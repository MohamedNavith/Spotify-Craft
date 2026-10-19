import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MusicProvider } from '../music-provider.interface';
import {
  ProviderName,
  SearchOptions,
  UnifiedAlbum,
  UnifiedArtist,
  UnifiedPlayback,
  UnifiedSearchResult,
  UnifiedTrack,
} from '../types';

@Injectable()
export class AudiusProvider implements MusicProvider {
  private readonly logger = new Logger(AudiusProvider.name);
  readonly id: ProviderName = 'audius';
  readonly name = 'Audius Open Protocol';
  readonly isEnabled = true;
  readonly requiresAuth = false;

  private host = 'https://audius-discovery-1.cultur3stake.com';
  private readonly appName = 'Wavelength';

  constructor() {
    this.initDiscoveryNode();
  }

  private async initDiscoveryNode() {
    try {
      const res = await axios.get('https://api.audius.co', { timeout: 5000 });
      if (res.data?.data?.length > 0) {
        this.host = res.data.data[0];
      }
    } catch {
      // Use fallback host
    }
  }

  async search(query: string, options?: SearchOptions): Promise<UnifiedSearchResult> {
    const limit = Math.min(options?.limit || 20, 40);

    try {
      const res = await axios.get(`${this.host}/v1/tracks/search`, {
        params: {
          query,
          app_name: this.appName,
          limit,
        },
        timeout: 8000,
      });

      const rawTracks = res.data?.data || [];
      const tracks: UnifiedTrack[] = rawTracks.map((raw: any) => this.mapTrack(raw));

      return {
        provider: this.id,
        tracks,
        albums: [],
        artists: [],
        totalResults: tracks.length,
      };
    } catch (err: any) {
      this.logger.warn(`Audius search failed: ${err.message}`);
      return {
        provider: this.id,
        tracks: [],
        albums: [],
        artists: [],
        totalResults: 0,
      };
    }
  }

  async getTrack(id: string): Promise<UnifiedTrack> {
    const rawId = id.replace('audius:', '');
    const res = await axios.get(`${this.host}/v1/tracks/${rawId}`, {
      params: { app_name: this.appName },
      timeout: 8000,
    });

    const data = res.data?.data;
    if (!data) throw new Error(`Track ${id} not found on Audius`);
    return this.mapTrack(data);
  }

  async getPlayback(id: string): Promise<UnifiedPlayback> {
    const rawId = id.replace('audius:', '');
    const streamUrl = `${this.host}/v1/tracks/${rawId}/stream?app_name=${this.appName}`;

    return {
      trackId: `audius:${rawId}`,
      provider: this.id,
      streamUrl,
      streamFormat: 'mp3',
      bitrate: 320,
      mimeType: 'audio/mpeg',
      drmProtected: false,
      license: 'Audius Open Protocol License (Streaming Free)',
      requiresPremium: false,
    };
  }

  async getArtist(id: string): Promise<UnifiedArtist> {
    const rawId = id.replace('audius:', '');
    const res = await axios.get(`${this.host}/v1/users/${rawId}`, {
      params: { app_name: this.appName },
      timeout: 8000,
    });
    const user = res.data?.data;
    if (!user) throw new Error(`Artist ${id} not found on Audius`);

    return {
      id: `audius:${user.id}`,
      provider: this.id,
      providerArtistId: String(user.id),
      name: user.name,
      artworkUrl: user.profile_picture?.['480x480'] || null,
      bio: user.bio || null,
      genres: [],
      website: user.website || null,
      monthlyListeners: user.follower_count || 0,
      topTracks: [],
    };
  }

  async getAlbum(id: string): Promise<UnifiedAlbum> {
    const rawId = id.replace('audius:', '');
    const res = await axios.get(`${this.host}/v1/playlists/${rawId}`, {
      params: { app_name: this.appName },
      timeout: 8000,
    });
    const pl = res.data?.data;
    if (!pl) throw new Error(`Album ${id} not found on Audius`);

    return {
      id: `audius:${pl.id}`,
      provider: this.id,
      providerAlbumId: String(pl.id),
      title: pl.playlist_name,
      artistName: pl.user?.name || 'Unknown',
      artistId: pl.user?.id ? `audius:${pl.user.id}` : undefined,
      coverUrl: pl.artwork?.['480x480'] || null,
      releaseDate: pl.created_at || null,
      totalTracks: pl.track_count || 0,
      tracks: [],
    };
  }

  public mapTrack(raw: any): UnifiedTrack {
    const rawId = String(raw.id);
    const streamUrl = `${this.host}/v1/tracks/${rawId}/stream?app_name=${this.appName}`;
    const artworkUrl =
      raw.artwork?.['480x480'] || raw.artwork?.['150x150'] || null;

    return {
      id: `audius:${rawId}`,
      provider: this.id,
      providerTrackId: rawId,
      isrc: raw.isrc || null,
      title: raw.title || 'Untitled Track',
      artistName: raw.user?.name || 'Audius Creator',
      artistId: raw.user?.id ? `audius:${raw.user.id}` : undefined,
      albumName: null,
      duration: Number(raw.duration) || 0,
      streamUrl,
      streamFormat: 'mp3',
      artworkUrl,
      license: 'Audius Open Community License',
      licenseUrl: 'https://audius.co/legal/terms-of-use',
      audioQuality: '320kbps (MP3)',
      explicit: false,
      year: raw.release_date ? new Date(raw.release_date).getFullYear() : null,
      genres: raw.genre ? [raw.genre] : [],
      audioDownloadAllowed: raw.downloadable ?? false,
    };
  }
}
