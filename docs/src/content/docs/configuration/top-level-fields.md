---
title: Top-level fields
description: The keys you can set at the root of links.json.
---

These keys live at the root of `links.json`, alongside `categories` or `links`.

| Field         | Type     | Notes                                                                                             |
| ------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `$schema`     | `string` | Optional. URL of the JSON Schema for editor autocomplete. See [JSON Schema](/jabol/configuration/json-schema/). |
| `brand`       | `string` | Organization name. Shown in the top bar, used as the browser tab title. Editable from `/admin`.   |
| `title`       | `string` | Collection title shown as a sub-label next to the brand. Editable from `/admin`.                  |
| `description` | `string` | Page description / meta.                                                                          |
| `favicon`     | `string` | URL or `/api/icons/...` path for the favicon. Set via the Branding panel in `/admin`.             |
| `image`       | `string` | OG image used when the page is shared on social platforms. Absolute URL or `/api/icons/...` path; recommended 1200×630. |
| `theme`       | `string` | First-time-visitor theme: `light` / `dark` / `mocha` / `latte` (Catppuccin variants).             |
| `groupByTag`  | `boolean` | Flat shape only. If `true`, links bucket into synthetic categories by their first tag.           |

## `brand` vs `title`

`brand` is your wordmark (the thing on the left of the top bar — "Acme Co").
`title` is the sub-label (the collection name — "Internal links"). They render
together as `Acme Co / Internal links`. Either is optional; both are editable
from the admin Branding panel.

## `favicon`

Accepts either an absolute URL or a `/api/icons/<hash>...` path. The admin
panel lets you upload a file (cached locally) or paste an external URL (which
jabol downloads and caches). Both produce the same `/api/icons/...` form in
the persisted JSON.

## `image`

Used at the head-tag layer only — jabol emits it as `og:image` and
`twitter:image` so social platforms can render a large card when someone
shares your URL. Kept separate from `favicon` because favicons are small icons
(16–32px) and OG cards are large banners (1200×630 is the recommended size);
reusing one for the other looks bad in previews.

If `image` is unset, jabol simply omits the `og:image` / `twitter:image` tags
rather than falling back to the favicon — Slack/Twitter/Discord will render a
plain text card instead of a broken icon-as-banner.

## `theme`

Picks the default colour scheme for new visitors. Once a visitor has loaded
the site once, their preference is stored in `localStorage` and overrides the
file-level setting. The four themes are `light`, `dark`, `mocha` (Catppuccin
Mocha), and `latte` (Catppuccin Latte).
