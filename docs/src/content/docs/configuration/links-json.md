---
title: links.json
description: Two equivalent shapes — categorized or flat — for the canonical config file.
---

`links.json` is the canonical data file. jabol accepts two equivalent shapes
at the edge — they're both normalized into the same internal structure on
load.

## Categorized

Group links under named categories. The category order in the file is the
order on the page.

```json
{
  "title": "Homelab",
  "theme": "dark",
  "categories": [
    {
      "name": "Dev",
      "icon": "mdi:code-tags",
      "links": [
        { "name": "GitHub", "url": "https://github.com", "icon": "mdi:github" },
        {
          "name": "MDN",
          "url": "https://developer.mozilla.org",
          "tags": ["docs"]
        }
      ]
    }
  ]
}
```

See [`examples/categorized.json`](https://github.com/stephansama/jabol/blob/main/examples/categorized.json)
for a fuller starter.

## Flat (with optional tag grouping)

If your links are a flat bag, use this shape. Set `groupByTag: true` to have
jabol bucket links into synthetic categories using each link's first tag.

```json
{
  "title": "Bookmarks",
  "theme": "light",
  "groupByTag": true,
  "links": [
    { "name": "GitHub", "url": "https://github.com", "tags": ["dev"] },
    {
      "name": "Hacker News",
      "url": "https://news.ycombinator.com",
      "tags": ["news"]
    }
  ]
}
```

See [`examples/flat.json`](https://github.com/stephansama/jabol/blob/main/examples/flat.json).

## Field reference

- [Top-level fields](/jabol/configuration/top-level-fields/) — `brand`, `title`,
  `description`, `favicon`, `image`, `theme`, and shape-specific keys.
- [Category fields](/jabol/configuration/category-fields/) — `name`, `icon`,
  `hidden`, and the per-category `links` array.
- [Link fields](/jabol/configuration/link-fields/) — what each link object
  accepts.

## IDs and the file lifecycle

jabol stamps a UUID on each category and link the first time it reads the
file, so admin edits are addressable. Those IDs round-trip through the JSON
on every persist — don't strip them when editing by hand.

External edits to `links.json` (e.g. you `vim` the file) are picked up by a
file watcher and pushed to connected browsers via SSE — no reload needed.
