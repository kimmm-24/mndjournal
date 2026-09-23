import { currentUserId, handler, ok } from "@/server/api";
import { listPayments, type Payment } from "@/server/billing";
import { midtransConfigured, snapClientConfig } from "@/server/midtrans";
import { getEntitlement } from "@/server/plan";
import type { BillingPayment } from "@/lib/plan";

/** How long a Snap token stays payable — Midtrans's default order expiry. */
const SNAP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const present = (payment: Payment): BillingPayment => ({
  orderId: payment.orderId,
  plan: payment.plan,
  interval: payment.interval,
  amount: payment.amount,
  status: payment.status,
  paymentType: payment.paymentType,
  periodEndsAt: payment.periodEndsAt,
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
  // Lets the page reopen Snap for an unfinished bank transfer / QRIS.
  resumeToken:
    payment.status === "pending" &&
    payment.snapToken &&
    Date.now() - Date.parse(payment.createdAt) < SNAP_TOKEN_TTL_MS
      ? payment.snapToken
      : null,
});

/** Billing page state. Stays readable while expired — that's how users renew. */
export const GET = handler(async () => {
  const userId = await currentUserId();
  return ok({
    entitlement: getEntitlement(userId),
    payments: listPayments(userId).map(present),
    configured: midtransConfigured(),
    snap: snapClientConfig(),
  });
});
