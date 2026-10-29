import { create } from 'zustand';
import { resolveVideoIdAsync } from '../lib/dynamicResolver';
import { resolveMasterAudioStream } from '../lib/masterAudioResolver';
import { resolveVideoId } from '../lib/videoResolver';
import { UnifiedPlayback, UnifiedTrack } from '../types';

export type RepeatMode = 'off' | 'all' | 'one';
export type PlaybackMode = 'full' | 'preview';

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
  playbackMode: PlaybackMode;
  isNowPlayingVideoOpen: boolean;
  isSpotifyImportOpen: boolean;
  isShareModalOpen: boolean;
  shareTrack: UnifiedTrack | null;
  isCreateSheetOpen: boolean;
  isExpandedNowPlaying: boolean;
  isNowPlayingViewOpen: boolean;
  dynamicVideoId: string | null;
  likedTrackIds: Set<string>;
  downloadedTrackIds: Set<string>;
  isSleepTimerModalOpen: boolean;
  sleepTimerMinutes: number | null; // e.g. 5, 10, 15, 30, 45, 60, or -1 for end of track
  sleepTimerEndTime: number | null; // epoch timestamp ms when timer expires
  isDiscordModalOpen: boolean;

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
  togglePlaybackMode: () => void;
  toggleNowPlayingVideo: () => void;
  setIsSpotifyImportOpen: (open: boolean) => void;
  openShareModal: (track?: UnifiedTrack) => void;
  closeShareModal: () => void;
  setIsCreateSheetOpen: (open: boolean) => void;
  setIsExpandedNowPlaying: (open: boolean) => void;
  toggleNowPlayingView: () => void;
  setIsNowPlayingViewOpen: (open: boolean) => void;
  setDynamicVideoId: (id: string | null) => void;
  toggleLike: (trackId: string) => void;
  markTrackDownloaded: (id: string) => void;
  unmarkTrackDownloaded: (id: string) => void;
  addToQueue: (track: UnifiedTrack) => void;
  openSleepTimerModal: () => void;
  closeSleepTimerModal: () => void;
  setSleepTimer: (minutes: number | null) => void;
  setIsDiscordModalOpen: (open: boolean) => void;
}

const getInitialHistory = (): UnifiedTrack[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('wavelength_listening_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  playback: null,
  isPlaying: false,
  queue: [],
  queueIndex: 0,
  history: getInitialHistory(),
  volume: 0.8,
  isMuted: false,
  progress: 0,
  duration: 0,
  seekTarget: null,
  isShuffled: false,
  repeatMode: 'off',
  playbackMode: 'full', // Default to full version of song
  isNowPlayingVideoOpen: false,
  isSpotifyImportOpen: false,
  isShareModalOpen: false,
  shareTrack: null,
  isCreateSheetOpen: false,
  isExpandedNowPlaying: false,
  isNowPlayingViewOpen: false,
  dynamicVideoId: null,
  likedTrackIds: new Set<string>(),
  downloadedTrackIds: new Set<string>(),
  isSleepTimerModalOpen: false,
  sleepTimerMinutes: null,
  sleepTimerEndTime: null,
  isDiscordModalOpen: false,

  setTrack: (track, queue) => {
    const state = get();
    const newQueue =
      queue && queue.length > 0 ? queue : state.queue.length > 0 ? state.queue : [track];
    const index = newQueue.findIndex((t) => t.id === track.id);

    const currentHist = state.history || [];
    const updatedHist = [track, ...currentHist.filter((t) => t.id !== track.id)].slice(0, 50);
    try {
      localStorage.setItem('wavelength_listening_history', JSON.stringify(updatedHist));
    } catch {}

    // Check fast local resolver first
    const instantVideoId = resolveVideoId(track.title, track.artistName);

    set({
      currentTrack: track,
      queue: newQueue,
      queueIndex: index >= 0 ? index : 0,
      history: updatedHist,
      isPlaying: true,
      progress: 0,
      duration: track.duration || 180,
      dynamicVideoId: instantVideoId,
    });

    // Asynchronously resolve dynamic official video/audio if not instant
    if (!instantVideoId) {
      resolveVideoIdAsync(track.title, track.artistName).then((resolved) => {
        if (resolved) {
          const current = get().currentTrack;
          if (current && current.id === track.id) {
            set({ dynamicVideoId: resolved });
          }
        }
      });
    }

    // Seamlessly upgrade to 100% full-length 320kbps master ad-free stream
    if (track.provider !== 'upload' && !track.id.startsWith('offline-')) {
      resolveMasterAudioStream(track.title, track.artistName).then((master) => {
        if (master && master.streamUrl) {
          const current = get().currentTrack;
          if (current && current.id === track.id) {
            set({
              currentTrack: {
                ...current,
                streamUrl: master.streamUrl,
                duration: master.duration,
                audioQuality: '320kbps (Master Studio Lossless)',
              },
              duration: master.duration,
            });
          }
        }
      });
    }
  },

  openShareModal: (track) => {
    set({
      isShareModalOpen: true,
      shareTrack: track || get().currentTrack,
    });
  },

  closeShareModal: () => set({ isShareModalOpen: false, shareTrack: null }),

  setIsCreateSheetOpen: (open) => set({ isCreateSheetOpen: open }),

  setIsExpandedNowPlaying: (open) => set({ isExpandedNowPlaying: open }),

  setDynamicVideoId: (id) => set({ dynamicVideoId: id }),

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
    const instantVideoId = resolveVideoId(nextTrack.title, nextTrack.artistName);
    set({
      currentTrack: nextTrack,
      queueIndex: nextIndex,
      progress: 0,
      duration: nextTrack.duration || 180,
      isPlaying: true,
      dynamicVideoId: instantVideoId,
    });

    if (!instantVideoId) {
      resolveVideoIdAsync(nextTrack.title, nextTrack.artistName).then((resolved) => {
        if (resolved) {
          const current = get().currentTrack;
          if (current && current.id === nextTrack.id) {
            set({ dynamicVideoId: resolved });
          }
        }
      });
    }

    if (nextTrack.provider !== 'upload' && !nextTrack.id.startsWith('offline-')) {
      resolveMasterAudioStream(nextTrack.title, nextTrack.artistName).then((master) => {
        if (master && master.streamUrl) {
          const current = get().currentTrack;
          if (current && current.id === nextTrack.id) {
            set({
              currentTrack: {
                ...current,
                streamUrl: master.streamUrl,
                duration: master.duration,
                audioQuality: '320kbps (Master Studio Lossless)',
              },
              duration: master.duration,
            });
          }
        }
      });
    }
  },

  prevTrack: () => {
    const { queue, queueIndex, progress } = get();
    if (queue.length === 0) return;

    if (progress > 3) {
      set({ progress: 0 });
      return;
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    const prevTrack = queue[prevIndex];
    const instantVideoId = resolveVideoId(prevTrack.title, prevTrack.artistName);
    set({
      currentTrack: prevTrack,
      queueIndex: prevIndex,
      progress: 0,
      duration: prevTrack.duration || 180,
      isPlaying: true,
      dynamicVideoId: instantVideoId,
    });

    if (!instantVideoId) {
      resolveVideoIdAsync(prevTrack.title, prevTrack.artistName).then((resolved) => {
        if (resolved) {
          const current = get().currentTrack;
          if (current && current.id === prevTrack.id) {
            set({ dynamicVideoId: resolved });
          }
        }
      });
    }

    if (prevTrack.provider !== 'upload' && !prevTrack.id.startsWith('offline-')) {
      resolveMasterAudioStream(prevTrack.title, prevTrack.artistName).then((master) => {
        if (master && master.streamUrl) {
          const current = get().currentTrack;
          if (current && current.id === prevTrack.id) {
            set({
              currentTrack: {
                ...current,
                streamUrl: master.streamUrl,
                duration: master.duration,
                audioQuality: '320kbps (Master Studio Lossless)',
              },
              duration: master.duration,
            });
          }
        }
      });
    }
  },

  seek: (seconds) => {
    const valid = Math.max(0, isNaN(seconds) ? 0 : seconds);
    set({ seekTarget: valid, progress: valid });
  },

  clearSeek: () => set({ seekTarget: null }),

  fastForward: (seconds) => {
    const { progress, duration } = get();
    const newTarget = Math.max(0, Math.min(duration || 1000, progress + seconds));
    set({ seekTarget: newTarget, progress: newTarget });
  },

  setProgress: (seconds) => set({ progress: isNaN(seconds) ? 0 : seconds }),

  setDuration: (seconds) => {
    if (!isNaN(seconds) && seconds > 0) {
      set({ duration: seconds });
    }
  },

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: false }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

  cycleRepeat: () =>
    set((state) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(state.repeatMode);
      return { repeatMode: modes[(currentIndex + 1) % modes.length] };
    }),

  togglePlaybackMode: () =>
    set((state) => ({
      playbackMode: state.playbackMode === 'full' ? 'preview' : 'full',
    })),

  toggleNowPlayingVideo: () =>
    set((state) => ({
      isNowPlayingVideoOpen: !state.isNowPlayingVideoOpen,
    })),

  setIsSpotifyImportOpen: (open) => set({ isSpotifyImportOpen: open }),

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

  markTrackDownloaded: (id) =>
    set((state) => {
      const nextDown = new Set(state.downloadedTrackIds);
      nextDown.add(id);
      return { downloadedTrackIds: nextDown };
    }),

  unmarkTrackDownloaded: (id) =>
    set((state) => {
      const nextDown = new Set(state.downloadedTrackIds);
      nextDown.delete(id);
      return { downloadedTrackIds: nextDown };
    }),

  addToQueue: (track) =>
    set((state) => ({
      queue: [...state.queue, track],
    })),

  openSleepTimerModal: () => set({ isSleepTimerModalOpen: true }),
  closeSleepTimerModal: () => set({ isSleepTimerModalOpen: false }),

  setSleepTimer: (minutes) => {
    if (minutes === null) {
      set({ sleepTimerMinutes: null, sleepTimerEndTime: null });
    } else if (minutes === -1) {
      // End of current track
      set({ sleepTimerMinutes: -1, sleepTimerEndTime: null });
    } else {
      const endTime = Date.now() + minutes * 60 * 1000;
      set({ sleepTimerMinutes: minutes, sleepTimerEndTime: endTime });
    }
  },

  setIsDiscordModalOpen: (open) => set({ isDiscordModalOpen: open }),
  toggleNowPlayingView: () =>
    set((state) => ({ isNowPlayingViewOpen: !state.isNowPlayingViewOpen })),
  setIsNowPlayingViewOpen: (open) => set({ isNowPlayingViewOpen: open }),
}));
