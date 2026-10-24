import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';

export const stopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback, clear the queue, and leave voice channel'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue) {
      return interaction.reply({ content: '❌ **Nothing is currently playing.**', ephemeral: true });
    }
    queue.stop();
    AudioManager.removeQueue(interaction.guildId!);
    return interaction.reply({
      content: '⏹️ **Playback stopped and queue cleared.**',
    });
  },
};
