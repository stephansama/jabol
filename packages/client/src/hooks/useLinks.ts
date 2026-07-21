import { useCallback, useEffect, useState } from "react";
import { api, type LinksResponse } from "@/lib/api";
import { IS_STATIC, readBootstrap } from "@/lib/static";

export function useLinks(authed: boolean) {
  const initial = readBootstrap();
  const [data, setData] = useState<LinksResponse | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(initial === null && !IS_STATIC);

  const reload = useCallback(async () => {
    // Static output has no API — keep the bootstrap data as-is.
    if (IS_STATIC) return;
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
    if (IS_STATIC) return;
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}
