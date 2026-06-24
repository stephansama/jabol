---
title: Branding
description: Organization name, collection title, favicon, theme.
---

The **Branding** section at the top of `/admin` sets the visual identity
of your instance. Everything here lives at the top level of `links.json`
(see [Top-level fields](/jabol/configuration/top-level-fields/)).

## Organization name + collection title

Two text fields side-by-side. Save writes both to `links.json` and updates
the top bar (`Acme Co / Internal links`) and the browser tab title
immediately. Clear either field to remove it from the persisted JSON.

## Favicon

Three ways to set it:

1. **Upload an image file** — pick a file from disk. Max 512 KB; allowed types:
   SVG, PNG, JPG, WebP, ICO, GIF. The server stores it under
   `JABOL_DATA_DIR/icons/` with a content-hash filename and persists the
   `/api/icons/...` path to `links.json`.
2. **Paste a URL** — the server fetches and caches it the same way (so a
   third-party host going down doesn't break your favicon later).
3. **Reset** — drops the field from `links.json` and falls back to jabol's
   default capybara logo.

The favicon updates both the browser tab icon and the top-bar logo on
every open browser (via SSE) the moment you save.

## Theme

Pick a default theme for first-time visitors. Once a visitor has loaded the
site, their personal preference is stored in `localStorage` and overrides
the file-level setting — they can switch themes from the top bar without
affecting anyone else.

Two themes ship — both Catppuccin: `light` (Latte) and `dark` (Mocha). A
`system` option follows the visitor's `prefers-color-scheme`.

## Accent color

A color picker below the theme section overrides `--accent` — the color used
for buttons, focus rings, and link hovers — across both themes. The override
is written to `links.json` as a six-digit hex (e.g. `"accent": "#f38ba8"`) and
applied at runtime to every connected browser. Click **Reset to default** to
remove the override and fall back to Catppuccin red.
