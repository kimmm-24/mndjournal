import { and, eq } from "drizzle-orm";
import { db, playbooks, trades } from "@/db";
import { bad, currentUserId, handler, ok } from "@/server/api";

type Params = { params: Promise<{ id: string }> };

export const PATCH = handler(async (request: Request, { params }: Params) => {
  const userId = await currentUserId();
  const { id } = await params;
  const existing = db
    .select()
    .from(playbooks)
    .where(and(eq(playbooks.id, id), eq(playbooks.userId, userId)))
    .get();
  if (!existing) return bad("Playbook not found", 404);
  const body = (await request.json()) as { name?: string; description?: string; rules?: string[] };
  db.update(playbooks)
    .set({
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      rulesJson: body.rules ? JSON.stringify(body.rules) : existing.rulesJson,
    })
    .where(and(eq(playbooks.id, id), eq(playbooks.userId, userId)))
    .run();
  return ok({ updated: true });
});

export const DELETE = handler(async (_request: Request, { params }: Params) => {
  const userId = await currentUserId();
  const { id } = await params;
  const existing = db
    .select({ id: playbooks.id })
    .from(playbooks)
    .where(and(eq(playbooks.id, id), eq(playbooks.userId, userId)))
    .get();
  if (!existing) return bad("Playbook not found", 404);
  db.transaction((tx) => {
    tx.update(trades)
      .set({ playbookId: null })
      .where(and(eq(trades.playbookId, id), eq(trades.userId, userId)))
      .run();
    tx.delete(playbooks).where(and(eq(playbooks.id, id), eq(playbooks.userId, userId))).run();
  });
  return ok({ deleted: true });
});
