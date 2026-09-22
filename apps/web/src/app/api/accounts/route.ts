import { asc, count, eq } from "drizzle-orm";
import { accounts, db } from "@/db";
import { bad, currentUserId, handler, ok } from "@/server/api";
import { encryptJson } from "@/server/crypto";
import { newId, nowIso } from "@/server/ids";
import { syncAccount } from "@/server/sync";
import {
  accountLimitMessage,
  getAccountLimit,
  getPlan,
  SYNC_IMPORT_NOT_INCLUDED_MESSAGE,
} from "@/server/plan";

export const GET = handler(async (request: Request) => {
  const userId = await currentUserId();
  if (new URL(request.url).searchParams.get("summary") === "1") {
    return ok({
      accounts: db
        .select({
          id: accounts.id,
          name: accounts.name,
          broker: accounts.broker,
          archivedAt: accounts.archivedAt,
        })
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .orderBy(asc(accounts.createdAt))
        .all(),
    });
  }
  const rows = db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(asc(accounts.createdAt))
    .all();
  return ok({
    accounts: rows.map(({ credentialsEnc, ...safe }) => ({
      ...safe,
      connected: credentialsEnc !== null,
      snapshot: safe.snapshotJson ? JSON.parse(safe.snapshotJson) : null,
    })),
  });
});

interface CreateBody {
  name?: string;
  kind?: "sync" | "import" | "manual";
  broker?: string;
  currency?: string;
  initialBalance?: number;
  profitCalcMethod?: "fifo" | "lifo" | "wavg";
  credentials?: Record<string, string>;
  autoSync?: boolean;
}

export const POST = handler(async (request: Request) => {
  const userId = await currentUserId();
  const body = (await request.json()) as CreateBody;
  if (!body.name || !body.kind) return bad("name and kind are required");
  if (body.kind === "sync" && (!body.broker || !body.credentials)) {
    return bad("sync accounts need a broker and credentials");
  }

  const plan = getPlan(userId);
  if (body.kind !== "manual" && plan === "starter") {
    return bad(SYNC_IMPORT_NOT_INCLUDED_MESSAGE, 403);
  }
  const limit = getAccountLimit(plan);
  const existing = db.select({ n: count() }).from(accounts).where(eq(accounts.userId, userId)).get()!
    .n;
  if (existing >= limit) return bad(accountLimitMessage(limit), 403);

  const id = newId();
  db.insert(accounts)
    .values({
      id,
      userId,
      name: body.name,
      broker: body.broker ?? "",
      kind: body.kind,
      currency: body.currency ?? "USD",
      initialBalance: body.initialBalance ?? 0,
      profitCalcMethod: body.profitCalcMethod ?? "fifo",
      credentialsEnc: body.kind === "sync" ? encryptJson(body.credentials) : null,
      autoSync: body.autoSync ?? body.kind === "sync",
      createdAt: nowIso(),
    })
    .run();

  // First sync happens right away so the account isn't born empty.
  let sync = null;
  if (body.kind === "sync") {
    try {
      sync = await syncAccount(id);
    } catch (error) {
      // Bad credentials shouldn't strand a half-created account.
      db.delete(accounts).where(eq(accounts.id, id)).run();
      return bad(error instanceof Error ? error.message : "Broker connection failed", 502);
    }
  }
  return ok({ id, sync });
});
