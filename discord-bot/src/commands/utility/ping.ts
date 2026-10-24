import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot websocket latency and responsiveness'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const roundTrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;
    return interaction.editReply({
      content: `🏓 **Pong!**\n📡 Roundtrip Latency: \`${roundTrip}ms\`\n💓 WebSocket Heartbeat: \`${wsPing}ms\``,
    });
  },
};
