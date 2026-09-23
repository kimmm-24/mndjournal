import type { ImportedExecution } from "@luxalgo/journal-importers";
import {
  deployAccount,
  provisionAccount,
  readAccountInformation,
  readDeals,
  readPositions,
  undeployAccount,
  waitUntilConnected,
  type MetaApiDeal,
} from "./metaapi";

/**
 * MetaTrader 4/5 sync through MetaApi. Every local Indonesian forex broker
 * (Monex, MIFX, Didimax, HSB, …) runs on MetaTrader, so this one connector
 * covers them all. Only a read-only *investor* password is asked for; it is
 * handed to MetaApi once, at connect time, and never stored here.
 */
export const METATRADER_BROKER_ID = "metatrader";

export const METATRADER_BROKER = {
  id: METATRADER_BROKER_ID,
  displayName: "MetaTrader 4 / 5",
  credentials: [
    { key: "platform", label: "Platform", secret: false, options: ["mt5", "mt4"] },
    { key: "login", label: "Account number (login)", secret: false },
    { key: "password", label: "Investor (read-only) password", secret: true },
    { key: "server", label: "Broker server (as on the MT login screen)", secret: false },
  ],
  readOnlySetup:
    "Use your INVESTOR password — it can only read your history, never place trades. Find or set it in MetaTrader under Tools → Options → Server → Change (investor). The server name is the one you pick on MetaTrader's login screen, e.g. \"MonexInvestindo-Live\". mndjournal passes the password to its MetaTrader provider once to connect and doesn't store it.",
};

/** What's kept (encrypted) per account — deliberately no password. */
export interface MetaTraderCredentials {
  metaapiAccountId: string;
  login: string;
  server: string;
  platform: "mt4" | "mt5";
}

export const connectMetaTrader = async (
  name: string,
  input: Record<string, string>,
): Promise<MetaTraderCredentials> => {
  const login = (input.login ?? "").trim();
  const server = (input.server ?? "").trim();
  const platform = input.platform === "mt4" ? "mt4" : input.platform === "mt5" ? "mt5" : null;
  if (!/^\d+$/.test(login))
    throw new Error("The MetaTrader login is your account number (digits only).");
  if (!server) throw new Error("Enter your broker's MetaTrader server name.");
  if (!platform) throw new Error("Choose MT4 or MT5.");
  if (!input.password) throw new Error("Enter your investor password.");
  const metaapiAccountId = await provisionAccount({
    name,
    login,
    password: input.password,
    server,
    platform,
  });
  return { metaapiAccountId, login, server, platform };
};

const TRADE_SIDES: Record<string, "buy" | "sell"> = {
  DEAL_TYPE_BUY: "buy",
  DEAL_TYPE_SELL: "sell",
};

/**
 * MetaTrader deals → journal fills. Each buy/sell deal becomes one fill;
 * balance, credit, bonus and similar deals are account movements, not trades.
 *
 * - `group` = MT position id, so hedged positions on the same symbol are never
 *   netted together (the engine pairs fills within a group only). MT5
 *   netting-mode reversals (DEAL_ENTRY_INOUT) keep their position id, and the
 *   engine closes then re-opens across the flat point on its own.
 * - Closing deals (OUT, OUT_BY, INOUT) carry MetaTrader's own profit as
 *   `reportedGrossPnl`, so journal P&L equals what MT shows even for JPY or
 *   cross pairs, gold, indices and cent accounts, where recomputing
 *   price × lots would be wrong.
 * - MT's net for a deal is profit + swap + commission: charges become the
 *   fee, credits (positive swap, commission rebates) are added to the P&L.
 * - `order` is the deal ticket, which MT assigns increasingly, so fills sort
 *   stably across separate syncs.
 */
export const dealsToExecutions = (deals: MetaApiDeal[]): ImportedExecution[] =>
  deals
    .filter(
      (deal) =>
        deal.type in TRADE_SIDES &&
        typeof deal.symbol === "string" &&
        deal.symbol.length > 0 &&
        (deal.volume ?? 0) > 0,
    )
    .map((deal, index) => {
      const commission = deal.commission ?? 0;
      const swap = deal.swap ?? 0;
      const ticket = Number(deal.id);
      const closing = deal.entryType !== undefined && deal.entryType !== "DEAL_ENTRY_IN";
      return {
        symbol: deal.symbol!,
        side: TRADE_SIDES[deal.type]!,
        quantity: deal.volume!,
        price: deal.price ?? Number.NaN,
        fee: Math.max(0, -commission) + Math.max(0, -swap),
        executedAt: deal.time,
        assetClass: "forex" as const,
        importMetadata: {
          id: `mt:${deal.id}`,
          ...(deal.positionId ? { group: `mt:${deal.positionId}` } : {}),
          order: Number.isSafeInteger(ticket) && ticket >= 0 ? ticket : index,
          preserveFee: true,
          ...(closing
            ? { reportedGrossPnl: (deal.profit ?? 0) + Math.max(0, commission) + Math.max(0, swap) }
            : {}),
        },
      };
    });

/** New accounts re-read their whole history for a day: MT may still be loading it on first connect. */
const FULL_HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Later syncs re-read a month back; duplicates are dropped by the execution content hash. */
const OVERLAP_MS = 30 * 24 * 60 * 60 * 1000;
const HISTORY_START = new Date("2000-01-01T00:00:00Z");

export interface MetaTraderSnapshot {
  executions: ImportedExecution[];
  equity: number;
  currency: string;
  positions: unknown[];
}

/**
 * One sync: deploy (billing starts), wait for the broker login, read deals,
 * account information and open positions, then always undeploy (billing
 * stops) — even when a step fails.
 */
export const fetchMetaTraderSnapshot = async (
  credentials: MetaTraderCredentials,
  account: { createdAt: string; lastSyncAt: string | null },
  now = new Date(),
): Promise<MetaTraderSnapshot> => {
  const id = credentials.metaapiAccountId;
  await deployAccount(id);
  try {
    const region = await waitUntilConnected(id);
    const fullHistory =
      !account.lastSyncAt || now.getTime() - Date.parse(account.createdAt) < FULL_HISTORY_WINDOW_MS;
    const from = fullHistory
      ? HISTORY_START
      : new Date(Date.parse(account.lastSyncAt!) - OVERLAP_MS);
    const to = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const deals = await readDeals(id, region, from, to);
    const [information, positions] = await Promise.all([
      readAccountInformation(id, region),
      readPositions(id, region),
    ]);
    return {
      executions: dealsToExecutions(deals),
      equity: information.equity,
      currency: information.currency,
      positions,
    };
  } finally {
    await undeployQuietly(id);
  }
};

/** A failed undeploy would leave the account billing, so it's retried once and loudly logged. */
export const undeployQuietly = async (id: string): Promise<void> => {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await undeployAccount(id);
      return;
    } catch (error) {
      if (attempt === 2) console.error(`[metatrader] undeploy failed for ${id}`, error);
    }
  }
};
