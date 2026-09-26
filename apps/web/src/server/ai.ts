import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, RetryError, generateText } from "ai";
import { aiKeyEnvironment, getAiKey, getAiModel, getAiProvider } from "./settings";
import {
  acquireAiBurstSlot,
  alertProviderSpendCap,
  assertAiAccess,
  recordAiCall,
  releaseAiCall,
  reserveAiBudget,
  reserveAiCall,
  type AiReservation,
  type SpendCap,
} from "./ai-quota";
import { RequestError } from "./api";
import {
  AI_MAX_PROMPT_CHARS,
  AI_PAUSED_MESSAGE,
  AI_PROMPT_TOO_LARGE_MESSAGE,
} from "@/lib/ai-quota";
import { AI_PROVIDER_NAMES } from "@/lib/ai-settings";
import { headers } from "next/headers";
import { localeFromCookie } from "@/lib/i18n";

/**
 * BYO-key AI. Self-hosted means YOUR key on YOUR box: the key is read from the
 * encrypted settings store (or the selected provider's environment variable).
 * Requests go straight from this server to the selected provider.
 */
export const aiConfigured = (userId?: string): boolean =>
  getAiKey(getAiProvider(userId), userId) !== null;

const SYSTEM = `You are the reflection layer of a trader's journal.
You see only the trader's own recorded data — trades, stats, and notes. Ground every
statement in those numbers; never invent trades, prices, or market context you weren't given.
Be direct and specific like a good trading coach: name the behavior, cite the numbers,
say what to keep and what to fix. No platitudes, no disclaimers about trading being risky —
the trader knows. Keep it tight.`;

/**
 * The language AI text should be written in: the one the user is reading the
 * app in (the locale cookie on the current request). Outside a request —
 * or if reading it fails — the app default applies.
 */
export const replyLanguage = async (): Promise<"Indonesian" | "English"> => {
  try {
    const cookie = (await headers()).get("cookie");
    return localeFromCookie(cookie) === "en" ? "English" : "Indonesian";
  } catch {
    return "Indonesian";
  }
};

/** USD per million input / output tokens, for what our own key spends. */
const AI_PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
  // Unverified against OpenAI's price list; only used if OPENAI_API_KEY is set.
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
};
/** Unknown models are priced high, so the daily budget errs on the safe side. */
const FALLBACK_PRICE = { input: 5, output: 25 };
const priceOf = (model: string) => AI_PRICES[model] ?? FALLBACK_PRICE;
const costUsd = (model: string, inputTokens: number, outputTokens: number): number => {
  const price = priceOf(model);
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
};
/** The system prompt plus the language line, in tokens, rounded up. */
const SYSTEM_TOKENS = 250;

/**
 * Every AI call goes through here, so every guard lives here: prompt size,
 * per-user burst limit, the daily budget for calls our key pays for, and the
 * plan's quota (reserved before the call, given back if it fails).
 */
export const runAi = async (
  prompt: string,
  maxOutputTokens = 1200,
  userId?: string,
): Promise<string> => {
  // Plan + quota gates the feature itself, independent of whose key is used —
  // a starter-plan user's own pasted key still isn't enough, matching the
  // pricing page's "AI Reflection: not included" for that tier.
  if (userId) assertAiAccess(userId);
  if (prompt.length > AI_MAX_PROMPT_CHARS) throw new RequestError(AI_PROMPT_TOO_LARGE_MESSAGE, 413);
  const provider = getAiProvider(userId);
  const apiKey = getAiKey(provider, userId);
  if (!apiKey) {
    throw new Error(
      `AI is not configured — add your ${AI_PROVIDER_NAMES[provider]} API key in Settings.`,
    );
  }
  const model = getAiModel(provider, userId);
  const serverKey = aiKeyEnvironment(provider) !== null;

  const releases: (() => void)[] = [];
  let reservation: AiReservation | undefined;
  try {
    if (userId) releases.push(acquireAiBurstSlot(userId));
    if (serverKey) {
      // ~3 characters per token at worst, plus the system prompt, plus the full output cap.
      const inputTokens = Math.ceil(prompt.length / 3) + SYSTEM_TOKENS;
      releases.push(reserveAiBudget(costUsd(model, inputTokens, maxOutputTokens)));
    }
    if (userId) reservation = reserveAiCall(userId);
    return await callProvider(
      provider,
      apiKey,
      model,
      prompt,
      maxOutputTokens,
      serverKey,
      (usage) => {
        recordAiCall({
          userId: userId ?? "",
          model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          costUsd: costUsd(model, usage.inputTokens, usage.outputTokens),
          serverKey,
        });
      },
    );
  } catch (error) {
    if (reservation) releaseAiCall(reservation);
    throw error;
  } finally {
    for (const release of releases) release();
  }
};

const SPEND_CAP_CODE = "enforced_spend_limit_reached";

/**
 * Anthropic answers a request past the org's monthly tier cap with a 429
 * (error_code enforced_spend_limit_reached, no retry-after), which the AI SDK
 * would retry. Turned into a 402 here so it isn't: it keeps failing until the
 * 1st of next month. Ordinary 429s pass through and are retried as usual.
 */
const spendCapAwareFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (response.status !== 429) return response;
  const body = await response.clone().text();
  if (!body.includes(SPEND_CAP_CODE)) return response;
  return new Response(body, { status: 402, headers: response.headers });
};

/**
 * Which of Anthropic's spend caps an error is, if any: the limit set in the
 * Console (Settings > Billing), a 400 "You have reached your specified
 * (workspace) API usage limits"; the tier's monthly cap (see above); or no
 * prepaid credits left. For credits, the docs list 402 billing_error; the
 * 400 "Your credit balance is too low" is what the API has been observed to
 * send, and isn't in the docs, so both are matched. Neither is retried.
 */
const anthropicSpendCap = (status: number | undefined, text: string): SpendCap | null => {
  if (status === 400 && /reached your specified (?:workspace )?API usage limits/i.test(text))
    return "console-limit";
  if ((status === 402 || status === 429) && text.includes(SPEND_CAP_CODE)) return "tier-cap";
  if (status === 402 && text.includes("billing_error")) return "credit-balance";
  if (status === 400 && /credit balance is too low/i.test(text)) return "credit-balance";
  return null;
};

const callProvider = async (
  provider: ReturnType<typeof getAiProvider>,
  apiKey: string,
  model: string,
  prompt: string,
  maxOutputTokens: number,
  serverKey: boolean,
  onUsage: (usage: { inputTokens: number; outputTokens: number }) => void,
): Promise<string> => {
  try {
    const result = await generateText({
      model:
        provider === "openai"
          ? createOpenAI({ apiKey }).responses(model)
          : createAnthropic({ apiKey, fetch: spendCapAwareFetch })(model),
      ...(provider === "openai" ? { providerOptions: { openai: { store: false } } } : {}),
      system: `${SYSTEM}
Write your entire answer in ${await replyLanguage()}. Keep standard trading terms (win rate, profit factor, drawdown, P&L, R-multiple, long/short, stop loss, setup) in English, as traders use them.`,
      prompt,
      maxOutputTokens,
    });
    onUsage({
      inputTokens: result.totalUsage.inputTokens ?? 0,
      outputTokens: result.totalUsage.outputTokens ?? 0,
    });
    if (!result.text.trim()) throw new Error("AI returned no text. Check the model or try again.");
    return result.text;
  } catch (error) {
    if (RetryError.isInstance(error)) error = error.lastError;
    // Provider error messages can contain key fragments or request data. Never relay them.
    if (APICallError.isInstance(error)) {
      // Anthropic's spend caps or credits on our own account: nothing the user
      // can fix, and retrying won't help until we raise the limit or buy credits.
      // On a user's own key they're the user's to fix, so the messages below apply.
      const spendCap = anthropicSpendCap(
        error.statusCode,
        `${error.message} ${error.responseBody ?? ""}`,
      );
      if (spendCap && serverKey) {
        alertProviderSpendCap(spendCap);
        throw new RequestError(AI_PAUSED_MESSAGE, 503);
      }
      if (error.statusCode === 401 || error.statusCode === 403)
        throw new Error(
          "AI authentication_error: check your provider key and permissions in Settings.",
        );
      if (
        /credit balance|billing|insufficient_quota|exceeded your current quota/i.test(error.message)
      )
        throw new Error("AI billing: check your provider account's credits and quota.");
      if (error.statusCode === 429 || error.statusCode === 529)
        throw new Error("AI rate limit: please try again shortly.");
      if (
        error.statusCode === 404 ||
        /model.*(?:not found|does not exist|access)/i.test(error.message)
      )
        throw new Error(
          "AI model unavailable: check the model ID and your provider access in Settings.",
        );
    }
    throw new Error("AI request failed. Check your provider settings or try again shortly.");
  }
};
