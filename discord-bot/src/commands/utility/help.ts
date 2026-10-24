import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { config } from '../../config';

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display the full command manual and feature list for Wavelength'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('🎧 Wavelength Discord Music Bot Manual')
      .setDescription(
        'Enterprise-grade Spotify-style music streaming for your Discord server. Powered by 320kbps Lossless Master Audio, DSP Filters, Spotify/YouTube integration, and dedicated song request channels.',
      )
      .addFields(
        {
          name: '🎵 Music Playback',
          value:
            '`/play <query>` - Play song, album, Spotify link, or stream\n' +
            '`/pause` & `/resume` - Pause or unpause playback\n' +
            '`/skip` - Skip to the next track\n' +
            '`/previous` - Replay the previous track\n' +
            '`/stop` - Stop playback and clear queue\n' +
            '`/nowplaying` - Open the live interactive music dashboard\n' +
            '`/lyrics [song]` - Live synchronized lyrics\n' +
            '`/autoplay` - Toggle continuous smart radio mode',
        },
        {
          name: '📜 Queue & Audio Controls',
          value:
            '`/queue [page]` - Display upcoming songs & durations\n' +
            '`/volume <1-150>` - Change playback volume\n' +
            '`/seek <time>` - Jump to exact timestamp (e.g. 1:30)\n' +
            '`/loop <off|track|queue>` - Repeat mode\n' +
            '`/shuffle` - Shuffle queue order\n' +
            '`/history` - Server playback history\n' +
            '`/save` - Send current track to your private DMs',
        },
        {
          name: '🎛️ DSP Audio Filters',
          value:
            '`/filter <effect>` - Apply 8D, Bass Boost, Nightcore, Vaporwave, Slowed+Reverb, Karaoke, Normalizer, or Treble Boost in real-time!',
        },
        {
          name: '⚙️ Server & Customization',
          value:
            '`/setup` - Create a dedicated song-request channel like Hydra/Rythm\n' +
            '`/247` - Toggle 24/7 Voice Channel Stay Mode\n' +
            '`/playlist <save|play|list|delete>` - Custom user playlists\n' +
            '`/settings` - Configure server volume, prefix, and DJ role',
        },
      )
      .setFooter({ text: `Wavelength Music • ${config.wavelengthWebUrl}` });

    return interaction.reply({ embeds: [embed] });
  },
};
