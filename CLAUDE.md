# CLAUDE.md

Project context for Claude Code sessions working on this repo. Written from the actual current
state of the code, not from `README.md` (see **Known gaps** below — that file is stale).

## What this project actually is

**mndjournal** — a multi-tenant, commercial SaaS trading journal for traders in Indonesia, across
all instruments (stocks, forex, futures, crypto, gold, etc. — not gold/XAU-only despite some
earlier naming). It started as a fork of LuxAlgo's open-source, single-user, self-hosted
"Trade Journal" and has since been substantially rebuilt:

- Single-user → multi-tenant (Better Auth accounts, every table scoped by `user_id`).
- Free/self-hosted → three paid plans (Starter/Pro/Elite) with server-enforced feature gating.
- LuxAlgo branding → mndjournal branding throughout (see **Branding** below — this matters for a
  legal/trademark reason, not just cosmetics).
- Added a public marketing site (`/`, `/pricing`, `/terms`, `/privacy`, `/contact`) alongside the
  authenticated app.

## Known gaps — read before trusting other docs

- **`README.md` is stale.** It's still the original upstream LuxAlgo README verbatim — describes
  the project as "Trade Journal," links to `github.com/LuxAlgo/trade-journal`, references
  `@luxalgo/journal-core` as a published npm package, etc. None of that reflects this fork's
  actual branding or business model anymore. Don't treat it as ground truth; it needs a rewrite
  pass whenever that's prioritized. This file (`CLAUDE.md`) and the code itself are the source of
  truth in the meantime.
- The `@luxalgo/journal-core` / `@luxalgo/journal-importers` internal workspace package names were
  deliberately left unchanged during the rebrand (renaming them would touch many import
  statements for zero user-visible benefit — they're internal only, never shown in the UI).

## Tech stack

- **Next.js 15** (App Router), TypeScript, **Tailwind v4**.
- **Drizzle ORM** + **better-sqlite3** — one SQLite file, WAL mode, `busy_timeout` set for
  concurrent users. Schema in `apps/web/src/db/schema.ts`.
- **Better Auth** — email/password + Google OAuth (conditional, only if both
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set). Auth instance in `apps/web/src/server/auth.ts`.
- **Vitest** for tests, **pnpm** workspaces: `apps/web` (the app), `packages/core`
  (`@luxalgo/journal-core` — pure domain engine), `packages/importers`
  (`@luxalgo/journal-importers` — statement parsers).
- Charting via `@luxalgo/vela` (candlesticks/replay — paints to canvas, can't use CSS variables,
  so it reads colors via `useVizTokens()`/`readVizTokens()` in `components/charts/tokens.ts`, or in
  `trade-chart.tsx`'s case, hardcoded literals that must be kept in sync manually).

## Multi-tenancy

- Every app table has a `user_id` column. Better Auth owns `user`/`session`/`account`/
  `verification` — never query those directly outside `server/auth.ts`; read `userId` off the
  app's own tables instead, resolved via `currentUserId()` in `server/api.ts`.
- **Legacy migration pattern** (`server/legacy-migration.ts`): pre-multi-tenant rows get stamped
  with a sentinel owner (`""`), then reassigned to a real Better Auth user (created via
  `JOURNAL_LEGACY_EMAIL` / `JOURNAL_PASSWORD`) the first time the app boots after upgrading. Runs
  once via `ensureLegacyOwner()` in `instrumentation.ts`. Idempotent.
- **Migration/bootstrap ordering rule**: `db/bootstrap.ts`'s `CREATE TABLE IF NOT EXISTS` SQL runs
  unconditionally on every boot, *before* `db/index.ts`'s `ALTER TABLE ADD COLUMN` migration loop.
  A brand-new table can have its final shape (including indexes) directly in `bootstrap.ts`. A
  column being *added* to a pre-existing table cannot get an index in `bootstrap.ts` — that index
  must live in `db/index.ts`, after the column is guaranteed to exist, or it'll break upgrades of
  installs that predate the column.
- **`db` is a lazy `Proxy`** in `db/index.ts` — it only opens the SQLite file and runs migrations
  on first real property access, never merely from importing the module. This matters: Next's
  build-time "collecting page data" step imports every route module just to read config exports —
  if `db` initialized eagerly at import time, that alone would trigger `SQLITE_BUSY` errors during
  `pnpm build` (multiple build workers racing to migrate the same file). Don't revert this to an
  eager singleton.

## Broker sync & MetaTrader

- **`server/sync.ts`** handles every broker-connected (`kind: "sync"`) account. SDK brokers go
  through `@luxalgo/broker-sdk`. **MetaTrader** (`broker: "metatrader"`) goes through MetaApi
  instead: the client is in `server/metaapi.ts`, the deal conversion and sync logic in
  `server/metatrader.ts`. MetaTrader is only listed when `METAAPI_TOKEN` is set. It covers every
  local Indonesian forex broker, since they all run MetaTrader.
- **MetaApi bills per deployed hour.** Each sync deploys the cloud terminal, waits for it to
  connect, reads deals, account info and positions, then undeploys (in a `finally` block). Never
  leave an account deployed. `recoverInterruptedSyncs()` undeploys terminals left behind by a
  crash mid-sync. Deleting an account removes its MetaApi terminal (`disconnectBroker`).
- **Only the MetaApi account id is stored**, never the investor password. It's sent to MetaApi
  once, at connect time.
- **Deals → fills:** each deal carries `importMetadata`:
  - `group` = MT position id, so hedged positions aren't netted together.
  - `reportedGrossPnl` on closing deals, so journal P&L equals MT's own profit (JPY and cross
    pairs, gold and cent accounts would be wrong if recomputed from price × lots). Negative
    swap/commission become fees; positive ones are added to P&L.
  - `order` = the deal ticket.
  The execution validator accepts `importMetadata` from any source except `manual`.
- **Status on the account row:** `syncingSince`, `syncError`, and `syncAttemptedAt` (the backoff
  clock). Update them via `runAccountSync()`, which also stops the same account from syncing
  twice at once. MetaTrader's first sync and manual syncs run in the background
  (`startAccountSync`); the Accounts page polls. Manual MetaTrader syncs are limited to one per
  10 minutes.
- **Scheduler:** `server/sync-scheduler.ts` is started from `instrumentation.ts` and ticks every
  10 minutes. It syncs `autoSync` accounts once per `METATRADER_SYNC_INTERVAL_HOURS` (default 6)
  or `AUTO_SYNC_INTERVAL_HOURS` (default 1), measured from the last *attempt*. It skips users who
  are read-only or whose plan excludes sync.

## Email, verification & password reset

- **`server/email.ts`** sends through Resend's HTTP API (`RESEND_API_KEY`, `EMAIL_FROM`). It
  doesn't use SMTP because Railway blocks outbound SMTP on Hobby/Trial plans. Without a key,
  emails are printed to the server log instead (that's how local dev gets its links).
- **Templates** in `server/email-templates.ts` are bilingual, Indonesian first then English, with
  inline styles only. User-supplied values (the name) must go through `escapeHtml`.
- **`server/auth.ts`** wires Better Auth's `sendResetPassword` / `sendVerificationEmail` via
  `deliver()`, which is fire-and-forget. Never await email delivery in auth flows: awaiting makes
  "forgot password" respond slower for real accounts, which leaks which emails are registered.
- **Verification is required only when `RESEND_API_KEY` is set.** Blocked sign-ins automatically
  get a fresh link (`sendOnSignIn`).
- **Grandfathering:** `grandfatherExistingUsers()`, called from `instrumentation.ts`, marks every
  existing user verified the first time the app boots with email configured, then stores a
  one-time marker (`emailVerificationEnforcedAt` setting). The legacy-migrated owner account is
  marked verified when it's created.
- **Pages:** `/forgot-password` → email link → Better Auth's `/api/auth/reset-password/:token` →
  `/reset-password?token=…`. A reset signs the user out on all devices.

## Subscription plans & feature gating

Three paid plans: `starter` / `pro` / `elite`, billed as **prepaid periods** (1 month = 30 days,
1 year = 365 days) through Midtrans Snap. No auto-renewal: Indonesian users mostly pay with QRIS,
bank transfer and e-wallets, which can't be charged recurringly.

- **`server/plan.ts`** — `getEntitlement(userId)` is the source of truth; `getPlan(userId)` is its
  `.plan`, which every feature gate checks. A `subscriptions` row has `status` `trial` / `active` /
  `comp` plus `ends_at`:
  - **No row** → one is created on first read as a 14-day (`TRIAL_DAYS`) trial of Pro
    (`TRIAL_PLAN`). This covers new signups *and* accounts that predate billing (their trial starts
    at their first request after the upgrade), so there's no signup hook or backfill.
  - `comp` → manually granted, never expires. It's the column default, so pre-billing manual
    grants kept working after the migration.
  - `trial`/`active` past `ends_at` → **expired**: `plan` becomes `starter` and `readOnly` is true.
  Also holds `ACCOUNT_LIMITS` (starter 1 / pro 10 / elite unlimited) and `PROP_ACCOUNT_LIMITS`
  (starter 0 / pro 1 / elite unlimited).
- **Read-only when expired** — enforced once, in `server/api.ts`'s `handler`: every non-GET request
  from an expired user gets 402 (`READ_ONLY_MESSAGE`). Reads and `/api/export` keep working. Only
  billing routes opt out (`handler(fn, { allowReadOnly: true })`). New routes get this for free —
  don't add per-route expiry checks. The shell's `PlanBanner` shows trial countdown / renewal
  reminder / read-only notice.
- **Billing** — `server/midtrans.ts` (Snap + status API over plain fetch; sandbox vs production is
  only `MIDTRANS_IS_PRODUCTION` + which keys are set), `server/billing.ts` (checkout,
  `applyPaymentStatus`, `nextPeriodEnd`), `payments` table, `/billing` page. Payment state is only
  ever taken from Midtrans's status API, never from the webhook body or browser callbacks. A period
  is granted exactly once, on the transition to `paid`. Webhook: `/api/billing/notification`
  (public, signature-checked). `/api/billing/verify` settles an order from the browser — the only
  path that works on localhost, where Midtrans can't reach the webhook. Prices come from
  `pricing-data.ts`. Refunds mark the payment `refunded` but don't shorten access (manual decision).
- **`server/ai-quota.ts`** — AI usage quota, tracked in the `ai_usage` table per user per calendar
  month. Starter gets 0 (no AI at all). Quotas are env-configurable: `TRIAL_AI_QUOTA` (default 10),
  `PRO_AI_QUOTA` (default 100), `ELITE_AI_QUOTA` (default 300).
- **Enforcement is server-side, always**, with UI hidden entirely for restricted tiers (never just
  a disabled button) — this is the standing pattern for every gated feature: account limits
  (`api/accounts/route.ts`), playbooks (`api/playbooks/route.ts`), prop-firm accounts
  (`server/prop-firms.ts`'s `mutateProp`), sync/import account kind (`api/accounts/route.ts`),
  trade replay (`components/trade-market-data.tsx`, gated via a `replayAllowed` prop), and all AI
  features (gated inside `runAi()` in `server/ai.ts` — the single choke point recap/critique/ask/
  auto-tagger all call through, so new AI features get quota enforcement for free).
- **To grant a user a plan manually** (comp / testing), find their id then upsert — set `status`
  and `ends_at` too, or an existing trial row keeps expiring:
  ```sql
  SELECT id, email FROM user WHERE email = '...';
  INSERT INTO subscriptions (user_id, plan, status, ends_at, updated_at)
  VALUES ('<id>', 'pro', 'comp', NULL, datetime('now'))
  ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, status = excluded.status,
    ends_at = excluded.ends_at, updated_at = excluded.updated_at;
  ```
  To test expiry instead, set `status = 'active'` (or `'trial'`) with an `ends_at` in the past.
- Pricing copy (tiers, prices, the full feature comparison table) lives in **one file**,
  `apps/web/src/lib/pricing-data.ts` — both the landing page's pricing teaser and the full
  `/pricing` comparison table read from it, so they can't drift out of sync. When a gated feature's
  actual enforcement changes, update this file too, or the marketing site will misrepresent access.

## Branding

- Product name: **mndjournal**. Logo: `apps/web/public/logo.png` (also copied to
  `apps/web/src/app/icon.png` for the favicon, which applies app-wide since nothing overrides it
  per-route).
- Brand palette (dark theme only — there is no separate light-theme brand palette):
  `background #141820`, `card #1c2230`, `border #2a3245`, `accent/profit #4d8dff`, `loss #e05555`.
  These are wired into `globals.css`'s `.dark` block as CSS custom properties (`--profit`, `--loss`,
  `--brand`, etc.), consumed by Tailwind's `text-profit`/`bg-profit`/etc. utilities everywhere in
  the authenticated app. The marketing pages (outside the app shell) use the same hex values
  directly as Tailwind arbitrary values (e.g. `bg-[#4d8dff]/15`) rather than the CSS variables,
  since they're a separate visual system from the authenticated app shell.
- **"Trade Journal" as a name, and LuxAlgo's triangle logo, must not appear anywhere in the UI** —
  this isn't just a style preference, "Trade Journal" is a mark covered by LuxAlgo's own
  `TRADEMARKS.md` policy, and this is now a separate commercial product. Same for GitHub links
  pointing at `LuxAlgo/trade-journal` (docs links, open-source attribution, etc.) — remove rather
  than repoint, since there's no equivalent mndjournal-hosted destination. The `LICENSE` file
  itself stays untouched; only UI-visible attribution was in scope to remove.
- If you're building a new mockup/screenshot on the marketing site, match the *real* app UI
  precisely (real sidebar nav items/icons, real card styles, real gauge component, real calendar
  day-cell coloring, real table columns) — read the actual component before approximating one.

## Routing — public vs. authenticated

Public marketing/auth routes need to be added in **two places**, not one, or they'll either
redirect to `/login` or get wrapped in the authenticated app's sidebar chrome:

1. `apps/web/src/middleware.ts` — `PUBLIC_PATHS` set (skips the auth-cookie redirect).
2. `apps/web/src/components/shell.tsx` — `PUBLIC_SHELL_BYPASS` set (skips rendering the sidebar/
   top-bar chrome around the page).

Public *API* routes (no session, e.g. the Midtrans webhook `/api/billing/notification`) only need
`PUBLIC_PATHS`, and must authenticate the caller some other way (signature check) since `handler`
isn't used.

The middleware's matcher already excludes any request for a static file (anything with a dot in
the last path segment) — don't add per-file exclusions there, that pattern already covers new
assets under `/public`.

## Testing conventions

- Vitest tests that exercise a real API route mock `next/headers`'s `headers()` and
  `@/server/auth`'s `auth.api.getSession()` to run as a fixed signed-in `"test-user"` without a
  real HTTP/session round trip (see any `tests/*.test.ts` for the exact `vi.mock(...)` pattern).
  `tests/api-auth.test.ts` is the exception — it leaves `@/server/auth` unmocked to test the real
  Better Auth flow end-to-end.
- **Tests that depend on a specific plan should seed a `subscriptions` row** in `beforeEach`.
  Without one, the fixture user silently gets a Pro trial, with the trial's AI quota. Inserting
  just `plan` works because `status` defaults to `comp` (never expires) — see
  `tests/prop-firms.test.ts` or `tests/import-account.test.ts`. `tests/billing.test.ts` covers
  trial/expiry/read-only and fakes Midtrans with a stubbed global `fetch`.
- No React component-rendering tests exist in this repo (no React Testing Library dependency) —
  all tests exercise server-side route handlers/functions directly, not rendered UI.

## Windows dev environment quirks

- `pnpm build` on Windows fails at the very end with `EPERM: operation not permitted, symlink`
  during `output: standalone`'s trace-copying step. This is a known, pre-existing, accepted
  Windows-only limitation — the build has already fully compiled, type-checked, and generated all
  static pages by that point, and the error doesn't occur on Railway's Linux build. Don't chase it.
- `pnpm.exe` (and other global npm-shimmed CLIs like `railway.exe`) can intermittently get blocked
  by a Windows Application Control policy (`"An Application Control policy has blocked this
  file"`), unrelated to anything in this repo. It tends to clear up on its own after a while. If
  blocked, `node`, and the local `node_modules/.bin/next.cmd` / `node_modules/.bin/vitest.cmd`
  binaries usually still work fine as a direct-invocation workaround.

## Deployment

Hosted on **Railway**. Production SQLite lives at `/data/journal.db` in the container, which has
no `sqlite3` CLI — run SQL against it via `railway ssh` + `node -e` loading `better-sqlite3`
directly (it's already a dependency), not by trying to install a CLI in the container.

## Working conventions for this repo

- Don't commit or push unless explicitly asked. When asked to push and there's a natural way to
  split unrelated work into separate commits, do that (unless told to use one commit); always
  review `git status`/the diff before committing, especially after multiple tasks have left
  changes uncommitted in the same session.
- End commit messages with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` (or whatever
  attribution line the session's own system reminder specifies at the time — that takes
  precedence over this file if they ever differ).
