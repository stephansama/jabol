import { useEffect, useMemo, useState } from "react";
import type { Category, Link } from "@/lib/types";

export type FlatLink = Link & { categoryId: string; categoryName: string };

type FuseModule = typeof import("fuse.js");
type FuseCtor = FuseModule["default"];
type FuseInstance = InstanceType<FuseCtor>;

let fuseModulePromise: Promise<FuseModule> | null = null;

function loadFuse(): Promise<FuseModule> {
  if (!fuseModulePromise) fuseModulePromise = import("fuse.js");
  return fuseModulePromise;
}

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
  const [FuseCtor, setFuseCtor] = useState<FuseCtor | null>(null);

  const hasQuery = query.trim().length > 0;
  useEffect(() => {
    if (!hasQuery || FuseCtor) return;
    let cancelled = false;
    loadFuse().then((mod) => {
      if (!cancelled) setFuseCtor(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [hasQuery, FuseCtor]);

  const fuse = useMemo<FuseInstance | null>(() => {
    if (!FuseCtor) return null;
    return new FuseCtor(flat, {
      keys: [
        { name: "name", weight: 0.5 },
        { name: "tags", weight: 0.3 },
        { name: "description", weight: 0.2 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [FuseCtor, flat]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return flat;
    if (!fuse) return flat;
    return fuse.search(q).map((r) => r.item);
  }, [fuse, query, flat]);

  return { results, totalCount: flat.length };
}
