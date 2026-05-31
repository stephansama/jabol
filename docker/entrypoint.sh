#!/bin/sh
# Container entrypoint: run as root just long enough to fix ownership of the
# volume mounts, then drop to the unprivileged `jabol` user before exec'ing
# the application. Avoids the read-only-banner that fires when the process
# UID doesn't match the volume's owner UID (a common Coolify/k8s footgun).

set -e

for p in /data /config; do
  if [ -d "$p" ]; then
    chown -R jabol:jabol "$p" 2>/dev/null || true
  fi
done

# Seed a minimal valid links.json on first boot so the app's writability
# probe (access(path, W_OK)) succeeds. Without this, a freshly created
# named volume contains no file and the app flips to read-only.
if [ -d /config ] && [ ! -e /config/links.json ]; then
  cat > /config/links.json <<'JSON'
{
  "categories": [
    { "name": "Welcome", "links": [] }
  ]
}
JSON
fi

# Coolify Persistent Storage may bind-mount /config/links.json as a single
# file; chowning the parent dir doesn't reach it, so handle it explicitly.
if [ -f /config/links.json ]; then
  chown jabol:jabol /config/links.json 2>/dev/null || true
fi

exec su-exec jabol:jabol "$@"
