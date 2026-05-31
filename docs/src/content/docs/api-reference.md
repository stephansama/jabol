---
title: API reference
description: Every JSON endpoint jabol exposes.
---

jabol's HTTP API is served by the Hono backend at `/api/*`. Mutating
endpoints require authentication via session cookie (better-auth).

## Public

| Method | Path             | Notes                                                                 |
| ------ | ---------------- | --------------------------------------------------------------------- |
| `GET`  | `/api/info`      | `{ readOnly, signupOpen, hasAdmin }` — boot status.                   |
| `GET`  | `/api/session`   | `{ session: { user } | null }` — current session.                     |
| `GET`  | `/api/events`    | Server-Sent Events. Fires `links:update` whenever the canonical changes. |
| `GET`  | `/api/links`     | Full canonical with hidden links filtered out.                        |
| `GET`  | `/api/icons/:filename` | Serves a cached favicon / OG image. `Cache-Control: max-age=86400`. |
| `POST` | `/api/signup`    | One-shot. 404s once an admin exists or env-var seeding is configured. |
| `ANY`  | `/api/auth/*`    | better-auth handlers (sign-in, sign-out, session refresh).            |

## Admin (requires sign-in)

| Method   | Path                              | Body / notes                                                       |
| -------- | --------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/links/admin`                | Full canonical including hidden links.                             |
| `POST`   | `/api/links/admin`                | `{ categoryId, link }` — add a link.                               |
| `PATCH`  | `/api/links/admin/:id`            | Partial link fields.                                               |
| `DELETE` | `/api/links/admin/:id`            | Remove a link.                                                     |
| `PUT`    | `/api/links/admin`                | Replace the entire canonical (used by DropZone import).            |
| `POST`   | `/api/links/admin/refresh-assets` | Re-scrape favicons + OG images for every link. Returns `{ count }`. |
| `POST`   | `/api/categories`                 | `{ name, icon? }` — add a category.                                |
| `PATCH`  | `/api/categories/:id`             | Partial fields.                                                    |
| `DELETE` | `/api/categories/:id`             | 400 if links remain.                                               |
| `GET`    | `/api/admins`                     | List admin users.                                                  |
| `POST`   | `/api/admins`                     | `{ email, password }` — create an admin.                           |
| `DELETE` | `/api/admins/:id`                 | Remove. 400 on the last admin.                                     |
| `PATCH`  | `/api/settings`                   | `{ brand?, title?, favicon? }` — pass `null` to clear a field.     |
| `POST`   | `/api/settings/favicon`           | Multipart `file` upload OR JSON `{ url }` to fetch + cache.        |

## curl examples

**Get app info:**

```sh
curl http://localhost:8080/api/info
```

**Get the public canonical:**

```sh
curl http://localhost:8080/api/links | jq
```

**Sign in via better-auth:**

```sh
curl -c cookies.txt -X POST http://localhost:8080/api/auth/sign-in/email \
  -H 'content-type: application/json' \
  -d '{"email": "admin@example.com", "password": "…"}'
```

**Add a link (using saved cookie):**

```sh
curl -b cookies.txt -X POST http://localhost:8080/api/links/admin \
  -H 'content-type: application/json' \
  -d '{
    "categoryId": "<uuid>",
    "link": { "name": "GitHub", "url": "https://github.com", "tags": ["dev"] }
  }'
```

**Trigger an asset refresh:**

```sh
curl -b cookies.txt -X POST http://localhost:8080/api/links/admin/refresh-assets
# → { "count": 27 }
```

**Subscribe to live updates (SSE):**

```sh
curl -N http://localhost:8080/api/events
# event: links:update
# data: 1717200000000
# …
```
