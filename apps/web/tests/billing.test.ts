import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const originalDir = process.env.JOURNAL_DATA_DIR;
const scratch = mkdtempSync(join(tmpdir(), "journal-billing-test-"));
process.env.JOURNAL_DATA_DIR = scratch;
// Same session stub as the other route tests; sessionUser is swapped per test
// to act as a second user.
let sessionUser: { id: string; email?: string; name?: string } = { id: "test-user" };
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/server/auth", () => ({
  auth: { api: { getSession: async () => ({ user: sessionUser, session: {} }) } },
}));

const SERVER_KEY = "SB-Mid-server-test-key";
const DAY = 24 * 60 * 60 * 1000;

const { db, subscriptions, payments, accounts } = await import("../src/db");
const { getEntitlement, resolveEntitlement } = await import("../src/server/plan");
const { nextPeriodEnd, mapMidtransStatus } = await import("../src/server/billing");
const {
  READ_ONLY_MESSAGE,
  TRIAL_DAYS,
  METATRADER_ADDON_PLAN_MESSAGE,
  METATRADER_ADDON_RUNNING_MESSAGE,
  metatraderSlotsBelowConnectedMessage,
  metatraderSlotsMessage,
} = await import("../src/lib/plan");
const { metatraderSyncBlocked } = await import("../src/server/sync");
const { POST: createAccount } = await import("../src/app/api/accounts/route");
const { GET: getPlanRoute } = await import("../src/app/api/plan/route");
const playbooksRoute = await import("../src/app/api/playbooks/route");
const { POST: checkout } = await import("../src/app/api/billing/checkout/route");
const { POST: verify } = await import("../src/app/api/billing/verify/route");
const { POST: notify } = await import("../src/app/api/billing/notification/route");

const json = (url: string, body: unknown, method = "POST") =>
  new Request(`http://localhost${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const setSubscription = (row: Partial<typeof subscriptions.$inferInsert>, userId = "test-user") => {
  const values = {
    plan: "pro" as const,
    status: "active" as const,
    endsAt: null,
    updatedAt: new Date().toISOString(),
    ...row,
  };
  db.insert(subscriptions)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: subscriptions.userId, set: values })
    .run();
};

const signed = (body: { order_id: string; status_code: string; gross_amount: string }) => ({
  ...body,
  signature_key: createHash("sha512")
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${SERVER_KEY}`)
    .digest("hex"),
});

/** Fake Midtrans: Snap creates tokens; the status API reports `remote[orderId]`. */
let remote: Record<string, { transaction_status: string; gross_amount: string }> = {};
const fetchMock = vi.fn(async (input: string | URL | Request) => {
  const url = String(input);
  if (url.endsWith("/snap/v1/transactions")) {
    return Response.json(
      { token: "snap-token", redirect_url: "https://snap.example/pay" },
      { status: 201 },
    );
  }
  const match = /\/v2\/([^/]+)\/status$/.exec(url);
  if (match) {
    const orderId = decodeURIComponent(match[1]!);
    const status = remote[orderId];
    if (!status)
      return Response.json({ status_code: "404", status_message: "Not found" }, { status: 404 });
    return Response.json({
      order_id: orderId,
      status_code: status.transaction_status === "settlement" ? "200" : "201",
      payment_type: "qris",
      transaction_id: `tx-${orderId}`,
      ...status,
    });
  }
  throw new Error(`Unexpected fetch ${url}`);
});

beforeEach(() => {
  db.delete(subscriptions).run();
  db.delete(payments).run();
  db.delete(accounts).run();
  remote = {};
  sessionUser = { id: "test-user", email: "trader@example.com", name: "Trader" };
  vi.stubEnv("MIDTRANS_SERVER_KEY", SERVER_KEY);
  vi.stubEnv("MIDTRANS_CLIENT_KEY", "SB-Mid-client-test-key");
  vi.stubEnv("MIDTRANS_IS_PRODUCTION", "");
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
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

describe("entitlement", () => {
  it("starts a Pro trial for a user seen for the first time", async () => {
    const before = Date.now();
    const body = await (await getPlanRoute()).json();
    expect(body).toMatchObject({ plan: "pro", status: "trial", wasTrial: true, readOnly: false });
    const endsAt = Date.parse(body.endsAt);
    expect(endsAt - before).toBeGreaterThanOrEqual(TRIAL_DAYS * DAY - 1000);
    expect(endsAt - before).toBeLessThanOrEqual(TRIAL_DAYS * DAY + 1000);
    // Idempotent: a second read keeps the same trial rather than restarting it.
    expect((await (await getPlanRoute()).json()).endsAt).toBe(body.endsAt);
  });

  it("keeps pre-billing manual grants ('comp') unexpired and drops lapsed periods to read-only starter", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    const row = {
      userId: "u",
      plan: "elite" as const,
      metatraderSlots: 0,
      updatedAt: now.toISOString(),
    };
    expect(resolveEntitlement({ ...row, status: "comp", endsAt: null }, now)).toMatchObject({
      plan: "elite",
      readOnly: false,
    });
    expect(
      resolveEntitlement({ ...row, status: "active", endsAt: "2026-08-31T00:00:00Z" }, now),
    ).toMatchObject({
      plan: "starter",
      status: "expired",
      lastPlan: "elite",
      readOnly: true,
      wasTrial: false,
    });
    expect(
      resolveEntitlement(
        { ...row, plan: "pro", status: "trial", endsAt: "2026-08-31T00:00:00Z" },
        now,
      ),
    ).toMatchObject({ plan: "starter", status: "expired", wasTrial: true, readOnly: true });
  });
});

describe("read-only gate", () => {
  it("refuses writes but allows reads and checkout once the plan has lapsed", async () => {
    setSubscription({ status: "trial", endsAt: new Date(Date.now() - DAY).toISOString() });

    const write = await playbooksRoute.POST(json("/api/playbooks", { name: "ORB" }));
    expect(write.status).toBe(402);
    expect((await write.json()).error).toBe(READ_ONLY_MESSAGE);

    expect((await playbooksRoute.GET()).status).toBe(200);

    const started = await checkout(
      json("/api/billing/checkout", { plan: "pro", interval: "month" }),
    );
    expect(started.status).toBe(200);
    expect(await started.json()).toMatchObject({ token: "snap-token" });
  });

  it("lets an active plan write", async () => {
    setSubscription({ endsAt: new Date(Date.now() + DAY).toISOString() });
    expect((await playbooksRoute.POST(json("/api/playbooks", { name: "ORB" }))).status).toBe(200);
  });
});

describe("nextPeriodEnd", () => {
  const now = new Date("2026-09-01T00:00:00Z");
  const row = (
    plan: "starter" | "pro" | "elite",
    status: "trial" | "active" | "comp",
    daysLeft: number,
    metatraderSlots = 0,
  ) => ({
    userId: "u",
    plan,
    status,
    endsAt: new Date(now.getTime() + daysLeft * DAY).toISOString(),
    metatraderSlots,
    updatedAt: now.toISOString(),
  });
  const days = (iso: string) => (Date.parse(iso) - now.getTime()) / DAY;

  it("starts now when nothing is running", () => {
    expect(days(nextPeriodEnd(undefined, "pro", "month", now))).toBe(30);
    expect(days(nextPeriodEnd(row("pro", "active", -3), "pro", "year", now))).toBe(365);
    expect(days(nextPeriodEnd(row("elite", "comp", 0), "pro", "month", now))).toBe(30);
  });

  it("adds remaining trial days and extends a same-plan renewal", () => {
    expect(days(nextPeriodEnd(row("pro", "trial", 6), "elite", "month", now))).toBe(36);
    expect(days(nextPeriodEnd(row("pro", "active", 10), "pro", "month", now))).toBe(40);
  });

  it("converts unused time at the price ratio when switching plans", () => {
    // 10 days of Pro (99k/mo) → 10 × 99/199 days of Elite, then the new 30.
    expect(days(nextPeriodEnd(row("pro", "active", 10), "elite", "month", now))).toBeCloseTo(
      30 + (10 * 99) / 199,
      6,
    );
  });

  it("counts MetaTrader slots in the conversion, and extends when plan and slots match", () => {
    // 10 days of Pro + 1 slot (99k + 89k) → Pro alone: 10 × 188/99 days.
    expect(days(nextPeriodEnd(row("pro", "active", 10, 1), "pro", "month", now, 0))).toBeCloseTo(
      30 + (10 * 188) / 99,
      6,
    );
    expect(days(nextPeriodEnd(row("pro", "active", 10, 2), "pro", "month", now, 2))).toBe(40);
  });
});

describe("Midtrans status mapping", () => {
  it("only treats accepted captures and settlements as paid", () => {
    const status = (transaction_status: string, fraud_status?: string) =>
      mapMidtransStatus({
        order_id: "o",
        status_code: "200",
        gross_amount: "1",
        transaction_status,
        fraud_status,
      });
    expect(status("settlement")).toBe("paid");
    expect(status("capture", "accept")).toBe("paid");
    expect(status("capture", "challenge")).toBe("pending");
    expect(status("pending")).toBe("pending");
    expect(status("expire")).toBe("expired");
    expect(status("deny")).toBe("failed");
    expect(status("refund")).toBe("refunded");
  });
});

describe("checkout → notification", () => {
  const startCheckout = async () => {
    const response = await checkout(
      json("/api/billing/checkout", { plan: "pro", interval: "month" }),
    );
    expect(response.status).toBe(200);
    return (await response.json()).orderId as string;
  };
  const payment = (orderId: string) =>
    db
      .select()
      .from(payments)
      .all()
      .find((row) => row.orderId === orderId)!;
  const subscription = () =>
    db
      .select()
      .from(subscriptions)
      .all()
      .find((row) => row.userId === "test-user");

  it("sends Snap the server-side price and the user's contact details", async () => {
    await startCheckout();
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.transaction_details.gross_amount).toBe(99_000);
    expect(body.customer_details).toEqual({ first_name: "Trader", email: "trader@example.com" });
    expect(body.callbacks.finish).toBe("http://localhost/billing");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from(`${SERVER_KEY}:`).toString("base64")}`,
    );
  });

  it("rejects a notification with a bad signature", async () => {
    const orderId = await startCheckout();
    remote[orderId] = { transaction_status: "settlement", gross_amount: "99000.00" };
    const response = await notify(
      json("/api/billing/notification", {
        order_id: orderId,
        status_code: "200",
        gross_amount: "99000.00",
        signature_key: "0".repeat(128),
      }),
    );
    expect(response.status).toBe(401);
    expect(payment(orderId).status).toBe("pending");
  });

  it("activates the plan once on settlement, however many times Midtrans notifies", async () => {
    setSubscription({
      plan: "pro",
      status: "active",
      endsAt: new Date(Date.now() - DAY).toISOString(),
    });
    const orderId = await startCheckout();
    remote[orderId] = { transaction_status: "settlement", gross_amount: "99000.00" };
    const notification = signed({
      order_id: orderId,
      status_code: "200",
      gross_amount: "99000.00",
    });

    const first = await notify(json("/api/billing/notification", notification));
    expect(first.status).toBe(200);
    const paid = payment(orderId);
    expect(paid).toMatchObject({ status: "paid", paymentType: "qris" });
    const endsAt = subscription()!.endsAt!;
    expect(subscription()).toMatchObject({ plan: "pro", status: "active" });
    expect(Date.parse(endsAt) - Date.now()).toBeGreaterThan(29 * DAY);
    expect(getEntitlement("test-user").readOnly).toBe(false);

    // Retried notification: no second extension.
    expect((await notify(json("/api/billing/notification", notification))).status).toBe(200);
    expect(subscription()!.endsAt).toBe(endsAt);
  });

  it("trusts Midtrans's status API over the notification body", async () => {
    const orderId = await startCheckout();
    // A validly signed "settlement" the status API doesn't back up.
    remote[orderId] = { transaction_status: "pending", gross_amount: "99000.00" };
    await notify(
      json(
        "/api/billing/notification",
        signed({ order_id: orderId, status_code: "200", gross_amount: "99000.00" }),
      ),
    );
    expect(payment(orderId).status).toBe("pending");
  });

  it("refuses to grant a period when the paid amount doesn't match the order", async () => {
    const orderId = await startCheckout();
    remote[orderId] = { transaction_status: "settlement", gross_amount: "1000.00" };
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await notify(
      json(
        "/api/billing/notification",
        signed({ order_id: orderId, status_code: "200", gross_amount: "1000.00" }),
      ),
    );
    expect(response.status).toBe(500);
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
    expect(payment(orderId).status).toBe("pending");
  });

  it("acknowledges notifications for unknown orders without retrying", async () => {
    const response = await notify(
      json(
        "/api/billing/notification",
        signed({ order_id: "not-ours", status_code: "200", gross_amount: "1.00" }),
      ),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("ignored");
  });

  it("verify settles the caller's own order and hides other users' orders", async () => {
    const orderId = await startCheckout();
    remote[orderId] = { transaction_status: "settlement", gross_amount: "99000.00" };

    sessionUser = { id: "someone-else" };
    const foreign = await verify(json("/api/billing/verify", { orderId }));
    expect(foreign.status).toBe(400);
    expect(payment(orderId).status).toBe("pending");

    sessionUser = { id: "test-user" };
    const own = await verify(json("/api/billing/verify", { orderId }));
    expect(await own.json()).toMatchObject({
      status: "paid",
      entitlement: { plan: "pro", status: "active" },
    });
  });
});

describe("MetaTrader add-on", () => {
  const snapBody = () => {
    const call = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/snap/v1/transactions"),
    );
    return JSON.parse(String((call as unknown as [string, RequestInit])[1].body));
  };
  const addMetaTraderAccount = (id: string) =>
    db
      .insert(accounts)
      .values({
        id,
        userId: "test-user",
        name: id,
        broker: "metatrader",
        kind: "sync",
        currency: "USD",
        createdAt: new Date().toISOString(),
      })
      .run();
  const settle = async (orderId: string, amount: number) => {
    remote[orderId] = { transaction_status: "settlement", gross_amount: `${amount}.00` };
    await verify(json("/api/billing/verify", { orderId }));
  };

  it("prices a period with slots as plan + slots × Rp79.000 per month (× 12 per year)", async () => {
    const month = await checkout(
      json("/api/billing/checkout", { plan: "pro", interval: "month", metatraderSlots: 2 }),
    );
    expect(month.status).toBe(200);
    const body = snapBody();
    expect(body.transaction_details.gross_amount).toBe(99_000 + 2 * 89_000);
    expect(body.item_details).toMatchObject([
      { id: "pro-month", price: 99_000, quantity: 1 },
      { id: "metatrader-addon", price: 89_000, quantity: 2 },
    ]);

    fetchMock.mockClear();
    await checkout(
      json("/api/billing/checkout", { plan: "elite", interval: "year", metatraderSlots: 1 }),
    );
    expect(snapBody().transaction_details.gross_amount).toBe(1_791_000 + 12 * 89_000);
  });

  it("refuses slots on Starter and fewer slots than connected MetaTrader accounts", async () => {
    const starter = await checkout(
      json("/api/billing/checkout", { plan: "starter", interval: "month", metatraderSlots: 1 }),
    );
    expect(starter.status).toBe(400);
    expect((await starter.json()).error).toBe(METATRADER_ADDON_PLAN_MESSAGE);

    addMetaTraderAccount("mt-1");
    addMetaTraderAccount("mt-2");
    const tooFew = await checkout(
      json("/api/billing/checkout", { plan: "pro", interval: "month", metatraderSlots: 1 }),
    );
    expect(tooFew.status).toBe(400);
    expect((await tooFew.json()).error).toBe(metatraderSlotsBelowConnectedMessage(2));
    // Starter can't sync anyway, so it doesn't have to keep paying for slots.
    const downgrade = await checkout(
      json("/api/billing/checkout", { plan: "starter", interval: "month" }),
    );
    expect(downgrade.status).toBe(200);
  });

  it("sets the paid period's slots, and adds prorated slots to a running period", async () => {
    const started = await checkout(
      json("/api/billing/checkout", { plan: "pro", interval: "month", metatraderSlots: 1 }),
    );
    const { orderId } = await started.json();
    await settle(orderId, 99_000 + 89_000);
    expect(getEntitlement("test-user")).toMatchObject({ status: "active", metatraderSlots: 1 });

    // 20 days left: 89.000 × 20/30 = 59.334 → Rp60.000 per slot.
    setSubscription({ metatraderSlots: 1, endsAt: new Date(Date.now() + 20 * DAY).toISOString() });
    fetchMock.mockClear();
    const addon = await checkout(
      json("/api/billing/checkout", { addon: "metatrader", metatraderSlots: 2 }),
    );
    expect(addon.status).toBe(200);
    expect(snapBody().transaction_details.gross_amount).toBe(2 * 60_000);
    const endsAt = getEntitlement("test-user").endsAt;
    await settle((await addon.json()).orderId, 120_000);
    expect(getEntitlement("test-user")).toMatchObject({ metatraderSlots: 3, endsAt });

    // 5 days left would be Rp15.000; the one-off MetaApi fee sets a floor.
    setSubscription({ metatraderSlots: 3, endsAt: new Date(Date.now() + 5 * DAY).toISOString() });
    fetchMock.mockClear();
    await checkout(json("/api/billing/checkout", { addon: "metatrader", metatraderSlots: 1 }));
    expect(snapBody().transaction_details.gross_amount).toBe(49_000);
  });

  it("only sells extra slots to a running paid plan", async () => {
    setSubscription({ status: "trial", endsAt: new Date(Date.now() + 5 * DAY).toISOString() });
    const response = await checkout(
      json("/api/billing/checkout", { addon: "metatrader", metatraderSlots: 1 }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(METATRADER_ADDON_RUNNING_MESSAGE);
  });

  it("needs a free slot to connect, before MetaApi is contacted, and to sync", async () => {
    setSubscription({ endsAt: new Date(Date.now() + 10 * DAY).toISOString() });
    const response = await createAccount(
      json("/api/accounts", {
        name: "MT5",
        kind: "sync",
        broker: "metatrader",
        credentials: { login: "123", password: "x", server: "Broker-Live", platform: "mt5" },
      }),
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe(metatraderSlotsMessage(0));
    expect(fetchMock).not.toHaveBeenCalled();

    addMetaTraderAccount("mt-1");
    expect(metatraderSyncBlocked("test-user")).toBe(metatraderSlotsMessage(0));
    setSubscription({ metatraderSlots: 1, endsAt: new Date(Date.now() + 10 * DAY).toISOString() });
    expect(metatraderSyncBlocked("test-user")).toBeNull();
    setSubscription({ metatraderSlots: 1, endsAt: new Date(Date.now() - DAY).toISOString() });
    expect(metatraderSyncBlocked("test-user")).toBe(READ_ONLY_MESSAGE);
  });
});
