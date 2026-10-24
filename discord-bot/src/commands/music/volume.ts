import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';

export const volumeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Adjust the playback volume (1% - 150%)')
    .addIntegerOption((opt) =>
      opt.setName('percent').setDescription('Volume level from 1 to 150').setRequired(true).setMinValue(1).setMaxValue(150),
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue) {
      return interaction.reply({ content: '❌ **No active player found.**', ephemeral: true });
    }
    const percent = interaction.options.getInteger('percent', true);
    await queue.setVolume(percent);
    return interaction.reply({
      content: `🔊 **Volume set to \`${percent}%\`**`,
    });
  },
};
