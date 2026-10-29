import { joinVoiceChannel, VoiceConnection, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { Guild, TextBasedChannel, VoiceBasedChannel } from 'discord.js';
import { GuildQueue } from './GuildQueue';

export class AudioManager {
  private static queues = new Map<string, GuildQueue>();

  public static getQueue(guildId: string): GuildQueue | undefined {
    return this.queues.get(guildId);
  }

  public static hasQueue(guildId: string): boolean {
    return this.queues.has(guildId);
  }

  public static async createQueue(
    guild: Guild,
    voiceChannel: VoiceBasedChannel,
    textChannel: TextBasedChannel,
  ): Promise<GuildQueue> {
    const existing = this.queues.get(guild.id);
    if (existing && existing.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
      existing.textChannel = textChannel;
      return existing;
    }

    const connection: VoiceConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator as any,
      selfDeaf: true,
    });

    connection.on('stateChange', (oldState, newState) => {
      console.log(`[VoiceConnection - Guild ${guild.id}] State: ${oldState.status} -> ${newState.status}`);
      if (newState.status === VoiceConnectionStatus.Destroyed) {
        this.queues.delete(guild.id);
      }
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
    } catch (err) {
      console.warn(`[AudioManager] Voice connection for guild ${guild.id} status is currently ${connection.state.status}. Proceeding with audio pipeline...`);
    }

    const queue = new GuildQueue(guild.id, connection, textChannel);
    this.queues.set(guild.id, queue);

    return queue;
  }

  public static removeQueue(guildId: string) {
    const queue = this.queues.get(guildId);
    if (queue) {
      queue.destroy();
      this.queues.delete(guildId);
    }
  }

  public static getActiveCount(): number {
    return this.queues.size;
  }
}
