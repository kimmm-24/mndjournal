import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  accounts,
  attachments,
  db,
  executions,
  folders,
  journalDays,
  marketCsvDatasets,
  missedTrades,
  noteTemplates,
  notes,
  playbooks,
  progressChecks,
  progressRules,
  propAccounts,
  propAudit,
  propEntries,
  propReceipts,
  settings,
  trades,
  tradeExcursions,
  tradeRuleChecks,
  user,
} from "@/db";
import { auth } from "./auth";

/** Placeholder owner db/index.ts's migrations stamp on rows from before per-user data existed. */
const LEGACY_SENTINEL = "";

/**
 * One-time upgrade path, run once at server startup (see instrumentation.ts).
 * Rows written before per-user accounts existed have user_id = '' (an
 * additive SQLite column, or a rebuilt composite-key table, can't be
 * backfilled with a real id we don't know yet — see db/index.ts). On first
 * boot after upgrading, this creates one account to own them, then
 * reassigns those rows to it. Safe to call on every boot: once no '' rows
 * remain anywhere, it's a no-op.
 *
 * The password is JOURNAL_PASSWORD when one was already configured, so the
 * existing single-user password keeps working; otherwise a random one is
 * generated and printed once — capture it from the server logs.
 */
export const ensureLegacyOwner = async (): Promise<void> => {
  const orphanChecks = [
    db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, LEGACY_SENTINEL)).get(),
    db
      .select({ id: executions.id })
      .from(executions)
      .where(eq(executions.userId, LEGACY_SENTINEL))
      .get(),
    db.select({ key: trades.key }).from(trades).where(eq(trades.userId, LEGACY_SENTINEL)).get(),
    db.select({ id: folders.id }).from(folders).where(eq(folders.userId, LEGACY_SENTINEL)).get(),
    db.select({ id: notes.id }).from(notes).where(eq(notes.userId, LEGACY_SENTINEL)).get(),
    db.select({ id: playbooks.id }).from(playbooks).where(eq(playbooks.userId, LEGACY_SENTINEL)).get(),
    db
      .select({ id: attachments.id })
      .from(attachments)
      .where(eq(attachments.userId, LEGACY_SENTINEL))
      .get(),
    db
      .select({ id: noteTemplates.id })
      .from(noteTemplates)
      .where(eq(noteTemplates.userId, LEGACY_SENTINEL))
      .get(),
    db
      .select({ id: tradeRuleChecks.id })
      .from(tradeRuleChecks)
      .where(eq(tradeRuleChecks.userId, LEGACY_SENTINEL))
      .get(),
    db
      .select({ id: progressRules.id })
      .from(progressRules)
      .where(eq(progressRules.userId, LEGACY_SENTINEL))
      .get(),
    db
      .select({ id: progressChecks.id })
      .from(progressChecks)
      .where(eq(progressChecks.userId, LEGACY_SENTINEL))
      .get(),
    db
      .select({ id: missedTrades.id })
      .from(missedTrades)
      .where(eq(missedTrades.userId, LEGACY_SENTINEL))
      .get(),
    db
      .select({ date: journalDays.date })
      .from(journalDays)
      .where(eq(journalDays.userId, LEGACY_SENTINEL))
      .get(),
    db.select({ key: settings.key }).from(settings).where(eq(settings.userId, LEGACY_SENTINEL)).get(),
    db
      .select({ id: propAccounts.id })
      .from(propAccounts)
      .where(eq(propAccounts.userId, LEGACY_SENTINEL))
      .get(),
    db
      .select({ id: propEntries.id })
      .from(propEntries)
      .where(eq(propEntries.userId, LEGACY_SENTINEL))
      .get(),
    db
      .select({ id: propReceipts.id })
      .from(propReceipts)
      .where(eq(propReceipts.userId, LEGACY_SENTINEL))
      .get(),
    db.select({ id: propAudit.id }).from(propAudit).where(eq(propAudit.userId, LEGACY_SENTINEL)).get(),
    db
      .select({ tradeKey: tradeExcursions.tradeKey })
      .from(tradeExcursions)
      .where(eq(tradeExcursions.userId, LEGACY_SENTINEL))
      .get(),
    db
      .select({ id: marketCsvDatasets.id })
      .from(marketCsvDatasets)
      .where(eq(marketCsvDatasets.userId, LEGACY_SENTINEL))
      .get(),
  ];
  if (!orphanChecks.some(Boolean)) return;

  const email = process.env.JOURNAL_LEGACY_EMAIL || "admin@localhost";
  let legacyUserId = db.select({ id: user.id }).from(user).where(eq(user.email, email)).get()?.id;

  if (!legacyUserId) {
    const usingGenerated = !process.env.JOURNAL_PASSWORD;
    const password = process.env.JOURNAL_PASSWORD || randomBytes(18).toString("base64url");
    const { user: created } = await auth.api.signUpEmail({
      body: { name: "Journal owner", email, password },
    });
    legacyUserId = created.id;
    // The self-hoster's own account: there's no inbox behind admin@localhost to verify.
    db.update(user).set({ emailVerified: true }).where(eq(user.id, legacyUserId)).run();
    console.log(`\n[mndjournal] Migrated your existing journal to an account: ${email}`);
    console.log(
      usingGenerated
        ? `[mndjournal] Generated password: ${password} — sign in and change it, it will not be shown again.\n`
        : `[mndjournal] Signed in with your existing JOURNAL_PASSWORD.\n`,
    );
  }

  db.transaction((tx) => {
    tx.update(accounts).set({ userId: legacyUserId! }).where(eq(accounts.userId, LEGACY_SENTINEL)).run();
    tx
      .update(executions)
      .set({ userId: legacyUserId! })
      .where(eq(executions.userId, LEGACY_SENTINEL))
      .run();
    tx.update(trades).set({ userId: legacyUserId! }).where(eq(trades.userId, LEGACY_SENTINEL)).run();
    tx.update(folders).set({ userId: legacyUserId! }).where(eq(folders.userId, LEGACY_SENTINEL)).run();
    tx.update(notes).set({ userId: legacyUserId! }).where(eq(notes.userId, LEGACY_SENTINEL)).run();
    tx
      .update(playbooks)
      .set({ userId: legacyUserId! })
      .where(eq(playbooks.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(attachments)
      .set({ userId: legacyUserId! })
      .where(eq(attachments.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(noteTemplates)
      .set({ userId: legacyUserId! })
      .where(eq(noteTemplates.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(tradeRuleChecks)
      .set({ userId: legacyUserId! })
      .where(eq(tradeRuleChecks.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(progressRules)
      .set({ userId: legacyUserId! })
      .where(eq(progressRules.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(progressChecks)
      .set({ userId: legacyUserId! })
      .where(eq(progressChecks.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(missedTrades)
      .set({ userId: legacyUserId! })
      .where(eq(missedTrades.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(journalDays)
      .set({ userId: legacyUserId! })
      .where(eq(journalDays.userId, LEGACY_SENTINEL))
      .run();
    tx.update(settings).set({ userId: legacyUserId! }).where(eq(settings.userId, LEGACY_SENTINEL)).run();
    tx
      .update(propAccounts)
      .set({ userId: legacyUserId! })
      .where(eq(propAccounts.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(propEntries)
      .set({ userId: legacyUserId! })
      .where(eq(propEntries.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(propReceipts)
      .set({ userId: legacyUserId! })
      .where(eq(propReceipts.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(propAudit)
      .set({ userId: legacyUserId! })
      .where(eq(propAudit.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(tradeExcursions)
      .set({ userId: legacyUserId! })
      .where(eq(tradeExcursions.userId, LEGACY_SENTINEL))
      .run();
    tx
      .update(marketCsvDatasets)
      .set({ userId: legacyUserId! })
      .where(eq(marketCsvDatasets.userId, LEGACY_SENTINEL))
      .run();
  });
};
