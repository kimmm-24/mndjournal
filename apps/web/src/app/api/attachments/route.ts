import { and, eq } from "drizzle-orm";
import { db, attachments, trades, notes, missedTrades, propAccounts, propEntries } from "@/db";
import { currentUserId, handler, ok, requireValue } from "@/server/api";
import { newId, nowIso } from "@/server/ids";
import { attachmentMime, MAX_ATTACHMENT_SIZE } from "@/lib/attachment-validation";
function owner(type: string, id: string, userId: string) {
  if (type === "prop-account")
    return !!db
      .select({ id: propAccounts.id })
      .from(propAccounts)
      .where(and(eq(propAccounts.id, id), eq(propAccounts.userId, userId)))
      .get();
  if (type === "prop-entry")
    return !!db
      .select({ id: propEntries.id })
      .from(propEntries)
      .where(and(eq(propEntries.id, id), eq(propEntries.userId, userId)))
      .get();
  if (type === "trade")
    return !!db
      .select({ key: trades.key })
      .from(trades)
      .where(and(eq(trades.key, id), eq(trades.userId, userId)))
      .get();
  if (type === "note")
    return !!db
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .get();
  if (type === "missed")
    return !!db
      .select({ id: missedTrades.id })
      .from(missedTrades)
      .where(and(eq(missedTrades.id, id), eq(missedTrades.userId, userId)))
      .get();
  return (
    type === "day" &&
    /^\d{4}-\d{2}-\d{2}$/.test(id) &&
    !isNaN(Date.parse(id)) &&
    new Date(id).toISOString().slice(0, 10) === id
  );
}
export const GET = handler(async (request: Request) => {
  const userId = await currentUserId();
  const p = new URL(request.url).searchParams;
  const type = p.get("type") ?? "",
    id = p.get("id") ?? "";
  requireValue(owner(type, id, userId), "Attachment owner not found.");
  return ok({
    attachments: db
      .select({
        id: attachments.id,
        name: attachments.name,
        mime: attachments.mime,
        size: attachments.size,
      })
      .from(attachments)
      .where(
        and(
          eq(attachments.ownerType, type),
          eq(attachments.ownerId, id),
          eq(attachments.userId, userId),
        ),
      )
      .all(),
  });
});
export const POST = handler(async (request: Request) => {
  const userId = await currentUserId();
  requireValue(
    Number(request.headers.get("content-length") ?? 0) <= MAX_ATTACHMENT_SIZE + 10000,
    "Files must be 8 MB or smaller.",
  );
  const form = await request.formData();
  const type = String(form.get("type") ?? ""),
    ownerId = String(form.get("id") ?? ""),
    file = form.get("file");
  requireValue(owner(type, ownerId, userId), "Attachment owner not found.");
  requireValue(
    file instanceof File && file.size > 0 && file.size <= MAX_ATTACHMENT_SIZE,
    "Choose a file up to 8 MB.",
  );
  const bytes = Buffer.from(await file.arrayBuffer()),
    mime = attachmentMime(bytes);
  requireValue(mime, "Supported files: PNG, JPEG, WebP and PDF.");
  const id = newId();
  db.insert(attachments)
    .values({
      id,
      userId,
      ownerType: type,
      ownerId,
      name: file.name.slice(0, 200),
      mime,
      size: bytes.length,
      data: bytes,
      createdAt: nowIso(),
    })
    .run();
  return ok({ id });
});
