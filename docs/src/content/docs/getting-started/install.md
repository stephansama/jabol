---
title: Install
description: Run jabol with Docker, Docker Compose, or Node directly.
---

The fastest way to run jabol is the published Docker image
[`stephanrandle/jabol`](https://hub.docker.com/r/stephanrandle/jabol).

## Docker (single command)

```sh
docker run -d \
  -p 8080:8080 \
  -v "$PWD/links.json:/config/links.json" \
  -v "$PWD/data:/data" \
  -e JABOL_AUTH_SECRET="$(openssl rand -hex 32)" \
  stephanrandle/jabol:latest
```

- `-v "$PWD/links.json:/config/links.json"` — bind-mounts your config file. If
  the file doesn't exist on the host yet, jabol's entrypoint seeds a starter
  `links.json` for you on first boot.
- `-v "$PWD/data:/data"` — persistent storage for `auth.db` (admin accounts +
  sessions) and the cached favicon / OG-image directory.
- `JABOL_AUTH_SECRET` — required in production. Used by better-auth to sign
  session cookies.

See [Environment](/jabol/getting-started/environment/) for every supported variable.

## Docker Compose

A ready-to-use compose file ships in the repo. See [Docker Compose](/jabol/deploy/docker-compose/)
for a walkthrough.

## Coolify

Coolify deploys the compose file in a few clicks. See [Coolify](/jabol/deploy/coolify/)
for the specifics, including the gotcha around UID ownership on Coolify-managed
volumes.

## From source (development)

```sh
git clone https://github.com/stephansama/jabol
cd jabol
pnpm install
JABOL_CONFIG_PATH=./examples/categorized.json \
  JABOL_DATA_DIR=./.data \
  JABOL_AUTH_SECRET=dev \
  pnpm dev
```

The Hono server runs on `:8080`, the Vite SPA on `:5173` with `/api/*`
proxied. See [Development](/jabol/development/) for more.
