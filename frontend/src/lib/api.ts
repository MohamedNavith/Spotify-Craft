import {
  UnifiedAlbum,
  UnifiedArtist,
  UnifiedPlayback,
  UnifiedSearchResult,
  UnifiedTrack,
  UserProfile,
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function searchTracks(
  query: string,
  limit = 20,
): Promise<UnifiedSearchResult> {
  try {
    const res = await fetch(
      `${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    if (!res.ok) throw new Error('Search failed');
    return await res.json();
  } catch {
    // Graceful fallback directly to Jamendo client-side if backend is offline during early frontend test
    return searchJamendoDirect(query, limit);
  }
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
    const searchRes = await searchTracks('popular', 20);
    return searchRes.tracks;
  } catch {
    return [];
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
