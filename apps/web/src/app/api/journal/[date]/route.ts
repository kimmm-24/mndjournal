import { readFilters } from "@luxalgo/journal-core";
import { and, eq } from "drizzle-orm";
import { computeMetrics, dayKeyOf, intradayCurve } from "@luxalgo/journal-core";
import { db, executions, journalDays } from "@/db";
import { bad, currentUserId, handler, ok } from "@/server/api";
import { nowIso } from "@/server/ids";
import { getTimeZone } from "@/server/settings";
import { queryTrades } from "@/server/trades-query";

type Params = { params: Promise<{ date: string }> };

export const GET = handler(async (request: Request, { params }: Params) => {
  const userId = await currentUserId();
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("date must be YYYY-MM-DD");
  const url = new URL(request.url);
  const timeZone = getTimeZone(userId);

  const { rows, trades } = queryTrades(readFilters(url.searchParams), userId);
  const dayTradeIndexes = trades
    .map((trade, index) => ({ trade, index }))
    .filter(({ trade }) => trade.closedAt && dayKeyOf(trade.closedAt, timeZone) === date);
  const dayTrades = dayTradeIndexes.map(({ trade }) => trade);

  // Intraday curve needs exit timestamps — one fetch per involved account.
  const times = new Map<string, string>();
  for (const accountId of new Set(dayTrades.map((trade) => trade.accountId))) {
    const fills = db.select().from(executions).where(eq(executions.accountId, accountId)).all();
    for (const fill of fills) times.set(fill.id, fill.executedAt);
  }

  const note = db
    .select()
    .from(journalDays)
    .where(and(eq(journalDays.date, date), eq(journalDays.userId, userId)))
    .get();
  return ok({
    date,
    metrics: computeMetrics(dayTrades, { timeZone }),
    trades: dayTradeIndexes.map(({ index }) => rows[index]),
    intraday: intradayCurve(dayTrades, times, date, timeZone),
    note: note?.note ?? "",
  });
});

export const PUT = handler(async (request: Request, { params }: Params) => {
  const userId = await currentUserId();
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("date must be YYYY-MM-DD");
  const { note } = (await request.json()) as { note?: string };
  db.insert(journalDays)
    .values({ userId, date, note: note ?? "", updatedAt: nowIso() })
    .onConflictDoUpdate({
      target: [journalDays.userId, journalDays.date],
      set: { note: note ?? "", updatedAt: nowIso() },
    })
    .run();
  return ok({ saved: true });
});
