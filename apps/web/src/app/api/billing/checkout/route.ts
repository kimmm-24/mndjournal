import {
  isBillingInterval,
  isPlan,
  MAX_METATRADER_SLOTS,
  METATRADER_ADDON_PLAN_MESSAGE,
  METATRADER_ADDON_RUNNING_MESSAGE,
  metatraderAddonAllowed,
  metatraderSlotsBelowConnectedMessage,
} from "@/lib/plan";
import { currentUser, handler, ok, requireValue } from "@/server/api";
import { createCheckout, type CheckoutOrder } from "@/server/billing";
import { midtransConfigured } from "@/server/midtrans";
import { getEntitlement } from "@/server/plan";
import { countMetaTraderAccounts } from "@/server/sync";

const isSlotCount = (value: unknown, min: number): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= MAX_METATRADER_SLOTS;

/**
 * Starts a Snap order: a prepaid period (`plan`, `interval`, and optionally
 * `metatraderSlots`), or `{ addon: "metatrader", metatraderSlots }` for more
 * slots in the running paid period. Allowed while read-only: it's how users
 * get out of it.
 */
export const POST = handler(
  async (request: Request) => {
    requireValue(midtransConfigured(), "Payments aren't configured on this server yet.");
    const body = (await request.json().catch(() => ({}))) as {
      plan?: unknown;
      interval?: unknown;
      addon?: unknown;
      metatraderSlots?: unknown;
    };
    const user = await currentUser();
    const entitlement = getEntitlement(user.id);
    const slots = body.metatraderSlots ?? 0;
    let order: CheckoutOrder;
    if (body.addon === "metatrader") {
      requireValue(isSlotCount(slots, 1), "Choose how many MetaTrader slots to add.");
      requireValue(
        entitlement.status === "active" && entitlement.endsAt !== null,
        METATRADER_ADDON_RUNNING_MESSAGE,
      );
      requireValue(metatraderAddonAllowed(entitlement.plan), METATRADER_ADDON_PLAN_MESSAGE);
      requireValue(
        entitlement.metatraderSlots + slots <= MAX_METATRADER_SLOTS,
        "Choose how many MetaTrader slots to add.",
      );
      order = {
        kind: "addon",
        plan: entitlement.plan,
        endsAt: entitlement.endsAt,
        metatraderSlots: slots,
      };
    } else {
      requireValue(isPlan(body.plan), "Unknown plan");
      requireValue(isBillingInterval(body.interval), "Unknown billing interval");
      requireValue(isSlotCount(slots, 0), "Choose how many MetaTrader slots to add.");
      if (slots > 0) {
        requireValue(metatraderAddonAllowed(body.plan), METATRADER_ADDON_PLAN_MESSAGE);
      }
      // Fewer slots than connected accounts would leave some unable to sync.
      // (Starter can't sync at all, so it doesn't need the slots.)
      const connected = countMetaTraderAccounts(user.id);
      requireValue(
        !metatraderAddonAllowed(body.plan) || slots >= connected,
        metatraderSlotsBelowConnectedMessage(connected),
      );
      order = { kind: "plan", plan: body.plan, interval: body.interval, metatraderSlots: slots };
    }
    const origin = (process.env.BETTER_AUTH_URL || new URL(request.url).origin).replace(/\/+$/, "");
    return ok(await createCheckout(user, order, `${origin}/billing`));
  },
  { allowReadOnly: true },
);
