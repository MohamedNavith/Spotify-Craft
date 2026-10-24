import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';

export const resumeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume paused audio playback'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ **Nothing is currently playing.**', ephemeral: true });
    }
    const resumed = queue.resume();
    return interaction.reply({
      content: resumed ? '▶️ **Playback resumed.**' : '⚠️ **Playback is not paused.**',
    });
  },
};
