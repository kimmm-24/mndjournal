import { isBillingInterval, isPlan } from "@/lib/plan";
import { currentUser, handler, ok, requireValue } from "@/server/api";
import { createCheckout } from "@/server/billing";
import { midtransConfigured } from "@/server/midtrans";

/** Starts a Snap order for one prepaid period. Allowed while read-only: it's how users get out of it. */
export const POST = handler(
  async (request: Request) => {
    requireValue(midtransConfigured(), "Payments aren't configured on this server yet.");
    const body = (await request.json().catch(() => ({}))) as { plan?: unknown; interval?: unknown };
    requireValue(isPlan(body.plan), "Unknown plan");
    requireValue(isBillingInterval(body.interval), "Unknown billing interval");
    const user = await currentUser();
    const origin = (process.env.BETTER_AUTH_URL || new URL(request.url).origin).replace(/\/+$/, "");
    return ok(await createCheckout(user, body.plan, body.interval, `${origin}/billing`));
  },
  { allowReadOnly: true },
);
