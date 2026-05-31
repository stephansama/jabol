import { resolve } from "node:path";

const isDev = process.env.NODE_ENV !== "production";
const defaultDataDir = isDev ? "./.data" : "/data";
const defaultConfigPath = isDev ? "./examples/categorized.json" : "/config/links.json";
const dataDirEnv = process.env.JABOL_DATA_DIR ?? defaultDataDir;

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
  authSecret:
    process.env.JABOL_AUTH_SECRET ??
    "dev-only-secret-please-set-JABOL_AUTH_SECRET-in-production",
  isDev,
} as const;
