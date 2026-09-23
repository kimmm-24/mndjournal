export const PLANS = ["starter", "pro", "elite"] as const;
export type Plan = (typeof PLANS)[number];

export const isPlan = (value: unknown): value is Plan =>
  value === "starter" || value === "pro" || value === "elite";

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const isBillingInterval = (value: unknown): value is BillingInterval =>
  value === "month" || value === "year";

/** Every new account starts with this many days of Pro, no payment needed. */
export const TRIAL_DAYS = 14;
/** The plan a trial unlocks — the features worth paying for, not the entry tier. */
export const TRIAL_PLAN: Plan = "pro";

/**
 * MetaTrader auto sync is an add-on sold per connected MetaTrader account, on
 * top of Pro or Elite: every account costs us MetaApi fees (a one-off fee to
 * add it, plus one per sync), unlike SDK brokers, which are free API calls.
 * The price covers even a first month's worst case, one-off fee included,
 * under the limits in lib/metatrader-sync.ts. Slots run with the plan's
 * period. A yearly period charges 12 months — no yearly discount, because the
 * cost behind it doesn't shrink either.
 */
export const METATRADER_ADDON_MONTHLY_PRICE = 89_000;
/** Least a mid-period slot costs: the one-off MetaApi fee to add an account is due regardless. */
export const METATRADER_ADDON_MIN_PRICE = 49_000;
export const MAX_METATRADER_SLOTS = 20;
export const metatraderAddonAllowed = (plan: Plan): boolean => plan !== "starter";

export const metatraderAddonPrice = (interval: BillingInterval): number =>
  METATRADER_ADDON_MONTHLY_PRICE * (interval === "month" ? 1 : 12);

/**
 * Pure: the price of one extra MetaTrader slot bought mid-period, for the days
 * left until `endsAt` (30-day months, whole days, rounded up to Rp1.000), and
 * never below METATRADER_ADDON_MIN_PRICE. Per slot, so Midtrans's item lines
 * add up to the total exactly.
 */
export const proratedAddonPrice = (endsAt: string, now = new Date()): number => {
  const days = Math.max(1, Math.ceil((Date.parse(endsAt) - now.getTime()) / 86_400_000));
  const prorated = Math.ceil((METATRADER_ADDON_MONTHLY_PRICE * days) / 30 / 1000) * 1000;
  return Math.max(METATRADER_ADDON_MIN_PRICE, prorated);
};

/**
 * A user's resolved access right now:
 * - `trial`   — free trial, `plan` is TRIAL_PLAN until `endsAt`.
 * - `active`  — a paid period of `plan` running until `endsAt`.
 * - `comp`    — granted manually (SQL), never expires.
 * - `expired` — trial or paid period ended without renewal: the journal is
 *   read-only and `plan` is 'starter' for feature gates; `lastPlan` is what
 *   they had.
 */
export interface Entitlement {
  plan: Plan;
  status: "trial" | "active" | "comp" | "expired";
  lastPlan: Plan;
  /** Whether the current (or, when expired, the last) period was the free trial. */
  wasTrial: boolean;
  endsAt: string | null;
  readOnly: boolean;
  /** Paid MetaTrader add-on slots: how many MetaTrader accounts may be connected. */
  metatraderSlots: number;
}

/** A payment as the billing page sees it. */
export interface BillingPayment {
  orderId: string;
  /** 'plan' buys a period (with its MetaTrader slots); 'addon' adds slots to the running one. */
  kind: "plan" | "addon";
  metatraderSlots: number;
  plan: Plan;
  interval: BillingInterval;
  amount: number;
  status: "pending" | "paid" | "failed" | "expired" | "refunded";
  paymentType: string | null;
  periodEndsAt: string | null;
  paidAt: string | null;
  createdAt: string;
  /** Snap token of a still-payable pending order, to reopen its payment instructions. */
  resumeToken: string | null;
}

/** Window event the billing page fires after a payment so the shell's banner refetches. */
export const ENTITLEMENT_CHANGED_EVENT = "mndjournal:entitlement-changed";

export const READ_ONLY_MESSAGE =
  "Your plan has ended, so your journal is read-only. Choose a plan on the Billing page to keep journaling.";

export const PLAYBOOKS_NOT_INCLUDED_MESSAGE =
  "Playbooks are not included in your plan. Upgrade to Pro or Elite to create and use playbooks.";
export const PROP_FIRM_NOT_INCLUDED_MESSAGE =
  "Prop-firm tracking is not included in your plan. Upgrade to Pro or Elite to add a prop-firm account.";
export const SYNC_IMPORT_NOT_INCLUDED_MESSAGE =
  "Broker sync and file import aren't included in your plan. Upgrade to Pro or Elite, or add a manual account instead.";

export const METATRADER_ADDON_PLAN_MESSAGE = "The MetaTrader add-on is available on Pro and Elite.";
export const METATRADER_ADDON_RUNNING_MESSAGE =
  "MetaTrader slots can be added to a running paid plan. Choose a plan with MetaTrader slots instead.";
export const metatraderSlotsMessage = (slots: number): string =>
  slots === 0
    ? "MetaTrader auto sync is an add-on. Add a MetaTrader slot on the Billing page to connect this account."
    : `Your MetaTrader add-on covers ${slots} account${slots === 1 ? "" : "s"}. Add a slot on the Billing page to connect another.`;
export const metatraderSlotsBelowConnectedMessage = (connected: number): string =>
  `You have ${connected} MetaTrader account${connected === 1 ? "" : "s"} connected. Delete some before choosing fewer MetaTrader slots.`;

export const accountLimitMessage = (limit: number): string =>
  `You've reached your plan's limit of ${limit} account${limit === 1 ? "" : "s"}. Upgrade to add more.`;
export const propAccountLimitMessage = (limit: number): string =>
  `You've reached your plan's limit of ${limit} prop-firm account${limit === 1 ? "" : "s"}. Upgrade to add more.`;
