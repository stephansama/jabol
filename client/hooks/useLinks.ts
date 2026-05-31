import { useCallback, useEffect, useState } from "react";
import { api, type LinksResponse } from "@/lib/api";

const BOOTSTRAP_ID = "jabol-initial";

function readBootstrap(): LinksResponse | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(BOOTSTRAP_ID);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as LinksResponse;
  } catch {
    return null;
  }
}

export function useLinks(authed: boolean) {
  const initial = readBootstrap();
  const [data, setData] = useState<LinksResponse | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(initial === null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const next = await api.links(authed);
      setData(next);
    } catch (err: any) {
      setError(err?.message ?? "failed to load links");
    } finally {
      setLoading(false);
    }
  }, [authed]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}
