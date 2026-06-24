export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

export type Link = {
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

export type Category = {
  id: string;
  name: string;
  icon?: string;
  hidden?: boolean;
  links: Link[];
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
  categories: Category[];
};

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
