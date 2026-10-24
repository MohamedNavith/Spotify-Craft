import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, GuildMember } from 'discord.js';
import { Command } from '../command.interface';
import { db } from '../../database/db';
import { AudioManager } from '../../audio/AudioManager';
import { config } from '../../config';

export const playlistCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Manage your personal custom playlists')
    .addSubcommand((sub) =>
      sub
        .setName('save')
        .setDescription('Save the current playing queue as your custom playlist')
        .addStringOption((opt) => opt.setName('name').setDescription('Playlist name').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('play')
        .setDescription('Play one of your saved custom playlists')
        .addStringOption((opt) => opt.setName('name').setDescription('Playlist name').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('List all your saved custom playlists'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete one of your custom playlists')
        .addStringOption((opt) => opt.setName('name').setDescription('Playlist name').setRequired(true)),
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'save') {
      const name = interaction.options.getString('name', true).trim();
      const queue = AudioManager.getQueue(interaction.guildId!);
      if (!queue || (!queue.currentTrack && queue.tracks.length === 0)) {
        return interaction.reply({ content: '❌ **The queue is currently empty.** Play some songs first to save them.', ephemeral: true });
      }

      const allTracks = [];
      if (queue.currentTrack) allTracks.push(queue.currentTrack);
      allTracks.push(...queue.tracks);

      db.saveUserPlaylist(userId, name, allTracks);
      return interaction.reply({
        content: `💾 **Saved custom playlist \`${name}\` with ${allTracks.length} tracks!** Use \`/playlist play name:${name}\` to listen anytime.`,
      });
    }

    if (sub === 'list') {
      const playlists = db.getUserPlaylists(userId);
      if (playlists.length === 0) {
        return interaction.reply({ content: '📭 **You have no saved custom playlists.** Use `/playlist save <name>` to create one!', ephemeral: true });
      }

      const list = playlists.map((p, i) => `\`${i + 1}.\` **${p.name}** — ${p.tracks.length} tracks`).join('\n');
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`📂 ${interaction.user.username}'s Saved Playlists`)
        .setDescription(list);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'play') {
      const name = interaction.options.getString('name', true).trim();
      const playlists = db.getUserPlaylists(userId);
      const target = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());

      if (!target) {
        return interaction.reply({ content: `❌ **Playlist \`${name}\` not found.** Use \`/playlist list\` to view your playlists.`, ephemeral: true });
      }

      const member = interaction.member as GuildMember;
      const voiceChannel = member?.voice?.channel;
      if (!voiceChannel) {
        return interaction.reply({ content: '❌ **You must be in a voice channel to play music!**', ephemeral: true });
      }

      await interaction.deferReply();
      const queue = await AudioManager.createQueue(interaction.guild!, voiceChannel, interaction.channel!);
      await queue.addTracks(target.tracks);

      return interaction.editReply({
        content: `🎶 **Loaded custom playlist \`${target.name}\` (${target.tracks.length} tracks)!**`,
      });
    }

    if (sub === 'delete') {
      const name = interaction.options.getString('name', true).trim();
      const removed = db.deleteUserPlaylist(userId, name);
      return interaction.reply({
        content: removed ? `🗑️ **Deleted playlist \`${name}\`.**` : `❌ **Playlist \`${name}\` not found.**`,
        ephemeral: true,
      });
    }
  },
};
