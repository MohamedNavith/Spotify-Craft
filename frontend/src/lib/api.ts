import {
  UnifiedAlbum,
  UnifiedArtist,
  UnifiedPlayback,
  UnifiedSearchResult,
  UnifiedTrack,
  UserProfile,
} from '../types';
import { CURATED_OFFICIAL_HITS, searchOfficialMusic } from './officialMusic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function searchTracks(
  query: string,
  limit = 20,
): Promise<UnifiedSearchResult> {
  // Strategy 1: Try official client-side catalog first for real composer/artist songs
  try {
    const officialTracks = await searchOfficialMusic(query, limit);
    if (officialTracks && officialTracks.length > 0) {
      return {
        provider: 'official',
        tracks: officialTracks,
        albums: [],
        artists: [],
        totalResults: officialTracks.length,
      };
    }
  } catch (err) {
    console.warn('Client-side official search error:', err);
  }

  // Strategy 2: If a custom backend is configured, attempt backend search
  if (API_BASE) {
    try {
      const res = await fetch(
        `${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.tracks && data.tracks.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend offline, fallback to Jamendo
    }
  }

  // Strategy 3: Jamendo fallback
  return searchJamendoDirect(query, limit);
}

export async function getTrack(id: string): Promise<UnifiedTrack> {
  const res = await fetch(`${API_BASE}/api/tracks/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to load track');
  return res.json();
}

export async function getPlayback(id: string): Promise<UnifiedPlayback> {
  const res = await fetch(
    `${API_BASE}/api/tracks/${encodeURIComponent(id)}/playback`,
  );
  if (!res.ok) throw new Error('Failed to get playback stream');
  return res.json();
}

export async function getArtist(id: string): Promise<UnifiedArtist> {
  const res = await fetch(`${API_BASE}/api/artists/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to load artist');
  return res.json();
}

export async function getAlbum(id: string): Promise<UnifiedAlbum> {
  const res = await fetch(`${API_BASE}/api/albums/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to load album');
  return res.json();
}

export async function fetchTrendingTracks(): Promise<UnifiedTrack[]> {
  try {
    if (CURATED_OFFICIAL_HITS.todayTopHits.length > 0) {
      return CURATED_OFFICIAL_HITS.todayTopHits;
    }
    const searchRes = await searchTracks('top hits', 20);
    return searchRes.tracks;
  } catch {
    return CURATED_OFFICIAL_HITS.todayTopHits;
  }
}

// Fallback Jamendo client-side fetcher if backend is not yet started
async function searchJamendoDirect(
  query: string,
  limit: number,
): Promise<UnifiedSearchResult> {
  try {
    const clientId = '17ed92bf';
    const res = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=${limit}&namesearch=${encodeURIComponent(
        query,
      )}&include=musicinfo&order=popularity_total`,
    );
    const data = await res.json();

    const tracks: UnifiedTrack[] = (data.results || []).map((raw: any) => ({
      id: `jamendo:${raw.id}`,
      provider: 'jamendo',
      providerTrackId: String(raw.id),
      title: raw.name,
      artistName: raw.artist_name,
      artistId: `jamendo:${raw.artist_id}`,
      albumName: raw.album_name,
      albumId: `jamendo:${raw.album_id}`,
      duration: raw.duration,
      streamUrl: raw.audio,
      streamFormat: 'mp3',
      artworkUrl: raw.image || raw.album_image,
      license: raw.license_ccurl || 'Creative Commons',
      licenseUrl: raw.license_ccurl,
      audioQuality: '192kbps (MP3)',
      explicit: false,
      year: raw.releasedate ? new Date(raw.releasedate).getFullYear() : null,
      genres: raw.musicinfo?.tags?.genres || [],
    }));

    return {
      provider: 'jamendo',
      tracks,
      albums: [],
      artists: [],
      totalResults: tracks.length,
    };
  } catch {
    return {
      provider: 'jamendo',
      tracks: [],
      albums: [],
      artists: [],
      totalResults: 0,
    };
  }
}
