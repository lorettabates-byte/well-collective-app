const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function cachedFetch<T>(
  url: string,
  cacheKey: string,
  fallback: T,
): Promise<{ data: T; fromCache: boolean }> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data: T = await res.json();
      try {
        localStorage.setItem(`wc_cache_${cacheKey}`, JSON.stringify({ data, ts: Date.now() }));
      } catch {}
      return { data, fromCache: false };
    }
  } catch {}

  try {
    const raw = localStorage.getItem(`wc_cache_${cacheKey}`);
    if (raw) {
      const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
      if (Date.now() - ts < TTL_MS) return { data, fromCache: true };
    }
  } catch {}

  return { data: fallback, fromCache: true };
}

export function getCached<T>(cacheKey: string): T | null {
  try {
    const raw = localStorage.getItem(`wc_cache_${cacheKey}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - ts < TTL_MS) return data;
  } catch {}
  return null;
}
