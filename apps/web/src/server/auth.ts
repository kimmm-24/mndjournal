import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Per-user accounts: email + password (replacing the old single
 * JOURNAL_PASSWORD gate), plus Google sign-in when GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET are configured — omitted otherwise, so a self-hosted
 * install without Google credentials still works with email+password alone.
 * Google's redirect URI (register exactly this in Google Cloud Console,
 * with no trailing slash): `${BETTER_AUTH_URL}/api/auth/callback/google`.
 *
 * Credentials, sessions and tokens live in the `user`/`session`/`account`/
 * `verification` tables in db/schema.ts — managed exclusively through this
 * object, never queried directly elsewhere. `account` already carries the
 * OAuth token columns Google needs (accessToken, refreshToken, idToken,
 * etc.), so no schema change was needed to add this provider. Everything
 * else in the app scopes its own tables by `userId`, resolved via
 * `currentUserId()` in server/api.ts.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: { enabled: true },
  ...(googleClientId && googleClientSecret
    ? { socialProviders: { google: { clientId: googleClientId, clientSecret: googleClientSecret } } }
    : {}),
  // Reuses the app's existing secret so a self-hosted install still only
  // needs to manage one piece of key material; falls back to Better Auth's
  // own default (with a dev-mode warning) if neither is set.
  secret: process.env.BETTER_AUTH_SECRET || process.env.JOURNAL_SECRET,
  plugins: [nextCookies()],
});
