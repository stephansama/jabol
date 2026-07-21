import type { Canonical } from "./types.js";

// Strips hidden categories and hidden links — the public view served to
// unauthenticated visitors (and the only view a static SSG build ever emits).
export function filterPublicCanonical(canonical: Canonical): Canonical {
  return {
    ...canonical,
    categories: canonical.categories
      .filter((c) => !c.hidden)
      .map((c) => ({
        ...c,
        links: c.links.filter((l) => !l.hidden),
      })),
  };
}
