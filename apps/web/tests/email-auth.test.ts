// Real, unmocked Better Auth with email configured: verification is required
// and password reset works. Only two seams are replaced — next/headers (no
// Next request scope in a test) and the global fetch, which stands in for
// Resend's API and records every email "sent".
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";

const previousDir = process.env.JOURNAL_DATA_DIR;
const scratch = mkdtempSync(join(tmpdir(), "journal-email-auth-"));
process.env.JOURNAL_DATA_DIR = scratch;
// Read when server/auth.ts is first imported (requireEmailVerification), so
// it must be in place before the dynamic imports below.
process.env.RESEND_API_KEY = "re_test_key";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

interface SentEmail {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}
const sent: SentEmail[] = [];
const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
  expect(String(input)).toBe("https://api.resend.com/emails");
  expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
  sent.push(JSON.parse(String(init?.body)) as SentEmail);
  return Response.json({ id: "email-id" });
});
vi.stubGlobal("fetch", fetchMock);

const { GET: authGet, POST: authPost } = await import("../src/app/api/auth/[...all]/route");
const { grandfatherExistingUsers } = await import("../src/server/auth");
const { verificationEmail } = await import("../src/server/email-templates");
const { db, user } = await import("../src/db");

const post = (path: string, body: unknown) =>
  authPost(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
const signUp = (email: string, password = "password12345") =>
  post("/api/auth/sign-up/email", { name: "Rina", email, password, callbackURL: "/dashboard" });
const signIn = (email: string, password = "password12345") =>
  post("/api/auth/sign-in/email", { email, password });

/** The first link in the latest email to `to`. */
const linkSentTo = async (to: string) => {
  await vi.waitFor(() => expect(sent.some((email) => email.to.includes(to))).toBe(true));
  const email = sent.filter((candidate) => candidate.to.includes(to)).at(-1)!;
  return /(https?:\/\/\S+)/.exec(email.text)![1]!;
};

beforeEach(() => {
  sent.length = 0;
});
afterAll(() => {
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
  db.$client.close();
  if (previousDir === undefined) delete process.env.JOURNAL_DATA_DIR;
  else process.env.JOURNAL_DATA_DIR = previousDir;
  rmSync(scratch, { recursive: true, force: true });
});

describe("email verification", () => {
  it("emails a link on signup and refuses sign-in until it's clicked", async () => {
    const response = await signUp("rina@example.com");
    expect(response.status).toBe(200);
    expect((await response.json()).token).toBeNull();
    expect(response.headers.get("set-cookie") ?? "").not.toMatch(/session_token=[^;]/);

    const link = await linkSentTo("rina@example.com");
    expect(link).toContain("/api/auth/verify-email?token=");
    const email = sent.at(-1)!;
    expect(email.from).toBe("mndjournal <no-reply@mndjournal.com>");
    expect(email.subject).toContain("Verifikasi email");
    expect(email.subject).toContain("Verify your email");

    const blocked = await signIn("rina@example.com");
    expect(blocked.status).toBe(403);
    expect((await blocked.json()).code).toBe("EMAIL_NOT_VERIFIED");
    // sendOnSignIn: the blocked attempt itself mails a fresh link.
    await vi.waitFor(() => expect(sent.length).toBe(2));

    const verified = await authGet(new Request(link));
    expect(verified.status).toBe(302);
    expect(verified.headers.get("location")).toBe("/dashboard");
    expect(verified.headers.get("set-cookie")).toMatch(/session_token=/);

    expect((await signIn("rina@example.com")).status).toBe(200);
  });
});

describe("password reset", () => {
  it("resets the password through the emailed link", async () => {
    await signUp("dimas@example.com", "old-password-1");
    await authGet(new Request(await linkSentTo("dimas@example.com")));
    sent.length = 0;

    const requested = await post("/api/auth/request-password-reset", {
      email: "dimas@example.com",
      redirectTo: "/reset-password",
    });
    expect(requested.status).toBe(200);
    const link = await linkSentTo("dimas@example.com");
    expect(sent.at(-1)!.subject).toContain("Reset password");

    // The emailed link validates the token, then lands on our page with it.
    const landing = await authGet(new Request(link));
    expect(landing.status).toBe(302);
    const location = new URL(landing.headers.get("location")!, "http://localhost");
    expect(location.pathname).toBe("/reset-password");
    const token = location.searchParams.get("token")!;
    expect(token).toBeTruthy();

    const reset = await post("/api/auth/reset-password", { newPassword: "new-password-2", token });
    expect(reset.status).toBe(200);
    expect((await signIn("dimas@example.com", "old-password-1")).status).toBe(401);
    expect((await signIn("dimas@example.com", "new-password-2")).status).toBe(200);

    // Single use.
    const reused = await post("/api/auth/reset-password", { newPassword: "another-pass-3", token });
    expect(reused.status).toBe(400);
  });

  it("answers the same for unknown emails and sends nothing", async () => {
    const response = await post("/api/auth/request-password-reset", {
      email: "nobody@example.com",
      redirectTo: "/reset-password",
    });
    expect(response.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sent).toHaveLength(0);
  });
});

describe("grandfathering existing accounts", () => {
  it("marks accounts that predate verification as verified, once", async () => {
    const insert = (id: string) =>
      db
        .insert(user)
        .values({
          id,
          name: id,
          email: `${id}@example.com`,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .run();
    const verified = (id: string) =>
      db.select().from(user).where(eq(user.id, id)).get()!.emailVerified;

    insert("before-upgrade");
    grandfatherExistingUsers();
    expect(verified("before-upgrade")).toBe(true);

    insert("after-upgrade");
    grandfatherExistingUsers();
    expect(verified("after-upgrade")).toBe(false);
  });
});

describe("templates", () => {
  it("escapes the user's name and skips a name that is just the email", () => {
    const hostile = verificationEmail(
      { name: '<img src=x onerror="alert(1)">', email: "x@example.com" },
      "https://mndjournal.com/v?token=a&b=1",
    );
    expect(hostile.html).not.toContain("<img src=x");
    expect(hostile.html).toContain("&lt;img");
    expect(hostile.html).toContain("https://mndjournal.com/v?token=a&amp;b=1");

    const unnamed = verificationEmail(
      { name: "x@example.com", email: "x@example.com" },
      "https://a",
    );
    expect(unnamed.text).toContain("Halo,");
    expect(unnamed.text).toContain("Hi,");
  });
});
