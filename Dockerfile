# syntax=docker/dockerfile:1

# 1. Prod-only deps (with toolchain so better-sqlite3 compiles)
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

# 2. Build SPA + server with full deps
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++ libc6-compat
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.server.json vite.config.ts index.html ./
COPY src ./src
COPY server ./server
COPY public ./public
RUN pnpm build

# 3. Slim runtime — no compiler, no pnpm install
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache libc6-compat \
  && mkdir -p /config /data/icons

ENV NODE_ENV=production \
    JABOL_CONFIG_PATH=/config/links.json \
    JABOL_DATA_DIR=/data \
    JABOL_SPA_DIST=/app/dist \
    PORT=8080

COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/server-dist /app/server-dist
COPY examples /app/examples

EXPOSE 8080
VOLUME ["/config", "/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider --quiet http://localhost:8080/api/info || exit 1

CMD ["node", "/app/server-dist/index.js"]
