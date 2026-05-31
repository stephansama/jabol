import { useEffect } from "react";

export function useLinksSSE(onUpdate: () => void) {
  useEffect(() => {
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
