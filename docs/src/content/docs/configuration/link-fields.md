---
title: Link fields
description: What each link object in links.json accepts.
---

Each entry in a category's `links` array (or in the flat top-level `links`
array) accepts:

| Field           | Type       | Notes                                                                                                               |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `name`          | `string`   | Required. Display name.                                                                                            |
| `url`           | `string`   | Required, http(s).                                                                                                 |
| `description`   | `string`   | Optional, shown under the name.                                                                                    |
| `icon`          | `string`   | Optional. Iconify id (e.g. `mdi:github`) or absolute URL. If absent, jabol scrapes the page favicon and caches it. |
| `image`         | `string`   | Optional OG image override. If absent, jabol scrapes `og:image`. Used as the card hero in comfortable density.    |
| `tags`          | `string[]` | Optional. Searched, shown as pills, and clickable to filter the view.                                              |
| `hidden`        | `boolean`  | If `true`, only authenticated admins see the link.                                                                 |
| `openInSameTab` | `boolean`  | If `true`, the link opens in the current tab. Default opens in a new tab.                                          |
| `id`            | `string`   | UUID stamped by jabol on first read. Don't set by hand.                                                            |

## `icon` — three forms

- **Iconify id** (`mdi:github`, `simple-icons:vercel`, etc.) — looked up
  client-side via [@iconify/react](https://iconify.design/). No network
  request from the server. Best when you want a consistent monochrome look.
- **Absolute URL** (`https://example.com/icon.png`) — the server downloads
  and caches the image, then serves it from `/api/icons/<hash>`.
- **Omitted** — the enrichment pipeline scrapes `<link rel="icon">`,
  `<link rel="apple-touch-icon">`, `<link rel="shortcut icon">` from the
  target page, falls back to the well-known `/favicon.ico`, then to Google's
  S2 favicon service. The first successful candidate is cached.

## `image` — OG hero

Cards in comfortable density show a 16:9 hero image. If `image` is set, that
URL is used. Otherwise the enrichment pipeline grabs `<meta property="og:image">`
and caches it. If neither produces an image, the card falls back to a
textured cover tinted to the category's hue with the link's initial centered.

## `tags`

Tags are fuzzy-searched along with `name` and `description`. The home page
shows them as small pills under each card name; clicking a pill filters the
view to that tag. Tags also drive the synthetic category grouping in flat
mode (`groupByTag: true`).

## `hidden`

A hidden link is omitted from the public `/api/links` response entirely. When
an admin is signed in, they still see it in `/api/links/admin` and on the
home page (marked with a `🔒 hidden` badge). Useful for private bookmarks
you don't want to expose if someone shares your jabol URL.

## `openInSameTab`

Default is `false` (open in a new tab via `target="_blank"`). Set to `true`
for links you want to navigate the current tab — handy for "go to dashboard"
entries that are meant to replace the directory page.
