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
    // Trigger custom event so all open views (Sidebar, Library) update in real time!
    window.dispatchEvent(new CustomEvent('wavelength_playlists_updated'));
    return updated;
  } catch (err) {
    console.warn('Failed to save user playlist:', err);
    return [];
  }
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
