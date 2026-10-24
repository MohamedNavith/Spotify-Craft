import { EmbedBuilder, Message } from 'discord.js';
import { db } from '../database/db';
import { AudioManager } from '../audio/AudioManager';
import { isSpotifyUrl, resolveSpotify } from '../audio/resolvers/spotifyResolver';
import { resolveYouTubeOrSearch } from '../audio/resolvers/youtubeResolver';
import { config } from '../config';
import { createNowPlayingEmbed, createQueueEmbed, createLyricsEmbed } from '../ui/embeds';
import { createPlayerButtons, createFilterSelectMenu } from '../ui/buttons';
import { fetchLyrics } from '../audio/resolvers/lyricsResolver';
import { AudioFilter, LoopMode } from '../audio/types';
import { FILTER_DESCRIPTIONS } from '../audio/filters';

export async function handleMessage(message: Message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const settings = db.getGuildSettings(guildId);

  console.log(`[Text Chat - ${message.guild.name}] ${message.author.tag}: "${message.content}"`);

  // 1. Dedicated Song Request Channel Handler (Hydra/Rythm Style)
  if (settings.requestChannelId && message.channel.id === settings.requestChannelId) {
    const query = message.content.trim();
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

  // 2. Multi-Prefix & Mention Recognition
  const content = message.content.trim();
  const lowerContent = content.toLowerCase();

  const customPrefix = (settings.prefix || '!').toLowerCase();
  const botMention = `<@${message.client.user.id}>`;
  const botNickMention = `<@!${message.client.user.id}>`;

  let matchedPrefix = '';
  if (lowerContent.startsWith(customPrefix)) {
    matchedPrefix = customPrefix;
  } else if (lowerContent.startsWith('!')) {
    matchedPrefix = '!';
  } else if (lowerContent.startsWith('!w')) {
    matchedPrefix = '!w';
  } else if (lowerContent.startsWith(botMention.toLowerCase())) {
    matchedPrefix = botMention.toLowerCase();
  } else if (lowerContent.startsWith(botNickMention.toLowerCase())) {
    matchedPrefix = botNickMention.toLowerCase();
  } else {
    return;
  }

  const rawArgs = content.slice(matchedPrefix.length).trim().split(/\s+/);
  const commandName = rawArgs.shift()?.toLowerCase();
  if (!commandName) return;

  const currentPrefix = settings.prefix || '!';

  // --- COMMAND: JOIN / CONNECT ---
  if (commandName === 'join' || commandName === 'connect' || commandName === 'j') {
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply('❌ **You must be in a voice channel first for me to join!**');
    }
    await AudioManager.createQueue(message.guild, voiceChannel, message.channel);
    return message.reply(`🔊 **Joined <#${voiceChannel.id}>!** Ready to stream 320kbps master audio. Use \`${currentPrefix}play <song>\` or \`/play\`.`);
  }

  // --- COMMAND: LEAVE / DISCONNECT / DC ---
  if (commandName === 'leave' || commandName === 'disconnect' || commandName === 'dc') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue) {
      return message.reply('❌ **I am not currently connected to any voice channel.**');
    }
    queue.stop();
    AudioManager.removeQueue(guildId);
    return message.reply('👋 **Disconnected from voice channel.**');
  }

  // --- COMMAND: PLAY ---
  if (commandName === 'play' || commandName === 'p') {
    const query = rawArgs.join(' ').trim();
    const queue = AudioManager.getQueue(guildId);

    // If no query given but queue is paused, resume playback
    if (!query && queue && queue.isPaused) {
      queue.resume();
      return message.reply('▶️ **Playback resumed.**');
    }

    if (!query) {
      return message.reply(`❌ **Please specify a song title or link:** \`${currentPrefix}play <song name or spotify link>\``);
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

    const statusMsg = await message.reply(`🔍 **Searching:** \`${query}\`...`);

    let tracks = [];
    if (isSpotifyUrl(query)) {
      tracks = await resolveSpotify(query, requester);
    } else {
      tracks = await resolveYouTubeOrSearch(query, requester);
    }

    if (tracks.length === 0) {
      return statusMsg.edit(`❌ **No results found for:** \`${query}\`. Try adding the artist name.`);
    }

    const activeQueue = await AudioManager.createQueue(message.guild, voiceChannel, message.channel);

    if (tracks.length === 1) {
      const track = tracks[0];
      const isFirst = !activeQueue.currentTrack && activeQueue.tracks.length === 0;
      await activeQueue.addTrack(track);

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(
          isFirst
            ? `🎶 **Now Playing:** [${track.title}](${track.url}) by **${track.author}** (\`${track.formattedDuration}\`)`
            : `✅ **Queued at position #${activeQueue.tracks.length}:** [${track.title}](${track.url}) by **${track.author}** (\`${track.formattedDuration}\`)`,
        )
        .setThumbnail(track.thumbnail);

      return statusMsg.edit({ content: '', embeds: [embed] });
    } else {
      await activeQueue.addTracks(tracks);
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📦 Playlist Queued')
        .setDescription(`Successfully queued **${tracks.length} tracks**!\nFirst song: **[${tracks[0].title}](${tracks[0].url})**`)
        .setThumbnail(tracks[0].thumbnail);

      return statusMsg.edit({ content: '', embeds: [embed] });
    }
  }

  // --- COMMAND: SKIP ---
  if (commandName === 'skip' || commandName === 's' || commandName === 'next') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue || !queue.currentTrack) return message.reply('❌ **Nothing is currently playing.**');
    const skipped = queue.currentTrack;
    await queue.skip();
    return message.reply(`⏭️ **Skipped:** [${skipped.title}](${skipped.url})`);
  }

  // --- COMMAND: PREVIOUS ---
  if (commandName === 'previous' || commandName === 'prev') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue) return message.reply('❌ **No active player found.**');
    const success = await queue.previous();
    if (!success) return message.reply('⚠️ **No previous songs found in history.**');
    return message.reply(`⏮️ **Replaying previous song:** [${queue.currentTrack?.title}](${queue.currentTrack?.url})`);
  }

  // --- COMMAND: PAUSE ---
  if (commandName === 'pause') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue || !queue.currentTrack) return message.reply('❌ **Nothing is playing.**');
    const paused = queue.pause();
    return message.reply(paused ? '⏸️ **Playback paused.**' : '⚠️ **Playback is already paused.**');
  }

  // --- COMMAND: RESUME ---
  if (commandName === 'resume') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue || !queue.currentTrack) return message.reply('❌ **Nothing is playing.**');
    const resumed = queue.resume();
    return message.reply(resumed ? '▶️ **Playback resumed.**' : '⚠️ **Playback is not paused.**');
  }

  // --- COMMAND: STOP ---
  if (commandName === 'stop') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue) return message.reply('❌ **Nothing is playing.**');
    queue.stop();
    AudioManager.removeQueue(guildId);
    return message.reply('⏹️ **Playback stopped and queue cleared.**');
  }

  // --- COMMAND: QUEUE ---
  if (commandName === 'queue' || commandName === 'q') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue || (!queue.currentTrack && queue.tracks.length === 0)) {
      return message.reply('📭 **The queue is currently empty.**');
    }
    const page = parseInt(rawArgs[0] || '1', 10) || 1;
    const embed = createQueueEmbed(queue.currentTrack, queue.tracks, page);
    return message.reply({ embeds: [embed] });
  }

  // --- COMMAND: NOW PLAYING ---
  if (commandName === 'nowplaying' || commandName === 'np') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue || !queue.currentTrack) return message.reply('❌ **Nothing is currently playing.**');
    const embed = createNowPlayingEmbed(
      queue.currentTrack,
      queue.currentPlaybackSeconds,
      queue.volume,
      queue.loopMode,
      queue.currentFilter,
      queue.isAutoplay,
      !queue.isPaused,
    );
    const buttons = createPlayerButtons(!queue.isPaused, queue.loopMode, queue.isAutoplay);
    const filterMenu = createFilterSelectMenu(queue.currentFilter);
    return message.reply({ embeds: [embed], components: [...buttons, filterMenu] });
  }

  // --- COMMAND: VOLUME ---
  if (commandName === 'volume' || commandName === 'vol' || commandName === 'v') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue) return message.reply('❌ **No active player found.**');
    const volNum = parseInt(rawArgs[0], 10);
    if (isNaN(volNum) || volNum < 1 || volNum > 150) {
      return message.reply(`🔊 **Current volume is \`${queue.volume}%\`**. Usage: \`${currentPrefix}volume <1-150>\``);
    }
    await queue.setVolume(volNum);
    return message.reply(`🔊 **Volume set to \`${volNum}%\`**`);
  }

  // --- COMMAND: SEEK ---
  if (commandName === 'seek') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue || !queue.currentTrack) return message.reply('❌ **Nothing is playing.**');
    const timeStr = rawArgs[0];
    if (!timeStr) return message.reply(`Usage: \`${currentPrefix}seek <1:30 or seconds>\``);
    let seconds = 0;
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':').map((p) => parseInt(p, 10));
      seconds = parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      seconds = parseInt(timeStr, 10);
    }
    if (isNaN(seconds) || seconds < 0) return message.reply('❌ **Invalid timestamp.**');
    await queue.seek(seconds);
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return message.reply(`⏩ **Seeked to \`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}\`**`);
  }

  // --- COMMAND: LOOP ---
  if (commandName === 'loop' || commandName === 'repeat') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue) return message.reply('❌ **No active player found.**');
    const modeArg = rawArgs[0]?.toLowerCase() as LoopMode;
    let nextMode: LoopMode = 'off';
    if (modeArg && ['off', 'track', 'queue'].includes(modeArg)) {
      nextMode = modeArg;
    } else {
      nextMode = queue.loopMode === 'off' ? 'track' : queue.loopMode === 'track' ? 'queue' : 'off';
    }
    queue.setLoop(nextMode);
    const emoji = nextMode === 'track' ? '🔂' : nextMode === 'queue' ? '🔁' : '➡️';
    return message.reply(`${emoji} **Loop mode set to:** \`${nextMode.toUpperCase()}\``);
  }

  // --- COMMAND: SHUFFLE ---
  if (commandName === 'shuffle') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue || queue.tracks.length < 2) return message.reply('⚠️ **Need at least 2 tracks in queue to shuffle.**');
    queue.shuffle();
    return message.reply(`🔀 **Queue shuffled (${queue.tracks.length} tracks)!**`);
  }

  // --- COMMAND: LYRICS ---
  if (commandName === 'lyrics') {
    const queue = AudioManager.getQueue(guildId);
    let songName = rawArgs.join(' ').trim();
    let artistName = '';
    if (!songName && queue && queue.currentTrack) {
      songName = queue.currentTrack.title;
      artistName = queue.currentTrack.author;
    }
    if (!songName) return message.reply(`Usage: \`${currentPrefix}lyrics <song name>\``);
    const statusMsg = await message.reply('📜 **Fetching lyrics...**');
    const data = await fetchLyrics(songName, artistName);
    if (!data || !data.plainLyrics) return statusMsg.edit(`❌ **No lyrics found for:** \`${songName}\``);
    const embed = createLyricsEmbed(data.title, data.artist, data.plainLyrics);
    return statusMsg.edit({ content: '', embeds: [embed] });
  }

  // --- COMMAND: FILTER & SHORTCUTS (8D, Bass, Nightcore, Vaporwave) ---
  if (
    commandName === 'filter' ||
    commandName === '8d' ||
    commandName === 'bass' ||
    commandName === 'bassboost' ||
    commandName === 'nightcore' ||
    commandName === 'vaporwave'
  ) {
    const queue = AudioManager.getQueue(guildId);
    if (!queue || !queue.currentTrack) return message.reply('❌ **Nothing is playing.**');

    let filterType: AudioFilter = 'off';
    if (commandName === '8d') filterType = '8d';
    else if (commandName === 'bass' || commandName === 'bassboost') {
      const level = rawArgs[0]?.toLowerCase();
      filterType = level === 'high' ? 'bassboost_high' : level === 'low' ? 'bassboost_low' : 'bassboost_med';
    } else if (commandName === 'nightcore') filterType = 'nightcore';
    else if (commandName === 'vaporwave') filterType = 'vaporwave';
    else {
      filterType = (rawArgs[0]?.toLowerCase() as AudioFilter) || 'off';
    }

    const desc = FILTER_DESCRIPTIONS[filterType] || FILTER_DESCRIPTIONS['off'];
    await queue.setFilter(filterType);
    return message.reply(`${desc.emoji} **Audio filter applied:** \`${desc.name}\`\n*${desc.description}*`);
  }

  // --- COMMAND: AUTOPLAY ---
  if (commandName === 'autoplay' || commandName === 'radio') {
    const queue = AudioManager.getQueue(guildId);
    if (!queue) return message.reply('❌ **No active player found.**');
    const active = queue.toggleAutoplay();
    return message.reply(
      active
        ? '📻 **Autoplay (Radio Mode) enabled!** Continuous similar tracks will play automatically.'
        : '⏹️ **Autoplay disabled.**',
    );
  }

  // --- COMMAND: 247 ---
  if (commandName === '247') {
    const new247 = !settings.mode247;
    db.updateGuildSettings(guildId, { mode247: new247 });
    return message.reply(
      new247
        ? '🟢 **24/7 Mode Enabled!** Wavelength will stay connected in your voice channel 24/7 even when idle.'
        : '🔴 **24/7 Mode Disabled.** The bot will leave when the queue is empty.',
    );
  }

  // --- COMMAND: PREFIX / SETPREFIX ---
  if (commandName === 'prefix' || commandName === 'setprefix') {
    const newPrefix = rawArgs[0]?.trim();
    if (!newPrefix) {
      return message.reply(`⚙️ **Current prefix is:** \`${currentPrefix}\`\nTo change it, use: \`${currentPrefix}prefix <new prefix>\` (e.g. \`${currentPrefix}prefix ?\`)`);
    }
    if (newPrefix.length > 5) {
      return message.reply('❌ **Prefix cannot be longer than 5 characters.**');
    }
    db.updateGuildSettings(guildId, { prefix: newPrefix });
    return message.reply(`⚙️ **Server prefix updated to \`${newPrefix}\`!**\nYou can now use commands like \`${newPrefix}play\`, \`${newPrefix}join\`, \`${newPrefix}skip\`, or \`${newPrefix}help\`.`);
  }

  // --- COMMAND: HELP ---
  if (commandName === 'help' || commandName === 'h') {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('🎧 Wavelength Music Bot — Command Manual')
      .setDescription(`Current server prefix is: \`${currentPrefix}\` (You can also mention @Wavelength or use Slash Commands \`/\`)`)
      .addFields(
        {
          name: '🎵 Playback Commands',
          value:
            `\`${currentPrefix}join\` - Connect to your voice channel\n` +
            `\`${currentPrefix}play <song/link>\` - Play song, Spotify playlist, or YouTube URL\n` +
            `\`${currentPrefix}skip\` - Skip current track\n` +
            `\`${currentPrefix}previous\` - Replay previous track\n` +
            `\`${currentPrefix}pause\` & \`${currentPrefix}resume\` - Pause or resume playback\n` +
            `\`${currentPrefix}stop\` - Stop and clear queue\n` +
            `\`${currentPrefix}leave\` - Disconnect bot from voice\n` +
            `\`${currentPrefix}nowplaying\` - Show interactive player dashboard with buttons`,
        },
        {
          name: '🎛️ Audio DSP Filters',
          value:
            `\`${currentPrefix}8d\` - 360° Rotating Binaural Audio\n` +
            `\`${currentPrefix}bass [low/med/high]\` - Heavy Bass Boost\n` +
            `\`${currentPrefix}nightcore\` - Speed up tempo & pitch\n` +
            `\`${currentPrefix}vaporwave\` - Slowed aesthetic audio\n` +
            `\`${currentPrefix}filter off\` - Reset to pure studio sound`,
        },
        {
          name: '⚙️ Settings & Automation',
          value:
            `\`${currentPrefix}prefix <new_prefix>\` - Customize server prefix to anything you want!\n` +
            `\`${currentPrefix}247\` - Toggle 24/7 stay mode\n` +
            `\`${currentPrefix}autoplay\` - Toggle endless radio mode\n` +
            `\`/setup\` - Create dedicated song-request channel like Hydra`,
        },
      )
      .setFooter({ text: `Wavelength Music • ${config.wavelengthWebUrl}` });

    return message.reply({ embeds: [embed] });
  }
}
