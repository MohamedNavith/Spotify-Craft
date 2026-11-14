import { create } from 'zustand';
import { resolveVideoIdAsync } from '../lib/dynamicResolver';
import {
  getCachedMasterAudio,
  isPreviewAudioUrl,
  resolveMasterAudioStream,
} from '../lib/masterAudioResolver';
import { resolveVideoId } from '../lib/videoResolver';
import { AudioStreamDetails, StreamingQuality, UnifiedPlayback, UnifiedTrack } from '../types';

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
  isVerciOpen: boolean;
  verciStyle: 'constellation' | 'spicetify' | 'kinetic' | 'canvas' | 'fisheye' | 'minimal';
  isLumnGlowEnabled: boolean;
  isDynamicIslandVisible: boolean;
  isCanvasModeEnabled: boolean;
  streamingQuality: StreamingQuality;
  audioStreamDetails: AudioStreamDetails | null;
  isQualityModalOpen: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isEqualizerOpen: boolean;

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
  setIsVerciOpen: (open: boolean) => void;
  setVerciStyle: (style: 'constellation' | 'spicetify' | 'kinetic' | 'canvas' | 'fisheye' | 'minimal') => void;
  toggleLumnGlow: () => void;
  toggleDynamicIsland: () => void;
  setIsDynamicIslandVisible: (visible: boolean) => void;
  toggleCanvasMode: () => void;
  setIsCanvasModeEnabled: (enabled: boolean) => void;
  setStreamingQuality: (quality: StreamingQuality) => void;
  setAudioStreamDetails: (details: AudioStreamDetails | null) => void;
  setIsQualityModalOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsLyricsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsQueueOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsEqualizerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
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
  isVerciOpen: false,
  verciStyle: 'constellation',
  isLumnGlowEnabled: true,
  isDynamicIslandVisible: typeof window !== 'undefined' ? localStorage.getItem('wavelength_island_visible') !== 'false' : true,
  isCanvasModeEnabled: typeof window !== 'undefined' ? localStorage.getItem('wavelength_canvas_enabled') !== 'false' : true,
  streamingQuality: typeof window !== 'undefined' ? (localStorage.getItem('wavelength_streaming_quality') as StreamingQuality) || 'high-quality' : 'high-quality',
  audioStreamDetails: null,
  isQualityModalOpen: false,
  isLyricsOpen: false,
  isQueueOpen: false,
  isEqualizerOpen: false,
  setIsQualityModalOpen: (open) =>
    set((state) => ({
      isQualityModalOpen: typeof open === 'function' ? open(state.isQualityModalOpen) : open,
    })),
  setIsLyricsOpen: (open) =>
    set((state) => ({
      isLyricsOpen: typeof open === 'function' ? open(state.isLyricsOpen) : open,
    })),
  setIsQueueOpen: (open) =>
    set((state) => ({
      isQueueOpen: typeof open === 'function' ? open(state.isQueueOpen) : open,
    })),
  setIsEqualizerOpen: (open) =>
    set((state) => ({
      isEqualizerOpen: typeof open === 'function' ? open(state.isEqualizerOpen) : open,
    })),

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

    const instantVideoId = resolveVideoId(track.title, track.artistName);
    const isLocalOrOffline = track.provider === 'upload' || track.id.startsWith('offline-');

    if (isLocalOrOffline) {
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
      return;
    }

    // 1. Check synchronous fast cache for full master stream
    const cachedMaster = getCachedMasterAudio(track.title, track.artistName, state.streamingQuality);

    if (cachedMaster && cachedMaster.streamUrl) {
      // CACHE HIT: Full song is already known! Start playing immediately from 0:00!
      set({
        currentTrack: {
          ...track,
          streamUrl: cachedMaster.streamUrl,
          duration: cachedMaster.duration,
          audioQuality: cachedMaster.quality,
        },
        queue: newQueue,
        queueIndex: index >= 0 ? index : 0,
        history: updatedHist,
        isPlaying: true,
        progress: 0,
        duration: cachedMaster.duration,
        audioStreamDetails: cachedMaster.details || null,
        dynamicVideoId: instantVideoId,
      });

      // Background pre-cache next track in queue
      const nextIdx = (index >= 0 ? index : 0) + 1;
      if (newQueue[nextIdx]) {
        resolveMasterAudioStream(newQueue[nextIdx].title, newQueue[nextIdx].artistName, state.streamingQuality);
      }
      return;
    }

    // 2. CACHE MISS: Track is resolving.
    // CRITICAL FIX: NEVER assign 30s preview URL to streamUrl! Set streamUrl to null so 30s clip never plays!
    const fallbackPreview = track.streamUrl;
    set({
      currentTrack: {
        ...track,
        streamUrl: null, // Keeps audio engine quiet until full song is loaded
      },
      queue: newQueue,
      queueIndex: index >= 0 ? index : 0,
      history: updatedHist,
      isPlaying: true,
      progress: 0,
      duration: track.duration || 180,
      dynamicVideoId: instantVideoId,
    });

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

    // Seamlessly fetch full master audio and start playing from 0:00
    resolveMasterAudioStream(track.title, track.artistName, state.streamingQuality).then((master) => {
      const current = get().currentTrack;
      if (current && current.id === track.id) {
        if (master && master.streamUrl) {
          set({
            currentTrack: {
              ...current,
              streamUrl: master.streamUrl,
              duration: master.duration,
              audioQuality: master.quality,
            },
            duration: master.duration,
            audioStreamDetails: master.details || null,
          });
        } else if (fallbackPreview) {
          // Last resort fallback only if full master search fails completely
          set({
            currentTrack: {
              ...current,
              streamUrl: fallbackPreview,
            },
          });
        }
      }

      // Pre-cache next song in queue in background
      const nextIdx = (index >= 0 ? index : 0) + 1;
      if (newQueue[nextIdx]) {
        resolveMasterAudioStream(newQueue[nextIdx].title, newQueue[nextIdx].artistName, state.streamingQuality);
      }
    });
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
    const state = get();
    const { queue, queueIndex, repeatMode, isShuffled } = state;
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
    const isLocalOrOffline = nextTrack.provider === 'upload' || nextTrack.id.startsWith('offline-');

    if (isLocalOrOffline) {
      set({
        currentTrack: nextTrack,
        queueIndex: nextIndex,
        progress: 0,
        duration: nextTrack.duration || 180,
        isPlaying: true,
        dynamicVideoId: instantVideoId,
      });
      return;
    }

    // Check fast cache
    const cachedMaster = getCachedMasterAudio(nextTrack.title, nextTrack.artistName, state.streamingQuality);

    if (cachedMaster && cachedMaster.streamUrl) {
      set({
        currentTrack: {
          ...nextTrack,
          streamUrl: cachedMaster.streamUrl,
          duration: cachedMaster.duration,
          audioQuality: cachedMaster.quality,
        },
        queueIndex: nextIndex,
        progress: 0,
        duration: cachedMaster.duration,
        audioStreamDetails: cachedMaster.details || null,
        isPlaying: true,
        dynamicVideoId: instantVideoId,
      });

      // Pre-cache following song
      if (queue[nextIndex + 1]) {
        resolveMasterAudioStream(queue[nextIndex + 1].title, queue[nextIndex + 1].artistName, state.streamingQuality);
      }
      return;
    }

    // Cache miss: do NOT play 30s preview
    const fallbackPreview = nextTrack.streamUrl;
    set({
      currentTrack: {
        ...nextTrack,
        streamUrl: null,
      },
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

    resolveMasterAudioStream(nextTrack.title, nextTrack.artistName, state.streamingQuality).then((master) => {
      const current = get().currentTrack;
      if (current && current.id === nextTrack.id) {
        if (master && master.streamUrl) {
          set({
            currentTrack: {
              ...current,
              streamUrl: master.streamUrl,
              duration: master.duration,
              audioQuality: master.quality,
            },
            duration: master.duration,
            audioStreamDetails: master.details || null,
          });
        } else if (fallbackPreview) {
          set({
            currentTrack: {
              ...current,
              streamUrl: fallbackPreview,
            },
          });
        }
      }

      if (queue[nextIndex + 1]) {
        resolveMasterAudioStream(queue[nextIndex + 1].title, queue[nextIndex + 1].artistName, state.streamingQuality);
      }
    });
  },

  prevTrack: () => {
    const state = get();
    const { queue, queueIndex, progress } = state;
    if (queue.length === 0) return;

    if (progress > 3) {
      set({ progress: 0 });
      return;
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    const prevTrack = queue[prevIndex];
    const instantVideoId = resolveVideoId(prevTrack.title, prevTrack.artistName);
    const isLocalOrOffline = prevTrack.provider === 'upload' || prevTrack.id.startsWith('offline-');

    if (isLocalOrOffline) {
      set({
        currentTrack: prevTrack,
        queueIndex: prevIndex,
        progress: 0,
        duration: prevTrack.duration || 180,
        isPlaying: true,
        dynamicVideoId: instantVideoId,
      });
      return;
    }

    // Check fast cache
    const cachedMaster = getCachedMasterAudio(prevTrack.title, prevTrack.artistName, state.streamingQuality);

    if (cachedMaster && cachedMaster.streamUrl) {
      set({
        currentTrack: {
          ...prevTrack,
          streamUrl: cachedMaster.streamUrl,
          duration: cachedMaster.duration,
          audioQuality: cachedMaster.quality,
        },
        queueIndex: prevIndex,
        progress: 0,
        duration: cachedMaster.duration,
        audioStreamDetails: cachedMaster.details || null,
        isPlaying: true,
        dynamicVideoId: instantVideoId,
      });
      return;
    }

    // Cache miss: do NOT play 30s preview
    const fallbackPreview = prevTrack.streamUrl;
    set({
      currentTrack: {
        ...prevTrack,
        streamUrl: null,
      },
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

    resolveMasterAudioStream(prevTrack.title, prevTrack.artistName, state.streamingQuality).then((master) => {
      const current = get().currentTrack;
      if (current && current.id === prevTrack.id) {
        if (master && master.streamUrl) {
          set({
            currentTrack: {
              ...current,
              streamUrl: master.streamUrl,
              duration: master.duration,
              audioQuality: master.quality,
            },
            duration: master.duration,
            audioStreamDetails: master.details || null,
          });
        } else if (fallbackPreview) {
          set({
            currentTrack: {
              ...current,
              streamUrl: fallbackPreview,
            },
          });
        }
      }
    });
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
  setIsVerciOpen: (open) => set({ isVerciOpen: open }),
  setVerciStyle: (style) => set({ verciStyle: style }),
  toggleLumnGlow: () => set((state) => ({ isLumnGlowEnabled: !state.isLumnGlowEnabled })),
  toggleDynamicIsland: () =>
    set((state) => {
      const next = !state.isDynamicIslandVisible;
      try {
        localStorage.setItem('wavelength_island_visible', String(next));
      } catch {}
      return { isDynamicIslandVisible: next };
    }),
  setIsDynamicIslandVisible: (visible) => {
    try {
      localStorage.setItem('wavelength_island_visible', String(visible));
    } catch {}
    set({ isDynamicIslandVisible: visible });
  },
  toggleCanvasMode: () =>
    set((state) => {
      const next = !state.isCanvasModeEnabled;
      try {
        localStorage.setItem('wavelength_canvas_enabled', String(next));
      } catch {}
      return { isCanvasModeEnabled: next };
    }),
  setIsCanvasModeEnabled: (enabled) => {
    try {
      localStorage.setItem('wavelength_canvas_enabled', String(enabled));
    } catch {}
    set({ isCanvasModeEnabled: enabled });
  },
  setAudioStreamDetails: (details) => set({ audioStreamDetails: details }),
  setStreamingQuality: (quality) => {
    try {
      localStorage.setItem('wavelength_streaming_quality', quality);
    } catch {}
    set({ streamingQuality: quality });

    const track = get().currentTrack;
    if (track && track.provider !== 'upload' && !track.id.startsWith('offline-')) {
      resolveMasterAudioStream(track.title, track.artistName, quality).then((master) => {
        if (master && master.streamUrl) {
          const current = get().currentTrack;
          if (current && current.id === track.id) {
            set({
              currentTrack: {
                ...current,
                streamUrl: master.streamUrl,
                duration: master.duration,
                audioQuality: master.quality,
              },
              audioStreamDetails: master.details || null,
            });
          }
        }
      });
    }
  },
}));
