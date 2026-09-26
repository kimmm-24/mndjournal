import { and, eq, gt, sql } from "drizzle-orm";
import { db, aiCalls, aiUsage } from "@/db";
import {
  AI_PAUSED_MESSAGE,
  AI_TOO_FAST_MESSAGE,
  PLAN_NOT_INCLUDED_MESSAGE,
  quotaExceededMessage,
  type AiAccessStatus,
  type Plan,
} from "@/lib/ai-quota";
import { RequestError } from "./api";
import { getEntitlement } from "./plan";

const DEFAULT_PRO_QUOTA = 50;
const DEFAULT_ELITE_QUOTA = 105;
/** A taste of AI during the free trial, not a full Pro month's worth. */
const DEFAULT_TRIAL_QUOTA = 10;
/** Our spend on AI per WIB day before AI pauses for everyone. 0 turns AI off. */
const DEFAULT_DAILY_BUDGET_USD = 10;
const DEFAULT_MAX_IN_FLIGHT = 1;
const DEFAULT_MAX_PER_MINUTE = 10;

const envNumber = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export const getAiQuota = (plan: Plan): number => {
  if (plan === "starter") return 0;
  if (plan === "pro") return envNumber("PRO_AI_QUOTA", DEFAULT_PRO_QUOTA);
  return envNumber("ELITE_AI_QUOTA", DEFAULT_ELITE_QUOTA);
};

const monthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

/** ISO date (YYYY-MM-DD) of the 1st of next UTC month — when the count resets. */
const nextResetDate = (date: Date): string =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);

/** The ai_usage key a call counts against: the whole trial, or this calendar month. */
const usageKey = (period: AiAccessStatus["period"], now: Date): string =>
  period === "trial" ? "trial" : monthKey(now);

const usedIn = (userId: string, key: string): number =>
  db
    .select({ count: aiUsage.count })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.month, key)))
    .get()?.count ?? 0;

export const getAiAccessStatus = (userId: string, now = new Date()): AiAccessStatus => {
  const { plan, status: planStatus, endsAt } = getEntitlement(userId, now);
  const period = planStatus === "trial" ? "trial" : "month";
  const quota =
    period === "trial" ? envNumber("TRIAL_AI_QUOTA", DEFAULT_TRIAL_QUOTA) : getAiQuota(plan);
  const used = usedIn(userId, usageKey(period, now));
  return {
    plan,
    quota,
    used,
    remaining: Math.max(0, quota - used),
    period,
    resetsOn: period === "trial" && endsAt ? endsAt.slice(0, 10) : nextResetDate(now),
    allowed: quota > 0 && used < quota,
  };
};

/**
 * Early, read-only check (plan includes AI, quota not used up), so a refusal
 * comes before anything else. The binding check is reserveAiCall.
 */
export const assertAiAccess = (userId: string): void => {
  const status = getAiAccessStatus(userId);
  if (status.plan === "starter") throw new RequestError(PLAN_NOT_INCLUDED_MESSAGE, 403);
  if (!status.allowed) throw new RequestError(quotaExceededMessage(status), 429);
};

export interface AiReservation {
  userId: string;
  key: string;
}

/**
 * Takes one call from the user's quota before the AI call is made, in a
 * single conditional upsert, so parallel requests can never take more than
 * the quota: each one either gets a slot or is refused. Give the slot back
 * with releaseAiCall if the call fails.
 */
export const reserveAiCall = (userId: string, now = new Date()): AiReservation => {
  const status = getAiAccessStatus(userId, now);
  if (status.plan === "starter") throw new RequestError(PLAN_NOT_INCLUDED_MESSAGE, 403);
  const key = usageKey(status.period, now);
  const taken =
    status.quota > 0 &&
    db
      .insert(aiUsage)
      .values({ userId, month: key, count: 1 })
      .onConflictDoUpdate({
        target: [aiUsage.userId, aiUsage.month],
        set: { count: sql`${aiUsage.count} + 1` },
        setWhere: sql`${aiUsage.count} < ${status.quota}`,
      })
      .run().changes === 1;
  if (!taken) throw new RequestError(quotaExceededMessage(status), 429);
  return { userId, key };
};

export const releaseAiCall = ({ userId, key }: AiReservation): void => {
  db.update(aiUsage)
    .set({ count: sql`${aiUsage.count} - 1` })
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.month, key), gt(aiUsage.count, 0)))
    .run();
};

// Burst limit: per user, in this process's memory (the app runs as one instance).
const burst = new Map<string, { inFlight: number; recent: number[] }>();

/**
 * At most AI_MAX_IN_FLIGHT_PER_USER calls running at once and
 * AI_MAX_CALLS_PER_MINUTE started per minute, per user. Returns the function
 * that marks the call finished.
 */
export const acquireAiBurstSlot = (userId: string, now = Date.now()): (() => void) => {
  const maxInFlight = envNumber("AI_MAX_IN_FLIGHT_PER_USER", DEFAULT_MAX_IN_FLIGHT);
  const maxPerMinute = envNumber("AI_MAX_CALLS_PER_MINUTE", DEFAULT_MAX_PER_MINUTE);
  const entry = burst.get(userId) ?? { inFlight: 0, recent: [] };
  entry.recent = entry.recent.filter((at) => now - at < 60_000);
  if (entry.inFlight >= maxInFlight || entry.recent.length >= maxPerMinute) {
    burst.set(userId, entry);
    throw new RequestError(AI_TOO_FAST_MESSAGE, 429);
  }
  entry.inFlight += 1;
  entry.recent.push(now);
  burst.set(userId, entry);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.inFlight = Math.max(0, entry.inFlight - 1);
  };
};

/** Test seam: forget burst history between tests. */
export const resetAiBurstState = (): void => burst.clear();

// Daily budget: what our own API key spent today (WIB), plus the most that
// calls still running could add, so parallel calls can't overshoot the cap.
let pendingUsd = 0;
const alerted = new Set<string>();

/** Jakarta date (UTC+7, no daylight saving), the day the budget resets on. */
export const wibDay = (now = new Date()): string =>
  new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const aiDailyBudgetUsd = (): number =>
  envNumber("AI_DAILY_BUDGET_USD", DEFAULT_DAILY_BUDGET_USD);

export const aiSpentTodayUsd = (now = new Date()): number =>
  db
    .select({ total: sql<number>`coalesce(sum(${aiCalls.costUsd}), 0)` })
    .from(aiCalls)
    .where(and(eq(aiCalls.day, wibDay(now)), eq(aiCalls.serverKey, true)))
    .get()?.total ?? 0;

/** Logs once per day per threshold, so the morning log check sees it. */
const alertBudget = (spent: number, budget: number, now: Date): void => {
  const reached = spent >= budget;
  if (!reached && spent < budget * 0.8) return;
  const day = wibDay(now);
  // Past 100%, the 80% line would only be noise.
  if (reached) alerted.add(`${day}:80`);
  const key = `${day}:${reached ? 100 : 80}`;
  if (alerted.has(key)) return;
  alerted.add(key);
  const amounts = `$${spent.toFixed(4)} of $${budget.toFixed(2)} on ${day} (WIB)`;
  if (reached) console.error(`[ai] daily AI budget reached: ${amounts}; AI paused until 00:00 WIB`);
  else console.warn(`[ai] daily AI budget 80% used: ${amounts}`);
};

/**
 * Reserves `maxCostUsd` of today's budget for a call our key pays for, or
 * refuses with a 503 when today's spend plus calls in flight would pass
 * AI_DAILY_BUDGET_USD. Returns the release for when the call ends.
 */
export const reserveAiBudget = (maxCostUsd: number, now = new Date()): (() => void) => {
  const budget = aiDailyBudgetUsd();
  const spent = aiSpentTodayUsd(now);
  if (budget <= 0 || spent + pendingUsd + maxCostUsd > budget) {
    // Counts what's in flight, so the alert fires when AI actually pauses.
    alertBudget(Math.max(budget, spent + pendingUsd + maxCostUsd), budget, now);
    throw new RequestError(AI_PAUSED_MESSAGE, 503);
  }
  pendingUsd += maxCostUsd;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    pendingUsd = Math.max(0, pendingUsd - maxCostUsd);
  };
};

/** Records a call that reached the provider, and raises the budget alerts. */
export const recordAiCall = (
  call: {
    userId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    serverKey: boolean;
  },
  now = new Date(),
): void => {
  db.insert(aiCalls)
    .values({ ...call, day: wibDay(now), createdAt: now.toISOString() })
    .run();
  if (call.serverKey) alertBudget(aiSpentTodayUsd(now), aiDailyBudgetUsd(), now);
};

export type SpendCap = "console-limit" | "tier-cap" | "credit-balance";

const SPEND_CAP_ALERTS: Record<SpendCap, string> = {
  "console-limit":
    "[ai] Anthropic refused: the API usage limit set in the Anthropic Console is reached. AI is unavailable until it is raised (Console > Settings > Billing).",
  "tier-cap":
    "[ai] Anthropic refused: the account's monthly spend cap for its usage tier is reached (enforced_spend_limit_reached). AI is unavailable until 00:00 UTC on the 1st, or until the tier is raised.",
  "credit-balance":
    "[ai] Anthropic refused: the organization's prepaid credit balance is too low. AI is unavailable until credits are bought (Console > Settings > Billing).",
};

/** One log line per cap per WIB day, not one per refused request. */
export const alertProviderSpendCap = (cap: SpendCap, now = new Date()): void => {
  const key = `${wibDay(now)}:${cap}`;
  if (alerted.has(key)) return;
  alerted.add(key);
  console.error(SPEND_CAP_ALERTS[cap]);
};

/** Test seam: forget budget reservations and alerts between tests. */
export const resetAiBudgetState = (): void => {
  pendingUsd = 0;
  alerted.clear();
};
