import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command.interface';
import { AudioManager } from '../../audio/AudioManager';
import { AudioFilter } from '../../audio/types';
import { FILTER_DESCRIPTIONS } from '../../audio/filters';

export const filterCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Apply real-time FFmpeg DSP audio filters / effects')
    .addStringOption((opt) =>
      opt
        .setName('effect')
        .setDescription('DSP audio filter to apply')
        .setRequired(true)
        .addChoices(
          { name: 'Normal / Off', value: 'off' },
          { name: 'Bass Boost (Low)', value: 'bassboost_low' },
          { name: 'Bass Boost (Medium)', value: 'bassboost_med' },
          { name: 'Bass Boost (High / Earrape)', value: 'bassboost_high' },
          { name: '8D Audio (Binaural 360)', value: '8d' },
          { name: 'Nightcore (Fast & Pitch Up)', value: 'nightcore' },
          { name: 'Vaporwave (Slow & Aesthetic)', value: 'vaporwave' },
          { name: 'Slowed + Reverb (Lofi Echo)', value: 'slowed_reverb' },
          { name: 'Karaoke (Vocal Remover)', value: 'karaoke' },
          { name: 'Treble Boost', value: 'treble' },
          { name: 'Tremolo (Pulsating)', value: 'tremolo' },
          { name: 'Audio Normalizer', value: 'normalizer' },
        ),
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const queue = AudioManager.getQueue(interaction.guildId!);
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ **Nothing is currently playing.**', ephemeral: true });
    }

    const filterName = interaction.options.getString('effect', true) as AudioFilter;
    const filterDesc = FILTER_DESCRIPTIONS[filterName];

    await interaction.deferReply();
    await queue.setFilter(filterName);

    return interaction.editReply({
      content: `${filterDesc.emoji} **Audio filter applied:** \`${filterDesc.name}\`\n*${filterDesc.description}*`,
    });
  },
};
