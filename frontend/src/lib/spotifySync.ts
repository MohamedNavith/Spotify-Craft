/**
 * Wavelength Spotify Playlist Sync & Import Engine
 * Imports Spotify playlists, albums, and exports directly into Wavelength.
 */

import { UnifiedTrack } from '../types';
import { localTracks, normalizeQuery } from './playlistCatalog';
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
  const urlMatch = clean.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|track)\/([a-zA-Z0-9]+)/);
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

  if (!/^[a-zA-Z0-9]{22}$/.test(targetId)) throw new Error('Invalid Spotify link');
  const kind = type === 'unknown' ? 'playlist' : type;
  let playlistTitle = 'Imported Spotify Playlist';
  let coverUrl: string | undefined;

  // 1. Fetch official Spotify oEmbed metadata (CORS enabled worldwide)
  try {
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/${kind}/${targetId}`, { signal: AbortSignal.timeout(5000) },
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
    const embedUrl = `https://open.spotify.com/embed/${kind}/${targetId}`;
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
          if (kind === 'track' && entity.name && !entity.trackList?.length) {
            entity.trackList = [{ ...entity, title: entity.name, subtitle: entity.artists?.map((a: {name:string}) => a.name).join(', ') }];
          }
          if (Array.isArray(entity.trackList) && entity.trackList.length > 0) {
            const scrapedTracks: UnifiedTrack[] = entity.trackList.map((t: any, idx: number) => ({
              id: t.uri || `spotify-${targetId}-${idx}`,
              provider: 'spotify' as const,
              title: t.title || 'Unknown Track',
              providerTrackId: t.uri?.split(':').pop() || String(idx),
              artistName: t.subtitle || 'Unknown Artist',
              albumName: playlistTitle,
              duration: Math.round((t.duration || 180000) / 1000),
              artworkUrl: coverUrl,
              streamUrl: t.audioPreview?.url || null,
              streamFormat: 'mp3', license: 'Spotify catalog', explicit: Boolean(t.isExplicit),
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
    console.warn('Scraping Spotify embed trackList failed:', scrapeErr);
  }

  throw new Error('Track list unavailable. Import a CSV or text export instead.');
}

interface ExportTrack {
  title: string;
  artist: string;
  uri?: string;
}

export interface ExportPlaylist {
  title: string;
  tracks: ExportTrack[];
}

function csvFields(line: string): string[] {
  if (!line.includes(',')) return line.split(' - ').map(part => part.trim());
  return Array.from(line.matchAll(/(?:^|,)\s*(?:"((?:[^"]|"")*)"|([^,]*))/g),
    match => (match[1] ?? match[2]).replace(/""/g, '"').trim());
}

export function readPlaylistExport(content: string, title: string): ExportPlaylist[] {
  const text = content.trim();
  if (text.startsWith('{') || text.startsWith('[')) {
    const data = JSON.parse(text);
    const lists = data.playlists || (Array.isArray(data) ? [{ name: title, items: data }] : [data]);
    if (!Array.isArray(lists)) throw new Error('Invalid playlist export');
    return lists.map(list => {
      const records = list.items || list.tracks;
      if (!Array.isArray(records)) throw new Error('This file has no playlist tracks.');
      const tracks: ExportTrack[] = [];
      for (const record of records) {
        const item = record?.track ?? record;
        const name = item?.trackName || item?.name || item?.title;
        if (typeof name !== 'string' || !name.trim()) continue;
        const artist = item.artistName || item.artist || item.artists?.map((a: {name:string}) => a.name).join(', ');
        tracks.push({ title: name, artist: typeof artist === 'string' ? artist : '', uri: item.trackUri || item.uri });
      }
      return { title: list.name || list.title || title, tracks };
    });
  }

  const rows = text.split(/\r?\n/).filter(line=>line.trim()).map(csvFields);
  const header = rows[0] || [];
  const titleField = header.findIndex(cell => /^(track name|song|song name|title|track)$/i.test(cell));
  const artistField = header.findIndex(cell => /^(artist|artists|artist name(?:s|\(s\))?)$/i.test(cell));
  const uriField = header.findIndex(cell => /^track uri$/i.test(cell));
  if (titleField >= 0 && artistField >= 0) rows.shift();
  return [{ title, tracks: rows.map(row => ({
    title: row[titleField >= 0 ? titleField : 0], artist: row[artistField >= 0 ? artistField : 1] || '',
    uri: uriField >= 0 ? row[uriField] : undefined,
  })).filter(track=>track.title) }];
}

export async function matchExportTracks(list: ExportPlaylist): Promise<UnifiedTrack[]> {
  const tracks = new Map<string, UnifiedTrack>();
  for (const record of list.tracks) {
    const query = [record.title,record.artist].filter(Boolean).join(' ');
    const local = localTracks(record.title, 12).find(track =>
      normalizeQuery(track.title) === normalizeQuery(record.title) &&
      (!record.artist || normalizeQuery(track.artistName).includes(normalizeQuery(record.artist))));
    const id = typeof record.uri === 'string' && /^spotify:track:([a-zA-Z0-9]{22})$/.exec(record.uri)?.[1];
    let track = local;
    if (!track && id) {
      track = { id: 'spotify:track:' + id, providerTrackId:id, provider:'spotify', title:record.title,
        artistName:record.artist || 'Unknown artist', duration:0, streamUrl:null,
        streamFormat:'mp3', license:'Spotify catalog', explicit:false };
    }
    if (!track) [track] = await searchOfficialMusic(query, 1);
    if (track) tracks.set(track.id, track);
  }
  return [...tracks.values()];
}
