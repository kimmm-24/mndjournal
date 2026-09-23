import { NextResponse } from "next/server";
import { applyPaymentStatus } from "@/server/billing";
import { verifyNotificationSignature } from "@/server/midtrans";

/**
 * Midtrans HTTP notification (webhook) — set as the Payment Notification URL
 * in the Midtrans dashboard: {BETTER_AUTH_URL}/api/billing/notification.
 * Unauthenticated by nature (it's listed in middleware.ts's PUBLIC_PATHS), so
 * the signature is checked first and the body is otherwise only a hint:
 * applyPaymentStatus re-reads the real status from Midtrans's API. Any
 * non-2xx makes Midtrans retry, which is what a transient failure should do.
 */
export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !verifyNotificationSignature(body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  try {
    const payment = await applyPaymentStatus(body.order_id as string);
    // Unknown orders (e.g. the dashboard's "test notification") are acknowledged, not retried.
    return NextResponse.json({ ok: true, status: payment?.status ?? "ignored" });
  } catch (error) {
    console.error("[billing] notification failed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
};
