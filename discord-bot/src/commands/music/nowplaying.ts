import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';
import { createNowPlayingEmbed } from '../../ui/embeds';
import { createPlayerButtons, createFilterSelectMenu } from '../../ui/buttons';

export const nowplayingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Display the currently playing song dashboard with interactive controls'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ **Nothing is currently playing.**', ephemeral: true });
    }

    const embed = createNowPlayingEmbed(
      queue.currentTrack,
      queue.currentPlaybackSeconds,
      queue.volume,
      queue.loopMode,
      queue.currentFilter,
      queue.isAutoplay,
      !queue.isPaused,
    );
    const buttons = createPlayerButtons(!queue.isPaused, queue.loopMode, queue.isAutoplay);
    const filterMenu = createFilterSelectMenu(queue.currentFilter);

    return interaction.reply({
      embeds: [embed],
      components: [...buttons, filterMenu],
    });
  },
};
