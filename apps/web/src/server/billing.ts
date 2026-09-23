import { randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db, payments, subscriptions } from "@/db";
import type { BillingInterval, Plan } from "@/lib/plan";
import { PRICING_TIERS } from "@/lib/pricing-data";
import {
  createSnapTransaction,
  getTransactionStatus,
  type MidtransTransactionStatus,
} from "./midtrans";
import type { SubscriptionRow } from "./plan";

const DAY_MS = 24 * 60 * 60 * 1000;

export const PERIOD_DAYS: Record<BillingInterval, number> = { month: 30, year: 365 };

export type Payment = typeof payments.$inferSelect;
export type PaymentStatus = Payment["status"];

/** Prices come from the same file the marketing pricing page renders. */
export const priceFor = (plan: Plan, interval: BillingInterval): number => {
  const tier = PRICING_TIERS.find((candidate) => candidate.id === plan);
  if (!tier) throw new Error(`No price for plan ${plan}`);
  return interval === "month" ? tier.monthlyPrice : tier.yearlyPrice;
};

/**
 * Pure: when a newly paid `plan`/`interval` period ends, given what the user
 * already has at `now`.
 * - Nothing running (expired, comp, or no row): starts now.
 * - Trial still running: starts when the trial ends — paying early never
 *   forfeits trial days.
 * - Same plan still running: extends from its current end (early renewal).
 * - Different plan still running: the unused time is converted at the two
 *   plans' price ratio (e.g. 10 days of Pro → ~5 days of Elite) and the new
 *   period starts after that credit. Yearly prices are the same multiple of
 *   monthly for every tier, so the monthly ratio holds for either interval.
 */
export const nextPeriodEnd = (
  current: SubscriptionRow | undefined,
  plan: Plan,
  interval: BillingInterval,
  now = new Date(),
): string => {
  const nowMs = now.getTime();
  const currentEnd = current?.endsAt ? Date.parse(current.endsAt) : Number.NaN;
  let startMs = nowMs;
  if (current && current.status !== "comp" && currentEnd > nowMs) {
    if (current.status === "trial" || current.plan === plan) {
      startMs = currentEnd;
    } else {
      const credit =
        ((currentEnd - nowMs) * priceFor(current.plan, "month")) / priceFor(plan, "month");
      startMs = nowMs + credit;
    }
  }
  return new Date(startMs + PERIOD_DAYS[interval] * DAY_MS).toISOString();
};

/** Midtrans transaction_status → our payment status. */
export const mapMidtransStatus = (remote: MidtransTransactionStatus): PaymentStatus => {
  switch (remote.transaction_status) {
    case "settlement":
      return "paid";
    // Card payments: 'capture' is only final once fraud screening accepts it.
    case "capture":
      if (remote.fraud_status === "deny") return "failed";
      return remote.fraud_status === "challenge" ? "pending" : "paid";
    case "deny":
    case "cancel":
    case "failure":
      return "failed";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
    case "chargeback":
    case "partial_chargeback":
      return "refunded";
    default:
      return "pending";
  }
};

/** Payments only move forward; 'paid' is reachable once, so a period is granted once. */
const canTransition = (from: PaymentStatus, to: PaymentStatus): boolean => {
  if (from === to) return false;
  if (from === "pending") return to !== "refunded";
  if (from === "failed" || from === "expired") return to === "paid";
  if (from === "paid") return to === "refunded";
  return false;
};

const newOrderId = () => `MND-${Date.now()}-${randomBytes(4).toString("hex")}`;

export const createCheckout = async (
  user: { id: string; email: string; name: string },
  plan: Plan,
  interval: BillingInterval,
  finishUrl: string,
): Promise<{ orderId: string; token: string; redirectUrl: string }> => {
  const amount = priceFor(plan, interval);
  const orderId = newOrderId();
  const createdAt = new Date().toISOString();
  db.insert(payments)
    .values({
      orderId,
      userId: user.id,
      plan,
      interval,
      amount,
      status: "pending",
      createdAt,
      updatedAt: createdAt,
    })
    .run();
  const tierName = PRICING_TIERS.find((tier) => tier.id === plan)?.name ?? plan;
  try {
    const { token, redirectUrl } = await createSnapTransaction({
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [
        {
          id: `${plan}-${interval}`,
          price: amount,
          quantity: 1,
          name: `mndjournal ${tierName} - 1 ${interval === "month" ? "bulan" : "tahun"}`,
        },
      ],
      customer_details: {
        ...(user.name ? { first_name: user.name } : {}),
        ...(user.email ? { email: user.email } : {}),
      },
      callbacks: { finish: finishUrl },
    });
    db.update(payments)
      .set({ snapToken: token, redirectUrl, updatedAt: new Date().toISOString() })
      .where(eq(payments.orderId, orderId))
      .run();
    return { orderId, token, redirectUrl };
  } catch (error) {
    db.update(payments)
      .set({ status: "failed", updatedAt: new Date().toISOString() })
      .where(eq(payments.orderId, orderId))
      .run();
    throw error;
  }
};

export const getPayment = (orderId: string): Payment | undefined =>
  db.select().from(payments).where(eq(payments.orderId, orderId)).get();

export const listPayments = (userId: string, limit = 20): Payment[] =>
  db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .all();

/**
 * Bring an order in line with Midtrans's own status API — never with the
 * caller's claims, so the webhook body and the browser's Snap callbacks are
 * only ever a hint to go and look. On the transition to 'paid' the
 * subscription is extended in the same transaction, which is what makes
 * duplicate notifications (Midtrans retries) harmless. Returns undefined for
 * an order that isn't ours.
 *
 * A refund marks the payment 'refunded' but doesn't shorten the subscription
 * on its own: refunds are issued by us from the Midtrans dashboard, so the
 * matching access change is a deliberate, manual decision.
 */
export const applyPaymentStatus = async (
  orderId: string,
  now = () => new Date(),
): Promise<Payment | undefined> => {
  const payment = getPayment(orderId);
  if (!payment) return undefined;
  const remote = await getTransactionStatus(orderId);
  if (!remote) return payment;
  if (Number(remote.gross_amount) !== payment.amount) {
    throw new Error(
      `Midtrans amount ${remote.gross_amount} doesn't match order ${orderId} (${payment.amount})`,
    );
  }
  const next = mapMidtransStatus(remote);
  return db.transaction((tx) => {
    const fresh = tx.select().from(payments).where(eq(payments.orderId, orderId)).get()!;
    if (!canTransition(fresh.status, next)) return fresh;
    const at = now();
    const patch: Partial<Payment> = {
      status: next,
      paymentType: remote.payment_type ?? fresh.paymentType,
      transactionId: remote.transaction_id ?? fresh.transactionId,
      updatedAt: at.toISOString(),
    };
    if (next === "paid") {
      const current = tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, fresh.userId))
        .get();
      const endsAt = nextPeriodEnd(current, fresh.plan, fresh.interval, at);
      const values = {
        plan: fresh.plan,
        status: "active" as const,
        endsAt,
        updatedAt: at.toISOString(),
      };
      tx.insert(subscriptions)
        .values({ userId: fresh.userId, ...values })
        .onConflictDoUpdate({ target: subscriptions.userId, set: values })
        .run();
      patch.paidAt = at.toISOString();
      patch.periodEndsAt = endsAt;
    }
    tx.update(payments).set(patch).where(eq(payments.orderId, orderId)).run();
    return { ...fresh, ...patch };
  });
};
