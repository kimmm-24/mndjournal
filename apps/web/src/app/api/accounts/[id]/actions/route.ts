import { and, eq } from "drizzle-orm";
import { accounts, db, executions, trades } from "@/db";
import { bad, currentUserId, handler, ok } from "@/server/api";
import { nowIso } from "@/server/ids";
import { rebuildAccount } from "@/server/rebuild";
import {
  isMetaTrader,
  metatraderSyncBlocked,
  runAccountSync,
  startAccountSync,
} from "@/server/sync";
import {
  isMetaTraderSyncDay,
  METATRADER_SYNC_GAP_HOURS,
  METATRADER_WEEKEND_MESSAGE,
  syncGapMessage,
} from "@/lib/metatrader-sync";

type Params = { params: Promise<{ id: string }> };

interface ActionBody {
  action: "archive" | "unarchive" | "clear" | "sync" | "transfer";
  /** For "transfer": destination account id. */
  toAccountId?: string;
}

export const POST = handler(async (request: Request, { params }: Params) => {
  const userId = await currentUserId();
  const { id } = await params;
  const account = db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .get();
  if (!account) return bad("Account not found", 404);
  const body = (await request.json()) as ActionBody;

  switch (body.action) {
    case "archive":
      db.update(accounts).set({ archivedAt: nowIso() }).where(eq(accounts.id, id)).run();
      return ok({ archived: true });
    case "unarchive":
      db.update(accounts).set({ archivedAt: null }).where(eq(accounts.id, id)).run();
      return ok({ archived: false });
    case "clear":
      db.transaction((tx) => {
        tx.delete(trades).where(eq(trades.accountId, id)).run();
        tx.delete(executions).where(eq(executions.accountId, id)).run();
      });
      return ok({ cleared: true });
    case "sync": {
      if (account.syncingSince) return bad("This account is already syncing.", 409);
      if (isMetaTrader(account.broker)) {
        const blocked = metatraderSyncBlocked(userId);
        if (blocked) return bad(blocked, 403);
        if (!isMetaTraderSyncDay()) return bad(METATRADER_WEEKEND_MESSAGE, 429);
        // Each sync is billed by MetaApi: one per account per gap, and a
        // manual one stands in for that day's automatic sync.
        const last = account.syncAttemptedAt ?? account.lastSyncAt;
        const waitMs = last
          ? METATRADER_SYNC_GAP_HOURS * 3_600_000 - (Date.now() - Date.parse(last))
          : 0;
        if (waitMs > 0) return bad(syncGapMessage(Math.ceil(waitMs / 3_600_000)), 429);
        startAccountSync(id);
        return ok({ started: true });
      }
      return ok({ sync: await runAccountSync(id) });
    }
    case "transfer": {
      if (!body.toAccountId) return bad("toAccountId is required");
      const destinationId = body.toAccountId;
      const destination = db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, destinationId), eq(accounts.userId, userId)))
        .get();
      if (!destination) return bad("Destination account not found", 404);

      // Remember annotations before the move; trade keys are account-prefixed,
      // so after the rebuild they re-anchor under the destination's prefix.
      const sourceTrades = db.select().from(trades).where(eq(trades.accountId, id)).all();
      db.transaction((tx) => {
        tx.update(executions)
          .set({ accountId: destinationId })
          .where(eq(executions.accountId, id))
          .run();
        tx.delete(trades).where(eq(trades.accountId, id)).run();
      });
      rebuildAccount(destinationId);

      for (const source of sourceTrades) {
        const hasAnnotations =
          source.notes ||
          source.tagsJson ||
          source.mistakesJson ||
          source.playbookId ||
          source.rating !== null ||
          source.stopLoss !== null ||
          source.profitTarget !== null ||
          source.reviewedAt;
        if (!hasAnnotations) continue;
        const newKey = destinationId + source.key.slice(id.length);
        db.update(trades)
          .set({
            notes: source.notes,
            tagsJson: source.tagsJson,
            mistakesJson: source.mistakesJson,
            playbookId: source.playbookId,
            rating: source.rating,
            stopLoss: source.stopLoss,
            profitTarget: source.profitTarget,
            reviewedAt: source.reviewedAt,
          })
          .where(eq(trades.key, newKey))
          .run();
      }
      return ok({ transferred: true });
    }
    default:
      return bad("Unknown action");
  }
});
