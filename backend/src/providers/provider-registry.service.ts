import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { ArchiveProvider } from './archive/archive.provider';
import { AudiusProvider } from './audius/audius.provider';
import { JamendoProvider } from './jamendo/jamendo.provider';
import { MusicProvider } from './music-provider.interface';
import { SpotifyProvider } from './spotify/spotify.provider';
import {
  ProviderName,
  SearchOptions,
  UnifiedAlbum,
  UnifiedArtist,
  UnifiedPlayback,
  UnifiedSearchResult,
  UnifiedTrack,
} from './types';

@Injectable()
export class ProviderRegistryService {
  private readonly logger = new Logger(ProviderRegistryService.name);
  private readonly providers = new Map<ProviderName, MusicProvider>();

  constructor(
    private readonly jamendoProvider: JamendoProvider,
    @Optional() private readonly audiusProvider?: AudiusProvider,
    @Optional() private readonly archiveProvider?: ArchiveProvider,
    @Optional() private readonly spotifyProvider?: SpotifyProvider,
  ) {
    this.registerProvider(jamendoProvider);
    if (audiusProvider) this.registerProvider(audiusProvider);
    if (archiveProvider) this.registerProvider(archiveProvider);
    if (spotifyProvider) this.registerProvider(spotifyProvider);
  }

  /**
   * Register a new MusicProvider adapter
   */
  registerProvider(provider: MusicProvider): void {
    this.providers.set(provider.id, provider);
    this.logger.log(`Registered music provider: ${provider.name} [id=${provider.id}]`);
  }

  /**
   * Get an active provider by ID
   */
  getProvider(id: ProviderName): MusicProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new NotFoundException(`Provider "${id}" is not registered`);
    }
    return provider;
  }

  /**
   * List all registered and enabled providers
   */
  getEnabledProviders(): MusicProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isEnabled);
  }

  /**
   * Fan-out search across all enabled providers in parallel,
   * deduplicate by ISRC or (normalized title + artist), and rank results.
   */
  async search(query: string, options?: SearchOptions): Promise<UnifiedSearchResult> {
    const enabled = this.getEnabledProviders();
    if (enabled.length === 0) {
      return {
        provider: 'aggregated',
        tracks: [],
        albums: [],
        artists: [],
        totalResults: 0,
      };
    }

    // Parallel fan-out
    const searchPromises = enabled.map((p) =>
      p.search(query, options).catch((err) => {
        this.logger.warn(`Search failed for provider ${p.id}: ${err.message}`);
        return {
          provider: p.id,
          tracks: [],
          albums: [],
          artists: [],
          totalResults: 0,
        } as UnifiedSearchResult;
      }),
    );

    const results = await Promise.all(searchPromises);

    // Merge and deduplicate tracks
    const allTracks: UnifiedTrack[] = [];
    const allAlbums: UnifiedAlbum[] = [];
    const allArtists: UnifiedArtist[] = [];

    for (const res of results) {
      allTracks.push(...res.tracks);
      allAlbums.push(...res.albums);
      allArtists.push(...res.artists);
    }

    const deduplicatedTracks = this.deduplicateTracks(allTracks);
    const deduplicatedAlbums = this.deduplicateAlbums(allAlbums);
    const deduplicatedArtists = this.deduplicateArtists(allArtists);

    return {
      provider: 'aggregated',
      tracks: deduplicatedTracks,
      albums: deduplicatedAlbums,
      artists: deduplicatedArtists,
      totalResults:
        deduplicatedTracks.length +
        deduplicatedAlbums.length +
        deduplicatedArtists.length,
    };
  }

  /**
   * Retrieve track using compound ID (e.g., "jamendo:12345") or explicit provider
   */
  async getTrack(compoundOrRawId: string, providerHint?: ProviderName): Promise<UnifiedTrack> {
    const { providerId, rawId } = this.parseCompoundId(compoundOrRawId, providerHint);
    const provider = this.getProvider(providerId);
    return provider.getTrack(rawId);
  }

  /**
   * Retrieve playback stream metadata
   */
  async getPlayback(compoundOrRawId: string, providerHint?: ProviderName): Promise<UnifiedPlayback> {
    const { providerId, rawId } = this.parseCompoundId(compoundOrRawId, providerHint);
    const provider = this.getProvider(providerId);
    return provider.getPlayback(rawId);
  }

  /**
   * Retrieve artist details
   */
  async getArtist(compoundOrRawId: string, providerHint?: ProviderName): Promise<UnifiedArtist> {
    const { providerId, rawId } = this.parseCompoundId(compoundOrRawId, providerHint);
    const provider = this.getProvider(providerId);
    return provider.getArtist(rawId);
  }

  /**
   * Retrieve album details
   */
  async getAlbum(compoundOrRawId: string, providerHint?: ProviderName): Promise<UnifiedAlbum> {
    const { providerId, rawId } = this.parseCompoundId(compoundOrRawId, providerHint);
    const provider = this.getProvider(providerId);
    return provider.getAlbum(rawId);
  }

  // --- Deduplication & Ranking Helpers ---

  public deduplicateTracks(tracks: UnifiedTrack[]): UnifiedTrack[] {
    const seenIsrc = new Set<string>();
    const seenKey = new Set<string>();
    const unique: UnifiedTrack[] = [];

    for (const track of tracks) {
      if (track.isrc) {
        const isrcNorm = track.isrc.trim().toUpperCase();
        if (seenIsrc.has(isrcNorm)) continue;
        seenIsrc.add(isrcNorm);
      }

      const key = this.normalizeKey(`${track.title}:::${track.artistName}`);
      if (seenKey.has(key)) continue;
      seenKey.add(key);

      unique.push(track);
    }

    return unique;
  }

  public deduplicateAlbums(albums: UnifiedAlbum[]): UnifiedAlbum[] {
    const seenKey = new Set<string>();
    const unique: UnifiedAlbum[] = [];

    for (const album of albums) {
      const key = this.normalizeKey(`${album.title}:::${album.artistName}`);
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      unique.push(album);
    }

    return unique;
  }

  public deduplicateArtists(artists: UnifiedArtist[]): UnifiedArtist[] {
    const seenKey = new Set<string>();
    const unique: UnifiedArtist[] = [];

    for (const artist of artists) {
      const key = this.normalizeKey(artist.name);
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      unique.push(artist);
    }

    return unique;
  }

  private normalizeKey(str: string): string {
    return str
      .toLowerCase()
      .replace(/[\(\[\{].*?[\)\]\}]/g, '') // remove parenthesized details like (Remastered)
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  private parseCompoundId(
    compoundId: string,
    providerHint?: ProviderName,
  ): { providerId: ProviderName; rawId: string } {
    if (compoundId.includes(':')) {
      const [p, ...rest] = compoundId.split(':');
      return { providerId: p as ProviderName, rawId: rest.join(':') };
    }
    if (providerHint) {
      return { providerId: providerHint, rawId: compoundId };
    }
    // Default fallback to Jamendo in Phase 1
    return { providerId: 'jamendo', rawId: compoundId };
  }
}
