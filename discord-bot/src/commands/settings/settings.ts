import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../command.interface';
import { db } from '../../database/db';
import { createSettingsEmbed } from '../../ui/embeds';

export const settingsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('View and update server settings for Wavelength')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption((opt) => opt.setName('volume').setDescription('Set default volume (1-150)').setMinValue(1).setMaxValue(150))
    .addStringOption((opt) => opt.setName('prefix').setDescription('Set text command prefix (e.g. ! or -)'))
    .addRoleOption((opt) => opt.setName('dj_role').setDescription('Set DJ role for music moderation')),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId!;
    const settings = db.getGuildSettings(guildId);

    const volume = interaction.options.getInteger('volume');
    const prefix = interaction.options.getString('prefix');
    const djRole = interaction.options.getRole('dj_role');

    const updates: any = {};
    if (volume !== null) updates.defaultVolume = volume;
    if (prefix !== null) updates.prefix = prefix.trim();
    if (djRole !== null) updates.djRoleId = djRole.id;

    if (Object.keys(updates).length > 0) {
      db.updateGuildSettings(guildId, updates);
    }

    const updated = db.getGuildSettings(guildId);
    const embed = createSettingsEmbed(updated);

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
