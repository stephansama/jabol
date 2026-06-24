import { useEffect, useState } from "react";
import type { Theme, ThemePreference } from "@/lib/types";

const STORAGE_KEY = "jabol.theme";
const DEFAULT_PREFERENCE: ThemePreference = "system";

// Keep these in sync with the `--bg` token per theme in styles/themes.css so the
// installed PWA / mobile browser chrome matches the active surface color.
const THEME_BG: Record<Theme, string> = {
  dark: "#1e1e2e",
  light: "#eff1f5",
};

function resolve(pref: ThemePreference, prefersDark: boolean): Theme {
  return pref === "system" ? (prefersDark ? "dark" : "light") : pref;
}

function applyTheme(resolved: Theme): void {
  document.documentElement.setAttribute("data-theme", resolved);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_BG[resolved]);
}

export function useResolvedTheme(preference: ThemePreference | undefined): Theme {
  const pref = preference ?? DEFAULT_PREFERENCE;
  const mql =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
  const [prefersDark, setPrefersDark] = useState<boolean>(() => !!mql?.matches);

  useEffect(() => {
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mql]);

  const resolved = resolve(pref, prefersDark);

  useEffect(() => {
    applyTheme(resolved);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {}
  }, [resolved, pref]);

  return resolved;
}

export function useAccentOverride(accent: string | undefined): void {
  useEffect(() => {
    const root = document.documentElement;
    if (accent) {
      root.style.setProperty("--accent", accent);
    } else {
      root.style.removeProperty("--accent");
    }
  }, [accent]);
}

export function useSystemThemeSync(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      let pref: ThemePreference = DEFAULT_PREFERENCE;
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
        if (stored) pref = stored;
      } catch {}
      const resolved = resolve(pref, mql.matches);
      applyTheme(resolved);
    };

    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);
}
