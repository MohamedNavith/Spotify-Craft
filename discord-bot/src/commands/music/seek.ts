import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';

export const seekCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a specific timestamp in the current song')
    .addStringOption((opt) =>
      opt.setName('time').setDescription('Timestamp to seek to (e.g. 1:30 or 90)').setRequired(true),
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ **Nothing is currently playing.**', ephemeral: true });
    }

    const timeStr = interaction.options.getString('time', true).trim();
    let seconds = 0;

    if (timeStr.includes(':')) {
      const parts = timeStr.split(':').map((p) => parseInt(p, 10));
      if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    } else {
      seconds = parseInt(timeStr, 10);
    }

    if (isNaN(seconds) || seconds < 0) {
      return interaction.reply({ content: '❌ **Invalid time format.** Use format like `1:30` or `90`.', ephemeral: true });
    }

    await interaction.deferReply();
    await queue.seek(seconds);
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return interaction.editReply({
      content: `⏩ **Seeked to \`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}\`**`,
    });
  },
};
