import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { createAudioResource, AudioResource, StreamType } from '@discordjs/voice';
import playdl from 'play-dl';
import ffmpegPath from 'ffmpeg-static';
import { Track, AudioFilter } from './types';
import { AUDIO_FILTERS } from './filters';
import { searchMasterAudio } from './resolvers/masterResolver';

export class AudioStreamer {
  private static activeProcesses = new Map<string, ChildProcessWithoutNullStreams>();

  public static async createResource(
    guildId: string,
    track: Track,
    filter: AudioFilter = 'off',
    seekSeconds = 0,
  ): Promise<AudioResource> {
    // Clean up any existing FFmpeg process for this guild
    this.killProcess(guildId);

    // 1. Resolve direct stream URL if not already known
    let streamUrl = track.streamUrl;
    if (!streamUrl) {
      // First try master CDN with title + author
      let master = await searchMasterAudio(`${track.title} ${track.author}`);
      if (!master) {
        // Fallback to title only
        master = await searchMasterAudio(track.title);
      }
      if (master && master.streamUrl) {
        streamUrl = master.streamUrl;
        track.streamUrl = master.streamUrl;
      }
    }

    let inputStream: any = null;
    let inputArg = streamUrl;

    if (!streamUrl) {
      // Fallback: use @distube/ytdl-core or play-dl for YouTube stream
      try {
        const { Ytdl } = require('@distube/ytdl-core');
        const ytdl = new Ytdl();
        inputStream = await ytdl.download(track.url, {
          filter: { hasAudio: true, hasVideo: false },
        });
        inputArg = 'pipe:0';
      } catch (err) {
        try {
          const streamInfo = await playdl.stream(track.url, { quality: 2 });
          inputStream = streamInfo.stream;
          inputArg = 'pipe:0';
        } catch (e2) {
          console.warn('Audio extraction failed for:', track.title, err);
          throw new Error('Could not resolve audio stream for track: ' + track.title);
        }
      }
    }

    // Build FFmpeg Arguments
    const ffmpegArgs: string[] = [];

    if (inputArg && (inputArg.startsWith('http://') || inputArg.startsWith('https://'))) {
      ffmpegArgs.push(
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
      );
    }

    ffmpegArgs.push(
      '-analyzeduration', '0',
      '-loglevel', 'error',
    );

    if (seekSeconds > 0) {
      ffmpegArgs.push('-ss', seekSeconds.toString());
    }

    ffmpegArgs.push('-i', inputArg || 'pipe:0');

    // Apply DSP Audio Filter
    const filterString = AUDIO_FILTERS[filter];
    if (filterString) {
      ffmpegArgs.push('-af', filterString);
    }

    ffmpegArgs.push(
      '-c:a', 'pcm_s16le',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1',
    );

    const proc = spawn(ffmpegPath as string, ffmpegArgs, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.activeProcesses.set(guildId, proc);

    if (inputStream) {
      inputStream.pipe(proc.stdin);
    }

    proc.on('error', (err) => {
      console.error(`[Guild ${guildId}] FFmpeg process error:`, err);
    });

    proc.stderr.on('data', (data) => {
      // Only log if meaningful error
      const msg = data.toString();
      if (!msg.includes('deprecated') && !msg.includes('header')) {
        console.warn(`[Guild ${guildId}] FFmpeg: ${msg}`);
      }
    });

    proc.on('close', () => {
      this.activeProcesses.delete(guildId);
    });

    const resource = createAudioResource(proc.stdout, {
      inputType: StreamType.Raw,
      inlineVolume: true,
    });

    return resource;
  }

  public static killProcess(guildId: string) {
    const existing = this.activeProcesses.get(guildId);
    if (existing) {
      try {
        existing.kill('SIGKILL');
      } catch {}
      this.activeProcesses.delete(guildId);
    }
  }
}
