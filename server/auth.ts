import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { env } from "./config.js";

mkdirSync(dirname(env.authDbPath), { recursive: true });

const db = new Database(env.authDbPath);
db.pragma("journal_mode = WAL");

const trustedOrigins = env.isDev
  ? [env.baseUrl, "http://localhost:5173", "http://127.0.0.1:5173"]
  : [env.baseUrl];

export const authOptions: BetterAuthOptions = {
  database: db,
  secret: env.authSecret,
  baseURL: env.baseUrl,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    cookies: {
      sessionToken: { attributes: { sameSite: "lax" } },
    },
  },
};

export const auth = betterAuth(authOptions);

export type AuthInstance = typeof auth;

export function countUsers(): number {
  try {
    const row = db.prepare("SELECT COUNT(*) AS n FROM user").get() as { n: number } | undefined;
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}

export function listAdminUsers(): Array<{ id: string; email: string; name: string | null; createdAt: string }> {
  try {
    return db
      .prepare("SELECT id, email, name, createdAt FROM user ORDER BY createdAt ASC")
      .all() as Array<{ id: string; email: string; name: string | null; createdAt: string }>;
  } catch {
    return [];
  }
}

export function deleteUserById(id: string): boolean {
  try {
    db.prepare("DELETE FROM session WHERE userId = ?").run(id);
    db.prepare("DELETE FROM account WHERE userId = ?").run(id);
    const res = db.prepare("DELETE FROM user WHERE id = ?").run(id);
    return res.changes > 0;
  } catch (err) {
    console.error("[auth] deleteUserById failed:", err);
    return false;
  }
}
