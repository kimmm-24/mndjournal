import { asc, eq } from "drizzle-orm";
import { db, playbooks, trades } from "@/db";
import { bad, currentUserId, handler, ok } from "@/server/api";
import { newId, nowIso } from "@/server/ids";

export const GET = handler(async () => {
  const userId = await currentUserId();
  const rows = db
    .select()
    .from(playbooks)
    .where(eq(playbooks.userId, userId))
    .orderBy(asc(playbooks.createdAt))
    .all();
  const counts = new Map<string, number>();
  for (const trade of db
    .select({ playbookId: trades.playbookId })
    .from(trades)
    .where(eq(trades.userId, userId))
    .all()) {
    if (trade.playbookId) counts.set(trade.playbookId, (counts.get(trade.playbookId) ?? 0) + 1);
  }
  return ok({
    playbooks: rows.map((row) => ({
      ...row,
      rules: JSON.parse(row.rulesJson) as string[],
      tradeCount: counts.get(row.id) ?? 0,
    })),
  });
});

export const POST = handler(async (request: Request) => {
  const userId = await currentUserId();
  const body = (await request.json()) as { name?: string; description?: string; rules?: string[] };
  if (!body.name) return bad("name is required");
  const id = newId();
  db.insert(playbooks)
    .values({
      id,
      userId,
      name: body.name,
      description: body.description ?? "",
      rulesJson: JSON.stringify(body.rules ?? []),
      createdAt: nowIso(),
    })
    .run();
  return ok({ id });
});
