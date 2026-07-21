import { useRegisterSW } from "virtual:pwa-register/react";

// Hourly background check for a fresh service worker so long-lived tabs/installs
// pick up new deploys without a manual hard reload.
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Registers the service worker (registerType: "prompt") and renders a small
 * toast when a new version has been precached, letting the user reload into it.
 * Also surfaces a one-time "ready to work offline" confirmation.
 */
export function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, UPDATE_INTERVAL_MS);
    },
  });

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg px-4 py-3 text-sm text-fg shadow-lg"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-strong)",
      }}
    >
      <span className="flex-1">
        {needRefresh
          ? "A new version of jabol is available."
          : "jabol is ready to work offline."}
      </span>
      {needRefresh && (
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="rounded-md px-2.5 py-1 font-semibold transition-colors"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          Reload
        </button>
      )}
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss"
        className="rounded-md px-2 py-1 text-fg-subtle transition-colors hover:text-fg"
      >
        ✕
      </button>
    </div>
  );
}
