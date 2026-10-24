import { joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
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
    if (existing) {
      existing.textChannel = textChannel;
      return existing;
    }

    const connection: VoiceConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator as any,
      selfDeaf: true,
    });

    const queue = new GuildQueue(guild.id, connection, textChannel);
    this.queues.set(guild.id, queue);

    connection.on('stateChange', (_, newState) => {
      if (newState.status === 'destroyed') {
        this.queues.delete(guild.id);
      }
    });

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
