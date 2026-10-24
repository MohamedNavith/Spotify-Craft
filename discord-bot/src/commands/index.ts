import { Collection } from 'discord.js';
import { Command } from './command.interface';

import { playCommand } from './music/play';
import { pauseCommand } from './music/pause';
import { resumeCommand } from './music/resume';
import { skipCommand } from './music/skip';
import { previousCommand } from './music/previous';
import { stopCommand } from './music/stop';
import { queueCommand } from './music/queue';
import { nowplayingCommand } from './music/nowplaying';
import { volumeCommand } from './music/volume';
import { seekCommand } from './music/seek';
import { loopCommand } from './music/loop';
import { shuffleCommand } from './music/shuffle';
import { autoplayCommand } from './music/autoplay';
import { lyricsCommand } from './music/lyrics';
import { saveCommand } from './music/save';
import { historyCommand } from './music/history';

import { filterCommand } from './filters/filter';

import { mode247Command } from './settings/mode247';
import { setupCommand } from './settings/setup';
import { settingsCommand } from './settings/settings';
import { playlistCommand } from './settings/playlist';
import { setprefixCommand } from './settings/setprefix';

import { helpCommand } from './utility/help';
import { pingCommand } from './utility/ping';
import { statsCommand } from './utility/stats';

export const commands = new Collection<string, Command>();

const commandList: Command[] = [
  playCommand,
  pauseCommand,
  resumeCommand,
  skipCommand,
  previousCommand,
  stopCommand,
  queueCommand,
  nowplayingCommand,
  volumeCommand,
  seekCommand,
  loopCommand,
  shuffleCommand,
  autoplayCommand,
  lyricsCommand,
  saveCommand,
  historyCommand,

  filterCommand,

  mode247Command,
  setupCommand,
  settingsCommand,
  playlistCommand,
  setprefixCommand,

  helpCommand,
  pingCommand,
  statsCommand,
];

for (const cmd of commandList) {
  commands.set(cmd.data.name, cmd);
}

export const slashCommandsJson = commandList.map((cmd) => cmd.data.toJSON());
