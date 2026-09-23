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

## Subscription plans & feature gating

Three plans: `starter` / `pro` / `elite`. No payment provider is wired up yet — plan changes are a
manual SQL upsert until Midtrans (or similar) integration lands.

- **`server/plan.ts`** — `getPlan(userId)`: **no row in the `subscriptions` table means `starter`**,
  by design (this is what makes every existing account, including the legacy migrated one, default
  correctly with zero backfill). Also holds `ACCOUNT_LIMITS` (starter 1 / pro 10 / elite unlimited)
  and `PROP_ACCOUNT_LIMITS` (starter 0 / pro 1 / elite unlimited).
- **`server/ai-quota.ts`** — AI usage quota, tracked in the `ai_usage` table per user per calendar
  month. Starter gets 0 (no AI at all). Pro/Elite quotas are env-configurable:
  `PRO_AI_QUOTA` (default 100), `ELITE_AI_QUOTA` (default 300).
- **Enforcement is server-side, always**, with UI hidden entirely for restricted tiers (never just
  a disabled button) — this is the standing pattern for every gated feature: account limits
  (`api/accounts/route.ts`), playbooks (`api/playbooks/route.ts`), prop-firm accounts
  (`server/prop-firms.ts`'s `mutateProp`), sync/import account kind (`api/accounts/route.ts`),
  trade replay (`components/trade-market-data.tsx`, gated via a `replayAllowed` prop), and all AI
  features (gated inside `runAi()` in `server/ai.ts` — the single choke point recap/critique/ask/
  auto-tagger all call through, so new AI features get quota enforcement for free).
- **To change a user's plan manually** (e.g. for testing), find their id then upsert:
  ```sql
  SELECT id, email FROM user WHERE email = '...';
  INSERT INTO subscriptions (user_id, plan, updated_at)
  VALUES ('<id>', 'pro', datetime('now'))
  ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, updated_at = excluded.updated_at;
  ```
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

The middleware's matcher already excludes any request for a static file (anything with a dot in
the last path segment) — don't add per-file exclusions there, that pattern already covers new
assets under `/public`.

## Testing conventions

- Vitest tests that exercise a real API route mock `next/headers`'s `headers()` and
  `@/server/auth`'s `auth.api.getSession()` to run as a fixed signed-in `"test-user"` without a
  real HTTP/session round trip (see any `tests/*.test.ts` for the exact `vi.mock(...)` pattern).
  `tests/api-auth.test.ts` is the exception — it leaves `@/server/auth` unmocked to test the real
  Better Auth flow end-to-end.
- **Any test that creates accounts, prop accounts, or playbooks needs a seeded `subscriptions`
  plan row**, or it'll hit the starter-tier gate (0 prop accounts, 1 account max, no playbooks).
  Seed `pro` or `elite` in `beforeEach` for that fixture user — see `tests/prop-firms.test.ts` or
  `tests/import-account.test.ts` for the pattern.
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
