import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";

export class RequestError extends Error {}
export function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new RequestError(message);
}

export const ok = (data: unknown, init?: ResponseInit) => {
  const responseHeaders = new Headers(init?.headers);
  if (!responseHeaders.has("Cache-Control")) responseHeaders.set("Cache-Control", "private, no-store");
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

/** Route-handler wrapper: the auth gate, plus uniform error JSON instead of HTML 500 pages. */
export const handler =
  <A extends unknown[]>(fn: (...args: A) => Promise<Response> | Response) =>
  async (...args: A): Promise<Response> => {
    try {
      const session = await getSession();
      if (!session) return bad("Unauthorized", 401);
      return await fn(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      return NextResponse.json(
        { error: message },
        { status: error instanceof RequestError ? 400 : 500 },
      );
    }
  };
