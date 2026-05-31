---
title: Quickstart
description: First boot — create an admin and populate your links.
---

After [installing](/jabol/getting-started/install/) and starting the container,
open <http://localhost:8080>.

## 1. Create the first admin

The first time jabol boots with no admin account, the **/signup** route is
open. Visit `/signup`, set an email + password, submit. As soon as one admin
exists, `/signup` returns 404 — jabol is single-tenant by design.

You can skip the signup page entirely by setting both `JABOL_ADMIN_EMAIL` and
`JABOL_ADMIN_PASSWORD` env vars on first boot. The admin is seeded
automatically and you go straight to `/login`.

## 2. Sign in

`/login` accepts the credentials you just created. Sessions persist for 30
days by default (cookie-based, via better-auth).

## 3. Populate your links

You have three options:

**Edit from the admin UI.** Go to `/admin`, click "Add link" inside a category
(there's a starter "Welcome" category on first boot). The form takes a name,
URL, optional iconify icon, tags, etc. Favicons and OG images auto-scrape from
the URL.

**Drag-drop a `links.json`.** The admin page has a DropZone at the top of the
Links section. Drop a full `links.json` to replace the canonical in one go.

**Edit the JSON file directly.** If you mounted `links.json` from the host,
edit it in your favorite editor and save. jabol's file watcher picks up the
change and pushes it to every connected browser via SSE — no reload needed.

## 4. Visit the home page

Go back to `/`. Your links render as cards. Search with `/`, navigate with
arrow keys, hit `Enter` to open. See [Admin overview](/jabol/admin/overview/)
for everything you can configure from the UI.
