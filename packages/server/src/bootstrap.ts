import { getMigrations } from "better-auth/db/migration";
import { auth, authOptions, countUsers } from "./auth.js";
import { env } from "./config.js";

export async function ensureAuthSchema(): Promise<void> {
  const { runMigrations } = await getMigrations(authOptions);
  await runMigrations();
}

type BootstrapState = {
  signupOpen: boolean;
  hasAdmin: boolean;
};

const state: BootstrapState = {
  signupOpen: false,
  hasAdmin: false,
};

export function getBootstrapState(): BootstrapState {
  return { ...state };
}

export function refreshBootstrapState(): void {
  const n = countUsers();
  state.hasAdmin = n > 0;
  state.signupOpen = !state.hasAdmin && !env.adminEmail;
}

export const DEV_ADMIN_EMAIL = "dev@local.dev";
export const DEV_ADMIN_PASSWORD = "devpassword";

export async function maybeSeedAdmin(): Promise<void> {
  refreshBootstrapState();
  if (state.hasAdmin) return;

  if (env.adminEmail && env.adminPassword) {
    try {
      await auth.api.signUpEmail({
        body: {
          email: env.adminEmail,
          password: env.adminPassword,
          name: "Admin",
        },
      });
      console.log(`[bootstrap] seeded admin user ${env.adminEmail}`);
    } catch (err) {
      console.error("[bootstrap] failed to seed admin from env vars:", err);
    }
    refreshBootstrapState();
    return;
  }

  if (env.isDev) {
    try {
      await auth.api.signUpEmail({
        body: { email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD, name: "Dev" },
      });
      console.log(`[bootstrap] seeded dev admin ${DEV_ADMIN_EMAIL} (NODE_ENV !== production)`);
      refreshBootstrapState();
    } catch (err) {
      console.error("[bootstrap] failed to seed dev admin:", err);
    }
    return;
  }

  console.warn(
    "[bootstrap] no admin user exists and no JABOL_ADMIN_EMAIL/PASSWORD set. " +
      "First signup at /signup will create the admin account.",
  );
}

export async function consumeFirstSignup(email: string, password: string, name?: string): Promise<void> {
  if (!state.signupOpen) {
    throw new Error("signup is closed");
  }
  await auth.api.signUpEmail({
    body: { email, password, name: name ?? "Admin" },
  });
  refreshBootstrapState();
}
