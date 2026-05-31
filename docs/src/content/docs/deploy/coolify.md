---
title: Coolify
description: Deploy jabol on a Coolify-managed host.
---

[Coolify](https://coolify.io) deploys the bundled `docker-compose.yml`
in a couple of clicks. The image's entrypoint handles the two gotchas
that bite most self-hostable Node apps on Coolify (UID mismatch and
empty config volume), so the path of least resistance Just Works.

## Setup

1. **Coolify → New Resource → Docker Compose** → point it at this repo
   (or paste the [`docker-compose.yml`](https://github.com/stephansama/jabol/blob/main/docker-compose.yml)
   directly).
2. In **Environment Variables**, set:
   - `JABOL_AUTH_SECRET` — required, long random string.
     `openssl rand -hex 32` to generate.
   - `JABOL_BASE_URL` — `https://your-domain.example.com` (the public
     URL Coolify routes through its proxy).
   - _(optional)_ `JABOL_ADMIN_EMAIL` + `JABOL_ADMIN_PASSWORD` — seed
     the first admin so you can skip `/signup`.
3. **Domains** → assign a hostname. Coolify provisions an HTTPS cert via
   Let's Encrypt and routes traffic through Traefik to the container's
   internal port 8080.
4. **Deploy**. Coolify pulls `stephanrandle/jabol:latest` and starts
   the container.
5. **First visit** — `/signup` if you didn't seed an admin, or sign in
   with the seeded admin. Edit from `/admin`.

## What survives a redeploy

| Path                                | Volume         | Lost on redeploy? |
| ----------------------------------- | -------------- | ----------------- |
| `/data/auth.db` (admins + sessions) | `jabol_data`   | No                |
| `/data/icons/` (cached assets)      | `jabol_data`   | No                |
| `/config/links.json`                | `jabol_config` | No                |

Both volumes persist across redeploys. Click **Redeploy** when a new
version of `stephanrandle/jabol:latest` ships and your data is
untouched.

## Why the entrypoint matters here

Coolify-managed volumes are commonly owned by `root:root` (created by
the Docker daemon at provisioning time), but the jabol container runs
as a non-root `jabol` user inside. Without the entrypoint, the app
would hit `EACCES` writing to `/data` / `/config` and flip into
read-only mode — every admin save would 403.

The image's entrypoint runs as root just long enough to `chown -R
jabol:jabol /data /config /config/links.json`, then drops to the
`jabol` user via `su-exec`. So mount ownership normalizes itself on
every boot. No manual UID work needed on your end.

If for any reason you still see the read-only banner, the boot log now
prints a line like:

```
[store] read-only detection: cannot write /config/links.json (errno=EACCES, process uid=100)
```

`errno=EACCES` means permission denied (chown didn't help → host-side
permissions are weirder than expected). `errno=EROFS` means a
genuinely read-only mount.

## Auto-redeploy

In Coolify, enable the Docker Hub webhook on the resource. When a new
`stephanrandle/jabol:latest` tag is pushed (e.g. via the GitHub Action's
release job), Coolify redeploys automatically.
