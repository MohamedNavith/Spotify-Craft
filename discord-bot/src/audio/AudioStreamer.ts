import { spawn, execSync, ChildProcessWithoutNullStreams } from 'child_process';
import { createAudioResource, AudioResource, StreamType } from '@discordjs/voice';
import playdl from 'play-dl';
import ffmpegStatic from 'ffmpeg-static';
import { Track, AudioFilter } from './types';
import { AUDIO_FILTERS } from './filters';
import { searchMasterAudio } from './resolvers/masterResolver';

function resolveFfmpegPath(): string {
  if (process.platform === 'linux') {
    try {
      execSync('which ffmpeg', { stdio: 'ignore' });
      return 'ffmpeg';
    } catch {}
  }
  return ffmpegStatic || 'ffmpeg';
}

const ffmpegExecutable = resolveFfmpegPath();

export class AudioStreamer {
  private static activeProcesses = new Map<string, ChildProcessWithoutNullStreams>();

  public static async createResource(
    guildId: string,
    track: Track,
    filter: AudioFilter = 'off',
    seekSeconds = 0,
    volume = 100,
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

    // Build DSP Filter Chain + Volume
    const filterParts: string[] = [];
    const filterString = AUDIO_FILTERS[filter];
    if (filterString) {
      filterParts.push(filterString);
    }
    if (volume !== undefined && volume !== 100) {
      filterParts.push(`volume=${(Math.max(5, Math.min(150, volume)) / 100).toFixed(2)}`);
    }

    if (filterParts.length > 0) {
      ffmpegArgs.push('-af', filterParts.join(','));
    }

    ffmpegArgs.push(
      '-c:a', 'libopus',
      '-b:a', '128k',
      '-f', 'opus',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1',
    );

    const proc = spawn(ffmpegExecutable, ffmpegArgs, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.activeProcesses.set(guildId, proc);

    if (inputStream) {
      inputStream.on('error', (err: any) => {
        console.warn(`[Guild ${guildId}] Input stream warning:`, err?.message || err);
      });
      proc.stdin.on('error', (err: any) => {
        if (err.code !== 'EPIPE' && err.code !== 'EOF') {
          console.warn(`[Guild ${guildId}] FFmpeg stdin warning:`, err?.message || err);
        }
      });
      inputStream.pipe(proc.stdin);
    }

    proc.stdout.on('error', (err: any) => {
      if (err.code !== 'EPIPE') {
        console.warn(`[Guild ${guildId}] FFmpeg stdout warning:`, err?.message || err);
      }
    });

    proc.on('error', (err) => {
      console.error(`[Guild ${guildId}] FFmpeg process error:`, err);
    });

    proc.stderr.on('data', (data) => {
      const msg = data.toString();
      if (
        !msg.includes('deprecated') &&
        !msg.includes('header') &&
        !msg.includes('Connection reset by peer') &&
        !msg.includes('Broken pipe') &&
        !msg.includes('Premature close')
      ) {
        console.warn(`[Guild ${guildId}] FFmpeg: ${msg}`);
      }
    });

    proc.on('close', () => {
      this.activeProcesses.delete(guildId);
    });

    const resource = createAudioResource(proc.stdout, {
      inputType: StreamType.OggOpus,
      inlineVolume: false,
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
