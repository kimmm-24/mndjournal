import { currentUserId, handler, ok } from "@/server/api";
import { getPlan } from "@/server/plan";

/** The signed-in user's plan — used to hide/enable plan-gated UI (playbooks, sync/import, replay, ...). */
export const GET = handler(async () => {
  const userId = await currentUserId();
  return ok({ plan: getPlan(userId) });
});
