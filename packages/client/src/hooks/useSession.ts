import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IS_STATIC } from "@/lib/static";
import type { SessionUser } from "@/lib/types";

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(!IS_STATIC);

  const refresh = useCallback(async () => {
    // Static output is never authenticated — no session endpoint to call.
    if (IS_STATIC) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.session();
      setUser(res.session?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await api.signIn(email, password);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await api.signOut();
    setUser(null);
  }, []);

  return { user, loading, signIn, signOut, refresh };
}
