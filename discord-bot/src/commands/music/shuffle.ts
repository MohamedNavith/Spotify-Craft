import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';

export const shuffleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Randomly shuffle the tracks in the queue'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue || queue.tracks.length < 2) {
      return interaction.reply({ content: '⚠️ **Need at least 2 tracks in the queue to shuffle.**', ephemeral: true });
    }
    queue.shuffle();
    return interaction.reply({
      content: `🔀 **Successfully shuffled ${queue.tracks.length} tracks in the queue!**`,
    });
  },
};
