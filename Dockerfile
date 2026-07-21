# syntax=docker/dockerfile:1

# 1. Build everything with full workspace deps, then produce a pruned,
#    self-contained server bundle via `pnpm deploy`.
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat
RUN corepack enable

# Copy the workspace manifests first for better layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/client/package.json ./packages/client/
COPY packages/server/package.json ./packages/server/
COPY docs/package.json ./docs/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter '!jabol-docs...'

# Copy sources needed to build core, client, and server.
COPY tsconfig.base.json ./
COPY packages/core ./packages/core
COPY packages/client ./packages/client
COPY packages/server ./packages/server
COPY assets ./assets

# build core -> client (SPA dist) -> server (tsc), then prune into /app/deploy.
RUN pnpm --filter @jabol/core build \
 && pnpm --filter @jabol/client build \
 && pnpm --filter @jabol/server build \
 && pnpm --filter @jabol/server --prod deploy /app/deploy

# 2. Slim runtime — no compiler, no pnpm install.
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache libc6-compat su-exec \
  && addgroup -S jabol \
  && adduser -S -G jabol -h /app -s /bin/sh jabol \
  && mkdir -p /config /data/icons \
  && chown -R jabol:jabol /app /config /data

ENV NODE_ENV=production \
    JABOL_CONFIG_PATH=/config/links.json \
    JABOL_DATA_DIR=/data \
    JABOL_SPA_DIST=/app/client-dist \
    PORT=8080

# The pruned server bundle (its own dist + node_modules incl. built @jabol/core
# and better-sqlite3) lands at /app; the SPA dist is served from /app/client-dist.
COPY --from=build --chown=jabol:jabol /app/deploy /app
COPY --from=build --chown=jabol:jabol /app/packages/client/dist /app/client-dist
COPY --chown=jabol:jabol examples /app/examples
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080
VOLUME ["/config", "/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider --quiet http://localhost:8080/api/info || exit 1

# Entrypoint runs as root, fixes mount ownership, then drops to the jabol user.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "/app/dist/index.js"]
