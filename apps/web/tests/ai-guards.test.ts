// The AI cost guards in server/ai.ts's runAi and server/ai-quota.ts, with our
// own (server) Anthropic key: the quota reserved atomically, prompt size caps,
// the per-user burst limit, the daily budget, and the per-trial quota. The
// provider is a stubbed fetch returning Anthropic-shaped replies.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";

const originalDir = process.env.JOURNAL_DATA_DIR;
const scratch = mkdtempSync(join(tmpdir(), "journal-ai-guards-"));
process.env.JOURNAL_DATA_DIR = scratch;

const USER = "guard-user";
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/server/auth", () => ({
  auth: { api: { getSession: async () => ({ user: { id: "guard-user" }, session: {} }) } },
}));

const { db, aiCalls, aiUsage, playbooks, subscriptions, trades } = await import("../src/db");
const { runAi } = await import("../src/server/ai");
const { RequestError } = await import("../src/server/api");
const { getAiAccessStatus, getAiQuota, resetAiBudgetState, resetAiBurstState } =
  await import("../src/server/ai-quota");
const {
  AI_MAX_PROMPT_CHARS,
  AI_PAUSED_MESSAGE,
  AI_PROMPT_TOO_LARGE_MESSAGE,
  AI_TOO_FAST_MESSAGE,
  aiQuestionTooLongMessage,
} = await import("../src/lib/ai-quota");
const { POST: ask } = await import("../src/app/api/ai/ask/route");
const { POST: tag } = await import("../src/app/api/ai/tag/route");

const monthKey = () => new Date().toISOString().slice(0, 7);

const seedPlan = (
  plan: "pro" | "elite",
  status: "comp" | "trial" = "comp",
  endsAt: string | null = null,
) =>
  db
    .insert(subscriptions)
    .values({ userId: USER, plan, status, endsAt, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: subscriptions.userId, set: { plan, status, endsAt } })
    .run();

const used = (key: string) =>
  db
    .select({ count: aiUsage.count })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, USER), eq(aiUsage.month, key)))
    .get()?.count ?? 0;

/** Anthropic replies with the given token usage, after `delayMs`. */
const provider = (inputTokens = 1_000, outputTokens = 300, delayMs = 0) =>
  vi.fn(async () => {
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    return Response.json({
      id: "msg_fixture",
      type: "message",
      role: "assistant",
      model: "claude-haiku-4-5-20251001",
      content: [{ type: "text", text: "Fixture answer" }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    });
  });

const refusal = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => null,
    (error: unknown) => error,
  );
  expect(error).toBeInstanceOf(RequestError);
  return error as InstanceType<typeof RequestError>;
};

beforeEach(() => {
  db.delete(aiUsage).run();
  db.delete(aiCalls).run();
  resetAiBurstState();
  resetAiBudgetState();
  vi.stubEnv("ANTHROPIC_API_KEY", "server-fixture-key");
  vi.stubEnv("OPENAI_API_KEY", "");
  seedPlan("pro");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
afterAll(() => {
  db.$client.close();
  if (originalDir === undefined) delete process.env.JOURNAL_DATA_DIR;
  else process.env.JOURNAL_DATA_DIR = originalDir;
  rmSync(scratch, { recursive: true, force: true });
});

describe("plan quotas", () => {
  it("defaults to Pro 50 and Elite 105, unless the env var overrides it", () => {
    expect(getAiQuota("starter")).toBe(0);
    expect(getAiQuota("pro")).toBe(50);
    expect(getAiQuota("elite")).toBe(105);
    vi.stubEnv("PRO_AI_QUOTA", "100");
    expect(getAiQuota("pro")).toBe(100);
  });
});

describe("atomic quota", () => {
  it("never lets parallel requests go past the quota", async () => {
    vi.stubEnv("AI_MAX_IN_FLIGHT_PER_USER", "10");
    db.insert(aiUsage).values({ userId: USER, month: monthKey(), count: 49 }).run();
    const fetcher = provider(1_000, 300, 20);
    vi.stubGlobal("fetch", fetcher);

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => runAi("Fixture", 1200, USER)),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    for (const result of results.filter((result) => result.status === "rejected")) {
      const reason = (result as PromiseRejectedResult).reason as InstanceType<typeof RequestError>;
      expect(reason.status).toBe(429);
      expect(reason.message).toContain("AI quota for this month is used up");
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(used(monthKey())).toBe(50);
  });

  it("gives the call back when the provider fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { type: "error", error: { type: "invalid_request_error", message: "fixture" } },
          { status: 400 },
        ),
      ),
    );
    await expect(runAi("Fixture", 1200, USER)).rejects.toThrow();
    expect(used(monthKey())).toBe(0);
  });
});

describe("input caps", () => {
  it("refuses an oversized prompt before contacting the provider", async () => {
    const fetcher = provider();
    vi.stubGlobal("fetch", fetcher);
    const error = await refusal(runAi("x".repeat(AI_MAX_PROMPT_CHARS + 1), 1200, USER));
    expect(error.status).toBe(413);
    expect(error.message).toBe(AI_PROMPT_TOO_LARGE_MESSAGE);
    expect(fetcher).not.toHaveBeenCalled();
    expect(used(monthKey())).toBe(0);
  });

  it("refuses a question over the length limit with a 400", async () => {
    const response = await ask(
      new Request("http://localhost/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "q".repeat(1_001) }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: aiQuestionTooLongMessage() });
  });
});

describe("per-user burst limit", () => {
  it("allows one call in flight at a time", async () => {
    vi.stubGlobal("fetch", provider(1_000, 300, 20));
    const first = runAi("Fixture", 1200, USER);
    const error = await refusal(runAi("Fixture", 1200, USER));
    expect(error.status).toBe(429);
    expect(error.message).toBe(AI_TOO_FAST_MESSAGE);
    await expect(first).resolves.toBe("Fixture answer");
    expect(used(monthKey())).toBe(1);
  });

  it("allows 10 calls a minute", async () => {
    vi.stubGlobal("fetch", provider());
    for (let i = 0; i < 10; i++) await runAi("Fixture", 1200, USER);
    const error = await refusal(runAi("Fixture", 1200, USER));
    expect(error.message).toBe(AI_TOO_FAST_MESSAGE);
    expect(used(monthKey())).toBe(10);
  });
});

describe("daily budget", () => {
  it("records each call's tokens, alerts at 80% and 100%, then pauses AI", async () => {
    vi.stubEnv("AI_DAILY_BUDGET_USD", "0.03");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    // 8,000 in + 1,000 out on Haiku 4.5 = $0.013 per call.
    vi.stubGlobal("fetch", provider(8_000, 1_000));

    await runAi("Fixture", 1200, USER);
    expect(warn).not.toHaveBeenCalled();
    await runAi("Fixture", 1200, USER);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("daily AI budget 80% used"));

    const paused = await refusal(runAi("Fixture", 1200, USER));
    expect(paused.status).toBe(503);
    expect(paused.message).toBe(AI_PAUSED_MESSAGE);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("daily AI budget reached"));

    const calls = db.select().from(aiCalls).all();
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ inputTokens: 8_000, outputTokens: 1_000, serverKey: true });
    expect(calls[0]!.costUsd).toBeCloseTo(0.013, 6);
    // The refused call didn't use up quota.
    expect(used(monthKey())).toBe(2);
  });

  it("turns AI off entirely at a budget of 0", async () => {
    vi.stubEnv("AI_DAILY_BUDGET_USD", "0");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetcher = provider();
    vi.stubGlobal("fetch", fetcher);
    const error = await refusal(runAi("Fixture", 1200, USER));
    expect(error.status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("Anthropic's own spend caps", () => {
  const anthropicError = (status: number, type: string, message: string, extra = {}) =>
    vi.fn(async () =>
      Response.json({ type: "error", error: { type, message, ...extra } }, { status }),
    );

  it("treats the Console usage limit (400) as AI paused, logged once, quota untouched", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetcher = anthropicError(
      400,
      "invalid_request_error",
      "You have reached your specified API usage limits. You will regain access on 2026-10-01 at 00:00 UTC.",
    );
    vi.stubGlobal("fetch", fetcher);
    for (let i = 0; i < 2; i++) {
      const paused = await refusal(runAi("Fixture", 1200, USER));
      expect(paused.status).toBe(503);
      expect(paused.message).toBe(AI_PAUSED_MESSAGE);
    }
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]![0]).toContain("Anthropic Console");
    expect(used(monthKey())).toBe(0);
  });

  it("does not retry the tier spend cap (429 enforced_spend_limit_reached)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetcher = anthropicError(429, "rate_limit_error", "Monthly spend limit reached.", {
      details: { error_code: "enforced_spend_limit_reached" },
    });
    vi.stubGlobal("fetch", fetcher);
    const paused = await refusal(runAi("Fixture", 1200, USER));
    expect(paused.status).toBe(503);
    expect(paused.message).toBe(AI_PAUSED_MESSAGE);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("enforced_spend_limit_reached"));
    expect(used(monthKey())).toBe(0);
  });

  it.each([
    [
      "the documented 402 billing_error",
      402,
      "billing_error",
      "There is an issue with your billing information.",
    ],
    [
      "the observed 400 credit balance message",
      400,
      "invalid_request_error",
      "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.",
    ],
  ])(
    "treats no credits left (%s) as AI paused, not retried, logged once",
    async (_, status, type, message) => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const fetcher = anthropicError(status, type, message);
      vi.stubGlobal("fetch", fetcher);
      for (let i = 0; i < 2; i++) {
        const paused = await refusal(runAi("Fixture", 1200, USER));
        expect(paused.status).toBe(503);
        expect(paused.message).toBe(AI_PAUSED_MESSAGE);
      }
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0]![0]).toContain("credit balance is too low");
      expect(used(monthKey())).toBe(0);
    },
  );

  it("makes the auto-tagger answer the same 503 quietly, without retrying", async () => {
    const now = new Date().toISOString();
    db.insert(playbooks)
      .values({ id: "pb-guard", userId: USER, name: "Breakout", createdAt: now })
      .onConflictDoNothing()
      .run();
    db.insert(trades)
      .values({
        key: "guard-trade",
        accountId: "guard-account",
        userId: USER,
        symbol: "XAUUSD",
        direction: "long",
        status: "win",
        openedAt: now,
        closedAt: now,
        quantity: 1,
        openQuantity: 0,
        avgEntry: 2000,
        avgExit: 2010,
        grossPnl: 10,
        fees: 0,
        netPnl: 10,
        executionCount: 2,
        executionIdsJson: "[]",
        exitsJson: "[]",
      })
      .onConflictDoNothing()
      .run();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetcher = anthropicError(
      400,
      "invalid_request_error",
      "Your credit balance is too low to access the Anthropic API.",
    );
    vi.stubGlobal("fetch", fetcher);
    const response = await tag(
      new Request("http://localhost/api/ai/tag", {
        method: "POST",
        body: JSON.stringify({ key: "guard-trade" }),
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: AI_PAUSED_MESSAGE });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(used(monthKey())).toBe(0);
  });

  it("still retries an ordinary 429 rate limit", async () => {
    const fetcher = vi.fn(async () =>
      Response.json(
        { type: "error", error: { type: "rate_limit_error", message: "Rate limited" } },
        { status: 429, headers: { "retry-after-ms": "1" } },
      ),
    );
    vi.stubGlobal("fetch", fetcher);
    await expect(runAi("Fixture", 1200, USER)).rejects.toThrow("AI rate limit");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(used(monthKey())).toBe(0);
  });
});

describe("trial quota", () => {
  it("counts the whole trial as one period, however many months it spans", async () => {
    const endsAt = new Date(Date.now() + 14 * 86_400_000).toISOString();
    seedPlan("pro", "trial", endsAt);
    vi.stubEnv("AI_MAX_CALLS_PER_MINUTE", "100");
    // Usage from a calendar month doesn't count against the trial.
    db.insert(aiUsage).values({ userId: USER, month: monthKey(), count: 10 }).run();
    vi.stubGlobal("fetch", provider());

    for (let i = 0; i < 10; i++) await runAi("Fixture", 1200, USER);
    const error = await refusal(runAi("Fixture", 1200, USER));
    expect(error.status).toBe(429);
    expect(error.message).toContain("included in your trial");
    expect(used("trial")).toBe(10);

    // A day before the trial ends — possibly in the next month — it's still used up.
    const lateInTrial = new Date(Date.parse(endsAt) - 86_400_000);
    expect(getAiAccessStatus(USER, lateInTrial)).toMatchObject({
      period: "trial",
      used: 10,
      quota: 10,
      allowed: false,
      resetsOn: endsAt.slice(0, 10),
    });
  });
});
