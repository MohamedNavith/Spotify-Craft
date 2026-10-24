import { AudioFilter } from './types';

export const AUDIO_FILTERS: Record<AudioFilter, string | null> = {
  off: null,
  bassboost_low: 'bass=g=5,dynaudnorm=f=200',
  bassboost_med: 'bass=g=10,dynaudnorm=f=200',
  bassboost_high: 'bass=g=15,dynaudnorm=f=200',
  '8d': 'apulsator=hz=0.08',
  nightcore: 'asetrate=48000*1.25,aresample=48000,atempo=1.06',
  vaporwave: 'aresample=48000,asetrate=48000*0.82',
  slowed_reverb: 'atempo=0.85,aecho=0.8:0.9:1000:0.3',
  karaoke: 'pan=stereo|c0=c0-c1|c1=c1-c0',
  treble: 'treble=g=6',
  tremolo: 'tremolo=f=5.0:d=0.5',
  normalizer: 'dynaudnorm=f=200:m=10.0',
};

export const FILTER_DESCRIPTIONS: Record<AudioFilter, { name: string; emoji: string; description: string }> = {
  off: { name: 'Normal / Off', emoji: '⏹️', description: 'Raw, pristine studio audio without filters' },
  bassboost_low: { name: 'Bass Boost (Low)', emoji: '🔊', description: 'Subtle low-end punch (+5dB)' },
  bassboost_med: { name: 'Bass Boost (Medium)', emoji: '🔊', description: 'Heavy club bass (+10dB)' },
  bassboost_high: { name: 'Bass Boost (High)', emoji: '💣', description: 'Extreme earthquake sub-bass (+15dB)' },
  '8d': { name: '8D Audio (Surround)', emoji: '🎧', description: '360-degree rotating binaural spatial audio' },
  nightcore: { name: 'Nightcore', emoji: '⚡', description: 'Speed up pitch & tempo (1.25x)' },
  vaporwave: { name: 'Vaporwave', emoji: '🌊', description: 'Slowed aesthetic pitch down (0.82x)' },
  slowed_reverb: { name: 'Slowed + Reverb', emoji: '🌧️', description: 'Lofi midnight slowed with atmospheric echo' },
  karaoke: { name: 'Karaoke', emoji: '🎤', description: 'Center-channel vocal cancellation' },
  treble: { name: 'Treble Boost', emoji: '🎚️', description: 'Crisp vocal and instrumental highs (+6dB)' },
  tremolo: { name: 'Tremolo', emoji: '📻', description: 'Rapid pulsating amplitude modulation effect' },
  normalizer: { name: 'Audio Normalizer', emoji: '🎛️', description: 'Equalizes quiet and loud sections dynamically' },
};
