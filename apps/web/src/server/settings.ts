import { and, eq } from "drizzle-orm";
import { db, settings } from "@/db";
import { decryptJson, encryptJson } from "./crypto";
import { EMPTY_DEFAULTS, type JournalDefaults } from "@/lib/journal-defaults";
import {
  AI_DEFAULT_MODELS,
  isAiProvider,
  type AiProvider,
  type AiSettingsPayload,
} from "@/lib/ai-settings";

/**
 * Settings are keyed by (userId, key). `userId` is optional on every
 * function here so callers not yet migrated to per-user scoping (see the
 * tenancy plan's incremental batches) keep compiling; they land in this
 * fixed bucket instead of a real user's row. Nothing ever reassigns rows out
 * of it — unlike the legacy-migration sentinel, it's a stable "shared until
 * that feature's own batch" default, not a one-time placeholder.
 */
const UNSCOPED_OWNER = "__unscoped__";

export const getJournalDefaults = (userId?: string): JournalDefaults => {
  try {
    return { ...EMPTY_DEFAULTS, ...JSON.parse(getSetting("journalDefaults", userId) ?? "{}") };
  } catch {
    return EMPTY_DEFAULTS;
  }
};

export const getSetting = (key: string, userId?: string): string | null =>
  db
    .select()
    .from(settings)
    .where(and(eq(settings.key, key), eq(settings.userId, userId ?? UNSCOPED_OWNER)))
    .get()?.value ?? null;

export const setSetting = (key: string, value: string, userId?: string): void => {
  db.insert(settings)
    .values({ userId: userId ?? UNSCOPED_OWNER, key, value })
    .onConflictDoUpdate({ target: [settings.userId, settings.key], set: { value } })
    .run();
};

export const deleteSetting = (key: string, userId?: string): void => {
  db.delete(settings)
    .where(and(eq(settings.key, key), eq(settings.userId, userId ?? UNSCOPED_OWNER)))
    .run();
};

/** Journal display timezone (IANA), default UTC. */
export const getTimeZone = (userId?: string): string => getSetting("timeZone", userId) ?? "UTC";

/** Preserve the legacy parsing default until a separate import zone is saved. */
export const getImportTimeZone = (userId?: string): string =>
  getSetting("importTimeZone", userId) ?? getTimeZone(userId);

/** Per-symbol contract multipliers for futures/options P&L. */
export const getMultipliers = (userId?: string): Record<string, number> => {
  const raw = getSetting("multipliers", userId);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
};

export const aiKeyEnvironment = (provider: AiProvider): string | null =>
  (provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY)?.trim() ||
  null;

/** Provider keys are stored separately and encrypted like broker credentials. */
export const getAiKey = (provider: AiProvider, userId?: string): string | null => {
  const environment = aiKeyEnvironment(provider);
  if (environment) return environment;
  const envelope = getSetting(`${provider}KeyEnc`, userId);
  if (!envelope) return null;
  try {
    const key = decryptJson<unknown>(envelope);
    return typeof key === "string" ? key.trim() || null : null;
  } catch {
    return null;
  }
};

export const setAiKey = (provider: AiProvider, key: string | null, userId?: string): void => {
  if (key === null) deleteSetting(`${provider}KeyEnc`, userId);
  else setSetting(`${provider}KeyEnc`, encryptJson(key.trim()), userId);
};

export const getAnthropicKey = (userId?: string): string | null => getAiKey("anthropic", userId);
export const setAnthropicKey = (key: string | null, userId?: string): void =>
  setAiKey("anthropic", key, userId);

export const getAiProvider = (userId?: string): AiProvider => {
  const selected = getSetting("aiProvider", userId);
  if (isAiProvider(selected)) return selected;
  // Preserve existing Anthropic setups; an OpenAI-only setup works without a UI visit.
  return !getAiKey("anthropic", userId) && getAiKey("openai", userId) ? "openai" : "anthropic";
};

export const aiModelSetting = (provider: AiProvider): string =>
  provider === "anthropic" ? "aiModel" : "openaiModel";

export const getAiModel = (provider: AiProvider, userId?: string): string =>
  getSetting(aiModelSetting(provider), userId)?.trim() || AI_DEFAULT_MODELS[provider];

export const getAiSettings = (userId?: string): AiSettingsPayload => {
  const aiProvider = getAiProvider(userId);
  const connection = (provider: AiProvider) => ({
    configured: Boolean(getAiKey(provider, userId)),
    source: aiKeyEnvironment(provider)
      ? ("environment" as const)
      : getAiKey(provider, userId)
        ? ("saved" as const)
        : null,
    model: getAiModel(provider, userId),
  });
  const aiConnections = { anthropic: connection("anthropic"), openai: connection("openai") };
  return {
    aiProvider,
    aiConfigured: aiConnections[aiProvider].configured,
    aiModel: aiConnections[aiProvider].model,
    aiConnections,
  };
};
