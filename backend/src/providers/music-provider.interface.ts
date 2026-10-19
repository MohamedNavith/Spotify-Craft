import {
  ProviderName,
  SearchOptions,
  UnifiedAlbum,
  UnifiedArtist,
  UnifiedPlayback,
  UnifiedSearchResult,
  UnifiedTrack,
} from './types';

/**
 * Universal Music Provider Interface for Wavelength
 * All providers (Jamendo, Audius, Internet Archive, Spotify, YouTube, Uploads)
 * implement this contract.
 */
export interface MusicProvider {
  readonly id: ProviderName;
  readonly name: string;
  readonly isEnabled: boolean;
  readonly requiresAuth: boolean;

  /**
   * Search for tracks, albums, or artists
   */
  search(query: string, options?: SearchOptions): Promise<UnifiedSearchResult>;

  /**
   * Retrieve a single track by its provider-specific ID
   */
  getTrack(id: string): Promise<UnifiedTrack>;

  /**
   * Retrieve streaming / playback metadata and direct URL or embed configuration
   */
  getPlayback(id: string): Promise<UnifiedPlayback>;

  /**
   * Retrieve artist profile, bio, genres, and top tracks
   */
  getArtist(id: string): Promise<UnifiedArtist>;

  /**
   * Retrieve album information and tracklist
   */
  getAlbum(id: string): Promise<UnifiedAlbum>;
}
