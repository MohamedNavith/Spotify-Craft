import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsResponse {
  trackName: string;
  artistName: string;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  parsedLines: LyricLine[];
}

@Injectable()
export class LyricsService {
  private readonly logger = new Logger(LyricsService.name);
  private readonly lrclibUrl = 'https://lrclib.net/api/get';

  async getLyrics(
    trackName: string,
    artistName: string,
    duration?: number,
  ): Promise<LyricsResponse> {
    try {
      const res = await axios.get(this.lrclibUrl, {
        params: {
          track_name: trackName,
          artist_name: artistName,
          duration: duration ? Math.round(duration) : undefined,
        },
        timeout: 6000,
        headers: {
          'User-Agent': 'Wavelength-Music/1.0 (https://github.com/MohamedNavith/Spotify-Craft)',
        },
      });

      const data = res.data;
      const parsedLines = data.syncedLyrics
        ? this.parseLrc(data.syncedLyrics)
        : [];

      return {
        trackName: data.trackName || trackName,
        artistName: data.artistName || artistName,
        instrumental: Boolean(data.instrumental),
        plainLyrics: data.plainLyrics || null,
        syncedLyrics: data.syncedLyrics || null,
        parsedLines,
      };
    } catch (err: any) {
      this.logger.debug(`LRCLIB lookup failed: ${err.message}`);
      return {
        trackName,
        artistName,
        instrumental: false,
        plainLyrics: null,
        syncedLyrics: null,
        parsedLines: [],
      };
    }
  }

  public parseLrc(lrcText: string): LyricLine[] {
    const lines = lrcText.split('\n');
    const result: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    for (const line of lines) {
      const match = timeRegex.exec(line.trim());
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const fraction = parseFloat(`0.${match[3]}`);
        const totalTime = minutes * 60 + seconds + fraction;
        const text = match[4].trim();

        if (text) {
          result.push({ time: totalTime, text });
        }
      }
    }

    return result.sort((a, b) => a.time - b.time);
  }
}
