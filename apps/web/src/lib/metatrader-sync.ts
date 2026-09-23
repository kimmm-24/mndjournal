/**
 * MetaTrader sync limits. MetaApi bills per MetaTrader account: a fee to add
 * one, and a fee each time its terminal is deployed, which happens on every
 * sync. These limits cap the worst case per add-on slot below the add-on's
 * price (METATRADER_ADDON_MONTHLY_PRICE in lib/plan.ts) — change them only
 * together with that price.
 */

/** Each account syncs at most once per this many hours, automatic and manual combined. */
export const METATRADER_SYNC_GAP_HOURS = 24;

/**
 * Syncs run Monday to Friday, Jakarta time (UTC+7, no daylight saving): the
 * forex and gold markets are closed at the weekend, so weekend trades are rare
 * and simply sync on Monday. The sync right after connecting is the exception,
 * so a new account isn't empty until Monday.
 */
export const isMetaTraderSyncDay = (now = new Date()): boolean => {
  const day = new Date(now.getTime() + 7 * 60 * 60 * 1000).getUTCDay();
  return day >= 1 && day <= 5;
};

export const METATRADER_WEEKEND_MESSAGE =
  "MetaTrader syncs run Monday to Friday (WIB), while the markets are open. Weekend trades sync on Monday.";

/** New MetaTrader accounts each add-on slot may connect per 30 days. */
export const METATRADER_CONNECTS_PER_SLOT = 2;

/** Shown instead of MetaApi's own billing errors, which are about our MetaApi balance, not the user's. */
export const METATRADER_UNAVAILABLE_MESSAGE =
  "MetaTrader sync is temporarily unavailable. Please try again later.";

export const syncGapMessage = (hours: number): string =>
  `This account already synced in the last ${METATRADER_SYNC_GAP_HOURS} hours. The next sync is possible in ${hours} h.`;

export const connectLimitMessage = (limit: number): string =>
  `Your MetaTrader slots allow ${limit} new MetaTrader account${limit === 1 ? "" : "s"} per 30 days, and you've reached that. Try again later.`;
