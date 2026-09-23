import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { deliver, emailConfigured } from "./email";
import { resetPasswordEmail, verificationEmail } from "./email-templates";
import { getSetting, setSetting } from "./settings";

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
  /**
   * Email verification is required only once email can actually be sent
   * (RESEND_API_KEY set) — otherwise nobody could ever verify. Unverified
   * sign-ins get a fresh link automatically (sendOnSignIn), so an expired
   * or lost verification email is never a dead end.
   */
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: emailConfigured(),
    sendResetPassword: async ({ user, url }) => deliver(resetPasswordEmail(user, url)),
    // A reset is often "someone else may have my password": sign out everywhere.
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => deliver(verificationEmail(user, url)),
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 24 * 60 * 60,
  },
  ...(googleClientId && googleClientSecret
    ? {
        socialProviders: { google: { clientId: googleClientId, clientSecret: googleClientSecret } },
      }
    : {}),
  // Reuses the app's existing secret so a self-hosted install still only
  // needs to manage one piece of key material; falls back to Better Auth's
  // own default (with a dev-mode warning) if neither is set.
  secret: process.env.BETTER_AUTH_SECRET || process.env.JOURNAL_SECRET,
  plugins: [nextCookies()],
});

const VERIFICATION_ENFORCED_KEY = "emailVerificationEnforcedAt";

/**
 * Runs at boot (instrumentation.ts). The first time the app starts with
 * email configured, every account that already exists is marked verified:
 * they signed up when there was no way to verify, and without this they'd
 * be locked out on their next sign-in. Only accounts created after that
 * moment have to verify. The marker makes it a one-time step.
 */
export const grandfatherExistingUsers = (): void => {
  if (!emailConfigured() || getSetting(VERIFICATION_ENFORCED_KEY)) return;
  db.transaction((tx) => {
    tx.update(schema.user)
      .set({ emailVerified: true })
      .where(eq(schema.user.emailVerified, false))
      .run();
  });
  setSetting(VERIFICATION_ENFORCED_KEY, new Date().toISOString());
};
