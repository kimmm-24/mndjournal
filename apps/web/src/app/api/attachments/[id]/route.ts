import { and, eq } from "drizzle-orm";
import { db, attachments } from "@/db";
import { currentUserId, handler, ok, bad } from "@/server/api";
type Context = { params: Promise<{ id: string }> };
export const GET = handler(async (_request: Request, { params }: Context) => {
  const userId = await currentUserId();
  const { id } = await params;
  const a = db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, id), eq(attachments.userId, userId)))
    .get();
  if (!a) return bad("Attachment not found", 404);
  return new Response(new Uint8Array(a.data), {
    headers: {
      "Content-Type": a.mime,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${a.mime.startsWith("image/") ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(a.name)}`,
      "Cache-Control": "private, no-store",
    },
  });
});
export const DELETE = handler(async (_request: Request, { params }: Context) => {
  const userId = await currentUserId();
  const { id } = await params;
  db.delete(attachments)
    .where(and(eq(attachments.id, id), eq(attachments.userId, userId)))
    .run();
  return ok({ deleted: true });
});
