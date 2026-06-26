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
          window.location.reload();
        }
      } catch {
        // Network hiccup — just try again on the next interval.
      }
    }

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
