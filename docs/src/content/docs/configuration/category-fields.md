---
title: Category fields
description: What each entry in the categories array of links.json accepts.
---

Each entry in the top-level `categories` array (categorized shape only) accepts:

| Field    | Type      | Notes                                                                                                                            |
| -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `name`   | `string`  | Required. Shown as the section header on the home page.                                                                          |
| `icon`   | `string`  | Optional Iconify id (e.g. `mdi:briefcase`) or absolute URL, rendered beside the name.                                            |
| `hidden` | `boolean` | If `true`, the whole category — header and every link inside it — is gated behind admin auth. Mirrors per-link `hidden`.         |
| `id`     | `string`  | UUID stamped by jabol on first read. Don't set by hand.                                                                          |
| `links`  | `array`   | The category's links. See [Link fields](/jabol/configuration/link-fields/).                                                      |

The flat shape's synthetic categories (built from each link's first tag when
`groupByTag: true`) are derived at load time and don't carry any of these
fields — gate links in flat mode with per-link `hidden` instead.

## `hidden`

A hidden category is omitted entirely from the public `/api/links` response —
its name doesn't appear in the body, the category jump menu, or the search
results, and none of its links leak either (regardless of their per-link
`hidden` state). An admin signed in sees the category render with a
`🔒 hidden` badge next to its name and can toggle it from the admin UI.

Useful for keeping a "Work" or "Internal tools" catalog out of public view
without having to mark every link inside hidden one-by-one.
