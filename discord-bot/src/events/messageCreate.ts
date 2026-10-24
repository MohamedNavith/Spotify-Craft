import { Message } from 'discord.js';
import { db } from '../database/db';
import { AudioManager } from '../audio/AudioManager';
import { isSpotifyUrl, resolveSpotify } from '../audio/resolvers/spotifyResolver';
import { resolveYouTubeOrSearch } from '../audio/resolvers/youtubeResolver';

export async function handleMessage(message: Message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const settings = db.getGuildSettings(guildId);

  // 1. Dedicated Song Request Channel Handler
  if (settings.requestChannelId && message.channel.id === settings.requestChannelId) {
    const query = message.content.trim();
    // Delete user input message to keep channel pristine
    try {
      await message.delete();
    } catch {}

    if (!query) return;

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      const errAlert = await (message.channel as any).send({
        content: `❌ <@${message.author.id}>, **you must join a voice channel first to play music!**`,
      });
      setTimeout(() => errAlert.delete().catch(() => {}), 5000);
      return;
    }

    const requester = {
      id: message.author.id,
      username: message.author.username,
      avatarUrl: message.author.displayAvatarURL(),
    };

    let tracks = [];
    if (isSpotifyUrl(query)) {
      tracks = await resolveSpotify(query, requester);
    } else {
      tracks = await resolveYouTubeOrSearch(query, requester);
    }

    if (tracks.length === 0) {
      const notFound = await (message.channel as any).send({
        content: `❌ <@${message.author.id}>, **no tracks found for:** \`${query}\``,
      });
      setTimeout(() => notFound.delete().catch(() => {}), 6000);
      return;
    }

    const queue = await AudioManager.createQueue(message.guild, voiceChannel, message.channel);
    await queue.addTracks(tracks);

    const confirmation = await (message.channel as any).send({
      content: `🎶 <@${message.author.id}> **added ${tracks.length === 1 ? `[${tracks[0].title}](${tracks[0].url})` : `\`${tracks.length} tracks\``} to the queue!**`,
    });
    setTimeout(() => confirmation.delete().catch(() => {}), 6000);
    return;
  }

  // 2. Legacy Text Prefix Commands (e.g. !w play <song>)
  const prefix = settings.prefix.toLowerCase();
  const content = message.content.trim();
  if (!content.toLowerCase().startsWith(prefix)) return;

  const args = content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  if (commandName === 'play' || commandName === 'p') {
    const query = args.join(' ');
    if (!query) {
      return message.reply('❌ **Please specify a song title or link:** `' + prefix + ' play <song>`');
    }
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply('❌ **You must be in a voice channel to play music!**');
    }
    const requester = {
      id: message.author.id,
      username: message.author.username,
      avatarUrl: message.author.displayAvatarURL(),
    };
    const tracks = isSpotifyUrl(query)
      ? await resolveSpotify(query, requester)
      : await resolveYouTubeOrSearch(query, requester);

    if (tracks.length === 0) {
      return message.reply(`❌ **No results found for:** \`${query}\``);
    }
    const queue = await AudioManager.createQueue(message.guild, voiceChannel, message.channel);
    await queue.addTracks(tracks);
    return message.reply(`✅ **Queued:** [${tracks[0].title}](${tracks[0].url})`);
  }

  if (commandName === 'skip' || commandName === 's') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue || !queue.currentTrack) return message.reply('❌ **Nothing is playing.**');
    await queue.skip();
    return message.reply('⏭️ **Skipped.**');
  }

  if (commandName === 'pause') {
    const queue = AudioManager.getQueue(guildId);
    if (queue) {
      queue.pause();
      return message.reply('⏸️ **Paused.**');
    }
  }

  if (commandName === 'resume') {
    const queue = AudioManager.getQueue(guildId);
    if (queue) {
      queue.resume();
      return message.reply('▶️ **Resumed.**');
    }
  }

  if (commandName === 'stop') {
    const queue = AudioManager.getQueue(guildId);
    if (queue) {
      queue.stop();
      AudioManager.removeQueue(guildId);
      return message.reply('⏹️ **Stopped.**');
    }
  }
}
