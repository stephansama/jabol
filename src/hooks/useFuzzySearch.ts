import Fuse from "fuse.js";
import { useMemo } from "react";
import type { Category, Link } from "@/lib/types";

export type FlatLink = Link & { categoryId: string; categoryName: string };

export function flatten(categories: Category[]): FlatLink[] {
  const out: FlatLink[] = [];
  for (const cat of categories) {
    for (const link of cat.links) {
      out.push({ ...link, categoryId: cat.id, categoryName: cat.name });
    }
  }
  return out;
}

export function useFuzzySearch(categories: Category[], query: string) {
  const flat = useMemo(() => flatten(categories), [categories]);

  const fuse = useMemo(
    () =>
      new Fuse(flat, {
        keys: [
          { name: "name", weight: 0.5 },
          { name: "tags", weight: 0.3 },
          { name: "description", weight: 0.2 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [flat],
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return flat;
    return fuse.search(q).map((r) => r.item);
  }, [fuse, query, flat]);

  return { results, totalCount: flat.length };
}
