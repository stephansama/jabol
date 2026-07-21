import type { LinksResponse } from "./api";

// The server/SSG injects the initial canonical as a JSON <script> in <head>.
// The SSG build additionally sets `static: true`, which flips the SPA into a
// presentational-only mode: no /api/* fetches, no SSE, no auth — it just
// renders what was embedded at build time.
const BOOTSTRAP_ID = "jabol-initial";

export type Bootstrap = LinksResponse & { static?: boolean };

export function readBootstrap(): Bootstrap | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(BOOTSTRAP_ID);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as Bootstrap;
  } catch {
    return null;
  }
}

// Evaluated once at module load — the bootstrap script is in <head>, so it is
// present before any hook runs.
export const IS_STATIC = readBootstrap()?.static === true;
