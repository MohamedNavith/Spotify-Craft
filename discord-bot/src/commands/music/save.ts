import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';
import { config } from '../../config';

export const saveCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('save')
    .setDescription('Send the currently playing track details to your private Discord DMs'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ **Nothing is currently playing.**', ephemeral: true });
    }

    const track = queue.currentTrack;
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('💾 Saved Track from Wavelength')
        .setDescription(`**[${track.title}](${track.url})**\nby **${track.author}**\n\nDuration: \`${track.formattedDuration}\`\nSaved from: **${interaction.guild?.name || 'Discord'}**`)
        .setThumbnail(track.thumbnail)
        .addFields({ name: 'Web Player', value: `[Listen on Wavelength](${config.wavelengthWebUrl})` })
        .setTimestamp();

      await interaction.user.send({ embeds: [dmEmbed] });
      return interaction.reply({ content: '📬 **Sent track details to your DMs! Check your private messages.**', ephemeral: true });
    } catch (e) {
      return interaction.reply({ content: '❌ **Could not send you a DM.** Please make sure your server DMs are enabled.', ephemeral: true });
    }
  },
};
