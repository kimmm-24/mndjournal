// Real, unmocked Better Auth signup/session flow: no fake auth object here.
// The one seam replaced is next/headers' headers(), which only resolves
// inside Next's own request-handling runtime — calling a route handler
// directly in a test has no such context. That mock is fed the REAL cookie
// captured from a real signup below, so session validation itself (hashing,
// cookie signing, DB lookup) runs for real. tests/auth-gate.unit.test.ts
// covers server/api.ts's own gate logic in isolation with a fully mocked
// session instead.
import { afterAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";

const previousDir = process.env.JOURNAL_DATA_DIR;
const scratch = mkdtempSync(join(tmpdir(), "journal-api-auth-"));
process.env.JOURNAL_DATA_DIR = scratch;

let currentHeaders = new Headers();
vi.mock("next/headers", () => ({ headers: async () => currentHeaders }));

const { POST: authPost } = await import("../src/app/api/auth/[...all]/route");
const { handler, ok, currentUserId } = await import("../src/server/api");
const { db, user } = await import("../src/db");

const jsonRequest = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const signUp = (email: string, password: string, name = "Fixture") =>
  authPost(jsonRequest("/api/auth/sign-up/email", { name, email, password }));

const signIn = (email: string, password: string) =>
  authPost(jsonRequest("/api/auth/sign-in/email", { email, password }));

const cookieFrom = (response: Response) => response.headers.get("set-cookie")?.split(";")[0];

afterAll(() => {
  db.$client.close();
  if (previousDir === undefined) delete process.env.JOURNAL_DATA_DIR;
  else process.env.JOURNAL_DATA_DIR = previousDir;
  rmSync(scratch, { recursive: true, force: true });
});

describe("Better Auth's real signup and session flow", () => {
  it("creates a real user and issues a session cookie on signup", async () => {
    const response = await signUp("alice@example.com", "password12345");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user.email).toBe("alice@example.com");
    expect(cookieFrom(response)).toMatch(/^better-auth\.session_token=/);
    expect(db.select().from(user).where(eq(user.email, "alice@example.com")).get()).toBeTruthy();
  });

  it("rejects the wrong password and accepts the right one", async () => {
    await signUp("bob@example.com", "password12345");
    expect((await signIn("bob@example.com", "wrong-password")).status).toBe(401);
    const right = await signIn("bob@example.com", "password12345");
    expect(right.status).toBe(200);
    expect(cookieFrom(right)).toMatch(/^better-auth\.session_token=/);
  });

  it("gates a protected route end to end with a real session cookie, and rejects a tampered one", async () => {
    const signup = await signUp("carol@example.com", "password12345");
    const cookie = cookieFrom(signup)!;
    const protectedRoute = handler(async () => ok({ userId: await currentUserId() }));

    currentHeaders = new Headers();
    expect((await protectedRoute()).status).toBe(401);

    currentHeaders = new Headers({ cookie });
    const authorized = await protectedRoute();
    expect(authorized.status).toBe(200);
    const { userId } = await authorized.json();
    const created = db.select().from(user).where(eq(user.email, "carol@example.com")).get();
    expect(userId).toBe(created!.id);

    currentHeaders = new Headers({ cookie: cookie.replace(/=.+$/, "=tampered.value") });
    expect((await protectedRoute()).status).toBe(401);
  });
});
