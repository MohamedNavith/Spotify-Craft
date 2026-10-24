import { VoiceState } from 'discord.js';
import { AudioManager } from '../audio/AudioManager';
import { db } from '../database/db';

export function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  const guildId = oldState.guild.id;
  const queue = AudioManager.getQueue(guildId);
  if (!queue) return;

  const botMember = oldState.guild.members.me;
  if (!botMember || !botMember.voice.channel) return;

  const botChannel = botMember.voice.channel;
  // Count non-bot members in the channel
  const humanMembers = botChannel.members.filter((m) => !m.user.bot);

  const settings = db.getGuildSettings(guildId);

  if (humanMembers.size === 0 && !settings.mode247) {
    // All members left, start idle timer
    queue.resetIdleTimer();
  } else if (humanMembers.size > 0) {
    // Someone is in the channel, clear idle timer
    queue.clearIdleTimer();
  }
}
