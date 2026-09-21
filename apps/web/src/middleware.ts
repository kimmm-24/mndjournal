import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Auth guard. This only checks whether a session cookie is present — the
 * edge runtime has no Node crypto or database access, so it can't validate
 * the session itself. It gates navigation; server/api.ts's `handler` gates
 * data by verifying the session for real against the database.
 */
export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/api/auth")) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
