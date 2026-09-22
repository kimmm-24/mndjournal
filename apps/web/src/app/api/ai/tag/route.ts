import { bad, currentUserId, handler, ok } from "@/server/api";
import { suggestPlaybook } from "@/server/ai-tagger";

/** Suggests the best-matching playbook for a trade — counts against the same AI quota. */
export const POST = handler(async (request: Request) => {
  const userId = await currentUserId();
  const { key } = (await request.json()) as { key?: string };
  if (!key) return bad("key is required");
  const suggestion = await suggestPlaybook(key, userId);
  return ok(suggestion);
});
