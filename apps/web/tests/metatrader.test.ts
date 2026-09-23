import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";

const originalDir = process.env.JOURNAL_DATA_DIR;
const scratch = mkdtempSync(join(tmpdir(), "journal-metatrader-test-"));
process.env.JOURNAL_DATA_DIR = scratch;
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/server/auth", () => ({
  auth: { api: { getSession: async () => ({ user: { id: "test-user" }, session: {} }) } },
}));

const { db, accounts, executions, trades, subscriptions } = await import("../src/db");
const { dealsToExecutions } = await import("../src/server/metatrader");
const { timing } = await import("../src/server/metaapi");
const { insertExecutions } = await import("../src/server/executions");
const { decryptJson } = await import("../src/server/crypto");
const { listBrokers } = await import("../src/server/sync");
const { dueAccounts } = await import("../src/server/sync-scheduler");
const accountsRoute = await import("../src/app/api/accounts/route");
const { POST: accountAction } = await import("../src/app/api/accounts/[id]/actions/route");
const { DELETE: deleteAccount } = await import("../src/app/api/accounts/[id]/route");

type Deal = Parameters<typeof dealsToExecutions>[0][number];
const DAY = 24 * 60 * 60 * 1000;

const deal = (overrides: Partial<Deal> & Pick<Deal, "id" | "type" | "time">): Deal => ({
  symbol: "EURUSD",
  volume: 1,
  price: 1.1,
  commission: 0,
  swap: 0,
  profit: 0,
  ...overrides,
});

const plan = (value: "pro" | "starter", status: "comp" | "trial" = "comp", endsAt?: string) =>
  db
    .insert(subscriptions)
    .values({
      userId: "test-user",
      plan: value,
      status,
      endsAt,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: { plan: value, status, endsAt: endsAt ?? null },
    })
    .run();

const makeAccount = (overrides: Partial<typeof accounts.$inferInsert> = {}) => {
  const id = `acct-${Math.random().toString(36).slice(2)}`;
  db.insert(accounts)
    .values({
      id,
      userId: "test-user",
      name: "MT",
      broker: "metatrader",
      kind: "sync",
      createdAt: new Date().toISOString(),
      ...overrides,
    })
    .run();
  return id;
};

const tradesOf = (accountId: string) =>
  db
    .select()
    .from(trades)
    .where(eq(trades.accountId, accountId))
    .all()
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt));

beforeEach(() => {
  db.delete(trades).run();
  db.delete(executions).run();
  db.delete(accounts).run();
  plan("pro");
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

describe("deals → journal trades", () => {
  it("journals MetaTrader's own profit, with commission and swap charges as fees", () => {
    const account = makeAccount();
    insertExecutions(
      account,
      dealsToExecutions([
        deal({ id: "1", type: "DEAL_TYPE_BALANCE", time: "2026-09-01T00:00:00Z", symbol: "" }),
        deal({
          id: "10",
          type: "DEAL_TYPE_BUY",
          entryType: "DEAL_ENTRY_IN",
          time: "2026-09-01T01:00:00Z",
          positionId: "10",
          price: 1.1,
          commission: -3.5,
        }),
        deal({
          id: "11",
          type: "DEAL_TYPE_SELL",
          entryType: "DEAL_ENTRY_OUT",
          time: "2026-09-01T05:00:00Z",
          positionId: "10",
          price: 1.101,
          commission: -3.5,
          swap: -2,
          profit: 100,
        }),
        // USDJPY: price × lots would be nonsense in USD; MT's profit is authoritative.
        deal({
          id: "20",
          type: "DEAL_TYPE_SELL",
          entryType: "DEAL_ENTRY_IN",
          time: "2026-09-02T01:00:00Z",
          positionId: "20",
          symbol: "USDJPY",
          price: 150,
        }),
        deal({
          id: "21",
          type: "DEAL_TYPE_BUY",
          entryType: "DEAL_ENTRY_OUT",
          time: "2026-09-02T02:00:00Z",
          positionId: "20",
          symbol: "USDJPY",
          price: 149.9,
          swap: 1.5,
          profit: 66.71,
        }),
      ]),
      "sync",
    );
    const [eurusd, usdjpy] = tradesOf(account);
    expect(eurusd).toMatchObject({ symbol: "EURUSD", direction: "long", status: "win" });
    expect(eurusd!.grossPnl).toBeCloseTo(100);
    expect(eurusd!.fees).toBeCloseTo(9);
    expect(eurusd!.netPnl).toBeCloseTo(91);
    expect(usdjpy).toMatchObject({ symbol: "USDJPY", direction: "short" });
    // Positive swap is a credit: part of P&L, not a negative fee.
    expect(usdjpy!.netPnl).toBeCloseTo(68.21);
    expect(usdjpy!.fees).toBe(0);
  });

  it("keeps hedged positions apart and sums partial closes", () => {
    const account = makeAccount();
    insertExecutions(
      account,
      dealsToExecutions([
        deal({
          id: "1",
          type: "DEAL_TYPE_BUY",
          entryType: "DEAL_ENTRY_IN",
          time: "2026-09-01T01:00:00Z",
          positionId: "1",
          volume: 2,
        }),
        deal({
          id: "2",
          type: "DEAL_TYPE_SELL",
          entryType: "DEAL_ENTRY_IN",
          time: "2026-09-01T01:30:00Z",
          positionId: "2",
          volume: 1,
        }),
        deal({
          id: "3",
          type: "DEAL_TYPE_SELL",
          entryType: "DEAL_ENTRY_OUT",
          time: "2026-09-01T02:00:00Z",
          positionId: "1",
          volume: 1,
          profit: 50,
        }),
        deal({
          id: "4",
          type: "DEAL_TYPE_BUY",
          entryType: "DEAL_ENTRY_OUT",
          time: "2026-09-01T03:00:00Z",
          positionId: "2",
          volume: 1,
          profit: -20,
        }),
        deal({
          id: "5",
          type: "DEAL_TYPE_SELL",
          entryType: "DEAL_ENTRY_OUT",
          time: "2026-09-01T04:00:00Z",
          positionId: "1",
          volume: 1,
          profit: 30,
        }),
      ]),
      "sync",
    );
    const result = tradesOf(account);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ direction: "long", quantity: 2 });
    expect(result[0]!.netPnl).toBeCloseTo(80);
    expect(result[1]).toMatchObject({ direction: "short", quantity: 1 });
    expect(result[1]!.netPnl).toBeCloseTo(-20);
  });

  it("splits an MT5 netting reversal (DEAL_ENTRY_INOUT) into a close and a new position", () => {
    const account = makeAccount();
    insertExecutions(
      account,
      dealsToExecutions([
        deal({
          id: "1",
          type: "DEAL_TYPE_BUY",
          entryType: "DEAL_ENTRY_IN",
          time: "2026-09-01T01:00:00Z",
          positionId: "7",
        }),
        deal({
          id: "2",
          type: "DEAL_TYPE_SELL",
          entryType: "DEAL_ENTRY_INOUT",
          time: "2026-09-01T02:00:00Z",
          positionId: "7",
          volume: 2,
          profit: 20,
        }),
        deal({
          id: "3",
          type: "DEAL_TYPE_BUY",
          entryType: "DEAL_ENTRY_OUT",
          time: "2026-09-01T03:00:00Z",
          positionId: "7",
          profit: -10,
        }),
      ]),
      "sync",
    );
    const [first, second] = tradesOf(account);
    expect(first).toMatchObject({ direction: "long", quantity: 1 });
    expect(first!.netPnl).toBeCloseTo(20);
    expect(second).toMatchObject({ direction: "short", quantity: 1 });
    expect(second!.netPnl).toBeCloseTo(-10);
  });

  it("drops deals already journaled when the same history is synced again", () => {
    const account = makeAccount();
    const history = dealsToExecutions([
      deal({
        id: "1",
        type: "DEAL_TYPE_BUY",
        entryType: "DEAL_ENTRY_IN",
        time: "2026-09-01T01:00:00Z",
        positionId: "1",
      }),
      deal({
        id: "2",
        type: "DEAL_TYPE_SELL",
        entryType: "DEAL_ENTRY_OUT",
        time: "2026-09-01T02:00:00Z",
        positionId: "1",
        profit: 5,
      }),
    ]);
    expect(insertExecutions(account, history, "sync").inserted).toBe(2);
    expect(insertExecutions(account, history, "sync")).toMatchObject({
      inserted: 0,
      duplicates: 2,
    });
    expect(tradesOf(account)).toHaveLength(1);
  });
});

/** Fake MetaApi: records every call; `failDeals` makes the history read fail. */
const calls: { method: string; url: string; body?: Record<string, unknown>; tx?: string }[] = [];
let provisionReplies: number[] = [];
let failDeals = false;
const metaApi = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method ?? "GET";
  const headers = (init?.headers ?? {}) as Record<string, string>;
  expect(headers["auth-token"]).toBe("metaapi-test-token");
  calls.push({
    method,
    url,
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
    tx: headers["transaction-id"],
  });
  if (method === "POST" && url.endsWith("/users/current/accounts")) {
    const status = provisionReplies.shift() ?? 201;
    return status === 202
      ? new Response(null, { status: 202, headers: { "Retry-After": "1" } })
      : Response.json({ id: "ma-1", state: "UNDEPLOYED" }, { status: 201 });
  }
  if (method === "POST" && /\/(deploy|undeploy)$/.test(url))
    return new Response(null, { status: 204 });
  if (method === "DELETE") return new Response(null, { status: 204 });
  if (url.endsWith("/users/current/accounts/ma-1")) {
    const connected = calls.filter((call) => call.url === url).length > 1;
    return Response.json({
      state: "DEPLOYED",
      connectionStatus: connected ? "CONNECTED" : "DISCONNECTED",
      region: "london",
    });
  }
  if (url.includes("mt-client-api-v1.london.agiliumtrade.ai")) {
    if (url.includes("/history-deals/")) {
      if (failDeals) return Response.json({ message: "Internal error" }, { status: 500 });
      return Response.json([
        deal({
          id: "1",
          type: "DEAL_TYPE_BUY",
          entryType: "DEAL_ENTRY_IN",
          time: "2026-09-01T01:00:00Z",
          positionId: "1",
        }),
        deal({
          id: "2",
          type: "DEAL_TYPE_SELL",
          entryType: "DEAL_ENTRY_OUT",
          time: "2026-09-01T02:00:00Z",
          positionId: "1",
          profit: 42,
        }),
      ]);
    }
    if (url.endsWith("/account-information")) {
      return Response.json({ currency: "IDR", balance: 1000, equity: 1042 });
    }
    if (url.endsWith("/positions")) return Response.json([]);
  }
  throw new Error(`Unexpected MetaApi call ${method} ${url}`);
});

const connectBody = {
  name: "Monex",
  kind: "sync",
  broker: "metatrader",
  credentials: {
    platform: "mt5",
    login: "123456",
    password: "investor-pass",
    server: "MonexInvestindo-Live",
  },
};
const post = (body: unknown) =>
  accountsRoute.POST(
    new Request("http://localhost/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
const accountRow = (id: string) => db.select().from(accounts).where(eq(accounts.id, id)).get()!;

describe("MetaTrader via MetaApi", () => {
  beforeEach(() => {
    calls.length = 0;
    provisionReplies = [];
    failDeals = false;
    vi.stubEnv("METAAPI_TOKEN", "metaapi-test-token");
    vi.stubGlobal("fetch", metaApi);
    vi.spyOn(timing, "sleep").mockResolvedValue(undefined);
  });

  it("is only offered when METAAPI_TOKEN is set", () => {
    expect(listBrokers()[0]!.id).toBe("metatrader");
    vi.stubEnv("METAAPI_TOKEN", "");
    expect(listBrokers().some((broker) => broker.id === "metatrader")).toBe(false);
  });

  it("connects with the investor password, stores no password, and syncs in the background", async () => {
    provisionReplies = [202, 201];
    const response = await post(connectBody);
    expect(response.status).toBe(200);
    const { id, syncing } = await response.json();
    expect(syncing).toBe(true);

    // Provisioning replayed the 202 with the same transaction id.
    const provisions = calls.filter((call) => call.url.endsWith("/users/current/accounts"));
    expect(provisions).toHaveLength(2);
    expect(provisions[0]!.tx).toMatch(/^[0-9a-f]{32}$/);
    expect(provisions[1]!.tx).toBe(provisions[0]!.tx);
    expect(provisions[0]!.body).toMatchObject({
      login: "123456",
      password: "investor-pass",
      server: "MonexInvestindo-Live",
      platform: "mt5",
      type: "cloud-g2",
    });

    const stored = decryptJson<Record<string, string>>(accountRow(id).credentialsEnc!);
    expect(stored).toEqual({
      metaapiAccountId: "ma-1",
      login: "123456",
      server: "MonexInvestindo-Live",
      platform: "mt5",
    });

    await vi.waitFor(() => expect(accountRow(id).lastSyncAt).not.toBeNull());
    const row = accountRow(id);
    expect(row).toMatchObject({ syncingSince: null, syncError: null, currency: "IDR" });
    expect(JSON.parse(row.snapshotJson!).equity).toBe(1042);
    expect(tradesOf(id)[0]!.netPnl).toBeCloseTo(42);

    // Billing window: deployed first, undeployed last.
    const lifecycle = calls.filter((call) => /\/(deploy|undeploy)$/.test(call.url));
    expect(lifecycle.map((call) => call.url.split("/").at(-1))).toEqual(["deploy", "undeploy"]);
    expect(calls.at(-1)!.url).toMatch(/\/undeploy$/);
  });

  it("records the error and still undeploys when a sync fails", async () => {
    failDeals = true;
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { id } = await (await post(connectBody)).json();
    await vi.waitFor(() =>
      expect(accountRow(id).syncError).toContain("Couldn't read MetaTrader history"),
    );
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
    expect(accountRow(id).syncingSince).toBeNull();
    expect(calls.at(-1)!.url).toMatch(/\/undeploy$/);
  });

  it("spaces out manual syncs and removes the MetaApi account on delete", async () => {
    const { id } = await (await post(connectBody)).json();
    await vi.waitFor(() => expect(accountRow(id).lastSyncAt).not.toBeNull());
    const params = { params: Promise.resolve({ id }) };

    const again = await accountAction(
      new Request(`http://localhost/api/accounts/${id}/actions`, {
        method: "POST",
        body: JSON.stringify({ action: "sync" }),
      }),
      params,
    );
    expect(again.status).toBe(429);

    const deleted = await deleteAccount(
      new Request(`http://localhost/api/accounts/${id}`, { method: "DELETE" }),
      params,
    );
    expect(deleted.status).toBe(200);
    expect(calls.at(-1)).toMatchObject({ method: "DELETE" });
    expect(calls.at(-1)!.url).toMatch(/\/users\/current\/accounts\/ma-1$/);
  });

  it("rejects a malformed login before contacting MetaApi", async () => {
    const response = await post({
      ...connectBody,
      credentials: { ...connectBody.credentials, login: "abc" },
    });
    expect(response.status).toBe(502);
    expect(calls).toHaveLength(0);
    expect(db.select().from(accounts).all()).toHaveLength(0);
  });
});

describe("auto-sync scheduler", () => {
  const now = new Date("2026-09-10T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it("picks accounts whose interval has passed, measured from the last attempt", () => {
    const due = makeAccount({
      autoSync: true,
      credentialsEnc: "x",
      syncAttemptedAt: ago(7 * 3600_000),
    });
    makeAccount({ autoSync: true, credentialsEnc: "x", syncAttemptedAt: ago(2 * 3600_000) }); // MT: 6h interval
    makeAccount({ autoSync: false, credentialsEnc: "x" });
    makeAccount({ autoSync: true, credentialsEnc: "x", archivedAt: ago(DAY) });
    makeAccount({ autoSync: true, credentialsEnc: "x", syncingSince: ago(60_000) });
    const sdk = makeAccount({
      broker: "binance",
      autoSync: true,
      credentialsEnc: "x",
      syncAttemptedAt: ago(2 * 3600_000),
    });
    expect(
      dueAccounts(now)
        .map((account) => account.id)
        .sort(),
    ).toEqual([due, sdk].sort());
  });

  it("stops syncing for users whose plan lapsed or excludes broker sync", () => {
    makeAccount({ autoSync: true, credentialsEnc: "x" });
    plan("pro", "trial", ago(DAY));
    expect(dueAccounts(now)).toHaveLength(0);
    plan("starter");
    expect(dueAccounts(now)).toHaveLength(0);
  });
});
