import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { TextBasedChannel, Message } from 'discord.js';
import { Track, LoopMode, AudioFilter } from './types';
import { AudioStreamer } from './AudioStreamer';
import { db } from '../database/db';
import { createNowPlayingEmbed } from '../ui/embeds';
import { createPlayerButtons, createFilterSelectMenu } from '../ui/buttons';
import { searchMasterAudio } from './resolvers/masterResolver';

export class GuildQueue {
  public guildId: string;
  public voiceConnection: VoiceConnection;
  public textChannel: TextBasedChannel;
  public audioPlayer: AudioPlayer;
  public currentResource: AudioResource | null = null;

  public tracks: Track[] = [];
  public currentTrack: Track | null = null;
  public previousTracks: Track[] = [];

  public volume: number = 80;
  public loopMode: LoopMode = 'off';
  public currentFilter: AudioFilter = 'off';
  public isAutoplay: boolean = false;

  public playbackStartTime: number = 0;
  public currentSeekOffset: number = 0;
  public isPaused: boolean = false;

  private nowPlayingMessage: Message | null = null;
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(guildId: string, voiceConnection: VoiceConnection, textChannel: TextBasedChannel) {
    this.guildId = guildId;
    this.voiceConnection = voiceConnection;
    this.textChannel = textChannel;

    const settings = db.getGuildSettings(guildId);
    this.volume = settings.defaultVolume;
    this.currentFilter = settings.defaultFilter;

    this.audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    this.voiceConnection.subscribe(this.audioPlayer);
    this.setupListeners();
    this.resetIdleTimer();
  }

  private setupListeners() {
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.handleTrackEnd();
    });

    this.audioPlayer.on('error', (err) => {
      console.error(`[Guild ${this.guildId}] AudioPlayer Error:`, err);
      this.handleTrackEnd();
    });

    this.voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.voiceConnection, VoiceConnectionStatus.Signalling, 5000),
          entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch (e) {
        this.destroy();
      }
    });
  }

  public get currentPlaybackSeconds(): number {
    if (!this.currentTrack || this.playbackStartTime === 0) return 0;
    const elapsed = (Date.now() - this.playbackStartTime) / 1000;
    return Math.floor(this.currentSeekOffset + elapsed);
  }

  public async addTrack(track: Track, playNow = false) {
    if (playNow) {
      this.tracks.unshift(track);
    } else {
      this.tracks.push(track);
    }

    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle && !this.currentTrack) {
      await this.playNext();
    }
  }

  public async addTracks(newTracks: Track[]) {
    this.tracks.push(...newTracks);
    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle && !this.currentTrack) {
      await this.playNext();
    }
  }

  public async playNext(): Promise<boolean> {
    this.clearIdleTimer();

    if (this.tracks.length === 0) {
      if (this.isAutoplay && this.currentTrack) {
        const found = await this.triggerAutoplay(this.currentTrack);
        if (found) return true;
      }

      this.currentTrack = null;
      this.resetIdleTimer();
      return false;
    }

    const nextTrack = this.tracks.shift()!;
    if (this.currentTrack) {
      this.previousTracks.unshift(this.currentTrack);
      if (this.previousTracks.length > 20) this.previousTracks.pop();
    }

    await this.startPlayback(nextTrack, 0);
    return true;
  }

  public async startPlayback(track: Track, seekSeconds = 0) {
    try {
      this.currentTrack = track;
      this.currentSeekOffset = seekSeconds;
      this.playbackStartTime = Date.now();
      this.isPaused = false;

      const resource = await AudioStreamer.createResource(
        this.guildId,
        track,
        this.currentFilter,
        seekSeconds,
        this.volume,
      );

      this.currentResource = resource;
      if (resource.volume) {
        resource.volume.setVolumeLogarithmic(this.volume / 100);
      }

      this.audioPlayer.play(resource);
      db.addHistory(this.guildId, track);

      await this.sendNowPlayingMessage();
    } catch (err) {
      console.error(`Failed to play track ${track.title}:`, err);
      // Attempt next track
      await this.playNext();
    }
  }

  private async handleTrackEnd() {
    AudioStreamer.killProcess(this.guildId);

    if (this.loopMode === 'track' && this.currentTrack) {
      await this.startPlayback(this.currentTrack, 0);
      return;
    }

    if (this.loopMode === 'queue' && this.currentTrack) {
      this.tracks.push(this.currentTrack);
    }

    await this.playNext();
  }

  public pause(): boolean {
    if (this.isPaused) return false;
    this.audioPlayer.pause();
    this.isPaused = true;
    this.updateNowPlayingMessage();
    return true;
  }

  public resume(): boolean {
    if (!this.isPaused) return false;
    this.audioPlayer.unpause();
    this.isPaused = false;
    this.updateNowPlayingMessage();
    return true;
  }

  public togglePlay(): boolean {
    if (this.isPaused) {
      return this.resume();
    } else {
      return this.pause();
    }
  }

  public async skip(): Promise<boolean> {
    if (this.tracks.length === 0 && !this.isAutoplay) {
      this.stop();
      return true;
    }
    this.audioPlayer.stop();
    return true;
  }

  public async previous(): Promise<boolean> {
    if (this.previousTracks.length === 0) return false;
    const prev = this.previousTracks.shift()!;
    if (this.currentTrack) {
      this.tracks.unshift(this.currentTrack);
    }
    await this.startPlayback(prev, 0);
    return true;
  }

  public async seek(seconds: number): Promise<boolean> {
    if (!this.currentTrack) return false;
    const target = Math.max(0, Math.min(seconds, this.currentTrack.duration));
    await this.startPlayback(this.currentTrack, target);
    return true;
  }

  public async setFilter(filter: AudioFilter): Promise<boolean> {
    if (!this.currentTrack) return false;
    this.currentFilter = filter;
    const currentPos = this.currentPlaybackSeconds;
    await this.startPlayback(this.currentTrack, currentPos);
    return true;
  }

  public async setVolume(vol: number): Promise<boolean> {
    this.volume = Math.max(0, Math.min(150, vol));
    if (this.currentResource && this.currentResource.volume) {
      this.currentResource.volume.setVolumeLogarithmic(this.volume / 100);
    } else if (this.currentTrack && !this.isPaused) {
      const currentPos = this.currentPlaybackSeconds;
      await this.startPlayback(this.currentTrack, currentPos);
    }
    this.updateNowPlayingMessage();
    return true;
  }

  public setLoop(mode: LoopMode) {
    this.loopMode = mode;
    this.updateNowPlayingMessage();
  }

  public toggleAutoplay(): boolean {
    this.isAutoplay = !this.isAutoplay;
    this.updateNowPlayingMessage();
    return this.isAutoplay;
  }

  public shuffle() {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  public remove(index: number): Track | null {
    if (index < 0 || index >= this.tracks.length) return null;
    return this.tracks.splice(index, 1)[0] || null;
  }

  public move(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.tracks.length) return false;
    if (toIndex < 0 || toIndex >= this.tracks.length) return false;
    const [moved] = this.tracks.splice(fromIndex, 1);
    this.tracks.splice(toIndex, 0, moved);
    return true;
  }

  public stop() {
    this.tracks = [];
    this.currentTrack = null;
    this.audioPlayer.stop();
    AudioStreamer.killProcess(this.guildId);

    const settings = db.getGuildSettings(this.guildId);
    if (!settings.mode247) {
      this.resetIdleTimer();
    }
  }

  public destroy() {
    this.clearIdleTimer();
    AudioStreamer.killProcess(this.guildId);
    this.audioPlayer.stop();
    try {
      this.voiceConnection.destroy();
    } catch {}
  }

  private async triggerAutoplay(lastTrack: Track): Promise<boolean> {
    try {
      // Find similar tracks by searching artist or genre
      const master = await searchMasterAudio(lastTrack.author);
      if (master && master.title !== lastTrack.title) {
        this.tracks.push({
          title: master.title,
          author: master.artist,
          url: master.streamUrl,
          streamUrl: master.streamUrl,
          duration: master.duration,
          formattedDuration: `${Math.floor(master.duration / 60)}:${(master.duration % 60).toString().padStart(2, '0')}`,
          thumbnail: master.thumbnail,
          requester: { id: '0', username: 'Wavelength Autoplay', avatarUrl: '' },
          source: 'wavelength',
        });
        await this.playNext();
        return true;
      }
    } catch {}
    return false;
  }

  public async sendNowPlayingMessage() {
    if (!this.currentTrack) return;
    const settings = db.getGuildSettings(this.guildId);
    if (!settings.announceNowPlaying) return;

    try {
      const embed = createNowPlayingEmbed(
        this.currentTrack,
        this.currentPlaybackSeconds,
        this.volume,
        this.loopMode,
        this.currentFilter,
        this.isAutoplay,
        !this.isPaused,
      );

      const buttons = createPlayerButtons(!this.isPaused, this.loopMode, this.isAutoplay);
      const filterMenu = createFilterSelectMenu(this.currentFilter);

      // Delete old message if still present
      if (this.nowPlayingMessage) {
        try {
          await this.nowPlayingMessage.delete();
        } catch {}
      }

      if ('send' in this.textChannel) {
        this.nowPlayingMessage = await (this.textChannel as any).send({
          embeds: [embed],
          components: [...buttons, filterMenu],
        });
      }
    } catch (err) {
      console.error('Error sending now playing message:', err);
    }
  }

  public async updateNowPlayingMessage() {
    if (!this.nowPlayingMessage || !this.currentTrack) return;
    try {
      const embed = createNowPlayingEmbed(
        this.currentTrack,
        this.currentPlaybackSeconds,
        this.volume,
        this.loopMode,
        this.currentFilter,
        this.isAutoplay,
        !this.isPaused,
      );
      const buttons = createPlayerButtons(!this.isPaused, this.loopMode, this.isAutoplay);
      const filterMenu = createFilterSelectMenu(this.currentFilter);

      await this.nowPlayingMessage.edit({
        embeds: [embed],
        components: [...buttons, filterMenu],
      });
    } catch {}
  }

  public resetIdleTimer() {
    this.clearIdleTimer();
    const settings = db.getGuildSettings(this.guildId);
    if (settings.mode247) return; // 24/7 mode: never disconnect

    this.idleTimer = setTimeout(() => {
      this.destroy();
    }, settings.idleTimeoutSeconds * 1000);
  }

  public clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }
}
