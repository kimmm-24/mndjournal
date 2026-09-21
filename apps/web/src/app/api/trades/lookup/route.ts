import { db } from "@/db";
import { currentUserId, handler, ok } from "@/server/api";
import type { LinkableTrade } from "@/lib/trade-links";

/** Stop after 51 matches; retain Unicode-aware searching without loading the entire history. */
export const GET = handler(async (request: Request) => {
  const userId = await currentUserId();
  const search = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const candidates = db.$client
    .prepare(
      `
    SELECT t.key, t.symbol, t.direction, t.opened_at AS openedAt,
      COALESCE(a.name, 'Unknown account') AS accountName
    FROM trades t LEFT JOIN accounts a ON a.id = t.account_id
    WHERE t.user_id = ?
    ORDER BY t.opened_at DESC
  `,
    )
    .iterate(userId) as IterableIterator<LinkableTrade>;
  const matches: LinkableTrade[] = [];
  for (const trade of candidates) {
    if (!`${trade.symbol} ${trade.openedAt} ${trade.accountName}`.toLowerCase().includes(search))
      continue;
    matches.push(trade);
    if (matches.length === 51) break;
  }
  return ok({ trades: matches.slice(0, 50), hasMore: matches.length > 50 });
});
