import { useEffect } from "react";
import { IS_STATIC } from "@/lib/static";

export function useLinksSSE(onUpdate: () => void) {
  useEffect(() => {
    // No server, no live updates in a static build.
    if (IS_STATIC) return;
    let es: EventSource | null = null;
    let stopped = false;
    let backoff = 1000;

    function connect() {
      if (stopped) return;
      es = new EventSource("/api/events", { withCredentials: true });
      es.addEventListener("links:update", () => onUpdate());
      es.addEventListener("ready", () => {
        backoff = 1000;
      });
      es.onerror = () => {
        es?.close();
        if (stopped) return;
        const wait = backoff;
        backoff = Math.min(backoff * 2, 30_000);
        setTimeout(connect, wait);
      };
    }

    connect();
    return () => {
      stopped = true;
      es?.close();
    };
  }, [onUpdate]);
}
