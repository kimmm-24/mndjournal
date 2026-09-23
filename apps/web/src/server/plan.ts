import { eq } from "drizzle-orm";
import { db, subscriptions } from "@/db";
import { isPlan, TRIAL_DAYS, TRIAL_PLAN, type Entitlement, type Plan } from "@/lib/plan";

const DAY_MS = 24 * 60 * 60 * 1000;

export type SubscriptionRow = typeof subscriptions.$inferSelect;

/** Pure: what a subscription row grants at `now`. */
export const resolveEntitlement = (row: SubscriptionRow, now = new Date()): Entitlement => {
  const lastPlan: Plan = isPlan(row.plan) ? row.plan : "starter";
  const wasTrial = row.status === "trial";
  if (row.status === "comp") {
    return { plan: lastPlan, status: "comp", lastPlan, wasTrial, endsAt: null, readOnly: false };
  }
  const endsAt = row.endsAt;
  if (endsAt && Date.parse(endsAt) > now.getTime()) {
    return {
      plan: lastPlan,
      status: wasTrial ? "trial" : "active",
      lastPlan,
      wasTrial,
      endsAt,
      readOnly: false,
    };
  }
  return { plan: "starter", status: "expired", lastPlan, wasTrial, endsAt, readOnly: true };
};

/**
 * The user's access right now. A user with no row yet — a new signup, or an
 * account from before billing existed — gets a TRIAL_DAYS trial of TRIAL_PLAN
 * starting now, so no signup hook or backfill is needed.
 */
export const getEntitlement = (userId: string, now = new Date()): Entitlement => {
  const read = () => db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).get();
  let row = read();
  if (!row) {
    db.insert(subscriptions)
      .values({
        userId,
        plan: TRIAL_PLAN,
        status: "trial",
        endsAt: new Date(now.getTime() + TRIAL_DAYS * DAY_MS).toISOString(),
        updatedAt: now.toISOString(),
      })
      // Two first requests racing: whichever insert lands first wins.
      .onConflictDoNothing()
      .run();
    row = read()!;
  }
  return resolveEntitlement(row, now);
};

/** The plan feature gates check: the trial plan while trialing, 'starter' once expired. */
export const getPlan = (userId: string): Plan => getEntitlement(userId).plan;

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
