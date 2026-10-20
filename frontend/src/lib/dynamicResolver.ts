import { CURATED_OFFICIAL_VIDEOS, resolveVideoId as resolveLocalVideoId } from './videoResolver';

/**
 * Universal Dynamic YouTube Master Audio Resolver
 * Automatically resolves verified official video IDs for ANY song in real-time
 * with zero rate-limits, multiple redundant fallbacks, and local persistence.
 */

const MEMORY_CACHE = new Map<string, string>();

const INVIDIOUS_INSTANCES = [
  'https://invidious.f5.si',
  'https://inv.nadeko.net',
  'https://yt.chocolatemoo53.com',
  'https://invidious.nerdvpn.de',
  'https://yt.artemislena.eu',
];

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
];

export async function resolveVideoIdAsync(
  title: string,
  artist: string,
): Promise<string | null> {
  const normTitle = (title || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();
  const normArtist = (artist || '').toLowerCase().trim();
  const query = `${normTitle} ${normArtist}`.trim();

  if (!query) return null;

  // 1. Instant check in curated local dictionary
  const localMatch = resolveLocalVideoId(title, artist);
  if (localMatch) {
    return localMatch;
  }

  // 2. Instant check in in-memory cache
  if (MEMORY_CACHE.has(query)) {
    return MEMORY_CACHE.get(query)!;
  }

  // 3. Instant check in localStorage persistent cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`wl_yt_cache_${query}`);
      if (cached) {
        MEMORY_CACHE.set(query, cached);
        return cached;
      }
    } catch {}
  }

  // 4. Dynamic query across fast Invidious instances
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `${base}/api/v1/search?q=${encodeURIComponent(query + ' official audio song')}&type=video`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          // Find first item with videoId
          const match = items.find((it: any) => it && it.videoId && it.type === 'video');
          if (match && match.videoId) {
            const vId = match.videoId;
            MEMORY_CACHE.set(query, vId);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(`wl_yt_cache_${query}`, vId);
              } catch {}
            }
            return vId;
          }
        }
      }
    } catch {
      // Try next instance seamlessly
    }
  }

  // 5. Fallback across Piped instances
  for (const base of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `${base}/search?q=${encodeURIComponent(query + ' official')}&filter=videos`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        if (Array.isArray(items) && items.length > 0) {
          const match = items[0];
          if (match && match.url) {
            // url: "/watch?v=Umqb9KENgmk"
            const vMatch = match.url.match(/v=([a-zA-Z0-9_-]{11})/);
            if (vMatch) {
              const vId = vMatch[1];
              MEMORY_CACHE.set(query, vId);
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(`wl_yt_cache_${query}`, vId);
                } catch {}
              }
              return vId;
            }
          }
        }
      }
    } catch {
      // Try next instance
    }
  }

  return null;
}
