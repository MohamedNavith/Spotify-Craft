import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';
import { LoopMode } from '../../audio/types';

export const loopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set playback loop mode')
    .addStringOption((opt) =>
      opt
        .setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Repeat Track', value: 'track' },
          { name: 'Repeat Queue', value: 'queue' },
        ),
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue) {
      return interaction.reply({ content: '❌ **No active player found.**', ephemeral: true });
    }
    const mode = interaction.options.getString('mode', true) as LoopMode;
    queue.setLoop(mode);
    const emoji = mode === 'track' ? '🔂' : mode === 'queue' ? '🔁' : '➡️';
    return interaction.reply({
      content: `${emoji} **Loop mode set to:** \`${mode.toUpperCase()}\``,
    });
  },
};
