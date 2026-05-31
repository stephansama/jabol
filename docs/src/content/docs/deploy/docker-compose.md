---
title: Docker Compose
description: The bundled compose file, line by line.
---

The repo ships with a [`docker-compose.yml`](https://github.com/stephansama/jabol/blob/main/docker-compose.yml)
that's ready for `docker compose up` (or for ingestion by Coolify and
similar Docker-Compose-aware platforms).

```yaml
services:
  jabol:
    image: stephanrandle/jabol:latest
    container_name: jabol
    restart: unless-stopped
    expose:
      - "8080"
    environment:
      JABOL_BASE_URL: ${JABOL_BASE_URL:-http://localhost:8080}
      JABOL_AUTH_SECRET: "${JABOL_AUTH_SECRET:?set JABOL_AUTH_SECRET to a long random string, generate with openssl rand -hex 32}"
    volumes:
      - jabol_data:/data
      - jabol_config:/config

volumes:
  jabol_data:
  jabol_config:
```

## Why `expose`, not `ports`

`expose: ["8080"]` declares the port inside the container without
publishing it on the host. That's the right shape for reverse-proxy
managed hosting (Coolify, Traefik, Caddy, nginx, etc.) — the proxy
routes traffic to the container on the internal Docker network, no host
port is bound, and the deploy doesn't conflict with anything else
listening on `:8080` on the host.

For a plain local run that needs a published port, either override with
a `docker-compose.override.yml` or use `docker run -p 8080:8080 …` per
the [Docker](/jabol/deploy/docker/) page.

## Env vars

- **`JABOL_AUTH_SECRET`** — required. The compose file errors out
  immediately if it's unset, telling you how to generate one.
- **`JABOL_BASE_URL`** — defaults to `http://localhost:8080`. Set this
  to your public URL in production or sign-in breaks (cookie origin
  mismatch).
- See [Environment](/jabol/getting-started/environment/) for the full
  list.

## Volumes

Two named volumes:

- `jabol_data` → `/data` — `auth.db` and cached icons.
- `jabol_config` → `/config` — `links.json`.

Both persist across container restarts and image upgrades. On first
boot, the entrypoint seeds a starter `links.json` into the empty config
volume so the app boots straight into a usable state.

## Local up/down

```sh
JABOL_AUTH_SECRET="$(openssl rand -hex 32)" docker compose up -d
docker compose logs -f
docker compose down       # stops; volumes survive
docker compose down -v    # also removes volumes — data is lost
```
