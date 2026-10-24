import { REST, Routes } from 'discord.js';
import { config } from './config';
import { slashCommandsJson } from './commands';

async function deploy() {
  if (!config.discordToken || !config.clientId) {
    console.error('❌ Error: DISCORD_TOKEN and CLIENT_ID must be set in your .env file to deploy slash commands.');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  try {
    console.log(`[Wavelength Deployer] Registering ${slashCommandsJson.length} application (/) commands...`);

    const data: any = await rest.put(Routes.applicationCommands(config.clientId), {
      body: slashCommandsJson,
    });

    console.log(`✅ [Wavelength Deployer] Successfully registered ${data.length} global slash commands!`);
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
    process.exit(1);
  }
}

deploy();
