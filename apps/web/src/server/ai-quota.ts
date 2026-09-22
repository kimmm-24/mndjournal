import { and, eq, sql } from "drizzle-orm";
import { db, aiUsage } from "@/db";
import {
  PLAN_NOT_INCLUDED_MESSAGE,
  quotaExceededMessage,
  type AiAccessStatus,
  type Plan,
} from "@/lib/ai-quota";
import { getPlan } from "./plan";

const DEFAULT_PRO_QUOTA = 100;
const DEFAULT_ELITE_QUOTA = 300;

const envQuota = (name: string, fallback: number): number => {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
};

export const getAiQuota = (plan: Plan): number => {
  if (plan === "starter") return 0;
  if (plan === "pro") return envQuota("PRO_AI_QUOTA", DEFAULT_PRO_QUOTA);
  return envQuota("ELITE_AI_QUOTA", DEFAULT_ELITE_QUOTA);
};

const monthKey = (date = new Date()): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

/** ISO date (YYYY-MM-DD) of the 1st of next UTC month — when the count resets. */
const nextResetDate = (date = new Date()): string =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);

export const getAiUsage = (userId: string): number =>
  db
    .select({ count: aiUsage.count })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.month, monthKey())))
    .get()?.count ?? 0;

export const getAiAccessStatus = (userId: string): AiAccessStatus => {
  const plan = getPlan(userId);
  const quota = getAiQuota(plan);
  const used = getAiUsage(userId);
  return {
    plan,
    quota,
    used,
    remaining: Math.max(0, quota - used),
    resetsOn: nextResetDate(),
    allowed: quota > 0 && used < quota,
  };
};

/** Gate for runAi — throws the exact message the UI shows via AiNotice/aiFeedback. */
export const assertAiAccess = (userId: string): void => {
  const status = getAiAccessStatus(userId);
  if (status.plan === "starter") throw new Error(PLAN_NOT_INCLUDED_MESSAGE);
  if (!status.allowed) throw new Error(quotaExceededMessage(status));
};

/** Combined recap + critique + ask-journal usage, incremented only after a call succeeds. */
export const recordAiUsage = (userId: string): void => {
  const month = monthKey();
  db.insert(aiUsage)
    .values({ userId, month, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.month],
      set: { count: sql`${aiUsage.count} + 1` },
    })
    .run();
};
