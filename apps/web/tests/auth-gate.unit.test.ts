// Fast, fully-mocked unit test of server/api.ts's own gate/error-mapping
// logic in isolation. tests/api-auth.test.ts complements this with a real,
// unmocked Better Auth signup/session flow — this file only cares that
// `handler` and `currentUserId` behave correctly given a session (real or
// not).
import { afterEach, describe, expect, it, vi } from "vitest";

let sessionUser: { id: string } | null = null;
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => (sessionUser ? { user: sessionUser, session: {} } : null)),
    },
  },
}));

const { handler, currentUserId, RequestError } = await import("../src/server/api");

afterEach(() => {
  sessionUser = null;
});

describe("the session gate", () => {
  it("rejects a request with no session before the handler body runs", async () => {
    const action = vi.fn(() => new Response("secret"));
    const response = await handler(action)();
    expect(response.status).toBe(401);
    expect(action).not.toHaveBeenCalled();
  });

  it("runs the handler and exposes the signed-in user's id once a session exists", async () => {
    sessionUser = { id: "user-1" };
    const route = handler(async () => new Response(await currentUserId()));
    const response = await route();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("user-1");
  });

  it("turns a thrown RequestError into a 400 and any other error into a 500", async () => {
    sessionUser = { id: "user-1" };
    const badInput = handler(async () => {
      throw new RequestError("nope");
    });
    expect((await badInput()).status).toBe(400);
    const crashed = handler(async () => {
      throw new Error("boom");
    });
    expect((await crashed()).status).toBe(500);
  });
});
