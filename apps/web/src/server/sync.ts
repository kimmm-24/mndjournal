import { connect, listBrokers as listSdkBrokers, type BrokerId } from "@luxalgo/broker-sdk";
import { eq, isNotNull } from "drizzle-orm";
import type { ImportedExecution } from "@luxalgo/journal-importers";
import { accounts, db } from "@/db";
import { decryptJson, encryptJson } from "./crypto";
import { nowIso } from "./ids";
import { insertExecutions, type InsertResult } from "./executions";
import { metaApiConfigured, removeAccount } from "./metaapi";
import {
  fetchMetaTraderSnapshot,
  METATRADER_BROKER,
  METATRADER_BROKER_ID,
  undeployQuietly,
  type MetaTraderCredentials,
} from "./metatrader";

/**
 * Broker connectivity goes through @luxalgo/broker-sdk, except MetaTrader,
 * which the SDK doesn't cover and which goes through MetaApi
 * (server/metatrader.ts). MetaTrader is listed first — it's what Indonesian
 * forex brokers run on — and only when METAAPI_TOKEN is configured.
 */
export const listBrokers = () => [
  ...(metaApiConfigured() ? [METATRADER_BROKER] : []),
  ...listSdkBrokers(),
];

export const isMetaTrader = (broker: string) => broker === METATRADER_BROKER_ID;

export interface SyncOutcome extends InsertResult {
  accountId: string;
  equity: number | null;
  positions: number;
  syncedAt: string;
}

interface FetchedSnapshot {
  rows: ImportedExecution[];
  equity: number;
  positions: unknown[];
  fetchedAt: string;
  currency?: string;
}

const fetchSdkSnapshot = async (
  accountId: string,
  broker: string,
  credentials: Record<string, string>,
): Promise<FetchedSnapshot> => {
  const connection = connect({
    broker: broker as BrokerId,
    credentials,
    // Some brokers rotate tokens on every fetch (Questrade): persist or die.
    onCredentialsRotated: (next: Record<string, string>) => {
      db.update(accounts)
        .set({ credentialsEnc: encryptJson(next) })
        .where(eq(accounts.id, accountId))
        .run();
    },
  } as Parameters<typeof connect>[0]);

  const snapshot = await connection.fetchSnapshot();
  return {
    rows: snapshot.accounts.flatMap((brokerAccount) =>
      brokerAccount.trades.map((trade) => ({
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        fee: trade.fee ?? 0,
        // The SDK omits unparseable timestamps; a fill with no time can't be
        // journaled meaningfully, so it is dropped rather than guessed at.
        executedAt: trade.executedAt ?? "",
      })),
    ),
    equity: snapshot.accounts.reduce((total, a) => total + a.equity, 0),
    positions: snapshot.accounts.flatMap((a) => a.positions),
    fetchedAt: snapshot.fetchedAt,
  };
};

export const syncAccount = async (accountId: string): Promise<SyncOutcome> => {
  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!account) throw new Error("Account not found");
  if (account.kind !== "sync" || !account.credentialsEnc) {
    throw new Error("Account is not broker-connected");
  }

  let snapshot: FetchedSnapshot;
  if (isMetaTrader(account.broker)) {
    const mt = await fetchMetaTraderSnapshot(
      decryptJson<MetaTraderCredentials>(account.credentialsEnc),
      account,
    );
    snapshot = {
      rows: mt.executions,
      equity: mt.equity,
      positions: mt.positions,
      fetchedAt: nowIso(),
      currency: mt.currency,
    };
  } else {
    snapshot = await fetchSdkSnapshot(
      accountId,
      account.broker,
      decryptJson<Record<string, string>>(account.credentialsEnc),
    );
  }
  const syncedAt = nowIso();

  const timed = snapshot.rows.filter((row) => row.executedAt !== "");
  const untimed = snapshot.rows.length - timed.length;

  // One odd broker record must not fail the whole sync: invalid rows are
  // skipped and counted so the account page can report them.
  const result = insertExecutions(accountId, timed, "sync");
  if (untimed > 0) {
    result.skipped += untimed;
    if (result.skippedReasons.length < 5)
      result.skippedReasons.push(`${untimed} fill(s) had no usable timestamp.`);
  }

  const { equity, positions, fetchedAt } = snapshot;
  db.update(accounts)
    .set({
      lastSyncAt: syncedAt,
      snapshotJson: JSON.stringify({ equity, positions, fetchedAt }),
      // The broker knows the account's real currency (e.g. IDR or cent "USC").
      ...(snapshot.currency && /^[A-Z]{3}$/.test(snapshot.currency)
        ? { currency: snapshot.currency }
        : {}),
    })
    .where(eq(accounts.id, accountId))
    .run();

  return { accountId, ...result, equity, positions: positions.length, syncedAt };
};

/** Accounts with a sync in flight in this process — manual and scheduled syncs never overlap. */
const running = new Set<string>();

export class SyncInProgressError extends Error {
  constructor() {
    super("This account is already syncing.");
  }
}

/**
 * syncAccount plus bookkeeping the Accounts page and scheduler read:
 * `syncingSince` while running, `syncError` on failure (cleared on success),
 * `syncAttemptedAt` for backoff either way.
 */
export const runAccountSync = async (accountId: string): Promise<SyncOutcome> => {
  if (running.has(accountId)) throw new SyncInProgressError();
  running.add(accountId);
  const startedAt = nowIso();
  db.update(accounts)
    .set({ syncingSince: startedAt, syncAttemptedAt: startedAt })
    .where(eq(accounts.id, accountId))
    .run();
  try {
    const outcome = await syncAccount(accountId);
    db.update(accounts)
      .set({ syncingSince: null, syncError: null })
      .where(eq(accounts.id, accountId))
      .run();
    return outcome;
  } catch (error) {
    db.update(accounts)
      .set({
        syncingSince: null,
        syncError: error instanceof Error ? error.message : "Sync failed",
      })
      .where(eq(accounts.id, accountId))
      .run();
    throw error;
  } finally {
    running.delete(accountId);
  }
};

/** Fire-and-forget sync for slow connectors (MetaTrader); the outcome lands on the account row. */
export const startAccountSync = (accountId: string): void => {
  runAccountSync(accountId).catch((error: unknown) => {
    if (!(error instanceof SyncInProgressError)) {
      console.error(`[sync] account ${accountId} failed`, error);
    }
  });
};

/** Tears down the broker side of a deleted account (MetaApi terminal); best effort. */
export const disconnectBroker = async (account: {
  broker: string;
  credentialsEnc: string | null;
}): Promise<void> => {
  if (!isMetaTrader(account.broker) || !account.credentialsEnc) return;
  const { metaapiAccountId } = decryptJson<MetaTraderCredentials>(account.credentialsEnc);
  await removeAccount(metaapiAccountId).catch((error: unknown) =>
    console.error(`[metatrader] couldn't remove ${metaapiAccountId}`, error),
  );
};

/**
 * Boot-time cleanup: a restart mid-sync leaves `syncingSince` set forever
 * and — for MetaTrader — possibly a deployed (billing) terminal. Clear the
 * flag and undeploy.
 */
export const recoverInterruptedSyncs = async (): Promise<void> => {
  const stuck = db.select().from(accounts).where(isNotNull(accounts.syncingSince)).all();
  for (const account of stuck) {
    db.update(accounts)
      .set({ syncingSince: null, syncError: "Sync was interrupted by a server restart." })
      .where(eq(accounts.id, account.id))
      .run();
    if (isMetaTrader(account.broker) && account.credentialsEnc) {
      await undeployQuietly(
        decryptJson<MetaTraderCredentials>(account.credentialsEnc).metaapiAccountId,
      );
    }
  }
};
