import { readFilters } from "@luxalgo/journal-core";
import { eq } from "drizzle-orm";
import { accounts, db } from "@/db";
import { performanceTrends } from "@/lib/performance-trends";
import { currentUserId, handler, ok } from "@/server/api";
import { getTimeZone } from "@/server/settings";
import { queryTrades } from "@/server/trades-query";

export const GET = handler(async (request: Request) => {
  const userId = await currentUserId();
  const { trades } = queryTrades(readFilters(new URL(request.url).searchParams), userId);
  const currencies = new Map(
    db
      .select({ id: accounts.id, currency: accounts.currency })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .all()
      .map((account) => [account.id, account.currency]),
  );
  return ok({
    trends: performanceTrends(trades),
    currencies: [
      ...new Set(
        trades
          .filter((trade) => trade.status !== "open" && trade.closedAt)
          .map((trade) => currencies.get(trade.accountId) ?? "USD"),
      ),
    ],
    timeZone: getTimeZone(userId),
  });
});
