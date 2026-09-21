import { analyzeAdherence, readFilters } from "@luxalgo/journal-core";
import { eq } from "drizzle-orm";
import { db, playbooks, tradeRuleChecks, accounts } from "@/db";
import { queryTrades } from "@/server/trades-query";
import { currentUserId, handler, ok } from "@/server/api";

export const GET = handler(async (request: Request) => {
  const userId = await currentUserId();
  const { trades } = queryTrades(readFilters(new URL(request.url).searchParams), userId);
  const checks = db.select().from(tradeRuleChecks).where(eq(tradeRuleChecks.userId, userId)).all();
  const books = db
    .select()
    .from(playbooks)
    .where(eq(playbooks.userId, userId))
    .all()
    .map((book) => ({
      id: book.id,
      rules: JSON.parse(book.rulesJson) as string[],
    }));
  const currencies = new Map(
    db
      .select({ id: accounts.id, currency: accounts.currency })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .all()
      .map((a) => [a.id, a.currency]),
  );
  return ok({
    books: analyzeAdherence(trades, books, checks).map(({ accountIds, ...book }) => ({
      ...book,
      currencies: [...new Set(accountIds.map((id) => currencies.get(id) ?? "USD"))],
    })),
  });
});
