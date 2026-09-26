// AI prompts carry times on the trader's own clock, with the zone named, so a
// rule like "session 12:00-15:00 WIB" is judged against the right hour. The
// provider is a stubbed fetch; the tests read the prompt it was sent.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const originalDir = process.env.JOURNAL_DATA_DIR;
const scratch = mkdtempSync(join(tmpdir(), "journal-ai-timezone-"));
process.env.JOURNAL_DATA_DIR = scratch;

const USER = "tz-user";
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/server/auth", () => ({
  auth: { api: { getSession: async () => ({ user: { id: "tz-user" }, session: {} }) } },
}));

const { db, accounts, playbooks, subscriptions } = await import("../src/db");
const { insertExecutions } = await import("../src/server/executions");
const { setSetting } = await import("../src/server/settings");
const { queryTrades } = await import("../src/server/trades-query");
const { resetAiBudgetState, resetAiBurstState } = await import("../src/server/ai-quota");
const { timeZoneLabel } = await import("../src/lib/timezone");
const { POST: tag } = await import("../src/app/api/ai/tag/route");
const { POST: critique } = await import("../src/app/api/ai/critique/route");
const { POST: ask } = await import("../src/app/api/ai/ask/route");

/** Anthropic replies with `text`; `prompts` collects what it was sent. */
const provider = (text: string) => {
  const prompts: string[] = [];
  const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as {
      messages: { content: string | { text: string }[] }[];
    };
    const content = body.messages[0]!.content;
    prompts.push(typeof content === "string" ? content : content.map((c) => c.text).join(""));
    return Response.json({
      id: "msg_fixture",
      type: "message",
      role: "assistant",
      model: "claude-haiku-4-5-20251001",
      content: [{ type: "text", text }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 500, output_tokens: 50 },
    });
  });
  return { fetcher, prompts };
};

const post = (body: unknown) =>
  new Request("http://localhost/api/ai", { method: "POST", body: JSON.stringify(body) });

let tradeKey = "";

beforeEach(() => {
  resetAiBurstState();
  resetAiBudgetState();
  vi.stubEnv("ANTHROPIC_API_KEY", "server-fixture-key");
  vi.stubEnv("OPENAI_API_KEY", "");
  db.insert(subscriptions)
    .values({ userId: USER, plan: "elite", updatedAt: new Date().toISOString() })
    .onConflictDoNothing()
    .run();
  db.insert(accounts)
    .values({ id: "tz-account", userId: USER, name: "TZ", kind: "manual", createdAt: "2026-01-01" })
    .onConflictDoNothing()
    .run();
  db.insert(playbooks)
    .values({
      id: "tz-playbook",
      userId: USER,
      name: "Jakarta afternoon session",
      rulesJson: JSON.stringify(["Only trade the session 12:00-15:00 WIB"]),
      createdAt: "2026-01-01",
    })
    .onConflictDoNothing()
    .run();
  // 05:15-05:50 UTC is 12:15-12:50 WIB.
  insertExecutions(
    "tz-account",
    [
      {
        symbol: "XAUUSD",
        side: "buy",
        quantity: 1,
        price: 2650,
        executedAt: "2026-09-25T05:15:00Z",
        fee: 0,
      },
      {
        symbol: "XAUUSD",
        side: "sell",
        quantity: 1,
        price: 2658,
        executedAt: "2026-09-25T05:50:00Z",
        fee: 0,
      },
    ],
    "manual",
  );
  setSetting("timeZone", "Asia/Jakarta", USER);
  tradeKey = queryTrades(undefined, USER).trades[0]!.key;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
afterAll(() => {
  db.$client.close();
  if (originalDir === undefined) delete process.env.JOURNAL_DATA_DIR;
  else process.env.JOURNAL_DATA_DIR = originalDir;
  rmSync(scratch, { recursive: true, force: true });
});

describe("timeZoneLabel", () => {
  it("names the zone, its Indonesian name and its offset", () => {
    expect(timeZoneLabel("Asia/Jakarta")).toBe("Asia/Jakarta (WIB, UTC+07:00)");
    expect(timeZoneLabel("Asia/Makassar")).toBe("Asia/Makassar (WITA, UTC+08:00)");
    expect(timeZoneLabel("UTC")).toBe("UTC (UTC+00:00)");
  });
});

describe("AI prompts use the trader's clock", () => {
  it("auto-tagger: a 05:15 UTC trade is sent as 12:15 WIB and matches a 12:00-15:00 WIB rule", async () => {
    const { fetcher, prompts } = provider(
      "PLAYBOOK: Jakarta afternoon session\nREASON: Opened 12:15 WIB, inside the session.",
    );
    vi.stubGlobal("fetch", fetcher);
    const response = await tag(post({ key: tradeKey }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ playbookId: "tz-playbook" });
    expect(prompts[0]).toContain("times in Asia/Jakarta (WIB, UTC+07:00)");
    expect(prompts[0]).toContain("Opened: 2026-09-25 12:15");
    expect(prompts[0]).toContain("Closed: 2026-09-25 12:50");
    expect(prompts[0]).not.toContain("05:15");
  });

  it("critique: fills are listed in local time", async () => {
    const { fetcher, prompts } = provider("Fixture critique");
    vi.stubGlobal("fetch", fetcher);
    expect((await critique(post({ key: tradeKey }))).status).toBe(200);
    expect(prompts[0]).toContain("Fills (times in Asia/Jakarta (WIB, UTC+07:00))");
    expect(prompts[0]).toContain("2026-09-25 12:15 buy");
    expect(prompts[0]).not.toContain("05:15");
  });

  it("ask: hour and weekday buckets name their zone", async () => {
    const { fetcher, prompts } = provider("Fixture answer");
    vi.stubGlobal("fetch", fetcher);
    expect((await ask(post({ question: "When do I trade best?" }))).status).toBe(200);
    expect(prompts[0]).toContain("By hour of open (Asia/Jakarta (WIB, UTC+07:00))");
    expect(prompts[0]).toContain("By weekday (Asia/Jakarta (WIB, UTC+07:00))");
  });
});
