import CryptoJS from 'crypto-js';

const DES_KEY = '38346591';
const MEMORY_CACHE = new Map<string, MasterAudioResult>();

export interface MasterAudioResult {
  streamUrl: string;
  duration: number;
  artworkUrl?: string;
  artistName?: string;
  albumName?: string;
  quality: string;
}

function decryptMediaUrl(encryptedUrl: string): string | null {
  try {
    const key = CryptoJS.enc.Utf8.parse(DES_KEY);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl),
    });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    const raw = decrypted.toString(CryptoJS.enc.Utf8);
    if (!raw) return null;
    return raw.replace(/_[0-9]+\.(mp4|m4a|mp3)/, '_320.$1').replace('_96.', '_320.');
  } catch {
    return null;
  }
}

export function cleanTrackQuery(title: string, artist = ''): string {
  const normTitle = (title || '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*$/i, '')
    .replace(/ft\..*$/i, '')
    .replace(/- Extended/i, '')
    .replace(/- Single/i, '')
    .replace(/- Master/i, '')
    .replace(/- Remastered/i, '')
    .trim();

  const normArtist = (artist || '')
    .split(',')[0]
    .split('&')[0]
    .trim();

  return `${normTitle} ${normArtist}`.trim().toLowerCase();
}

export async function resolveMasterAudioStream(
  title: string,
  artist = '',
): Promise<MasterAudioResult | null> {
  const query = cleanTrackQuery(title, artist);
  if (!query) return null;

  // 1. Check in-memory fast cache
  if (MEMORY_CACHE.has(query)) {
    return MEMORY_CACHE.get(query)!;
  }

  // 2. Check localStorage persistent cache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`wl_master_audio_${query}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.streamUrl) {
          MEMORY_CACHE.set(query, parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Primary Endpoint: Public High-Speed JSON API
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://jiosaavn-api-private.vercel.app/search/songs?q=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const results = data.data?.results || data.results || [];
      if (Array.isArray(results) && results.length > 0) {
        const match = results[0];
        const dl = match.download_url || match.downloadUrl || [];
        let streamUrl = '';

        if (Array.isArray(dl) && dl.length > 0) {
          const best = dl.find((x: any) => x.quality === '320kbps') || dl[dl.length - 1];
          streamUrl = best?.link || '';
        } else if (match.media_url || match.encrypted_media_url) {
          streamUrl = match.media_url || decryptMediaUrl(match.encrypted_media_url) || '';
        }

        if (streamUrl) {
          const dur = match.duration ? parseInt(String(match.duration), 10) : 240;
          let artworkUrl = '';
          if (Array.isArray(match.image) && match.image.length > 0) {
            artworkUrl = match.image[match.image.length - 1]?.link || '';
          }

          const result: MasterAudioResult = {
            streamUrl,
            duration: dur > 0 ? dur : 240,
            artworkUrl: artworkUrl || undefined,
            artistName: match.subtitle || match.primaryArtists || undefined,
            albumName: match.album || undefined,
            quality: '320kbps (Master Studio Lossless)',
          };

          MEMORY_CACHE.set(query, result);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`wl_master_audio_${query}`, JSON.stringify(result));
            } catch {}
          }
          return result;
        }
      }
    }
  } catch {}

  // 4. Secondary Endpoint: Direct API with Client-Side DES Decryption
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&n=5&p=1&q=${encodeURIComponent(
        query,
      )}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const results = data.results || [];
      if (Array.isArray(results) && results.length > 0) {
        const match = results[0];
        if (match.encrypted_media_url) {
          const streamUrl = decryptMediaUrl(match.encrypted_media_url);
          if (streamUrl) {
            const dur = match.duration ? parseInt(String(match.duration), 10) : 240;
            const result: MasterAudioResult = {
              streamUrl,
              duration: dur > 0 ? dur : 240,
              artworkUrl: match.image ? match.image.replace('150x150', '500x500') : undefined,
              artistName: match.singers || match.primary_artists || undefined,
              albumName: match.album || undefined,
              quality: '320kbps (Master Studio Lossless)',
            };

            MEMORY_CACHE.set(query, result);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(`wl_master_audio_${query}`, JSON.stringify(result));
              } catch {}
            }
            return result;
          }
        }
      }
    }
  } catch {}

  return null;
}
