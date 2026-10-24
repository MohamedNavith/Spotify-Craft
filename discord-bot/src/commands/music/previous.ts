import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';

export const previousCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Replay the previously played song'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue) {
      return interaction.reply({ content: '❌ **No active player found.**', ephemeral: true });
    }
    const success = await queue.previous();
    if (!success) {
      return interaction.reply({ content: '⚠️ **No previous tracks found in history.**', ephemeral: true });
    }
    return interaction.reply({
      content: `⏮️ **Replaying previous song:** [${queue.currentTrack?.title}](${queue.currentTrack?.url})`,
    });
  },
};
