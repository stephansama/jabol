# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm**. The `package.json` scripts internally call `npm run …` but pnpm runs them fine; always invoke top-level commands with `pnpm`.

```sh
pnpm install                    # install deps (better-sqlite3 builds natively)
pnpm dev                        # concurrent: server on :8080, vite SPA on :5173
pnpm dev:server                 # tsx watch server/index.ts only
pnpm dev:spa                    # vite only (proxies /api → :8080)
pnpm build                      # build:spa (vite → dist/) + build:server (tsc → server-dist/)
pnpm typecheck                  # tsc --noEmit for both SPA and server projects
pnpm start                      # node server-dist/index.js (production)
```

Running locally needs `JABOL_CONFIG_PATH`, `JABOL_DATA_DIR`, `JABOL_AUTH_SECRET` (the README has the canonical incantation pointing at `examples/categorized.json`). There is no test suite.

Docker is multi-stage (`node:20-alpine`); GitHub Actions in `.github/workflows/release.yml` runs `auto shipit` on push to `main`, then builds + pushes `linux/amd64` to `stephanrandle/jabol` on Docker Hub. Multi-arch (`linux/amd64,linux/arm64`) is opt-in — change `platforms:` in the workflow to enable it.

## Architecture

**One process, two halves + shared assets:**
- `server/` — Hono HTTP server (`@hono/node-server`) that serves the JSON API at `/api/*` and, in production, also serves the built SPA from `JABOL_SPA_DIST` (defaults to `/app/dist`). Compiles to `server-dist/` via `tsconfig.server.json`.
- `client/` — React 18 + React Router 6 SPA built with Vite. In dev, vite serves on `:5173` and proxies `/api/*` to the server. The `@` import alias resolves to `client/`.
- `assets/` — single canonical home for the favicon, screenshot, and any other shared image asset. Vite serves it as `publicDir`; the Starlight docs site (`docs/`) reads it via `publicDir: "../assets"` + `vite.server.fs.allow: [".."]`. Reference these files from one place; don't introduce copies.

**Canonical state lives in one place** — `server/state/store.ts`. The `Store` singleton holds the in-memory `Canonical` shape, persists atomically to `links.json` (temp file + rename), and emits change events. SSE (`server/state/sse.ts`) and the file watcher (`server/state/watcher.ts`) hang off the store's listener set. Anything that mutates links must go through the store so the watcher-suppression window (`suppressWatchUntil`) prevents echo events from the store's own writes.

**Input shapes are unified at the edge** — `server/enrich/normalize.ts` accepts both the "categorized" and "flat" `links.json` shapes (see README), and `flat + groupByTag: true` is reshaped into synthetic categories at load. Downstream code only sees `Canonical { categories: [{ id, name, links: [{ id, … }] }] }`. UUIDs are stamped on first read and written back so admin edits are addressable.

**Read-only mode is a first-class state.** `Store.init()` calls `access(configPath, W_OK)`; if it fails, all mutating endpoints throw `HttpError(403)` and `/api/info` reports `readOnly: true`. Auth still works in read-only mode so admins can see hidden links. The SPA renders `ReadOnlyBanner` based on the info response.

**Bootstrap / signup is one-shot.** `server/bootstrap.ts` reports `signupOpen = true` only when no admin user exists AND `JABOL_ADMIN_EMAIL` is unset. Once either condition flips, `POST /api/signup` returns 404. If env vars are set, an admin is seeded on first boot via `maybeSeedAdmin()`.

**Enrichment fetches favicons and OG images.** `server/enrich/index.ts` runs against the whole canonical at startup (`enrichCanonical`) and against new/changed links only on reload or mutation (`enrichLinks`). Resolved `icon` / `image` values are carried forward across reloads when `url` is unchanged (see `Store.reloadFromDisk`). Cached icons are written under `JABOL_DATA_DIR/icons/` and served via `/api/icons`.

**Auth = better-auth + better-sqlite3.** `server/auth.ts` opens `auth.db` in `JABOL_DATA_DIR` with WAL mode. All routes under `/api/auth/*` are delegated to `auth.handler`. Admin-gated routes use `server/middleware/requireAdmin.ts`. "Admin" is currently synonymous with "any signed-in user" — there is no role column; `listAdminUsers` reads the entire `user` table.

**SPA structure** — `client/routes/` has the four pages (Home, Login, Signup, Admin). Data hooks in `client/hooks/` wrap the API: `useLinks` fetches, `useLinksSSE` subscribes to `/api/events` for live reloads, `useFuzzySearch` runs Fuse.js client-side, `useKeyboardNav` powers `/` `↑/↓` `Enter` `Esc`. Theme is `light` / `dark` / `mocha` / `latte` (Catppuccin); persisted in `localStorage`; the `theme` field in `links.json` only seeds first-time visitors.

**PWA is build-time generated, served as static dist.** `vite-plugin-pwa` (`vite.config.ts`) emits `manifest.webmanifest` + `sw.js` into `dist/` at build; the Hono `serveStatic` mount serves them — there is **no server route** for the SW/manifest. Icons come from `assets/favicon.svg` via `@vite-pwa/assets-generator` (`pwa-assets.config.ts`, `pnpm assets:generate`) and are committed to `assets/` like `screenshot.png`. The SW is registered manually from `client/pwa/PWAUpdatePrompt.tsx` (`registerType: "prompt"`, hence the update toast). Crucial interaction with the head-injection system: **`index.html` is deliberately not precached** and the default `navigateFallback` is disabled, because the server re-renders `<head>` per request — navigations use a NetworkFirst runtime route instead so OG/meta stay live. PWA `<meta>`/`<link>` tags live **outside** the `jabol:head` sentinels in `index.html` so the per-request re-render never strips them; `theme-color` is updated at runtime in `useTheme.ts`. `devOptions.enabled` is `false`, so the SW is inert under `pnpm dev`.

## Conventions worth knowing

- Server uses ESM with `.js` import extensions (TypeScript NodeNext-style) — when adding files under `server/`, import siblings as `./foo.js` even though the source is `./foo.ts`.
- The `Canonical` types in `server/enrich/normalize.ts` are the single source of truth for link shape; mirror changes into `client/lib/types.ts` for the SPA.
- Versioning is handled by Intuit Auto (`.autorc.json`); do not hand-edit `package.json` `version`. Auto reads PR labels (`major` / `minor` / `patch` / `skip-release`).
