import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';
import { config } from '../../config';

export const statsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Display bot system statistics, memory, and performance'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const memory = process.memoryUsage();
    const ramMb = (memory.heapUsed / 1024 / 1024).toFixed(2);
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('📊 Wavelength Bot Performance & Statistics')
      .addFields(
        { name: 'Servers', value: `\`${interaction.client.guilds.cache.size}\``, inline: true },
        { name: 'Active Players', value: `\`${AudioManager.getActiveCount()}\``, inline: true },
        { name: 'RAM Usage', value: `\`${ramMb} MB\``, inline: true },
        { name: 'Uptime', value: `\`${hours}h ${minutes}m\``, inline: true },
        { name: 'Node.js', value: `\`${process.version}\``, inline: true },
        { name: 'Voice Engine', value: '`@discordjs/voice + FFmpeg DSP`', inline: true },
      )
      .setFooter({ text: 'Wavelength High-Performance Music Infrastructure' });

    return interaction.reply({ embeds: [embed] });
  },
};
