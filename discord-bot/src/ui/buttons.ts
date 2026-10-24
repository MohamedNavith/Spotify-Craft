import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { AudioFilter, LoopMode } from '../audio/types';
import { FILTER_DESCRIPTIONS } from '../audio/filters';

export function createPlayerButtons(isPlaying: boolean, loopMode: LoopMode, isAutoplay: boolean) {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_previous')
      .setEmoji('⏮️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_playpause')
      .setEmoji(isPlaying ? '⏸️' : '▶️')
      .setStyle(isPlaying ? ButtonStyle.Primary : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_skip')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_loop')
      .setEmoji(loopMode === 'track' ? '🔂' : loopMode === 'queue' ? '🔁' : '🔄')
      .setStyle(loopMode === 'off' ? ButtonStyle.Secondary : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_shuffle')
      .setEmoji('🔀')
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_voldown')
      .setEmoji('🔉')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_volup')
      .setEmoji('🔊')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_lyrics')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_autoplay')
      .setEmoji('📻')
      .setStyle(isAutoplay ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_stop')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger),
  );

  return [row1, row2];
}

export function createFilterSelectMenu(currentFilter: AudioFilter) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_filter')
    .setPlaceholder('🎛️ Select Audio DSP Filter / Equalizer');

  const options: StringSelectMenuOptionBuilder[] = [];

  for (const [key, val] of Object.entries(FILTER_DESCRIPTIONS)) {
    const opt = new StringSelectMenuOptionBuilder()
      .setLabel(val.name)
      .setValue(key)
      .setDescription(val.description.slice(0, 50))
      .setEmoji(val.emoji)
      .setDefault(key === currentFilter);
    options.push(opt);
  }

  selectMenu.addOptions(options);

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}
