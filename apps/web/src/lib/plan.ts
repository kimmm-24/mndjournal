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
}

/** A payment as the billing page sees it. */
export interface BillingPayment {
  orderId: string;
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

export const accountLimitMessage = (limit: number): string =>
  `You've reached your plan's limit of ${limit} account${limit === 1 ? "" : "s"}. Upgrade to add more.`;
export const propAccountLimitMessage = (limit: number): string =>
  `You've reached your plan's limit of ${limit} prop-firm account${limit === 1 ? "" : "s"}. Upgrade to add more.`;
