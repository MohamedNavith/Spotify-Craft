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
export class ArchiveProvider implements MusicProvider {
  private readonly logger = new Logger(ArchiveProvider.name);
  readonly id: ProviderName = 'archive';
  readonly name = 'Internet Archive & Public Domain';
  readonly isEnabled = true;
  readonly requiresAuth = false;

  private readonly baseUrl = 'https://archive.org';

  async search(query: string, options?: SearchOptions): Promise<UnifiedSearchResult> {
    const limit = Math.min(options?.limit || 15, 30);

    try {
      const q = `mediatype:audio AND (collection:etree OR collection:audio_music OR collection:georgeblood) AND (${query})`;
      const res = await axios.get(`${this.baseUrl}/advancedsearch.php`, {
        params: {
          q,
          fl: ['identifier', 'title', 'creator', 'year', 'publicdate', 'description'],
          sort: ['downloads desc'],
          rows: limit,
          page: 1,
          output: 'json',
        },
        timeout: 9000,
      });

      const docs = res.data?.response?.docs || [];
      const tracks: UnifiedTrack[] = docs.map((doc: any) => this.mapDocToTrack(doc));

      return {
        provider: this.id,
        tracks,
        albums: [],
        artists: [],
        totalResults: tracks.length,
      };
    } catch (err: any) {
      this.logger.warn(`Internet Archive search failed: ${err.message}`);
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
    const rawId = id.replace('archive:', '');
    const metaRes = await axios.get(`${this.baseUrl}/metadata/${rawId}`, {
      timeout: 8000,
    });
    const meta = metaRes.data;
    if (!meta) throw new Error(`Track ${id} not found in Archive`);

    const files: any[] = meta.files || [];
    const audioFile = files.find(
      (f) =>
        f.format?.toLowerCase().includes('vbr mp3') ||
        f.format?.toLowerCase().includes('mp3') ||
        f.name?.endsWith('.mp3'),
    );

    const streamUrl = audioFile
      ? `${this.baseUrl}/download/${rawId}/${encodeURIComponent(audioFile.name)}`
      : null;

    const artworkFile = files.find(
      (f) =>
        f.format?.toLowerCase().includes('item image') ||
        f.name?.endsWith('.jpg') ||
        f.name?.endsWith('.png'),
    );

    const artworkUrl = artworkFile
      ? `${this.baseUrl}/download/${rawId}/${encodeURIComponent(artworkFile.name)}`
      : `https://archive.org/services/img/${rawId}`;

    return {
      id: `archive:${rawId}`,
      provider: this.id,
      providerTrackId: rawId,
      isrc: null,
      title: meta.metadata?.title || rawId,
      artistName: meta.metadata?.creator || 'Public Domain / Free Music Archive',
      albumName: meta.metadata?.collection?.[0] || 'Internet Archive Live',
      duration: Math.floor(Number(audioFile?.length) || 180),
      streamUrl,
      streamFormat: 'mp3',
      artworkUrl,
      license: 'Public Domain / Creative Commons (CC0 / CC BY)',
      licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
      audioQuality: 'VBR MP3 (Original Lossless Source)',
      explicit: false,
      year: meta.metadata?.year ? parseInt(meta.metadata.year, 10) : null,
      genres: ['Archive', 'Live', 'Public Domain'],
      audioDownloadAllowed: true,
      shareUrl: `https://archive.org/details/${rawId}`,
    };
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
    const rawId = id.replace('archive:', '');
    return {
      id: `archive:${rawId}`,
      provider: this.id,
      providerArtistId: rawId,
      name: rawId.replace(/[-_]/g, ' '),
      artworkUrl: `https://archive.org/services/img/${rawId}`,
      bio: 'Public Domain and Open Audio Contributor on Internet Archive.',
      genres: ['Live Music', 'Public Domain'],
      monthlyListeners: 0,
      topTracks: [],
    };
  }

  async getAlbum(id: string): Promise<UnifiedAlbum> {
    const rawId = id.replace('archive:', '');
    return {
      id: `archive:${rawId}`,
      provider: this.id,
      providerAlbumId: rawId,
      title: rawId.replace(/[-_]/g, ' '),
      artistName: 'Internet Archive Contributor',
      coverUrl: `https://archive.org/services/img/${rawId}`,
      totalTracks: 1,
      tracks: [],
    };
  }

  private mapDocToTrack(doc: any): UnifiedTrack {
    const rawId = String(doc.identifier);
    const artworkUrl = `https://archive.org/services/img/${rawId}`;

    return {
      id: `archive:${rawId}`,
      provider: this.id,
      providerTrackId: rawId,
      isrc: null,
      title: Array.isArray(doc.title) ? doc.title[0] : doc.title || rawId,
      artistName: Array.isArray(doc.creator)
        ? doc.creator[0]
        : doc.creator || 'Open Audio Archive',
      albumName: 'Internet Archive Public Collection',
      duration: 240, // Estimated until detailed metadata loaded
      streamUrl: `${this.baseUrl}/download/${rawId}`,
      streamFormat: 'mp3',
      artworkUrl,
      license: 'Public Domain / CC-BY (Internet Archive)',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      audioQuality: 'MP3',
      explicit: false,
      year: doc.year ? parseInt(doc.year, 10) : null,
      genres: ['Public Domain', 'Archive'],
      audioDownloadAllowed: true,
      shareUrl: `https://archive.org/details/${rawId}`,
    };
  }
}
