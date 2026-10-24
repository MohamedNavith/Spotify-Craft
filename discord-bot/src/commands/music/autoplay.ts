import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';

export const autoplayCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle intelligent continuous autoplay (Radio Mode)'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue) {
      return interaction.reply({ content: '❌ **No active player found.**', ephemeral: true });
    }
    const enabled = queue.toggleAutoplay();
    return interaction.reply({
      content: enabled
        ? '📻 **Autoplay (Radio Mode) enabled!** The music will continuously play similar recommended tracks forever.'
        : '⏹️ **Autoplay disabled.** Playback will stop when the queue finishes.',
    });
  },
};
