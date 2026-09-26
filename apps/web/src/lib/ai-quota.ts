import { isPlan, PLANS, type Plan } from "./plan";

export { isPlan, PLANS };
export type { Plan };

export interface AiAccessStatus {
  plan: Plan;
  /** Calls allowed in this period. 0 for starter (no AI access at all). */
  quota: number;
  used: number;
  remaining: number;
  /**
   * What the quota covers: a calendar month (UTC), or the whole free trial,
   * which gets one allowance however many months it spans.
   */
  period: "month" | "trial";
  /** ISO date (YYYY-MM-DD) the count resets: the 1st of next month, or the trial's end. */
  resetsOn: string;
  /** Whether an AI call is allowed right now, given plan and remaining quota. */
  allowed: boolean;
}

/** Longest question "Ask your journal" accepts. */
export const AI_MAX_QUESTION_CHARS = 1_000;

/**
 * Longest prompt sent to the model, whatever the feature. At ~3 characters per
 * token or more, that's at most ~8k input tokens: with the 1,200-token output
 * cap, about $0.014 per call on Claude Haiku 4.5. Each feature trims the
 * user's own text (notes, trades, playbooks) well below this; this is the
 * backstop.
 */
export const AI_MAX_PROMPT_CHARS = 24_000;

export const PLAN_NOT_INCLUDED_MESSAGE =
  "AI features are not included in your plan. Upgrade to Pro or Elite to use them.";

export const AI_TOO_FAST_MESSAGE =
  "You're sending AI requests too quickly. Please wait a minute and try again.";

export const AI_PAUSED_MESSAGE =
  "AI features are paused for the rest of today. Please try again tomorrow; the rest of your journal works as usual.";

export const AI_PROMPT_TOO_LARGE_MESSAGE =
  "This request has too much data for AI. Try a shorter note or a day with fewer trades.";

export const aiQuestionTooLongMessage = (limit = AI_MAX_QUESTION_CHARS): string =>
  `Your question is too long. Keep it under ${limit.toLocaleString("en-US")} characters.`;

export const quotaExceededMessage = (
  status: Pick<AiAccessStatus, "used" | "quota" | "resetsOn"> & {
    period?: AiAccessStatus["period"];
  },
): string =>
  status.period === "trial"
    ? `You've used all ${status.quota} AI calls included in your trial. Choose a plan on the Billing page to keep using AI.`
    : `Your AI quota for this month is used up (${status.used}/${status.quota}). It resets on ${status.resetsOn}.`;

/** Shortens user-written text before it goes into a prompt, saying that it did. */
export const clipForAi = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max)}… [truncated]`;
