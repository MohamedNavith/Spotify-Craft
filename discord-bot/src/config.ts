import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  defaultPrefix: process.env.DEFAULT_PREFIX || '!',
  defaultVolume: parseInt(process.env.DEFAULT_VOLUME || '80', 10),
  maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE || '1000', 10),
  idleTimeoutSeconds: parseInt(process.env.IDLE_TIMEOUT_SECONDS || '180', 10),
  embedColor: 0x1db954, // Spotify Green
  errorColor: 0xe22134,
  warningColor: 0xffa500,
  wavelengthWebUrl: process.env.WAVELENGTH_WEB_URL || 'https://mohamednavith.github.io/Spotify-Craft/',
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
};
