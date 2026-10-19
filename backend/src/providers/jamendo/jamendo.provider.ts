import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
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
import {
  JamendoAlbumResult,
  JamendoApiResponse,
  JamendoArtistResult,
  JamendoTrackResult,
} from './jamendo.types';

@Injectable()
export class JamendoProvider implements MusicProvider {
  private readonly logger = new Logger(JamendoProvider.name);
  readonly id: ProviderName = 'jamendo';
  readonly name = 'Jamendo Music';
  readonly requiresAuth = false;

  private readonly clientId: string;
  private readonly baseUrl: string;
  private readonly http: AxiosInstance;

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.clientId =
      this.configService?.get?.('JAMENDO_CLIENT_ID') ||
      process.env.JAMENDO_CLIENT_ID ||
      '17ed92bf';
    this.baseUrl =
      this.configService?.get?.('JAMENDO_BASE_URL') ||
      process.env.JAMENDO_BASE_URL ||
      'https://api.jamendo.com/v3.0';

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Wavelength-Music-Player/1.0',
      },
    });
  }

  get isEnabled(): boolean {
    return Boolean(this.clientId);
  }

  async search(query: string, options?: SearchOptions): Promise<UnifiedSearchResult> {
    const limit = Math.min(options?.limit || 20, 50);
    const offset = options?.offset || 0;

    try {
      const [tracksRes, artistsRes, albumsRes] = await Promise.allSettled([
        this.http.get<JamendoApiResponse<JamendoTrackResult>>('/tracks/', {
          params: {
            client_id: this.clientId,
            format: 'json',
            limit,
            offset,
            namesearch: query,
            include: 'musicinfo',
            order: 'popularity_total',
          },
        }),
        this.http.get<JamendoApiResponse<JamendoArtistResult>>('/artists/', {
          params: {
            client_id: this.clientId,
            format: 'json',
            limit: 5,
            namesearch: query,
            order: 'popularity_total',
          },
        }),
        this.http.get<JamendoApiResponse<JamendoAlbumResult>>('/albums/', {
          params: {
            client_id: this.clientId,
            format: 'json',
            limit: 5,
            namesearch: query,
            order: 'popularity_total',
          },
        }),
      ]);

      const tracks: UnifiedTrack[] = [];
      if (tracksRes.status === 'fulfilled' && tracksRes.value.data.results) {
        for (const item of tracksRes.value.data.results) {
          tracks.push(this.mapTrack(item));
        }
      }

      const artists: UnifiedArtist[] = [];
      if (artistsRes.status === 'fulfilled' && artistsRes.value.data.results) {
        for (const item of artistsRes.value.data.results) {
          artists.push(this.mapArtist(item));
        }
      }

      const albums: UnifiedAlbum[] = [];
      if (albumsRes.status === 'fulfilled' && albumsRes.value.data.results) {
        for (const item of albumsRes.value.data.results) {
          albums.push(this.mapAlbum(item));
        }
      }

      return {
        provider: this.id,
        tracks,
        albums,
        artists,
        totalResults: tracks.length + albums.length + artists.length,
      };
    } catch (err: any) {
      this.logger.error(`Jamendo search failed: ${err.message}`);
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
    const rawId = this.stripProviderPrefix(id);
    const res = await this.http.get<JamendoApiResponse<JamendoTrackResult>>('/tracks/', {
      params: {
        client_id: this.clientId,
        format: 'json',
        id: rawId,
        include: 'musicinfo',
      },
    });

    if (!res.data.results || res.data.results.length === 0) {
      throw new Error(`Track with ID ${id} not found in Jamendo`);
    }

    return this.mapTrack(res.data.results[0]);
  }

  async getPlayback(id: string): Promise<UnifiedPlayback> {
    const track = await this.getTrack(id);

    return {
      trackId: track.id,
      provider: this.id,
      streamUrl: track.streamUrl || '',
      streamFormat: 'mp3',
      bitrate: 192,
      mimeType: 'audio/mpeg',
      drmProtected: false,
      license: track.license,
      requiresPremium: false,
    };
  }

  async getArtist(id: string): Promise<UnifiedArtist> {
    const rawId = this.stripProviderPrefix(id);
    const [artistRes, tracksRes] = await Promise.allSettled([
      this.http.get<JamendoApiResponse<JamendoArtistResult>>('/artists/', {
        params: {
          client_id: this.clientId,
          format: 'json',
          id: rawId,
        },
      }),
      this.http.get<JamendoApiResponse<JamendoTrackResult>>('/tracks/', {
        params: {
          client_id: this.clientId,
          format: 'json',
          artist_id: rawId,
          limit: 10,
          order: 'popularity_total',
          include: 'musicinfo',
        },
      }),
    ]);

    if (artistRes.status !== 'fulfilled' || !artistRes.value.data.results?.length) {
      throw new Error(`Artist with ID ${id} not found in Jamendo`);
    }

    const artistData = artistRes.value.data.results[0];
    const topTracks: UnifiedTrack[] = [];
    if (tracksRes.status === 'fulfilled' && tracksRes.value.data.results) {
      for (const t of tracksRes.value.data.results) {
        topTracks.push(this.mapTrack(t));
      }
    }

    return this.mapArtist(artistData, topTracks);
  }

  async getAlbum(id: string): Promise<UnifiedAlbum> {
    const rawId = this.stripProviderPrefix(id);
    const [albumRes, tracksRes] = await Promise.allSettled([
      this.http.get<JamendoApiResponse<JamendoAlbumResult>>('/albums/', {
        params: {
          client_id: this.clientId,
          format: 'json',
          id: rawId,
        },
      }),
      this.http.get<JamendoApiResponse<JamendoTrackResult>>('/tracks/', {
        params: {
          client_id: this.clientId,
          format: 'json',
          album_id: rawId,
          limit: 50,
          order: 'track_position_asc',
          include: 'musicinfo',
        },
      }),
    ]);

    if (albumRes.status !== 'fulfilled' || !albumRes.value.data.results?.length) {
      throw new Error(`Album with ID ${id} not found in Jamendo`);
    }

    const albumData = albumRes.value.data.results[0];
    const tracks: UnifiedTrack[] = [];
    if (tracksRes.status === 'fulfilled' && tracksRes.value.data.results) {
      for (const t of tracksRes.value.data.results) {
        tracks.push(this.mapTrack(t));
      }
    }

    return this.mapAlbum(albumData, tracks);
  }

  // --- Internal Mapping Helpers ---

  public mapTrack(raw: JamendoTrackResult): UnifiedTrack {
    const compoundId = `jamendo:${raw.id}`;
    const license = raw.license_ccurl
      ? `Creative Commons (${raw.license_ccurl})`
      : 'Jamendo Free License (Personal Use)';

    const genres = raw.musicinfo?.tags?.genres || [];

    return {
      id: compoundId,
      provider: this.id,
      providerTrackId: String(raw.id),
      isrc: null,
      title: raw.name || 'Untitled Track',
      artistName: raw.artist_name || 'Unknown Artist',
      artistId: raw.artist_id ? `jamendo:${raw.artist_id}` : undefined,
      albumName: raw.album_name || null,
      albumId: raw.album_id ? `jamendo:${raw.album_id}` : null,
      duration: Number(raw.duration) || 0,
      streamUrl: raw.audio || null,
      streamFormat: 'mp3',
      artworkUrl: raw.image || raw.album_image || null,
      license,
      licenseUrl: raw.license_ccurl || 'https://www.jamendo.com/legal/licenses',
      audioQuality: '192kbps (MP3)',
      explicit: false,
      year: raw.releasedate ? new Date(raw.releasedate).getFullYear() : null,
      genres,
      audioDownloadAllowed: raw.audiodownload_allowed ?? true,
      shareUrl: raw.shareurl || null,
    };
  }

  public mapArtist(raw: JamendoArtistResult, topTracks?: UnifiedTrack[]): UnifiedArtist {
    return {
      id: `jamendo:${raw.id}`,
      provider: this.id,
      providerArtistId: String(raw.id),
      name: raw.name,
      artworkUrl: raw.image || null,
      bio: null,
      genres: [],
      website: raw.website || null,
      monthlyListeners: 0,
      topTracks: topTracks || [],
    };
  }

  public mapAlbum(raw: JamendoAlbumResult, tracks?: UnifiedTrack[]): UnifiedAlbum {
    return {
      id: `jamendo:${raw.id}`,
      provider: this.id,
      providerAlbumId: String(raw.id),
      title: raw.name,
      artistName: raw.artist_name,
      artistId: raw.artist_id ? `jamendo:${raw.artist_id}` : undefined,
      coverUrl: raw.image || null,
      releaseDate: raw.releasedate || null,
      totalTracks: tracks ? tracks.length : 0,
      tracks: tracks || [],
    };
  }

  private stripProviderPrefix(id: string): string {
    if (id.startsWith('jamendo:')) {
      return id.replace('jamendo:', '');
    }
    return id;
  }
}
