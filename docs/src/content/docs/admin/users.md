---
title: Admin users
description: Add and remove admin accounts.
---

The **Admins** section at the bottom of `/admin` lists every admin account
and lets you create new ones or remove existing ones.

## Add an admin

Email + password (min 8 chars). On save, better-auth provisions the user
in `auth.db`. They can sign in at `/login` immediately.

There's no role hierarchy in jabol today — every admin is fully
privileged. "Admin" is currently synonymous with "any signed-in user".

## Remove an admin

Each admin row has a Remove button. You can't remove the last admin
account (the server enforces this with a `400 cannot remove the only
admin` response) — otherwise you'd lock yourself out.

## First admin

On a fresh install with no admins, `/signup` is open. The first POST to
`/api/signup` creates an admin and closes the endpoint. Alternatively,
set `JABOL_ADMIN_EMAIL` + `JABOL_ADMIN_PASSWORD` env vars to seed the
first admin automatically on boot — `/signup` returns 404 in that case
even on first boot, because the seeded admin already exists by the time
anyone visits.

## Sessions

Sessions are cookie-based via better-auth, signed with `JABOL_AUTH_SECRET`.
Default expiry is 30 days with a 1-day refresh window. If you rotate
`JABOL_AUTH_SECRET`, all existing sessions are invalidated and everyone
has to sign in again — that's the disaster-recovery lever if you suspect
a session token leaked.
