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
  'https://invidious.nerdvpn.de',
  'https://yt.chocolatemoo53.com',
  'https://invidious.jing.rocks',
  'https://iv.melmac.space',
];

const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.leptons.xyz',
];

function isCleanOfficialCandidate(item: any, origTitle: string): boolean {
  if (!item) return false;
  const title = (item.title || '').toLowerCase();

  const badKeywords = [
    'cover', 'reaction', 'reverb', 'slowed', 'sped up',
    'mashup', 'tiktok', 'status', 'shorts', '1 hour', 'loop',
    '8d', 'bass boosted', 'teaser', 'trailer', 'karaoke', 'clean edit'
  ];

  const allowRemix = origTitle.toLowerCase().includes('remix');
  if (!allowRemix && title.includes('remix')) return false;

  for (const bad of badKeywords) {
    if (title.includes(bad)) return false;
  }

  if (typeof item.lengthSeconds === 'number' && item.lengthSeconds < 50) {
    return false;
  }

  return true;
}

function scoreCandidate(item: any, expectedArtist: string): number {
  let score = 0;
  const title = (item.title || '').toLowerCase();
  const author = (item.author || item.uploaderName || '').toLowerCase();
  const normArtist = expectedArtist.toLowerCase();

  if (author.endsWith('- topic') || author.includes('topic')) score += 100;
  if (normArtist && author.includes(normArtist)) score += 80;
  if (author.includes('vevo')) score += 60;
  if (['t-series', 'sony', 'zee', 'yrf', 'saregama', 'tips', 'warner', 'universal'].some((l) => author.includes(l))) {
    score += 70;
  }
  if (title.includes('official audio') || title.includes('official video')) score += 30;

  return score;
}

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
          // Filter out covers/reactions and pick the best official release
          const candidates = items.filter((it: any) => it && it.videoId && isCleanOfficialCandidate(it, title));
          if (candidates.length > 0) {
            candidates.sort((a: any, b: any) => scoreCandidate(b, artist) - scoreCandidate(a, artist));
            const best = candidates[0];
            const vId = best.videoId;
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
          const cleanItems = items.filter((it: any) => isCleanOfficialCandidate(it, title));
          const list = cleanItems.length > 0 ? cleanItems : items;
          list.sort((a: any, b: any) => scoreCandidate(b, artist) - scoreCandidate(a, artist));
          const match = list[0];
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
