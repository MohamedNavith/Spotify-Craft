'use client';

import { useEffect, useRef } from 'react';
import { resolveVideoIdAsync } from '../lib/dynamicResolver';
import { resolveMasterAudioStream } from '../lib/masterAudioResolver';
import { resolveVideoId } from '../lib/videoResolver';
import { useAuthStore } from '../stores/useAuthStore';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const prevTrackIdRef = useRef<string | null>(null);

  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    seekTarget,
    clearSeek,
    seek,
    fastForward,
    setProgress,
    setDuration,
    nextTrack,
    prevTrack,
    togglePlay,
    repeatMode,
    isNowPlayingVideoOpen,
    toggleNowPlayingVideo,
    dynamicVideoId,
    setDynamicVideoId,
    sleepTimerMinutes,
    sleepTimerEndTime,
    setSleepTimer,
    setIsPlaying,
  } = usePlayerStore();

  const isLocalOrOffline =
    currentTrack?.provider === 'upload' ||
    currentTrack?.id?.startsWith('offline-');

  const videoId =
    dynamicVideoId ||
    (currentTrack ? resolveVideoId(currentTrack.title, currentTrack.artistName) : null);

  // Background resolution for official music video
  useEffect(() => {
    if (!currentTrack || isLocalOrOffline) return;
    if (videoId) return;

    let active = true;
    resolveVideoIdAsync(currentTrack.title, currentTrack.artistName).then((resolved) => {
      if (active && resolved) {
        setDynamicVideoId(resolved);
      }
    });

    return () => {
      active = false;
    };
  }, [currentTrack, videoId, isLocalOrOffline, setDynamicVideoId]);

  // Track Ended Handler
  const handleTrackEnded = () => {
    if (sleepTimerMinutes === -1) {
      setIsPlaying(false);
      setSleepTimer(null);
      if (audioRef.current) audioRef.current.pause();
      return;
    }

    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setProgress(0);
    } else {
      nextTrack();
    }
  };

  // Sleep Timer Countdown Listener
  useEffect(() => {
    if (!sleepTimerEndTime) return;
    const interval = setInterval(() => {
      if (Date.now() >= sleepTimerEndTime) {
        setIsPlaying(false);
        setSleepTimer(null);
        if (audioRef.current) audioRef.current.pause();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEndTime, setIsPlaying, setSleepTimer]);

  // 1. Audio Source Loading: Directly bind HTML5 Audio to streamUrl
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack || !currentTrack.streamUrl) {
      audio.pause();
      audio.removeAttribute('src');
      return;
    }

    if (currentTrack.duration && currentTrack.duration > 0) {
      setDuration(currentTrack.duration);
    }

    const currentSrc = audio.src;
    const newSrc = currentTrack.streamUrl;
    const isNewTrack = prevTrackIdRef.current !== currentTrack.id;

    if (currentSrc !== newSrc) {
      const prevTime = audio.currentTime;
      audio.src = newSrc;
      audio.load();

      if (isNewTrack) {
        // Changing to a new track: ALWAYS start from 0:00!
        prevTrackIdRef.current = currentTrack.id;
        audio.currentTime = 0;
        setProgress(0);
        useAuthStore.getState().incrementSongCount();
      } else {
        // Same track upgrading from preview to full master 320kbps while playing: resume smoothly from current position
        if (prevTime > 1 && prevTime < (currentTrack.duration || 300)) {
          audio.currentTime = prevTime;
        }
      }

      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Waiting for user gesture to play:', err.message);
          });
        }
      }
    }
  }, [currentTrack?.id, currentTrack?.streamUrl, currentTrack?.duration, setDuration, setProgress, isPlaying]);

  // Real-time Listening Watchtime Tracker
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const timer = setInterval(() => {
      useAuthStore.getState().incrementWatchTime(1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentTrack]);

  // 2. Play / Pause Synchronization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.streamUrl) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Play interrupted or waiting for user gesture:', err.message);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.streamUrl]);

  // 3. Volume and Mute Control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 4. Seek Handling
  useEffect(() => {
    if (seekTarget !== null && audioRef.current) {
      audioRef.current.currentTime = seekTarget;
      clearSeek();
    }
  }, [seekTarget, clearSeek]);

  // 5. Hardware Lock Screen & MediaSession Integration
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    const artwork = currentTrack.artworkUrl
      ? [
          {
            src: currentTrack.artworkUrl,
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumName || 'Wavelength Master',
      artwork,
    });

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        fastForward(10);
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        fastForward(-10);
      });
    } catch (e) {
      console.warn('MediaSession handler setup failed:', e);
    }
  }, [currentTrack, nextTrack, prevTrack, setIsPlaying, seek, fastForward]);

  // 6. Update MediaSession Position State for active timeline on lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    try {
      if (
        'setPositionState' in navigator.mediaSession &&
        duration > 0 &&
        progress >= 0 &&
        progress <= duration
      ) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, 1),
          playbackRate: isPlaying ? 1 : 0,
          position: Math.min(progress, duration),
        });
      }
    } catch {}
  }, [progress, duration, isPlaying, currentTrack]);

  const ytDirectUrl = currentTrack
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${currentTrack.title} ${currentTrack.artistName} official music video`,
      )}`
    : '';

  return (
    <>
      {/* 100% Ad-Free, Instant, High-Fidelity Native HTML5 Audio Engine */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={() => {
          if (audioRef.current && isFinite(audioRef.current.currentTime)) {
            setProgress(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const d = audioRef.current.duration;
            if (isFinite(d) && d > 0) {
              setDuration(d);
            }
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) {
            const d = audioRef.current.duration;
            if (isFinite(d) && d > 0) {
              setDuration(d);
            }
          }
        }}
        onEnded={handleTrackEnded}
        onError={async (e) => {
          console.warn('Audio stream error, self-healing with master resolver:', e);
          if (currentTrack && !isLocalOrOffline) {
            try {
              const fresh = await resolveMasterAudioStream(
                currentTrack.title,
                currentTrack.artistName,
              );
              if (fresh && fresh.streamUrl && audioRef.current) {
                audioRef.current.src = fresh.streamUrl;
                audioRef.current.play().catch(() => {});
              }
            } catch {}
          }
        }}
      />

      {/* Official Music Video Overlay - ONLY mounted when the user explicitly requests Video */}
      {isNowPlayingVideoOpen && videoId && (
        <div className="fixed bottom-24 right-4 md:right-8 z-50 w-80 md:w-96 aspect-video rounded-xl overflow-hidden shadow-2xl border border-spotify-border bg-black transition-all animate-in fade-in slide-in-from-bottom-4 flex flex-col">
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center text-xs shadow-md"
              title="Open in YouTube"
            >
              ↗
            </a>
            <button
              onClick={toggleNowPlayingVideo}
              className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center text-xs shadow-md"
              title="Minimize Video"
            >
              ✕
            </button>
          </div>

          <iframe
            ref={ytIframeRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full"
            title="Official Music Video"
          />
        </div>
      )}

      {/* Fallback card when Video Mode is explicitly opened but video is unavailable */}
      {currentTrack && !videoId && isNowPlayingVideoOpen && (
        <div className="fixed bottom-24 right-4 md:right-8 z-50 w-80 md:w-96 aspect-video rounded-xl overflow-hidden shadow-2xl border border-spotify-border bg-black transition-all animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center p-4 bg-gradient-to-t from-black via-zinc-900 to-black text-center">
          <div className="absolute top-2 right-2 z-20">
            <button
              onClick={toggleNowPlayingVideo}
              className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center text-xs shadow-md"
              title="Close Video"
            >
              ✕
            </button>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-spotify-green">
            Official Video Mode
          </span>
          <h4 className="text-sm font-bold text-white truncate max-w-[240px] mt-1">
            {currentTrack.title}
          </h4>
          <p className="text-xs text-spotify-subtext truncate max-w-[200px]">
            {currentTrack.artistName}
          </p>
          <a
            href={ytDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 px-4 py-1.5 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <span>Watch on YouTube</span>
            <span>↗</span>
          </a>
        </div>
      )}
    </>
  );
}
