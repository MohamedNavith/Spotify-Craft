import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';
import { fetchLyrics } from '../../audio/resolvers/lyricsResolver';
import { createLyricsEmbed } from '../../ui/embeds';

export const lyricsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Fetch synchronized lyrics for the current or specified song')
    .addStringOption((opt) => opt.setName('song').setDescription('Song title and artist (optional)')),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    const querySong = interaction.options.getString('song');
    let title = querySong || '';
    let artist = '';

    if (!title) {
      const queue = AudioManager.getQueue(interaction.guildId!);
      if (queue && queue.currentTrack) {
        title = queue.currentTrack.title;
        artist = queue.currentTrack.author;
      }
    }

    if (!title) {
      return interaction.editReply({
        content: '❌ **Please specify a song name or play a song first.**',
      });
    }

    const lyricsData = await fetchLyrics(title, artist);
    if (!lyricsData || !lyricsData.plainLyrics) {
      return interaction.editReply({
        content: `❌ **No lyrics found for:** \`${title}\``,
      });
    }

    const embed = createLyricsEmbed(lyricsData.title, lyricsData.artist, lyricsData.plainLyrics);
    return interaction.editReply({ embeds: [embed] });
  },
};
