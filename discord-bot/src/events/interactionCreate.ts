import { Interaction } from 'discord.js';
import { commands } from '../commands';
import { AudioManager } from '../audio/AudioManager';
import { AudioFilter, LoopMode } from '../audio/types';
import { FILTER_DESCRIPTIONS } from '../audio/filters';
import { fetchLyrics } from '../audio/resolvers/lyricsResolver';
import { createLyricsEmbed } from '../ui/embeds';

export async function handleInteraction(interaction: Interaction) {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const cmd = commands.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(interaction);
    } catch (err: any) {
      console.error(`Error executing slash command ${interaction.commandName}:`, err);
      const replyPayload = {
        content: `❌ **An error occurred while executing this command:** ${err.message || 'Unknown error'}`,
        ephemeral: true,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(replyPayload).catch(() => {});
      } else {
        await interaction.reply(replyPayload).catch(() => {});
      }
    }
    return;
  }

  // 2. Handle Interactive Buttons
  if (interaction.isButton()) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const queue = AudioManager.getQueue(guildId);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({
        content: '❌ **Nothing is currently playing.**',
        ephemeral: true,
      });
    }

    const customId = interaction.customId;

    if (customId === 'btn_playpause') {
      queue.togglePlay();
      return interaction.reply({
        content: queue.isPaused ? '⏸️ **Playback paused.**' : '▶️ **Playback resumed.**',
        ephemeral: true,
      });
    }

    if (customId === 'btn_skip') {
      const skipped = queue.currentTrack;
      await queue.skip();
      return interaction.reply({
        content: `⏭️ **Skipped:** [${skipped.title}](${skipped.url})`,
        ephemeral: true,
      });
    }

    if (customId === 'btn_previous') {
      const success = await queue.previous();
      return interaction.reply({
        content: success
          ? `⏮️ **Replaying previous song:** [${queue.currentTrack.title}](${queue.currentTrack.url})`
          : '⚠️ **No previous songs in history.**',
        ephemeral: true,
      });
    }

    if (customId === 'btn_loop') {
      const nextLoop: Record<LoopMode, LoopMode> = {
        off: 'track',
        track: 'queue',
        queue: 'off',
      };
      const newMode = nextLoop[queue.loopMode];
      queue.setLoop(newMode);
      return interaction.reply({
        content: `🔁 **Loop mode changed to \`${newMode.toUpperCase()}\`**`,
        ephemeral: true,
      });
    }

    if (customId === 'btn_shuffle') {
      if (queue.tracks.length < 2) {
        return interaction.reply({ content: '⚠️ **Need at least 2 tracks in queue to shuffle.**', ephemeral: true });
      }
      queue.shuffle();
      return interaction.reply({
        content: `🔀 **Queue shuffled (${queue.tracks.length} tracks)!**`,
        ephemeral: true,
      });
    }

    if (customId === 'btn_voldown') {
      const newVol = Math.max(0, queue.volume - 10);
      queue.setVolume(newVol);
      return interaction.reply({
        content: `🔉 **Volume lowered to \`${newVol}%\`**`,
        ephemeral: true,
      });
    }

    if (customId === 'btn_volup') {
      const newVol = Math.min(150, queue.volume + 10);
      queue.setVolume(newVol);
      return interaction.reply({
        content: `🔊 **Volume raised to \`${newVol}%\`**`,
        ephemeral: true,
      });
    }

    if (customId === 'btn_autoplay') {
      const active = queue.toggleAutoplay();
      return interaction.reply({
        content: active
          ? '📻 **Autoplay (Radio Mode) enabled!** Similar songs will play continuously.'
          : '⏹️ **Autoplay disabled.**',
        ephemeral: true,
      });
    }

    if (customId === 'btn_stop') {
      queue.stop();
      AudioManager.removeQueue(guildId);
      return interaction.reply({
        content: '⏹️ **Playback stopped and queue cleared.**',
        ephemeral: true,
      });
    }

    if (customId === 'btn_lyrics') {
      await interaction.deferReply({ ephemeral: true });
      const lyrics = await fetchLyrics(queue.currentTrack.title, queue.currentTrack.author);
      if (!lyrics || !lyrics.plainLyrics) {
        return interaction.editReply({ content: `❌ **No lyrics found for:** \`${queue.currentTrack.title}\`` });
      }
      const embed = createLyricsEmbed(lyrics.title, lyrics.artist, lyrics.plainLyrics);
      return interaction.editReply({ embeds: [embed] });
    }
  }

  // 3. Handle Filter Select Menu
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_filter') {
      const guildId = interaction.guildId;
      if (!guildId) return;

      const queue = AudioManager.getQueue(guildId);
      if (!queue || !queue.currentTrack) {
        return interaction.reply({ content: '❌ **Nothing is currently playing.**', ephemeral: true });
      }

      const selected = interaction.values[0] as AudioFilter;
      const desc = FILTER_DESCRIPTIONS[selected];

      await interaction.deferReply({ ephemeral: true });
      await queue.setFilter(selected);

      return interaction.editReply({
        content: `${desc.emoji} **Audio filter applied:** \`${desc.name}\`\n*${desc.description}*`,
      });
    }
  }
}
