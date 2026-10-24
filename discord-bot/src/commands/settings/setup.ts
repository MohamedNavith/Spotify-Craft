import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { Command } from '../command.interface';
import { db } from '../../database/db';
import { config } from '../../config';
import { createPlayerButtons, createFilterSelectMenu } from '../../ui/buttons';

export const setupCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Create a dedicated song-request channel with an interactive live player dashboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild!;

    try {
      // Create dedicated text channel
      const channel = await guild.channels.create({
        name: 'wavelength-music',
        type: ChannelType.GuildText,
        topic: '🎵 Type any song name, Spotify URL, or YouTube link here to play music instantly! Commands: /help',
      });

      const initialEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎧 Wavelength Music Player')
        .setDescription('**No song is currently playing.**\n\nSend a song title, artist name, Spotify link, or YouTube URL in this channel to start playback instantly!')
        .setImage('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop')
        .setFooter({ text: 'Wavelength Dedicated Request Channel • Zero Ads • 320kbps Lossless' });

      const buttons = createPlayerButtons(false, 'off', false);
      const filterMenu = createFilterSelectMenu('off');

      const dashboardMsg = await channel.send({
        embeds: [initialEmbed],
        components: [...buttons, filterMenu],
      });

      db.updateGuildSettings(guild.id, {
        requestChannelId: channel.id,
        requestMessageId: dashboardMsg.id,
      });

      return interaction.editReply({
        content: `✅ **Dedicated music channel created:** <#${channel.id}>\nMembers can now simply type song names or paste links directly into that channel!`,
      });
    } catch (err: any) {
      return interaction.editReply({
        content: `❌ **Failed to create channel:** ${err.message}. Please verify the bot has \`Manage Channels\` permission.`,
      });
    }
  },
};
