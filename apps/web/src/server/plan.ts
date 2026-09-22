import { eq } from "drizzle-orm";
import { db, subscriptions } from "@/db";
import { isPlan, type Plan } from "@/lib/plan";

/** No row = 'starter' — every existing account, including the legacy migrated one. */
export const getPlan = (userId: string): Plan => {
  const plan = db
    .select({ plan: subscriptions.plan })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .get()?.plan;
  return isPlan(plan) ? plan : "starter";
};

export const ACCOUNT_LIMITS: Record<Plan, number> = {
  starter: 1,
  pro: 10,
  elite: Infinity,
};
export const getAccountLimit = (plan: Plan): number => ACCOUNT_LIMITS[plan];

export const PROP_ACCOUNT_LIMITS: Record<Plan, number> = {
  starter: 0,
  pro: 1,
  elite: Infinity,
};
export const getPropAccountLimit = (plan: Plan): number => PROP_ACCOUNT_LIMITS[plan];

export const playbooksAllowed = (plan: Plan): boolean => plan !== "starter";
export const syncImportAllowed = (plan: Plan): boolean => plan !== "starter";
export const replayAllowed = (plan: Plan): boolean => plan !== "starter";

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
