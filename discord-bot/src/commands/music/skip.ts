import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';

export const skipCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip to the next song in the queue'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ **Nothing is currently playing.**', ephemeral: true });
    }
    const current = queue.currentTrack;
    await queue.skip();
    return interaction.reply({
      content: `⏭️ **Skipped:** [${current.title}](${current.url})`,
    });
  },
};
