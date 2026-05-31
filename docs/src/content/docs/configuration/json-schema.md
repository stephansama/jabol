---
title: JSON Schema
description: Editor autocomplete, validation, and hover docs for links.json.
---

jabol ships a JSON Schema generated from the same Zod definitions the server
uses to validate `links.json` at boot. Point your editor at it and you get
autocomplete, schema validation, and field-level hover docs while you edit.

## The `$schema` pointer

Add `"$schema"` as the first key in your `links.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/stephansama/jabol/refs/heads/main/schema/links.schema.json",
  "title": "Homelab",
  "categories": [
    /* … */
  ]
}
```

VS Code, JetBrains IDEs, Neovim (with `vscode-json-languageservice` /
`coc-json` / `nvim-cmp`), and any other JSON-Schema-aware tool will fetch
the schema and offer:

- Autocomplete for top-level keys, category keys, and link keys.
- Inline validation — invalid values are underlined immediately.
- Hover tooltips on each field with the descriptions from
  [Top-level fields](/jabol/configuration/top-level-fields/) and
  [Link fields](/jabol/configuration/link-fields/).

## Where the schema lives

The canonical schema file is at
[`schema/links.schema.json`](https://github.com/stephansama/jabol/blob/main/schema/links.schema.json)
in the repo. The raw URL above is what you embed in `$schema`.

## How it's generated

The schema is derived from `server/enrich/schema.ts` (the Zod source) via
`pnpm schema:generate`. CI's `schema:check` job fails any PR where the
committed schema drifts from the Zod source, so the file you point at is
always in sync with the validation the server does at boot.

## Project-wide editor config (VS Code)

If your `links.json` is named something else, or you want autocomplete
without editing the file itself, point at the schema from `.vscode/settings.json`:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["links.json", "my-links.json"],
      "url": "https://raw.githubusercontent.com/stephansama/jabol/refs/heads/main/schema/links.schema.json"
    }
  ]
}
```
