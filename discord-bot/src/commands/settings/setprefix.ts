import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { db } from '../../database/db';

export const setprefixCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('Change the text command prefix for this server (e.g. !, ?, -, >)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt
        .setName('new_prefix')
        .setDescription('The new prefix to use for text commands (e.g. !, ?, -, ., w!)')
        .setRequired(true),
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ ephemeral: true });
    const newPrefix = interaction.options.getString('new_prefix', true).trim();

    if (newPrefix.length > 5) {
      return interaction.editReply('❌ **Prefix cannot be longer than 5 characters.**');
    }

    db.updateGuildSettings(interaction.guildId!, { prefix: newPrefix });

    return interaction.editReply({
      content: `⚙️ **Server prefix successfully updated to \`${newPrefix}\`!**\nYou can now run commands like \`${newPrefix}play\`, \`${newPrefix}join\`, \`${newPrefix}skip\`, or \`${newPrefix}help\`.`,
    });
  },
};
