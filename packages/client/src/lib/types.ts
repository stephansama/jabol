// Canonical data shapes are owned by @jabol/core (single source of truth).
// The SPA imports them as types only — nothing from the node-capable barrel is
// pulled into the browser bundle.
export type { Theme, ThemePreference, Link, Category, Canonical } from "@jabol/core/types";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  role: "admin";
};

export type AppInfo = {
  readOnly: boolean;
  signupOpen: boolean;
  hasAdmin: boolean;
};
