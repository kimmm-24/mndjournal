import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cache } from "react";
import { READ_ONLY_MESSAGE } from "@/lib/plan";
import { auth } from "./auth";
import { getEntitlement } from "./plan";

export class RequestError extends Error {}
export function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new RequestError(message);
}

export const ok = (data: unknown, init?: ResponseInit) => {
  const responseHeaders = new Headers(init?.headers);
  if (!responseHeaders.has("Cache-Control"))
    responseHeaders.set("Cache-Control", "private, no-store");
  return NextResponse.json(data, { ...init, headers: responseHeaders });
};

export const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

// Deduped per request: `handler`'s gate check and any `currentUserId()` call
// inside a route body share this single database lookup.
const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** The signed-in user's id. Only valid inside a route wrapped by `handler`. */
export const currentUserId = async (): Promise<string> => {
  const session = await getSession();
  requireValue(session, "Unauthorized");
  return session.user.id;
};

/** The signed-in user's id plus the contact details payment providers ask for. */
export const currentUser = async (): Promise<{ id: string; email: string; name: string }> => {
  const session = await getSession();
  requireValue(session, "Unauthorized");
  const { id, email, name } = session.user as { id: string; email?: string; name?: string };
  return { id, email: email ?? "", name: name ?? "" };
};

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Route-handler wrapper: the auth gate, the read-only gate for expired plans,
 * plus uniform error JSON instead of HTML 500 pages. Every mutating request
 * (anything but GET/HEAD/OPTIONS) from a user whose trial or paid period has
 * ended is refused with 402 here, so no individual route has to remember to
 * check — only routes that must keep working while expired (billing itself)
 * opt out with `allowReadOnly`.
 */
export const handler =
  <A extends unknown[]>(
    fn: (...args: A) => Promise<Response> | Response,
    options: { allowReadOnly?: boolean } = {},
  ) =>
  async (...args: A): Promise<Response> => {
    try {
      const session = await getSession();
      if (!session) return bad("Unauthorized", 401);
      const request = args[0];
      if (
        !options.allowReadOnly &&
        request instanceof Request &&
        !READ_METHODS.has(request.method) &&
        getEntitlement(session.user.id).readOnly
      ) {
        return bad(READ_ONLY_MESSAGE, 402);
      }
      return await fn(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      return NextResponse.json(
        { error: message },
        { status: error instanceof RequestError ? 400 : 500 },
      );
    }
  };
