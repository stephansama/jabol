import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { store } from "./store.js";

export async function linksEventStream(c: Context) {
  return streamSSE(c, async (stream) => {
    let alive = true;
    const unsubscribe = store.subscribe(() => {
      stream.writeSSE({ event: "links:update", data: String(Date.now()) }).catch(() => {});
    });

    stream.onAbort(() => {
      alive = false;
      unsubscribe();
    });

    await stream.writeSSE({ event: "ready", data: "ok" });

    // Heartbeat every 25s so proxies don't drop the connection.
    while (alive) {
      await stream.sleep(25_000);
      if (!alive) break;
      try {
        await stream.writeSSE({ event: "ping", data: String(Date.now()) });
      } catch {
        alive = false;
      }
    }
  });
}
