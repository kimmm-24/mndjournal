import { isPlan, PLANS, type Plan } from "./plan";

export { isPlan, PLANS };
export type { Plan };

export interface AiAccessStatus {
  plan: Plan;
  /** Calls allowed this calendar month. 0 for starter (no AI access at all). */
  quota: number;
  used: number;
  remaining: number;
  /** ISO date (YYYY-MM-DD) the count resets — the 1st of next month. */
  resetsOn: string;
  /** Whether an AI call is allowed right now, given plan and remaining quota. */
  allowed: boolean;
}

export const PLAN_NOT_INCLUDED_MESSAGE =
  "AI features are not included in your plan. Upgrade to Pro or Elite to use them.";

export const quotaExceededMessage = (status: Pick<AiAccessStatus, "used" | "quota" | "resetsOn">): string =>
  `Your AI quota for this month is used up (${status.used}/${status.quota}). It resets on ${status.resetsOn}.`;
