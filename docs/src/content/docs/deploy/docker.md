---
title: Docker
description: Run jabol in a single container.
---

```sh
docker run -d \
  --name jabol \
  -p 8080:8080 \
  -v "$PWD/links.json:/config/links.json" \
  -v "$PWD/data:/data" \
  -e JABOL_AUTH_SECRET="$(openssl rand -hex 32)" \
  --restart unless-stopped \
  stephanrandle/jabol:latest
```

The image is multi-arch (`linux/amd64`, `linux/arm64`) and based on
`node:20-alpine`. It runs as a non-root `jabol` user; the entrypoint
chowns the mount points at startup so write permissions Just Work
regardless of the host's volume ownership.

## What the volumes hold

| Path                 | Contents                                              | Lose it and…                                              |
| -------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `/config/links.json` | The canonical links/categories/branding file          | List resets to the seeded "Welcome" category              |
| `/data/auth.db`      | better-sqlite3 file with admin accounts + sessions    | Admin accounts vanish, everyone has to sign up / be seeded again |
| `/data/icons/`       | Cached favicons and OG images                         | Cards re-fetch icons on next render (small latency blip)  |

The image's entrypoint seeds a minimal valid `links.json` on first boot
if `/config/links.json` doesn't exist, so a fresh volume "just works"
without any pre-population step.

## Environment variables

See [Environment](/jabol/getting-started/environment/). The only required
variable in production is `JABOL_AUTH_SECRET`. Set `JABOL_BASE_URL` to your
public URL if you're behind a reverse proxy — better-auth uses it for
cookie origin and trusted-origins validation.

## Healthcheck

The image declares a `HEALTHCHECK` that hits `/api/info` every 30s. Most
container platforms surface this in their status UI.

## Updating

```sh
docker pull stephanrandle/jabol:latest
docker stop jabol && docker rm jabol
docker run -d … stephanrandle/jabol:latest    # same command as before
```

Volumes survive container replacement, so your admins and links stay put.

## Tags

- `latest` — most recent release
- `<major>.<minor>.<patch>` — pinned releases via semver
- `<major>.<minor>` — pinned to a minor line
- `<major>` — pinned to a major line
