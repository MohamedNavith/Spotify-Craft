import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { db } from '../../database/db';

export const mode247Command: Command = {
  data: new SlashCommandBuilder()
    .setName('247')
    .setDescription('Toggle 24/7 Voice Channel Stay Mode (Never disconnect on idle)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const settings = db.getGuildSettings(interaction.guildId!);
    const newMode = !settings.mode247;
    db.updateGuildSettings(interaction.guildId!, { mode247: newMode });

    return interaction.reply({
      content: newMode
        ? '🟢 **24/7 Mode Enabled!** Wavelength will stay connected in your voice channel 24/7 even when idle.'
        : '🔴 **24/7 Mode Disabled.** The bot will automatically leave when the queue is empty.',
    });
  },
};
