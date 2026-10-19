export type ProviderName =
  | 'jamendo'
  | 'audius'
  | 'archive'
  | 'spotify'
  | 'youtube'
  | 'upload';

export type StreamFormat = 'mp3' | 'aac' | 'hls' | 'dash' | 'embed';

export interface UnifiedTrack {
  id: string; // Global compound ID: `${provider}:${providerTrackId}`
  provider: ProviderName;
  providerTrackId: string;
  isrc?: string | null;
  title: string;
  artistName: string;
  artistId?: string;
  albumName?: string | null;
  albumId?: string | null;
  duration: number; // in seconds
  streamUrl?: string | null;
  streamFormat: StreamFormat;
  artworkUrl?: string | null;
  license: string; // e.g. "CC BY-SA 4.0", "Public Domain", "Official Embed", "Spotify Premium"
  licenseUrl?: string | null;
  audioQuality?: string; // e.g. "128kbps", "256kbps", "320kbps", "embed"
  explicit: boolean;
  year?: number | null;
  genres?: string[];
  audioDownloadAllowed?: boolean;
  shareUrl?: string | null;
}

export interface UnifiedPlayback {
  trackId: string;
  provider: ProviderName;
  streamUrl: string;
  streamFormat: StreamFormat;
  bitrate?: number; // in kbps
  mimeType?: string;
  expiresAt?: string;
  drmProtected: boolean;
  license: string;
  requiresPremium?: boolean;
  embedId?: string; // YouTube video ID or Spotify URI if embed
}

export interface UnifiedArtist {
  id: string;
  provider: ProviderName;
  providerArtistId: string;
  name: string;
  artworkUrl?: string | null;
  bio?: string | null;
  genres: string[];
  website?: string | null;
  monthlyListeners?: number;
  topTracks?: UnifiedTrack[];
}

export interface UnifiedAlbum {
  id: string;
  provider: ProviderName;
  providerAlbumId: string;
  title: string;
  artistName: string;
  artistId?: string;
  coverUrl?: string | null;
  releaseDate?: string | null;
  totalTracks: number;
  tracks?: UnifiedTrack[];
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  type?: ('track' | 'album' | 'artist')[];
  tags?: string[];
}

export interface UnifiedSearchResult {
  provider: ProviderName | 'aggregated';
  tracks: UnifiedTrack[];
  albums: UnifiedAlbum[];
  artists: UnifiedArtist[];
  totalResults: number;
}
