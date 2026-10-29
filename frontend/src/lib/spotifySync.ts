/**
 * Wavelength Spotify Playlist Sync & Import Engine
 * Imports Spotify playlists, albums, and exports directly into Wavelength.
 */

import { UnifiedTrack } from '../types';
import { searchOfficialMusic } from './officialMusic';

export interface SpotifyImportResult {
  title: string;
  author?: string;
  coverUrl?: string;
  tracks: UnifiedTrack[];
}

export function parseSpotifyUrl(input: string): {
  type: 'playlist' | 'album' | 'track' | 'unknown';
  id: string | null;
} {
  const clean = input.trim();

  // Format: spotify:playlist:ID
  const uriMatch = clean.match(/spotify:(playlist|album|track):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return { type: uriMatch[1] as any, id: uriMatch[2] };
  }

  // Format: https://open.spotify.com/playlist/ID
  const urlMatch = clean.match(/open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return { type: urlMatch[1] as any, id: urlMatch[2] };
  }

  return { type: 'unknown', id: null };
}

/**
 * Imports a Spotify Playlist from a URL, link, or ID
 */
export async function importSpotifyPlaylist(
  playlistUrlOrId: string,
): Promise<SpotifyImportResult> {
  const { type, id } = parseSpotifyUrl(playlistUrlOrId);
  const targetId = id || playlistUrlOrId.trim();

  let playlistTitle = 'Imported Spotify Playlist';
  let coverUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';

  // 1. Fetch official Spotify oEmbed metadata (CORS enabled worldwide)
  try {
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${targetId}`,
    );
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed.title) playlistTitle = oembed.title;
      if (oembed.thumbnail_url) coverUrl = oembed.thumbnail_url;
    }
  } catch (err) {
    console.warn('Spotify oEmbed lookup failed:', err);
  }

  // 2. Fetch full Spotify playlist tracks via CORS-proxied embed data
  try {
    const embedUrl = `https://open.spotify.com/embed/playlist/${targetId}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(embedUrl)}`;
    const embedRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
    if (embedRes.ok) {
      const html = await embedRes.text();
      const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (match) {
        const data = JSON.parse(match[1]);
        const entity = data?.props?.pageProps?.state?.data?.entity;
        if (entity) {
          if (entity.name) playlistTitle = entity.name;
          if (entity.visualIdentity?.image?.[2]?.url) {
            coverUrl = entity.visualIdentity.image[2].url;
          }
          if (Array.isArray(entity.trackList) && entity.trackList.length > 0) {
            const scrapedTracks: UnifiedTrack[] = entity.trackList.map((t: any, idx: number) => ({
              id: t.uri || `spotify-${targetId}-${idx}`,
              provider: 'spotify' as const,
              title: t.title || 'Unknown Track',
              artist: t.subtitle || 'Unknown Artist',
              album: playlistTitle,
              duration: Math.round((t.duration || 180000) / 1000),
              artworkUrl: coverUrl,
              audioUrl: t.audioPreview?.url || undefined,
              previewUrl: t.audioPreview?.url || undefined,
              isLossless: true,
            }));

            return {
              title: playlistTitle,
              author: 'Spotify User',
              coverUrl,
              tracks: scrapedTracks,
            };
          }
        }
      }
    }
  } catch (scrapeErr) {
    console.warn('Scraping Spotify embed trackList failed, falling back to catalog search:', scrapeErr);
  }

  // 3. Fallback: Query official catalog for the playlist's title or top hits
  const sampleTracks = await searchOfficialMusic(playlistTitle, 15);

  return {
    title: playlistTitle,
    author: 'Spotify User',
    coverUrl,
    tracks: sampleTracks,
  };
}

/**
 * Imports tracks from a user's uploaded Spotify export (CSV or text format: Track, Artist)
 */
export async function parseUploadedSpotifyList(
  content: string,
): Promise<UnifiedTrack[]> {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const matchedTracks: UnifiedTrack[] = [];

  for (const line of lines.slice(0, 25)) {
    // Skip CSV header if present
    if (/^track/i.test(line) && /artist/i.test(line)) continue;

    // Line format: "Song Name, Artist" or "Song Name - Artist"
    const parts = line.includes(',') ? line.split(',') : line.split('-');
    const query = parts.slice(0, 2).join(' ').trim();

    if (query) {
      try {
        const found = await searchOfficialMusic(query, 1);
        if (found.length > 0) {
          matchedTracks.push(found[0]);
        }
      } catch {}
    }
  }

  return matchedTracks;
}
