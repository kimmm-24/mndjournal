import { currentUserId, handler, ok } from "@/server/api";
import { getEntitlement } from "@/server/plan";

/**
 * The signed-in user's entitlement — `plan` drives plan-gated UI (playbooks,
 * sync/import, replay, ...); the rest drives the shell's trial/renewal banner.
 */
export const GET = handler(async () => {
  const userId = await currentUserId();
  return ok(getEntitlement(userId));
});
