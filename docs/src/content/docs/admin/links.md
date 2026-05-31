---
title: Manage links
description: Add, edit, import, export, and refresh links from the admin UI.
---

The **Links** section on `/admin` is where you spend most of your time.
Each category is collapsible; inside each category, links are listed with
inline edit / delete / hide controls.

## Add a category

Use the "New category" form above the first category. Name is required;
optional iconify icon (e.g. `mdi:briefcase`) renders next to the category
heading on the home page. Categories are persisted in the order you add
them.

## Add a link

Click **+ Add link** inside any category. The form takes:

- **Name** (required)
- **URL** (required, http/https)
- **Iconify id** (optional) — leave blank to auto-scrape the favicon
- **Tags** (comma-separated)
- **Description**
- **Hidden** — admin-only visibility
- **Open in same tab** — by default links open in a new tab

On save, the server auto-scrapes the page's favicon and OG image if you
didn't provide them, caches both, and writes the resulting `/api/icons/...`
paths into the canonical.

## Edit / hide / delete

Each link row has inline **Edit**, **Hide** / **Show**, and **Delete**
buttons. Edit pops the same form prefilled. Hide toggles the `hidden`
field. Delete removes the link (no undo — re-add if you change your mind).

## Tag filter

Tags on the home page double as filter pills. Click a tag chip on any card
to filter to that tag; the active tag appears in the sticky filter row
with an ✕ to clear. Filtering is purely client-side and composes with
the search input.

## Import (`DropZone`)

The header of the Links section accepts a drag-and-drop of a full
`links.json`. The dropped file is validated against the same schema the
server uses at boot, then replaces the canonical via `PUT /api/links/admin`.
UUIDs are preserved where IDs match the existing canonical, so admin edits
that referred to specific link IDs still resolve.

## Export

The **Export links.json** button next to the Refresh-assets button
downloads a date-stamped snapshot (`links-YYYY-MM-DD.json`) of the current
canonical. The `readOnly` UI flag is stripped, and the trailing newline
matches the server's atomic-write format so re-importing produces a
byte-identical file.

## Refresh assets

Click **Refresh assets** to re-scrape every link's favicon and OG image.
This is the manual escape hatch for:

- A site updated its favicon and the cached copy is stale.
- A site's `og:image` changed.
- You're recovering from a previous bug that cached the wrong thing.

User-provided iconify ids (`mdi:github`) and absolute URLs in `icon` /
`image` are **preserved** — refresh only re-scrapes auto-fetched
(`/api/icons/...`) paths. Iconify ids and absolute URLs were explicit
admin choices, so they're never clobbered.

The button shows a spinner while in flight (one HTTP fetch per unique
URL, capped at concurrency 8). When it finishes, the status line under
the button reports how many links were refreshed.
