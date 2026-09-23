import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { accounts, db } from "@/db";
import { getEntitlement, syncImportAllowed } from "./plan";
import { isMetaTrader, recoverInterruptedSyncs, runAccountSync } from "./sync";

/**
 * Background auto-sync for broker-connected accounts with "Auto-sync" on.
 * Before this existed the toggle was stored but nothing ever acted on it.
 *
 * Intervals are per connector because their costs differ: SDK brokers are
 * free API calls, while each MetaTrader sync deploys a MetaApi terminal,
 * which is billed per deployed hour. Both are measured from the last
 * *attempt*, so an account that keeps failing (e.g. changed password)
 * retries once per interval instead of every tick.
 */
const hoursFromEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return (Number.isFinite(value) && value > 0 ? value : fallback) * 60 * 60 * 1000;
};
export const syncIntervalMs = (broker: string) =>
  isMetaTrader(broker)
    ? hoursFromEnv("METATRADER_SYNC_INTERVAL_HOURS", 6)
    : hoursFromEnv("AUTO_SYNC_INTERVAL_HOURS", 1);

const TICK_MS = 10 * 60 * 1000;
const FIRST_TICK_MS = 60 * 1000;

/**
 * Accounts due now. Users whose plan lapsed (read-only) or no longer
 * includes broker sync are skipped — their data stays, the syncing stops.
 */
export const dueAccounts = (now = new Date()) =>
  db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.kind, "sync"),
        eq(accounts.autoSync, true),
        isNull(accounts.archivedAt),
        isNull(accounts.syncingSince),
        isNotNull(accounts.credentialsEnc),
      ),
    )
    .all()
    .filter((account) => {
      const last = account.syncAttemptedAt ?? account.lastSyncAt;
      if (last && now.getTime() - Date.parse(last) < syncIntervalMs(account.broker)) return false;
      const entitlement = getEntitlement(account.userId, now);
      return !entitlement.readOnly && syncImportAllowed(entitlement.plan);
    });

/** One pass: due accounts sync one at a time, so a slow broker can't stampede the rest. */
export const runDueSyncs = async (now = new Date()): Promise<void> => {
  for (const account of dueAccounts(now)) {
    try {
      await runAccountSync(account.id);
    } catch {
      // Recorded on the account row by runAccountSync; keep going.
    }
  }
};

const globalForScheduler = globalThis as unknown as { __journalSyncScheduler?: boolean };

/** Started once per server process from instrumentation.ts. */
export const startSyncScheduler = async (): Promise<void> => {
  if (globalForScheduler.__journalSyncScheduler) return;
  globalForScheduler.__journalSyncScheduler = true;
  await recoverInterruptedSyncs();
  let ticking = false;
  const tick = async () => {
    if (ticking) return;
    ticking = true;
    try {
      await runDueSyncs();
    } catch (error) {
      console.error("[sync] scheduler tick failed", error);
    } finally {
      ticking = false;
    }
  };
  setTimeout(() => void tick(), FIRST_TICK_MS).unref();
  setInterval(() => void tick(), TICK_MS).unref();
};
