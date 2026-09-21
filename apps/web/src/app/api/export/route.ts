import { eq } from "drizzle-orm";
import {
  db,
  accounts,
  executions,
  journalDays,
  notes,
  playbooks,
  trades,
  attachments,
  noteTemplates,
  tradeRuleChecks,
  progressRules,
  progressChecks,
  missedTrades,
  folders,
  propAccounts,
  propEntries,
  propReceipts,
  propAudit,
} from "@/db";
import { readFilters } from "@luxalgo/journal-core";
import { queryTrades } from "@/server/trades-query";
import {
  getJournalDefaults,
  getMultipliers,
  getTimeZone,
  getImportTimeZone,
} from "@/server/settings";
import { currentUserId, handler, ok } from "@/server/api";
import { attachmentExportRecord, EXPORT_ATTACHMENTS_NOTE } from "@/lib/export-format";

/**
 * Full data export: your journal is yours. Credentials are deliberately
 * excluded: an export must be safe to share or move between machines.
 */
export const GET = handler(async (request: Request) => {
  const userId = await currentUserId();
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";

  if (format === "csv") {
    const header =
      "key,account_id,symbol,direction,status,opened_at,closed_at,quantity,avg_entry,avg_exit,gross_pnl,fees,net_pnl,tags,notes";
    const escape = (value: unknown): string => {
      const text = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = queryTrades(readFilters(url.searchParams), userId).rows.map((row) =>
      [
        row.key,
        row.accountId,
        row.symbol,
        row.direction,
        row.status,
        row.openedAt,
        row.closedAt ?? "",
        row.quantity,
        row.avgEntry,
        row.avgExit ?? "",
        row.grossPnl,
        row.fees,
        row.netPnl,
        row.tagsJson ?? "[]",
        row.notes ?? "",
      ]
        .map(escape)
        .join(","),
    );
    return new Response([header, ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="trades.csv"',
      },
    });
  }

  return ok({
    exportedAt: new Date().toISOString(),
    note: EXPORT_ATTACHMENTS_NOTE,
    accounts: db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .all()
      .map(({ credentialsEnc: _omitted, ...safe }) => safe),
    executions: db.select().from(executions).where(eq(executions.userId, userId)).all(),
    trades: db.select().from(trades).where(eq(trades.userId, userId)).all(),
    journalDays: db.select().from(journalDays).where(eq(journalDays.userId, userId)).all(),
    notes: db.select().from(notes).where(eq(notes.userId, userId)).all(),
    folders: db.select().from(folders).where(eq(folders.userId, userId)).all(),
    playbooks: db.select().from(playbooks).where(eq(playbooks.userId, userId)).all(),
    noteTemplates: db.select().from(noteTemplates).where(eq(noteTemplates.userId, userId)).all(),
    tradeRuleChecks: db
      .select()
      .from(tradeRuleChecks)
      .where(eq(tradeRuleChecks.userId, userId))
      .all(),
    progressRules: db.select().from(progressRules).where(eq(progressRules.userId, userId)).all(),
    progressChecks: db
      .select()
      .from(progressChecks)
      .where(eq(progressChecks.userId, userId))
      .all(),
    missedTrades: db.select().from(missedTrades).where(eq(missedTrades.userId, userId)).all(),
    propAccounts: db.select().from(propAccounts).where(eq(propAccounts.userId, userId)).all(),
    propEntries: db.select().from(propEntries).where(eq(propEntries.userId, userId)).all(),
    propReceipts: db.select().from(propReceipts).where(eq(propReceipts.userId, userId)).all(),
    propAudit: db.select().from(propAudit).where(eq(propAudit.userId, userId)).all(),
    journalDefaults: getJournalDefaults(userId),
    settings: {
      timeZone: getTimeZone(userId),
      importTimeZone: getImportTimeZone(userId),
      multipliers: getMultipliers(userId),
    },
    // Metadata only: attachment binaries stay in the data directory.
    attachments: db
      .select({
        id: attachments.id,
        ownerType: attachments.ownerType,
        ownerId: attachments.ownerId,
        name: attachments.name,
        mime: attachments.mime,
        size: attachments.size,
        createdAt: attachments.createdAt,
      })
      .from(attachments)
      .where(eq(attachments.userId, userId))
      .all()
      .map(attachmentExportRecord),
  });
});
