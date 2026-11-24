import CryptoJS from 'crypto-js';
import { AudioStreamDetails, StreamingQuality } from '../types';

const DES_KEY = '38346591';
const MEMORY_CACHE = new Map<string, MasterAudioResult>();

export interface MasterAudioResult {
  streamUrl: string;
  duration: number;
  artworkUrl?: string;
  artistName?: string;
  albumName?: string;
  quality: string;
  details?: AudioStreamDetails;
}

function decryptMediaUrl(encryptedUrl: string, targetQuality: '320' | '160' | '96' | '48' = '320'): string | null {
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
    return raw.replace(/_[0-9]+\.(mp4|m4a|mp3)/, `_${targetQuality}.$1`).replace('_96.', `_${targetQuality}.`);
  } catch {
    return null;
  }
}

export function isPreviewAudioUrl(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes('audio-ssl.itunes.apple.com') ||
    url.includes('AudioPreview') ||
    url.includes('.plus.aac.p.m4a') ||
    url.includes('/preview/')
  );
}

export function invalidateAudioCache(
  title: string,
  artist = '',
  qualityParam?: StreamingQuality
) {
  const query = cleanTrackQuery(title, artist);
  if (!query) return;
  const qualities: StreamingQuality[] = qualityParam
    ? [qualityParam]
    : ['lossless', 'hi-res-lossless', 'high-quality', 'high-efficiency', 'none'];

  for (const q of qualities) {
    const key = `${query}__${q}`;
    MEMORY_CACHE.delete(key);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`wl_audio_${key}`);
      } catch {}
    }
  }
}

export function getCachedMasterAudio(
  title: string,
  artist = '',
  qualityParam?: StreamingQuality
): MasterAudioResult | null {
  const query = cleanTrackQuery(title, artist);
  if (!query) return null;

  const quality: StreamingQuality =
    qualityParam ||
    (typeof window !== 'undefined'
      ? (localStorage.getItem('wavelength_streaming_quality') as StreamingQuality) || 'high-quality'
      : 'high-quality');

  const cacheKey = `${query}__${quality}`;

  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey)!;
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`wl_audio_${cacheKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.streamUrl) {
          MEMORY_CACHE.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {}
  }

  return null;
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

/**
 * Resolves audio stream according to Apple Music quality specifications:
 * - High Efficiency: HE-AAC 48-96 kbps (~1.5 MB / song)
 * - High Quality: AAC 320 kbps Studio Master (~6-7 MB / song) [Default]
 * - Lossless: Bit-perfect FLAC 16-bit/44.1 kHz or 24-bit/48 kHz (~36 MB / song) [Opt-in]
 * - Hi-Res Lossless: Bit-perfect FLAC up to 24-bit/192 kHz (~145 MB / song) [Opt-in]
 */
export async function resolveMasterAudioStream(
  title: string,
  artist = '',
  qualityParam?: StreamingQuality
): Promise<MasterAudioResult | null> {
  const query = cleanTrackQuery(title, artist);
  if (!query) return null;

  // Read configured preference: default is 'high-quality' (never lossless by default)
  const quality: StreamingQuality =
    qualityParam ||
    (typeof window !== 'undefined'
      ? (localStorage.getItem('wavelength_streaming_quality') as StreamingQuality) || 'high-quality'
      : 'high-quality');

  const cacheKey = `${query}__${quality}`;

  // 1. Check in-memory fast cache
  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey)!;
  }

  // 2. Check localStorage persistent cache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`wl_audio_${cacheKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.streamUrl) {
          MEMORY_CACHE.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {}
  }

  // 3. Lossless & Hi-Res Lossless Tier: Fetch from genuine FLAC audio provider
  if (quality === 'lossless' || quality === 'hi-res-lossless') {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7500);

      const flacSearchUrl = `https://tracks.monochrome.st/search/tracks?q=${encodeURIComponent(query)}&limit=3`;
      const res = await fetch(flacSearchUrl, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const tracks = data.tracks || [];
        if (Array.isArray(tracks) && tracks.length > 0) {
          const matchedTrack = tracks[0];
          const trackId = matchedTrack.id || matchedTrack.trackId;

          if (trackId) {
            const streamUrl = `https://tracks.monochrome.st/track/${encodeURIComponent(trackId)}`;
            const dur = matchedTrack.duration ? Math.round(matchedTrack.duration / 1000) : 240;

            const isHiRes = quality === 'hi-res-lossless';
            const details: AudioStreamDetails = {
              codec: 'FLAC',
              bitrate: isHiRes ? 'Up to 9,216 kbps' : '1,411 kbps',
              sampleRate: isHiRes ? '96 kHz / 192 kHz' : '44.1 kHz / 48 kHz',
              bitDepth: isHiRes ? '24-bit' : '16-bit / 24-bit',
              channels: 'Stereo 2.0',
              tier: quality,
              tierLabel: isHiRes ? 'Hi-Res Lossless' : 'Lossless',
              sizeEstimateMb: isHiRes ? 145 : 36,
              isRealLossless: true,
            };

            const result: MasterAudioResult = {
              streamUrl,
              duration: dur,
              artworkUrl: matchedTrack.artwork || undefined,
              artistName: Array.isArray(matchedTrack.artistNames)
                ? matchedTrack.artistNames.join(', ')
                : undefined,
              albumName: matchedTrack.albumName || undefined,
              quality: isHiRes
                ? 'Hi-Res Lossless (FLAC 24-bit/192kHz)'
                : 'Lossless (FLAC 24-bit/48kHz)',
              details,
            };

            MEMORY_CACHE.set(cacheKey, result);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(`wl_audio_${cacheKey}`, JSON.stringify(result));
              } catch {}
            }
            return result;
          }
        }
      }
    } catch (err) {
      console.warn('[Lossless Engine] FLAC resolver unreachable or song uncataloged, falling back cleanly:', err);
    }
  }

  // 4. High Quality (320kbps Master) & High Efficiency (HE-AAC 48/96kbps)
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
        let actualBitrate = '320 kbps';
        let isHeAac = quality === 'high-efficiency';

        if (Array.isArray(dl) && dl.length > 0) {
          if (isHeAac) {
            const low = dl.find((x: any) => x.quality === '48kbps' || x.quality === '96kbps') || dl[0];
            streamUrl = low?.link || '';
            actualBitrate = low?.quality || '96 kbps';
          } else {
            const high = dl.find((x: any) => x.quality === '320kbps') || dl[dl.length - 1];
            streamUrl = high?.link || '';
            actualBitrate = '320 kbps';
          }
        } else if (match.media_url || match.encrypted_media_url) {
          streamUrl =
            match.media_url ||
            decryptMediaUrl(match.encrypted_media_url, isHeAac ? '96' : '320') ||
            '';
        }

        if (streamUrl) {
          const dur = match.duration ? parseInt(String(match.duration), 10) : 240;
          let artworkUrl = '';
          if (Array.isArray(match.image) && match.image.length > 0) {
            artworkUrl = match.image[match.image.length - 1]?.link || '';
          }

          const wasLosslessRequested = quality === 'lossless' || quality === 'hi-res-lossless';
          const details: AudioStreamDetails = {
            codec: 'AAC',
            bitrate: actualBitrate,
            sampleRate: '44.1 kHz',
            bitDepth: '16-bit',
            channels: 'Stereo 2.0',
            tier: isHeAac ? 'high-efficiency' : 'high-quality',
            tierLabel: isHeAac
              ? 'High Efficiency'
              : wasLosslessRequested
              ? 'High Quality (Lossless Unavailable)'
              : 'High Quality',
            sizeEstimateMb: isHeAac ? 1.5 : 6.8,
            isRealLossless: false,
          };

          const result: MasterAudioResult = {
            streamUrl,
            duration: dur > 0 ? dur : 240,
            artworkUrl: artworkUrl || undefined,
            artistName: match.subtitle || match.primaryArtists || undefined,
            albumName: match.album || undefined,
            quality: isHeAac
              ? `High Efficiency (HE-AAC ${actualBitrate})`
              : wasLosslessRequested
              ? `High Quality (${actualBitrate} AAC • Lossless Unavailable)`
              : `High Quality (AAC ${actualBitrate})`,
            details,
          };

          MEMORY_CACHE.set(cacheKey, result);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`wl_audio_${cacheKey}`, JSON.stringify(result));
            } catch {}
          }
          return result;
        }
      }
    }
  } catch {}

  // 5. Fallback Direct Endpoint with DES Decryption
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&n=5&p=1&q=${encodeURIComponent(
        query
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
          const isHeAac = quality === 'high-efficiency';
          const streamUrl = decryptMediaUrl(match.encrypted_media_url, isHeAac ? '96' : '320');
          if (streamUrl) {
            const dur = match.duration ? parseInt(String(match.duration), 10) : 240;
            const details: AudioStreamDetails = {
              codec: 'AAC',
              bitrate: isHeAac ? '96 kbps' : '320 kbps',
              sampleRate: '44.1 kHz',
              bitDepth: '16-bit',
              channels: 'Stereo 2.0',
              tier: isHeAac ? 'high-efficiency' : 'high-quality',
              tierLabel: isHeAac ? 'High Efficiency' : 'High Quality',
              sizeEstimateMb: isHeAac ? 1.5 : 6.8,
              isRealLossless: false,
            };

            const result: MasterAudioResult = {
              streamUrl,
              duration: dur > 0 ? dur : 240,
              artworkUrl: match.image ? match.image.replace('150x150', '500x500') : undefined,
              artistName: match.singers || match.primary_artists || undefined,
              albumName: match.album || undefined,
              quality: isHeAac ? 'High Efficiency (HE-AAC 96 kbps)' : 'High Quality (AAC 320 kbps)',
              details,
            };

            MEMORY_CACHE.set(cacheKey, result);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(`wl_audio_${cacheKey}`, JSON.stringify(result));
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
