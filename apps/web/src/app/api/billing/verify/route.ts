import { currentUserId, handler, ok, requireValue } from "@/server/api";
import { applyPaymentStatus, getPayment } from "@/server/billing";
import { getEntitlement } from "@/server/plan";

/**
 * Re-checks one of the user's orders against Midtrans. Called by the billing
 * page after Snap closes or redirects back, so a payment is reflected
 * immediately — and in local development, where Midtrans can't reach the
 * notification webhook on localhost, this is the only path that settles it.
 */
export const POST = handler(
  async (request: Request) => {
    const userId = await currentUserId();
    const body = (await request.json().catch(() => ({}))) as { orderId?: unknown };
    requireValue(typeof body.orderId === "string", "Missing orderId");
    const payment = getPayment(body.orderId);
    requireValue(payment && payment.userId === userId, "Order not found");
    const updated = await applyPaymentStatus(payment.orderId);
    return ok({ status: updated?.status ?? payment.status, entitlement: getEntitlement(userId) });
  },
  { allowReadOnly: true },
);
