import { UnifiedTrack } from '../types';

export interface UserPlaylist {
  id: string;
  title: string;
  description?: string;
  coverArt?: string;
  tracks: UnifiedTrack[];
  createdAt: number;
}

const STORAGE_KEY = 'wavelength_user_playlists';
const LIKED_TRACKS_KEY = 'wavelength_liked_tracks_full';

export function getUserPlaylists(): UserPlaylist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserPlaylist(playlist: UserPlaylist): UserPlaylist[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getUserPlaylists();
    const existingIndex = current.findIndex((p) => p.id === playlist.id);

    let updated: UserPlaylist[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = playlist;
    } else {
      updated = [playlist, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wavelength_playlists_updated'));
    return updated;
  } catch (err) {
    console.warn('Failed to save user playlist:', err);
    return [];
  }
}

export function createCustomUserPlaylist(
  title: string,
  tracks: UnifiedTrack[] = [],
  description = 'Created by you in Wavelength',
): UserPlaylist {
  const newPlaylist: UserPlaylist = {
    id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim() || 'My Favorite Playlist',
    description,
    coverArt: tracks[0]?.artworkUrl,
    tracks,
    createdAt: Date.now(),
  };

  saveUserPlaylist(newPlaylist);
  return newPlaylist;
}

export function addTrackToExistingPlaylist(playlistId: string, track: UnifiedTrack): UserPlaylist | null {
  const playlists = getUserPlaylists();
  const target = playlists.find((p) => p.id === playlistId);
  if (!target) return null;

  if (target.tracks.some((t) => t.id === track.id)) {
    return target; // already present
  }

  const updated: UserPlaylist = {
    ...target,
    coverArt: target.coverArt || track.artworkUrl,
    tracks: [...target.tracks, track],
  };

  saveUserPlaylist(updated);
  return updated;
}

export function deleteUserPlaylist(id: string): UserPlaylist[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getUserPlaylists();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wavelength_playlists_updated'));
    return updated;
  } catch {
    return [];
  }
}

export function getLikedTracks(): UnifiedTrack[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LIKED_TRACKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLikedTrack(track: UnifiedTrack): UnifiedTrack[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getLikedTracks();
    if (current.some((t) => t.id === track.id)) return current;
    const updated = [track, ...current];
    localStorage.setItem(LIKED_TRACKS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wavelength_liked_tracks_updated'));
    return updated;
  } catch {
    return [];
  }
}

export function removeLikedTrack(trackId: string): UnifiedTrack[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getLikedTracks();
    const updated = current.filter((t) => t.id !== trackId);
    localStorage.setItem(LIKED_TRACKS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wavelength_liked_tracks_updated'));
    return updated;
  } catch {
    return [];
  }
}

export function addSpotifyPlaylistToLibrary(
  title: string,
  tracks: UnifiedTrack[],
  coverArt?: string,
): UserPlaylist {
  const newPlaylist: UserPlaylist = {
    id: `spotify-import-${Date.now()}`,
    title: title || 'Imported Spotify Playlist',
    description: `Synced from Spotify • ${tracks.length} tracks`,
    coverArt: coverArt || tracks[0]?.artworkUrl,
    tracks,
    createdAt: Date.now(),
  };

  saveUserPlaylist(newPlaylist);
  return newPlaylist;
}
