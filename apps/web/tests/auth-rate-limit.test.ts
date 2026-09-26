// The real Better Auth route with rate limiting switched on (it's only on in
// production), to check the limits are counted per client IP: one client
// hitting the sign-in limit must not lock out another, and a client must not
// escape its own limit by sending a made-up X-Forwarded-For.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const previousDir = process.env.JOURNAL_DATA_DIR;
const scratch = mkdtempSync(join(tmpdir(), "journal-auth-rate-limit-"));
process.env.JOURNAL_DATA_DIR = scratch;

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { POST: authPost } = await import("../src/app/api/auth/[...all]/route");
const { auth } = await import("../src/server/auth");
const { db } = await import("../src/db");

const signIn = (headers: Record<string, string>) =>
  authPost(
    new Request("http://localhost/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ email: "nobody@example.com", password: "wrong-password" }),
    }),
  );

/** Sign-in allows 3 requests per 10 s per client; the 4th is refused. */
const SIGN_IN_LIMIT = 3;

beforeAll(async () => {
  (await auth.$context).rateLimit.enabled = true;
});

afterAll(() => {
  db.$client.close();
  if (previousDir === undefined) delete process.env.JOURNAL_DATA_DIR;
  else process.env.JOURNAL_DATA_DIR = previousDir;
  rmSync(scratch, { recursive: true, force: true });
});

describe("sign-in rate limit", () => {
  it("blocks a client after the limit, but not a different client", async () => {
    const first = { "x-real-ip": "203.0.113.10" };
    for (let i = 0; i < SIGN_IN_LIMIT; i++) {
      expect((await signIn(first)).status).not.toBe(429);
    }
    expect((await signIn(first)).status).toBe(429);

    expect((await signIn({ "x-real-ip": "203.0.113.20" })).status).not.toBe(429);
    expect((await signIn(first)).status).toBe(429);
  });

  it("ignores X-Forwarded-For, so a client can't claim a fresh address", async () => {
    const client = "198.51.100.7";
    for (let i = 0; i < SIGN_IN_LIMIT; i++) {
      await signIn({ "x-real-ip": client, "x-forwarded-for": `192.0.2.${i + 1}` });
    }
    const spoofed = await signIn({ "x-real-ip": client, "x-forwarded-for": "192.0.2.99" });
    expect(spoofed.status).toBe(429);
  });
});
