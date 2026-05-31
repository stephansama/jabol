---
title: Environment variables
description: Every JABOL_* variable jabol reads at boot.
---

jabol's server reads these on startup. Most have sensible defaults; the only
one you must set in production is `JABOL_AUTH_SECRET`.

| Var                    | Default                 | Purpose                                             |
| ---------------------- | ----------------------- | --------------------------------------------------- |
| `PORT`                 | `8080`                  | Listen port.                                        |
| `JABOL_BASE_URL`       | `http://localhost:8080` | Used by better-auth for cookie + trusted origins.   |
| `JABOL_CONFIG_PATH`    | `/config/links.json`    | Path to the links JSON file.                        |
| `JABOL_DATA_DIR`       | `/data`                 | Writable dir for `auth.db` and `icons/`.            |
| `JABOL_AUTH_SECRET`    | dev-only fallback       | **Set this in production.** Used to sign sessions. |
| `JABOL_ADMIN_EMAIL`    | —                       | If set with password, seeds an admin on first boot. |
| `JABOL_ADMIN_PASSWORD` | —                       | Paired with `JABOL_ADMIN_EMAIL`. Min 8 chars.       |

## `JABOL_BASE_URL` and authentication

`JABOL_BASE_URL` is used by better-auth to validate the `Origin` header on
sign-in requests. If you're deploying behind a reverse proxy on a public
domain, set this to your public URL (e.g. `https://links.example.com`).
Leaving it at the localhost default in production breaks sign-in because the
cookie origin doesn't match.

## `JABOL_AUTH_SECRET`

Generate a strong value with `openssl rand -hex 32`. Keep it stable across
deploys — if you change it, all existing sessions are invalidated and every
admin has to sign in again.

## Read-only mode

If `links.json` is mounted read-only (or its parent directory isn't writable
by the runtime user), jabol detects this at boot and disables all mutating
admin routes. The admin UI shows a banner and clicking actions like "Save"
returns `403`. Auth still works, so admins can sign in to see hidden links.
