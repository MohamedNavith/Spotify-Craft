import { EmbedBuilder } from 'discord.js';
import { Track, LoopMode, AudioFilter, GuildSettings } from '../audio/types';
import { config } from '../config';
import { FILTER_DESCRIPTIONS } from '../audio/filters';

export function createProgressBar(currentSec: number, totalSec: number, size = 15): string {
  if (totalSec <= 0) return '🔴 LIVE STREAM';
  const progress = Math.min(Math.max(currentSec / totalSec, 0), 1);
  const progressIndex = Math.round(size * progress);
  const emptySize = size - progressIndex;

  const filledBar = '━'.repeat(Math.max(0, progressIndex - 1));
  const emptyBar = '─'.repeat(Math.max(0, emptySize));

  return `${filledBar}🔘${emptyBar}`;
}

export function formatTime(sec: number): string {
  if (sec <= 0 || !isFinite(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function createNowPlayingEmbed(
  track: Track,
  currentSec: number,
  volume: number,
  loopMode: LoopMode,
  filter: AudioFilter,
  autoplay: boolean,
  isPlaying: boolean,
): EmbedBuilder {
  const progressBar = createProgressBar(currentSec, track.duration);
  const filterInfo = FILTER_DESCRIPTIONS[filter];
  const loopEmoji = loopMode === 'track' ? '🔂 Track' : loopMode === 'queue' ? '🔁 Queue' : 'Off';

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(isPlaying ? '🎵 Now Playing' : '⏸️ Paused')
    .setDescription(`**[${track.title}](${track.url})**\nby **${track.author}**\n\n\`${formatTime(currentSec)}\` ${progressBar} \`${track.formattedDuration}\``)
    .setThumbnail(track.thumbnail || 'https://open.spotify.com/favicon.ico')
    .addFields(
      { name: '🔊 Volume', value: `\`${volume}%\``, inline: true },
      { name: '🔁 Loop', value: `\`${loopEmoji}\``, inline: true },
      { name: '🎛️ Filter', value: `\`${filterInfo.emoji} ${filterInfo.name}\``, inline: true },
      { name: '📻 Autoplay', value: autoplay ? '`🟢 Enabled`' : '`🔴 Disabled`', inline: true },
      { name: '👤 Requester', value: `<@${track.requester.id}>`, inline: true },
      { name: '⚡ Audio Quality', value: track.source === 'wavelength' ? '`320kbps Master Studio`' : '`Standard High`', inline: true },
    )
    .setFooter({
      text: `Wavelength Music • ${config.wavelengthWebUrl}`,
      iconURL: 'https://open.spotify.com/favicon.ico',
    })
    .setTimestamp();

  return embed;
}

export function createQueueEmbed(
  currentTrack: Track | null,
  tracks: Track[],
  page = 1,
  pageSize = 10,
): EmbedBuilder {
  const totalPages = Math.max(1, Math.ceil(tracks.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageTracks = tracks.slice(startIndex, startIndex + pageSize);

  const totalDurationSec = tracks.reduce((acc, t) => acc + (t.duration || 0), 0) + (currentTrack?.duration || 0);

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('📜 Wavelength Music Queue')
    .setFooter({ text: `Page ${currentPage} of ${totalPages} • ${tracks.length} tracks in queue (${formatTime(totalDurationSec)})` });

  if (currentTrack) {
    embed.setDescription(`**Now Playing:**\n🎶 **[${currentTrack.title}](${currentTrack.url})** - \`${currentTrack.formattedDuration}\` (Requested by <@${currentTrack.requester.id}>)\n\n**Up Next:**`);
  }

  if (pageTracks.length === 0) {
    embed.addFields({ name: 'Queue is empty', value: 'Use `/play` to add tracks or turn on `/autoplay`!' });
  } else {
    const list = pageTracks
      .map((t, i) => `\`${startIndex + i + 1}.\` **[${t.title}](${t.url})** | \`${t.formattedDuration}\` - <@${t.requester.id}>`)
      .join('\n');
    embed.addFields({ name: 'Upcoming Tracks', value: list });
  }

  return embed;
}

export function createLyricsEmbed(title: string, artist: string, lyrics: string): EmbedBuilder {
  const truncatedLyrics = lyrics.length > 4000 ? `${lyrics.slice(0, 3950)}...\n*(Lyrics truncated)*` : lyrics;

  return new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(`📜 Lyrics for ${title}`)
    .setDescription(`by **${artist}**\n\n${truncatedLyrics}`)
    .setFooter({ text: 'Wavelength Synced Lyrics' })
    .setTimestamp();
}

export function createSettingsEmbed(settings: GuildSettings): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('⚙️ Wavelength Server Configuration')
    .setDescription('Configure music playback, permissions, and automation for this server.')
    .addFields(
      { name: 'Prefix', value: `\`${settings.prefix}\``, inline: true },
      { name: 'Default Volume', value: `\`${settings.defaultVolume}%\``, inline: true },
      { name: 'Idle Timeout', value: settings.mode247 ? '`24/7 Mode Active`' : `\`${settings.idleTimeoutSeconds}s\``, inline: true },
      { name: 'DJ Role', value: settings.djRoleId ? `<@&${settings.djRoleId}>` : '`Everyone (No DJ Role)`', inline: true },
      { name: 'Default Filter', value: `\`${settings.defaultFilter}\``, inline: true },
      { name: '24/7 Voice Mode', value: settings.mode247 ? '`🟢 Enabled`' : '`🔴 Disabled`', inline: true },
      { name: 'Dedicated Music Channel', value: settings.requestChannelId ? `<#${settings.requestChannelId}>` : '`None (Run /setup)`', inline: false },
    )
    .setFooter({ text: 'Use /settings to update configuration' });
}
