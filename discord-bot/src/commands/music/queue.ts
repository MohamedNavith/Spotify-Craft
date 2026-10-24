import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';
import { createQueueEmbed } from '../../ui/embeds';

export const queueCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View the current song queue')
    .addIntegerOption((opt) => opt.setName('page').setDescription('Page number').setMinValue(1)),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue || (!queue.currentTrack && queue.tracks.length === 0)) {
      return interaction.reply({ content: '📭 **The queue is currently empty.**', ephemeral: true });
    }
    const page = interaction.options.getInteger('page') || 1;
    const embed = createQueueEmbed(queue.currentTrack, queue.tracks, page);
    return interaction.reply({ embeds: [embed] });
  },
};
