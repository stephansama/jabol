import { useCallback, useEffect, useState } from "react";
import { api, type LinksResponse } from "@/lib/api";

export function useLinks(authed: boolean) {
  const [data, setData] = useState<LinksResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}
