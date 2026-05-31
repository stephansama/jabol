---
title: Development
description: Running jabol locally and contributing.
---

## Prerequisites

- Node 20+
- pnpm (corepack handles this)

## Setup

```sh
git clone https://github.com/stephansama/jabol
cd jabol
pnpm install
```

`pnpm install` builds the native `better-sqlite3` module, so the first
install pulls a small compile toolchain on macOS / Linux (already
present on most dev boxes).

## Dev server

```sh
JABOL_CONFIG_PATH=./examples/categorized.json \
  JABOL_DATA_DIR=./.data \
  JABOL_AUTH_SECRET=dev-secret-at-least-32-characters \
  pnpm dev
```

`pnpm dev` starts two processes concurrently:

- **Hono server on `:8080`** (via `tsx watch`) — owns `/api/*`,
  better-auth, the file watcher, and the SSE event stream.
- **Vite SPA on `:5173`** — proxies `/api/*` to the Hono server, hot
  module reload for the React SPA.

Open <http://localhost:5173> for the dev experience.

## Repo layout

```
jabol/
├── server/                 # Hono backend (TypeScript, ESM)
│   ├── enrich/             # links.json normalization + favicon/OG scraping
│   ├── routes/             # API route handlers
│   ├── state/              # canonical store + SSE + file watcher
│   ├── middleware/         # requireAdmin
│   └── index.ts            # entrypoint
├── src/                    # React 18 SPA (Vite)
│   ├── routes/             # /, /login, /signup, /admin
│   ├── components/         # LinkCard, Icon, TopBar, AdminMenu, …
│   ├── hooks/              # useLinks, useLinksSSE, useFuzzySearch, …
│   └── lib/                # api client, types, helpers
├── schema/                 # generated JSON Schema (committed)
├── examples/               # starter links.json files
├── docs/                   # this Starlight docs site
└── scripts/                # generate-schema.ts
```

## Schema generation

The JSON Schema at [`schema/links.schema.json`](https://github.com/stephansama/jabol/blob/main/schema/links.schema.json)
is generated from `server/enrich/schema.ts` (the Zod source).

```sh
pnpm schema:generate    # regenerate after editing the Zod source
pnpm schema:check       # CI guard — fails if the committed schema is out of date
```

CI runs `schema:check` on every PR.

## Typecheck

```sh
pnpm typecheck    # tsc --noEmit on both SPA and server
```

## Build for production

```sh
pnpm build        # vite build + tsc on the server
pnpm start        # node server-dist/index.js
```

## Docs site

```sh
cd docs && pnpm install && pnpm dev    # http://localhost:4321
```

Or from the repo root: `pnpm docs:dev` / `pnpm docs:build`.

## Releases

Pushes to `main` trigger Intuit Auto via `.github/workflows/release.yml`.
Auto reads PR labels (`major`, `minor`, `patch`, `skip-release`) to
bump the version, then triggers a Docker multi-arch build that pushes
to `stephanrandle/jabol` on Docker Hub.
