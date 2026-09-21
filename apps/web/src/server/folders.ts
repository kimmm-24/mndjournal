import { and, eq } from "drizzle-orm";
import { db, folders } from "@/db";
import { newId, nowIso } from "./ids";

/**
 * Every user gets their own copy of these — folders used to be seeded once,
 * globally, by db/bootstrap.ts; now that they're per-user there's no
 * install-time moment to seed them at, so they're created lazily on first
 * use instead (see ensureDefaultFolders).
 */
const DEFAULT_FOLDERS = [
  "All notes",
  "Trade notes",
  "Daily journal",
  "Session recaps",
  "My notes",
] as const;

/** Idempotent: creates whichever of this user's default folders don't exist yet. */
export const ensureDefaultFolders = (userId: string): void => {
  const existing = new Set(
    db
      .select({ name: folders.name })
      .from(folders)
      .where(and(eq(folders.userId, userId), eq(folders.kind, "system")))
      .all()
      .map((row) => row.name),
  );
  const missing = DEFAULT_FOLDERS.filter((name) => !existing.has(name));
  if (missing.length === 0) return;
  const createdAt = nowIso();
  db.insert(folders)
    .values(missing.map((name) => ({ id: newId(), userId, name, kind: "system" as const, createdAt })))
    .run();
};

/** This user's default "My notes" folder — the fallback bucket for new notes. */
export const defaultNotesFolderId = (userId: string): string => {
  ensureDefaultFolders(userId);
  return db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.name, "My notes")))
    .get()!.id;
};
