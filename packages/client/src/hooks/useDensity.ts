import { useCallback, useEffect, useState } from "react";

export type Density = "comfortable" | "compact";

const STORAGE_KEY = "jabol.density";
const MOBILE_QUERY = "(max-width: 639px)";

function readStored(): Density {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "compact" || v === "comfortable") return v;
  } catch {}
  return "comfortable";
}

function readIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useDensity() {
  const [stored, setStored] = useState<Density>(readStored);
  const [isMobile, setIsMobile] = useState<boolean>(readIsMobile);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, stored);
    } catch {}
  }, [stored]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const setDensity = useCallback((d: Density) => setStored(d), []);
  const density: Density = isMobile ? "compact" : stored;

  return { density, setDensity };
}
