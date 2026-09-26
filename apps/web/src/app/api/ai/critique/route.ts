import { clipForAi } from "@/lib/ai-quota";
import { bad, currentUserId, handler, ok } from "@/server/api";
import { runAi } from "@/server/ai";
import { listExecutions } from "@/server/executions";
import { getTradeByKey, rowToTrade } from "@/server/trades-query";

const MAX_FILLS = 60;
const MAX_NOTE_CHARS = 2_000;

/** At most 20 tags or mistakes, each trimmed, to keep the prompt bounded. */
const list = (items: string[] | undefined): string =>
  (items ?? [])
    .slice(0, 20)
    .map((item) => clipForAi(item, 60))
    .join(", ") || "none";

/** Critique one trade: entries, exits, sizing, and the trader's own annotations. */
export const POST = handler(async (request: Request) => {
  const userId = await currentUserId();
  const { key } = (await request.json()) as { key?: string };
  if (!key) return bad("key is required");
  const row = getTradeByKey(key, userId);
  if (!row) return bad("Trade not found", 404);
  const trade = rowToTrade(row);
  const fills = listExecutions(row.accountId, trade.executionIds).sort((a, b) =>
    a.executedAt.localeCompare(b.executedAt),
  );
  const fillLines = fills
    .slice(0, MAX_FILLS)
    .map(
      (fill) =>
        `${fill.executedAt} ${fill.side} ${fill.quantity} @ ${fill.price}${fill.fee ? ` fee ${fill.fee}` : ""}`,
    );
  if (fills.length > MAX_FILLS) fillLines.push(`…and ${fills.length - MAX_FILLS} more fills`);

  const critique = await runAi(
    `Critique this single trade in under 150 words. Focus on execution quality visible in the
fills (entry clustering, scaling, exit discipline), risk (stop honored or not, R multiple),
and the trader's own tags/mistakes. End with one concrete instruction for the next
occurrence of this setup.

Trade: ${trade.symbol} ${trade.direction}, status ${trade.status}
Net P&L: ${trade.netPnl.toFixed(2)} (gross ${trade.grossPnl.toFixed(2)}, fees ${trade.fees.toFixed(2)})
Avg entry ${trade.avgEntry} → avg exit ${trade.avgExit ?? "still open"}
Planned stop: ${row.stopLoss ?? "none recorded"} | target: ${row.profitTarget ?? "none recorded"}
Rating: ${row.rating ?? "unrated"} | tags: ${list(trade.annotations?.tags)} | mistakes: ${list(trade.annotations?.mistakes)}
Notes: ${row.notes ? clipForAi(row.notes, MAX_NOTE_CHARS) : "none"}

Fills:
${fillLines.join("\n")}`,
    1200,
    userId,
  );

  return ok({ critique });
});
