---
title: Admin overview
description: A tour of the /admin page.
---

`/admin` is gated behind sign-in. Once signed in, the page is split into
three sections:

1. **Branding** — organization name, collection title, favicon, theme.
2. **Links** — categories and links, import/export, refresh assets.
3. **Admins** — manage admin accounts.

Every mutation in the UI calls the JSON API (see [API reference](/jabol/api-reference/))
which writes back to `links.json` atomically (temp file + rename). The
server then broadcasts the change to all other open browsers via SSE —
they update in real time without a refresh.

## Read-only mode

If jabol detects that `links.json` isn't writable at boot (read-only mount,
permission denied), the admin UI shows a yellow banner and disables every
save / upload / delete action. Auth still works so admins can sign in and
view hidden links — they just can't edit.

The most common cause on hosted platforms is a UID mismatch between the
container's process user and the mounted volume's owner. The Docker image's
entrypoint chowns `/data` and `/config` at startup and seeds a starter
`links.json` if one doesn't exist, which covers the typical Coolify case.
See [Coolify](/jabol/deploy/coolify/) for the specifics.
