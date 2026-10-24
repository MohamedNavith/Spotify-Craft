import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';

export const pauseCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current audio playback'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ **Nothing is currently playing.**', ephemeral: true });
    }
    const paused = queue.pause();
    return interaction.reply({
      content: paused ? '⏸️ **Playback paused.** Use `/resume` to continue.' : '⚠️ **Playback is already paused.**',
    });
  },
};
