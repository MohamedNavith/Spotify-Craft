export interface Requester {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface Track {
  title: string;
  author: string;
  url: string;
  streamUrl: string | null;
  duration: number; // in seconds
  formattedDuration: string;
  thumbnail: string;
  requester: Requester;
  source: 'wavelength' | 'spotify' | 'youtube' | 'soundcloud' | 'direct';
}

export type LoopMode = 'off' | 'track' | 'queue';

export type AudioFilter =
  | 'off'
  | 'bassboost_low'
  | 'bassboost_med'
  | 'bassboost_high'
  | '8d'
  | 'nightcore'
  | 'vaporwave'
  | 'slowed_reverb'
  | 'karaoke'
  | 'treble'
  | 'tremolo'
  | 'normalizer';

export interface GuildSettings {
  guildId: string;
  prefix: string;
  defaultVolume: number;
  idleTimeoutSeconds: number;
  djRoleId: string | null;
  defaultFilter: AudioFilter;
  announceNowPlaying: boolean;
  requestChannelId: string | null;
  requestMessageId: string | null;
  mode247: boolean;
}

export interface UserPlaylist {
  userId: string;
  name: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}
