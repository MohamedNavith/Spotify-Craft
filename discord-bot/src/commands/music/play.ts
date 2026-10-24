import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';
import { isSpotifyUrl, resolveSpotify } from '../../audio/resolvers/spotifyResolver';
import { resolveYouTubeOrSearch } from '../../audio/resolvers/youtubeResolver';
import { config } from '../../config';

export const playCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play any song, playlist, Spotify link, or search query with 320kbps master audio')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Song title, artist name, Spotify link, YouTube URL, or direct stream')
        .setRequired(true),
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();

    const member = interaction.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.editReply({
        content: '❌ **You must be in a voice channel to play music!**',
      });
    }

    const query = interaction.options.getString('query', true).trim();

    const requester = {
      id: interaction.user.id,
      username: interaction.user.username,
      avatarUrl: interaction.user.displayAvatarURL(),
    };

    let tracks = [];
    try {
      if (isSpotifyUrl(query)) {
        tracks = await resolveSpotify(query, requester);
      } else {
        tracks = await resolveYouTubeOrSearch(query, requester);
      }
    } catch (err: any) {
      return interaction.editReply({
        content: `❌ **Failed to load audio:** ${err?.message || 'Error occurred while resolving track.'}`,
      });
    }

    if (tracks.length === 0) {
      return interaction.editReply({
        content: `❌ **No audio results found for:** \`${query}\`. Try searching with the artist name or Spotify link.`,
      });
    }

    const queue = await AudioManager.createQueue(
      interaction.guild!,
      voiceChannel,
      interaction.channel!,
    );

    if (tracks.length === 1) {
      const track = tracks[0];
      const isFirst = !queue.currentTrack && queue.tracks.length === 0;
      await queue.addTrack(track);

      if (isFirst) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.embedColor)
              .setDescription(`🎶 **Now Playing:** [${track.title}](${track.url}) by **${track.author}** (\`${track.formattedDuration}\`)`)
              .setThumbnail(track.thumbnail),
          ],
        });
      } else {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.embedColor)
              .setDescription(`✅ **Queued at position #${queue.tracks.length}:** [${track.title}](${track.url}) by **${track.author}** (\`${track.formattedDuration}\`)`)
              .setThumbnail(track.thumbnail),
          ],
        });
      }
    } else {
      // Playlist queued
      await queue.addTracks(tracks);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('📦 Playlist Queued')
            .setDescription(`Successfully imported **${tracks.length} tracks** into the queue!\nFirst track: **[${tracks[0].title}](${tracks[0].url})**`)
            .setThumbnail(tracks[0].thumbnail),
        ],
      });
    }
  },
};
