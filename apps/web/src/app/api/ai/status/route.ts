import { currentUserId, handler, ok } from "@/server/api";
import { getAiAccessStatus } from "@/server/ai-quota";

/** Plan + this month's AI usage — lets the UI hide/disable AI buttons without a click. */
export const GET = handler(async () => {
  const userId = await currentUserId();
  return ok(getAiAccessStatus(userId));
});
