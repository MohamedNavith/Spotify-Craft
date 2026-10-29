import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from './config';
import { handleReady } from './events/ready';
import { handleInteraction } from './events/interactionCreate';
import { handleMessage } from './events/messageCreate';
import { handleVoiceStateUpdate } from './events/voiceStateUpdate';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, () => handleReady(client));
client.on('interactionCreate', (interaction) => handleInteraction(interaction));
client.on('messageCreate', (message) => handleMessage(message));
client.on('voiceStateUpdate', (oldState, newState) => handleVoiceStateUpdate(oldState, newState));

// Global Crash & Exception Immunity Guards
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Anti-Crash] Unhandled Promise Rejection intercepted:', reason);
});

process.on('uncaughtException', (err, origin) => {
  console.error(`⚠️ [Anti-Crash] Uncaught Exception intercepted (${origin}):`, err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.error(`⚠️ [Anti-Crash Monitor] Exception observed (${origin}):`, err);
});

const shutdown = () => {
  console.log('\n[Wavelength Bot] Shutting down gracefully...');
  client.destroy();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (!config.discordToken) {
  console.warn('⚠️ Warning: DISCORD_TOKEN is not defined in your environment (.env).');
  console.warn('Please copy .env.example to .env and configure your bot credentials.');
} else {
  client.login(config.discordToken).catch((err) => {
    console.error('❌ Failed to login to Discord:', err.message);
  });
}
