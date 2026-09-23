import { and, eq } from "drizzle-orm";
import { accounts, db, executions, trades } from "@/db";
import { bad, currentUserId, handler, ok } from "@/server/api";
import { rebuildAccount } from "@/server/rebuild";
import { disconnectBroker } from "@/server/sync";

type Params = { params: Promise<{ id: string }> };

interface PatchBody {
  name?: string;
  broker?: string;
  currency?: string;
  initialBalance?: number;
  profitCalcMethod?: "fifo" | "lifo" | "wavg";
  autoSync?: boolean;
}

export const PATCH = handler(async (request: Request, { params }: Params) => {
  const userId = await currentUserId();
  const { id } = await params;
  const account = db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .get();
  if (!account) return bad("Account not found", 404);

  const body = (await request.json()) as PatchBody;
  const patch: Partial<typeof accounts.$inferInsert> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.broker !== undefined) patch.broker = body.broker;
  if (body.currency !== undefined) patch.currency = body.currency;
  if (body.initialBalance !== undefined) patch.initialBalance = body.initialBalance;
  if (body.autoSync !== undefined) patch.autoSync = body.autoSync;
  if (body.profitCalcMethod !== undefined) patch.profitCalcMethod = body.profitCalcMethod;

  if (Object.keys(patch).length > 0) {
    db.update(accounts).set(patch).where(eq(accounts.id, id)).run();
  }
  // A new profit-calc method changes per-exit attribution — recompute.
  if (body.profitCalcMethod && body.profitCalcMethod !== account.profitCalcMethod) {
    rebuildAccount(id);
  }
  return ok({ updated: true });
});

export const DELETE = handler(async (_request: Request, { params }: Params) => {
  const userId = await currentUserId();
  const { id } = await params;
  const account = db
    .select({ id: accounts.id, broker: accounts.broker, credentialsEnc: accounts.credentialsEnc })
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .get();
  if (!account) return bad("Account not found", 404);
  db.transaction((tx) => {
    tx.delete(trades).where(eq(trades.accountId, id)).run();
    tx.delete(executions).where(eq(executions.accountId, id)).run();
    tx.delete(accounts).where(eq(accounts.id, id)).run();
  });
  // e.g. removes the MetaApi terminal, so nothing is left behind that could bill.
  await disconnectBroker(account);
  return ok({ deleted: true });
});
