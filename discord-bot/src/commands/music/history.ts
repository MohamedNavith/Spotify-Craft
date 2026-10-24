import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { db } from '../../database/db';
import { config } from '../../config';

export const historyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View recently played songs in this server'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const history = db.getHistory(interaction.guildId!, 15);
    if (history.length === 0) {
      return interaction.reply({ content: '📜 **No recently played songs recorded yet.**', ephemeral: true });
    }

    const list = history
      .map((t, i) => `\`${i + 1}.\` **[${t.title}](${t.url})** by **${t.author}** (\`${t.formattedDuration}\`) - <@${t.requester.id}>`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('📜 Server Playback History')
      .setDescription(list)
      .setFooter({ text: 'Last 15 songs played in this server' });

    return interaction.reply({ embeds: [embed] });
  },
};
