import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import * as schema from "./schema";
import { BOOTSTRAP_SQL } from "./bootstrap";

export const dataDir = (): string => process.env.JOURNAL_DATA_DIR ?? join(process.cwd(), "data");

const globalForDb = globalThis as unknown as { __journalDb?: ReturnType<typeof createDb> };

const createDb = () => {
  const dir = dataDir();
  mkdirSync(dir, { recursive: true });
  const sqlite = new Database(join(dir, "journal.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  // WAL allows one writer at a time; with multiple users now able to write
  // concurrently, a busy connection should queue briefly instead of failing
  // the request outright.
  sqlite.pragma("busy_timeout = 5000");
  sqlite.exec(BOOTSTRAP_SQL);
  // Additive upgrade: existing executions retain their fields and dedup hashes.
  const executionColumns = sqlite.pragma("table_info(executions)") as { name: string }[];
  if (!executionColumns.some((column) => column.name === "import_metadata_json")) {
    sqlite.exec("ALTER TABLE executions ADD COLUMN import_metadata_json TEXT");
  }
  // Multi-tenant upgrade: rows from before per-user accounts existed get a
  // placeholder owner ('') until server/legacy-migration.ts reassigns them to
  // a real user at startup. A default is required here because SQLite can't
  // add a NOT NULL column without one; every insert from here on supplies a
  // real user_id, so the default is never relied on beyond that one moment.
  const addUserIdIfMissing = (table: string) => {
    const columns = sqlite.pragma(`table_info(${table})`) as { name: string }[];
    if (!columns.some((column) => column.name === "user_id")) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`);
    }
  };
  for (const table of [
    "accounts",
    "executions",
    "trades",
    "folders",
    "notes",
    "playbooks",
    "attachments",
    "note_templates",
    "trade_rule_checks",
    "progress_rules",
    "progress_checks",
    "missed_trades",
    "prop_accounts",
    "prop_entries",
    "prop_receipts",
    "prop_audit",
    "trade_excursions",
    "market_csv_datasets",
  ]) {
    addUserIdIfMissing(table);
  }
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS accounts_user ON accounts (user_id);
    CREATE INDEX IF NOT EXISTS executions_user ON executions (user_id);
    CREATE INDEX IF NOT EXISTS trades_user_opened ON trades (user_id, opened_at);
    CREATE INDEX IF NOT EXISTS folders_user ON folders (user_id);
    CREATE INDEX IF NOT EXISTS notes_user ON notes (user_id);
    CREATE INDEX IF NOT EXISTS playbooks_user ON playbooks (user_id);
    CREATE INDEX IF NOT EXISTS attachments_user ON attachments (user_id);
    CREATE INDEX IF NOT EXISTS note_templates_user ON note_templates (user_id);
    CREATE INDEX IF NOT EXISTS trade_rule_checks_user ON trade_rule_checks (user_id);
    CREATE INDEX IF NOT EXISTS progress_rules_user ON progress_rules (user_id);
    CREATE INDEX IF NOT EXISTS progress_checks_user ON progress_checks (user_id);
    CREATE INDEX IF NOT EXISTS missed_trades_user ON missed_trades (user_id);
    CREATE INDEX IF NOT EXISTS prop_accounts_user ON prop_accounts (user_id);
    CREATE INDEX IF NOT EXISTS prop_entries_user ON prop_entries (user_id);
    CREATE INDEX IF NOT EXISTS prop_receipts_user ON prop_receipts (user_id);
    CREATE INDEX IF NOT EXISTS prop_audit_user ON prop_audit (user_id);
    CREATE INDEX IF NOT EXISTS trade_excursions_user ON trade_excursions (user_id);
    CREATE INDEX IF NOT EXISTS market_csv_datasets_user ON market_csv_datasets (user_id);
  `);
  // Structural upgrade: journal_days and settings used to key rows by
  // `date`/`key` alone (one row per install). SQLite can't add a column to a
  // primary key via ALTER TABLE, so an existing table is rebuilt in place —
  // new shape, old rows copied in under the same '' placeholder owner as
  // above. A fresh install never hits this: bootstrap.ts already creates
  // both tables with the composite key from the start.
  const hasUserId = (table: string) =>
    (sqlite.pragma(`table_info(${table})`) as { name: string }[]).some(
      (column) => column.name === "user_id",
    );
  if (!hasUserId("journal_days")) {
    sqlite.transaction(() => {
      sqlite.exec(`
        CREATE TABLE journal_days_new (
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          updated_at TEXT NOT NULL,
          PRIMARY KEY (user_id, date)
        );
        INSERT INTO journal_days_new (user_id, date, note, updated_at)
          SELECT '', date, note, updated_at FROM journal_days;
        DROP TABLE journal_days;
        ALTER TABLE journal_days_new RENAME TO journal_days;
      `);
    })();
  }
  if (!hasUserId("settings")) {
    sqlite.transaction(() => {
      sqlite.exec(`
        CREATE TABLE settings_new (
          user_id TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          PRIMARY KEY (user_id, key)
        );
        INSERT INTO settings_new (user_id, key, value) SELECT '', key, value FROM settings;
        DROP TABLE settings;
        ALTER TABLE settings_new RENAME TO settings;
      `);
    })();
  }
  // Materialize CSV bounds once so connection and range lookups never scan candle JSON.
  const csvColumns = sqlite.pragma("table_info(market_csv_datasets)") as { name: string }[];
  sqlite.transaction(() => {
    for (const name of ["bar_count", "first_time", "last_time"]) {
      if (!csvColumns.some((column) => column.name === name))
        sqlite.exec(
          `ALTER TABLE market_csv_datasets ADD COLUMN ${name} INTEGER NOT NULL DEFAULT 0`,
        );
    }
    sqlite.exec(`UPDATE market_csv_datasets SET
      bar_count = json_array_length(bars_json),
      first_time = json_extract(bars_json, '$[0].time'),
      last_time = json_extract(bars_json, '$[#-1].time') WHERE bar_count = 0`);
  })();
  return drizzle(sqlite, { schema });
};

/** Singleton across Next dev hot reloads. */
export const db = globalForDb.__journalDb ?? (globalForDb.__journalDb = createDb());

export * from "./schema";
