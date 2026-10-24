import { ActivityType, Client } from 'discord.js';

export function handleReady(client: Client) {
  console.log(`[Wavelength Bot] Logged in successfully as ${client.user?.tag}!`);
  console.log(`[Wavelength Bot] Connected to ${client.guilds.cache.size} servers.`);

  const updatePresence = () => {
    client.user?.setPresence({
      activities: [
        {
          name: '/play | 320kbps Master Audio',
          type: ActivityType.Listening,
        },
      ],
      status: 'online',
    });
  };

  updatePresence();
  setInterval(updatePresence, 300000); // refresh every 5 mins
}
