import { useEffect } from "react";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Periodically checks whether a newer build has been deployed and reloads
 * the page if so. Safari (especially in standalone/home-screen mode) can
 * keep serving an old cached bundle indefinitely even with no-cache headers,
 * which breaks once the next deploy removes that old bundle's files from
 * the server. Catching the version drift early lets us reload onto the new
 * build before that happens.
 */
export function useStaleVersionGuard() {
  useEffect(() => {
    const currentVersion = __APP_VERSION__;

    async function check() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.version && data.version !== currentVersion) {
          // Use href assignment with cache-buster so iOS standalone PWA
          // doesn't serve the old index.html from its own cache on reload.
          const url = new URL(window.location.href);
          url.searchParams.set("_v", data.version.slice(0, 8));
          window.location.href = url.toString();
        }
      } catch {
        // Network hiccup — just try again on the next interval.
      }
    }

    // Check immediately on mount — iOS standalone PWA can run a stale bundle
    // indefinitely without this, since visibility/interval may never fire if
    // the user opens the app and stays on the same screen for < 5 minutes.
    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
