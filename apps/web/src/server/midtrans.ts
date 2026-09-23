import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Minimal Midtrans client (Snap + status API) over plain fetch.
 *
 * Sandbox vs production is only configuration: sandbox keys and
 * MIDTRANS_IS_PRODUCTION unset (or anything but "true") talk to
 * *.sandbox.midtrans.com; production keys plus MIDTRANS_IS_PRODUCTION=true
 * talk to the live hosts. Keys come from the Midtrans dashboard →
 * Settings → Access Keys, for whichever environment is selected there.
 */
const config = () => {
  const production = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return {
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    production,
    snapHost: production ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com",
    apiHost: production ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com",
  };
};

export const midtransConfigured = (): boolean => {
  const { serverKey, clientKey } = config();
  return Boolean(serverKey && clientKey);
};

/** What the browser needs to open the Snap popup — the client key is public by design. */
export const snapClientConfig = () => {
  const { clientKey, production, snapHost } = config();
  return { clientKey, production, scriptUrl: `${snapHost}/snap/snap.js` };
};

const authHeader = () => `Basic ${Buffer.from(`${config().serverKey}:`).toString("base64")}`;

export interface SnapTransactionRequest {
  transaction_details: { order_id: string; gross_amount: number };
  item_details: { id: string; price: number; quantity: number; name: string }[];
  customer_details?: { first_name?: string; email?: string };
  callbacks?: { finish?: string };
}

export const createSnapTransaction = async (
  body: SnapTransactionRequest,
): Promise<{ token: string; redirectUrl: string }> => {
  const response = await fetch(`${config().snapHost}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as {
    token?: string;
    redirect_url?: string;
    error_messages?: string[];
  };
  if (!response.ok || !data.token || !data.redirect_url) {
    throw new Error(
      `Midtrans rejected the checkout: ${data.error_messages?.join("; ") ?? `HTTP ${response.status}`}`,
    );
  }
  return { token: data.token, redirectUrl: data.redirect_url };
};

export interface MidtransTransactionStatus {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  signature_key?: string;
}

/**
 * Authoritative status of an order, straight from Midtrans. Null when
 * Midtrans has no transaction for it yet — a Snap order the user opened but
 * never picked a payment method for.
 */
export const getTransactionStatus = async (
  orderId: string,
): Promise<MidtransTransactionStatus | null> => {
  const response = await fetch(`${config().apiHost}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: authHeader() },
  });
  const data = (await response.json().catch(() => ({}))) as Partial<MidtransTransactionStatus> & {
    status_message?: string;
  };
  if (response.status === 404 || data.status_code === "404") return null;
  if (!response.ok || !data.transaction_status) {
    throw new Error(
      `Midtrans status check failed: ${data.status_message ?? `HTTP ${response.status}`}`,
    );
  }
  return data as MidtransTransactionStatus;
};

/** Notification authenticity: SHA512(order_id + status_code + gross_amount + server key). */
export const verifyNotificationSignature = (notification: {
  order_id?: unknown;
  status_code?: unknown;
  gross_amount?: unknown;
  signature_key?: unknown;
}): boolean => {
  const { order_id, status_code, gross_amount, signature_key } = notification;
  const { serverKey } = config();
  if (
    !serverKey ||
    typeof order_id !== "string" ||
    typeof status_code !== "string" ||
    typeof gross_amount !== "string" ||
    typeof signature_key !== "string"
  ) {
    return false;
  }
  const expected = createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest("hex");
  const received = Buffer.from(signature_key.toLowerCase());
  return received.length === expected.length && timingSafeEqual(received, Buffer.from(expected));
};
