import { useEffect, useState } from "react";
import type { Theme, ThemePreference } from "@/lib/types";

const STORAGE_KEY = "jabol.theme";
const DEFAULT_PREFERENCE: ThemePreference = "system-catppuccin";

function resolve(pref: ThemePreference, prefersDark: boolean): Theme {
  switch (pref) {
    case "system":
      return prefersDark ? "dark" : "light";
    case "system-catppuccin":
      return prefersDark ? "mocha" : "latte";
    default:
      return pref;
  }
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
    document.documentElement.setAttribute("data-theme", resolved);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {}
  }, [resolved, pref]);

  return resolved;
}
