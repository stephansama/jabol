import { resolve } from "node:path";

const isDev = process.env.NODE_ENV !== "production";
const defaultDataDir = isDev ? "./.data" : "/data";
const defaultConfigPath = isDev ? "./examples/categorized.json" : "/config/links.json";
const dataDirEnv = process.env.JABOL_DATA_DIR ?? defaultDataDir;

const DEV_AUTH_SECRET_FALLBACK = "dev-only-secret-please-set-JABOL_AUTH_SECRET-in-production";
const MIN_PROD_SECRET_LENGTH = 32;

function resolveAuthSecret(): string {
  const provided = process.env.JABOL_AUTH_SECRET;
  if (isDev) return provided ?? DEV_AUTH_SECRET_FALLBACK;
  if (!provided) {
    console.error(
      "[server] FATAL: JABOL_AUTH_SECRET is required in production. " +
        "Generate one with `openssl rand -base64 48` and set the env var before starting.",
    );
    process.exit(1);
  }
  if (provided.length < MIN_PROD_SECRET_LENGTH) {
    console.error(
      `[server] FATAL: JABOL_AUTH_SECRET must be at least ${MIN_PROD_SECRET_LENGTH} characters in production ` +
        `(got ${provided.length}). Regenerate with \`openssl rand -base64 48\`.`,
    );
    process.exit(1);
  }
  return provided;
}

export const env = {
  port: Number(process.env.PORT ?? 8080),
  baseUrl: process.env.JABOL_BASE_URL ?? "http://localhost:8080",
  configPath: resolve(process.env.JABOL_CONFIG_PATH ?? defaultConfigPath),
  dataDir: resolve(dataDirEnv),
  iconsDir: resolve(dataDirEnv, "icons"),
  authDbPath: resolve(dataDirEnv, "auth.db"),
  spaDist: resolve(process.env.JABOL_SPA_DIST ?? "dist"),
  adminEmail: process.env.JABOL_ADMIN_EMAIL,
  adminPassword: process.env.JABOL_ADMIN_PASSWORD,
  authSecret: resolveAuthSecret(),
  isDev,
} as const;
