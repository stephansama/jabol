import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "jabol.collapsedCategories";

function readStored(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {}
  return new Set();
}

export function useCollapsedCategories() {
  const [collapsed, setCollapsed] = useState<Set<string>>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(collapsed)));
    } catch {}
  }, [collapsed]);

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isCollapsed = useCallback((id: string) => collapsed.has(id), [collapsed]);

  return { collapsed, toggle, isCollapsed };
}
