# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A React + Vite SPA (installable as a PWA) that estimates calories and macros
for a meal from a photo or text description, via the Claude API. Entries are
stored client-side only (`localStorage`), day by day — there is no database
and no user accounts.

## Two independent npm projects

The frontend (repo root) and backend (`server/`) are separate npm projects
with their own `package.json`, `node_modules`, and TypeScript config. Install
and build them independently:

```bash
npm install                       # frontend
npm --prefix server install       # backend
```

## Common commands

```bash
npm run dev              # frontend dev server (Vite, :5173)
npm run dev:server       # backend dev server (tsx watch, :3001)
npm run dev:all          # both at once (concurrently)

npm run build            # frontend: tsc -b && vite build -> dist/
npm --prefix server run build   # backend: tsc -> server/dist/

npm run lint             # oxlint (frontend)
npm --prefix server run lint    # oxlint (backend)

npm test                 # frontend: vitest run
npm --prefix server test # backend: vitest run
```

**Testing scope is deliberately narrow.** Vitest covers the pure, silent-bug-prone
logic only — the 3am day boundary in `src/utils/date.ts`, the attachment
branching in `src/utils/attachments.ts`, the goal/font-scale clamps, the
localStorage key handling, the fetch error mapping, and on the backend the
prompt builders in `server/src/claude.ts`, the session HMAC in `auth.ts`, and
every route's validation via supertest. There are deliberately **no component
or hook tests** — this is a single-user app whose UI changes often, and those
tests would cost more than they catch.

Frontend tests default to `environment: "node"`; the one suite that needs
`localStorage` opts into jsdom with a `@vitest-environment jsdom` docblock
(running jsdom everywhere cost ~50s per run). `server/tsconfig.json` excludes
`*.test.ts` so tests never reach `server/dist/`.

Frontend needs `.env` (copy from `.env.example`) with `VITE_API_BASE_URL`.
Backend needs `server/.env` (copy from `server/.env.example`) with
`ANTHROPIC_API_KEY`, `PORT`, `ALLOWED_ORIGIN` — the backend refuses to start
without `ANTHROPIC_API_KEY` set.

## Architecture

**Why there's a backend at all**: the only reason `server/` exists is to
keep `ANTHROPIC_API_KEY` off the client. `server/src/claude.ts` holds the
system prompt and calls the Anthropic SDK directly; `server/src/index.ts`
exposes this as a single rate-limited endpoint, `POST /api/analyze`. The
frontend's `src/api/claude.ts` is a thin fetch wrapper around that endpoint —
if you're changing the analysis prompt or response shape, both
`server/src/claude.ts` (source of truth) and `src/types.ts` (`FoodAnalysis`
shape, duplicated on both sides since they're separate TS projects) need to
agree.

**State/storage model**: there's no global state manager. `src/hooks/useEntries.ts`
and `src/hooks/useGoal.ts` each own one slice of state and read/write directly
to `localStorage` via `src/storage/*.ts`. Entries are keyed per day
(`calorie-tracker:entries:YYYY-MM-DD`, see `todayKey()` in `src/utils/date.ts`),
so "today" is whatever `todayKey()` returns *at render time* — it's not
re-evaluated on a timer, only when state changes (adding an entry) or on
reload. The day boundary is 3am rather than midnight (`todayKey()` shifts
the clock back 3h before reading the calendar date), so a meal logged at
1am still counts toward the previous day. `App.tsx` wires these two hooks
together and owns the
photo/text-analysis flow (`status`: idle/analyzing/error).

**Styling**: CSS Modules per component (`Component.module.css` next to
`Component.tsx`), no global CSS framework. Color/font tokens live in
`src/index.css` (`:root` custom properties).

**PWA**: `vite-plugin-pwa` (configured in `vite.config.ts`) generates the
manifest and service worker at build time. Icons are pre-generated (not at
build time) via `@vite-pwa/assets-generator` from `public/favicon-source.png`,
config in `pwa-assets.config.ts` — re-run `npx pwa-assets-generator` if the
source icon changes. The service worker is configured `NetworkOnly` for
`/api/*` since those calls cost real Anthropic API usage and must never be
served from cache.

## Deployment

Everything needed to deploy to a VPS (nginx config, pm2 ecosystem file,
update script) lives in `deploy/` — see `deploy/README.md` for the full
runbook. Notable choices baked into that setup:
- Backend runs under pm2, listening on `127.0.0.1:3002` (not 3001, to avoid
  clashing with whatever else runs on the shared host).
- nginx serves `dist/` as static files and reverse-proxies `/api/` to the
  backend.
- The whole site sits behind HTTP Basic Auth (`auth_basic` in the nginx
  config) — this is a personal single-user app, so this is the access
  control, not a login screen in the app itself.
