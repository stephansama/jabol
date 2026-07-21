import chokidar from "chokidar";
import { env } from "../config.js";
import { store } from "./store.js";

export function startWatcher(): void {
  if (store.isReadOnly() && env.isDev) {
    console.warn("[watcher] read-only mount — still watching for external edits");
  }
  const watcher = chokidar.watch(env.configPath, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });
  watcher.on("change", async () => {
    if (store.shouldSuppressWatchEvent()) return;
    try {
      await store.reloadFromDisk();
      console.log("[watcher] reloaded links.json from disk");
    } catch (err) {
      console.error("[watcher] reload failed:", err);
    }
  });
  watcher.on("error", (err) => console.error("[watcher] error:", err));
}
