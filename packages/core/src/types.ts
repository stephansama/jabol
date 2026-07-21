// Single source of truth for the link-directory data shape. This module is
// pure types with no runtime imports, so it is safe to bundle into the browser
// SPA via the `@jabol/core/types` export (unlike the barrel, which pulls in
// node-only code from normalize/enrich).

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

export type CanonicalLink = {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  image?: string;
  tags?: string[];
  hidden?: boolean;
  openInSameTab?: boolean;
};

export type CanonicalCategory = {
  id: string;
  name: string;
  icon?: string;
  hidden?: boolean;
  links: CanonicalLink[];
};

export type Canonical = {
  brand?: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  headerHtml?: string;
  headHtml?: string;
  bodyHtml?: string;
  theme?: ThemePreference;
  accent?: string;
  categories: CanonicalCategory[];
};

// Client-facing aliases — the SPA historically referred to these shapes as
// `Link` / `Category`, kept here so those imports resolve to the same types.
export type Link = CanonicalLink;
export type Category = CanonicalCategory;
