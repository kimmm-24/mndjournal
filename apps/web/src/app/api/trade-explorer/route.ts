import { readFilters } from "@luxalgo/journal-core";
import { eq } from "drizzle-orm";
import { accounts, db } from "@/db";
import { tradeExplorerPoints } from "@/lib/trade-explorer";
import { currentUserId, handler, ok } from "@/server/api";
import { getTimeZone } from "@/server/settings";
import { queryTrades } from "@/server/trades-query";

import { savedEstimates } from "@/server/market-data/estimates";

export const GET = handler(async (request: Request) => {
  const userId = await currentUserId();
  const { trades } = queryTrades(readFilters(new URL(request.url).searchParams), userId);
  const timeZone = getTimeZone(userId);
  const currencies = new Map(
    db
      .select({ id: accounts.id, currency: accounts.currency })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .all()
      .map((account) => [account.id, account.currency]),
  );
  const estimates = savedEstimates(trades, userId);
  return ok({
    points: tradeExplorerPoints(trades, timeZone).map((point) => ({
      ...point,
      mae: estimates.get(point.key)?.estimate.mae ?? null,
      mfe: estimates.get(point.key)?.estimate.mfe ?? null,
    })),
    currencies: [
      ...new Set(
        trades
          .filter((trade) => trade.status !== "open" && trade.closedAt)
          .map((trade) => currencies.get(trade.accountId) ?? "USD"),
      ),
    ],
    timeZone,
  });
});
