import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Auth guard. This only checks whether a session cookie is present — the
 * edge runtime has no Node crypto or database access, so it can't validate
 * the session itself. It gates navigation; server/api.ts's `handler` gates
 * data by verifying the session for real against the database.
 */
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/terms",
  "/privacy",
  "/contact",
  // Midtrans's server-to-server webhook: no session cookie, authenticated by
  // its signature inside the route instead.
  "/api/billing/notification",
]);

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
};

export const config = {
  // Skip Next internals and any request for a static file (has a dot in the
  // last path segment, e.g. /logo.png, /favicon.ico, /robots.txt) — those
  // are served straight from /public and were never meant to be auth-gated.
  matcher: ["/((?!_next/static|_next/image|.*\\.[^/]+$).*)"],
};
