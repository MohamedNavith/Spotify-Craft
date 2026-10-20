import { create } from 'zustand';
import { UnifiedPlayback, UnifiedTrack } from '../types';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  currentTrack: UnifiedTrack | null;
  playback: UnifiedPlayback | null;
  isPlaying: boolean;
  queue: UnifiedTrack[];
  queueIndex: number;
  history: UnifiedTrack[];
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  seekTarget: number | null;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  likedTrackIds: Set<string>;

  // Actions
  setTrack: (track: UnifiedTrack, queue?: UnifiedTrack[]) => void;
  setPlayback: (playback: UnifiedPlayback | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  clearSeek: () => void;
  fastForward: (seconds: number) => void;
  setProgress: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: (trackId: string) => void;
  addToQueue: (track: UnifiedTrack) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  playback: null,
  isPlaying: false,
  queue: [],
  queueIndex: 0,
  history: [],
  volume: 0.8,
  isMuted: false,
  progress: 0,
  duration: 0,
  seekTarget: null,
  isShuffled: false,
  repeatMode: 'off',
  likedTrackIds: new Set<string>(),

  setTrack: (track, queue) => {
    const state = get();
    const newQueue = queue && queue.length > 0 ? queue : state.queue.length > 0 ? state.queue : [track];
    const index = newQueue.findIndex((t) => t.id === track.id);

    set({
      currentTrack: track,
      queue: newQueue,
      queueIndex: index >= 0 ? index : 0,
      isPlaying: true,
      progress: 0,
      duration: track.duration || 0,
    });
  },

  setPlayback: (playback) => set({ playback }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  nextTrack: () => {
    const { queue, queueIndex, repeatMode, isShuffled } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      set({ progress: 0, isPlaying: true });
      return;
    }

    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        set({ isPlaying: false, progress: 0 });
        return;
      }
    }

    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    const nextTrack = queue[nextIndex];
    set({
      currentTrack: nextTrack,
      queueIndex: nextIndex,
      progress: 0,
      duration: nextTrack.duration || 0,
      isPlaying: true,
    });
  },

  prevTrack: () => {
    const { queue, queueIndex, progress } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart track
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    const prevTrack = queue[prevIndex];
    set({
      currentTrack: prevTrack,
      queueIndex: prevIndex,
      progress: 0,
      duration: prevTrack.duration || 0,
      isPlaying: true,
    });
  },

  seek: (seconds) => {
    const target = Math.max(0, isNaN(seconds) ? 0 : seconds);
    set({ seekTarget: target, progress: target });
  },

  clearSeek: () => set({ seekTarget: null }),

  fastForward: (seconds) => {
    const { progress, duration } = get();
    const maxDur = duration > 0 ? duration : 3600;
    const target = Math.max(0, Math.min(maxDur, progress + seconds));
    set({ seekTarget: target, progress: target });
  },

  setProgress: (seconds) => set({ progress: seconds }),

  setDuration: (seconds) => set({ duration: seconds }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: false }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

  cycleRepeat: () =>
    set((state) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
      return { repeatMode: modes[nextIndex] };
    }),

  toggleLike: (trackId) =>
    set((state) => {
      const nextLiked = new Set(state.likedTrackIds);
      if (nextLiked.has(trackId)) {
        nextLiked.delete(trackId);
      } else {
        nextLiked.add(trackId);
      }
      return { likedTrackIds: nextLiked };
    }),

  addToQueue: (track) =>
    set((state) => ({
      queue: [...state.queue, track],
    })),
}));
