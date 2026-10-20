'use client';

import { useEffect, useRef } from 'react';
import { resolveVideoIdAsync } from '../lib/dynamicResolver';
import { resolveVideoId } from '../lib/videoResolver';
import { usePlayerStore } from '../stores/usePlayerStore';

// Ultra-light silent WAV audio carrier (1 sample) used to keep Android MediaSession active during full mode
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

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
    playbackMode,
    isNowPlayingVideoOpen,
    toggleNowPlayingVideo,
    dynamicVideoId,
    setDynamicVideoId,
    sleepTimerMinutes,
    sleepTimerEndTime,
    setSleepTimer,
    setIsPlaying,
  } = usePlayerStore();

  const videoId = dynamicVideoId || (currentTrack ? resolveVideoId(currentTrack.title, currentTrack.artistName) : null);
  const isYTMode = playbackMode === 'full' && !!videoId;

  // Resolve dynamic video ID asynchronously if not already known
  useEffect(() => {
    if (!currentTrack) return;
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
  }, [currentTrack, videoId, setDynamicVideoId]);

  // Universal Track Finished Handler (Handles Sleep Timer & Auto-Next)
  const handleTrackEnded = () => {
    if (sleepTimerMinutes === -1) {
      // Sleep timer was configured for "End of this track"
      setIsPlaying(false);
      setSleepTimer(null);
      if (audioRef.current) audioRef.current.pause();
      postYT('pauseVideo');
      return;
    }

    if (repeatMode === 'one') {
      if (isYTMode) {
        postYT('seekTo', [0, true]);
        postYT('playVideo');
      } else if (audioRef.current) {
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
        postYT('pauseVideo');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEndTime, setIsPlaying, setSleepTimer]);

  // Helper to send postMessage commands to YouTube IFrame
  const postYT = (func: string, args: any[] = []) => {
    try {
      if (ytIframeRef.current?.contentWindow) {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*',
        );
      }
    } catch {}
  };

  // Listen for YouTube IFrame Player API postMessage events (Ended, Time update, Ad silencing)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);

        // Dynamic Ad Silencer & Auto-Skipper
        if (data.event === 'infoDelivery' && data.info) {
          const isAd = Boolean(
            data.info.adVideoId ||
            data.info.isAd ||
            (data.info.videoData && data.info.videoData.isAd)
          );

          if (isAd) {
            // Mute ad and fast-forward past commercial slot
            postYT('mute');
            postYT('setPlaybackRate', [16]);
            if (data.info.duration && data.info.duration > 0) {
              postYT('seekTo', [data.info.duration, true]);
            }
            return;
          } else {
            // Restore regular playback audio rate
            if (!isMuted) postYT('unMute');
            postYT('setPlaybackRate', [1]);
          }

          if (typeof data.info.currentTime === 'number' && isFinite(data.info.currentTime)) {
            setProgress(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && isFinite(data.info.duration) && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
        }

        if (data.event === 'onStateChange') {
          // YT.PlayerState.ENDED = 0
          if (data.info === 0) {
            handleTrackEnded();
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [repeatMode, nextTrack, setProgress, setDuration, isMuted, sleepTimerMinutes]);

  // 1. Audio Source Loading: Synchronize streamUrl or YouTube embed
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute('src');
      postYT('pauseVideo');
      return;
    }

    if (currentTrack.duration) {
      setDuration(currentTrack.duration);
    }

    if (isYTMode) {
      // In full mode with YouTube video, use silent audio carrier to keep Android Lock Screen & MediaSession alive
      if (audio.src !== SILENT_AUDIO_URI) {
        audio.src = SILENT_AUDIO_URI;
        audio.loop = true;
        audio.volume = 0.001;
      }
      if (isPlaying) {
        audio.play().catch(() => {});
        postYT('playVideo');
      } else {
        audio.pause();
        postYT('pauseVideo');
      }
    } else {
      // Fallback or preview mode: use HTML5 audio element
      postYT('pauseVideo');
      audio.loop = false;
      if (currentTrack.streamUrl && audio.src !== currentTrack.streamUrl) {
        audio.src = currentTrack.streamUrl;
        audio.load();
      }

      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Autoplay waiting for user gesture:', err.message);
          });
        }
      }
    }
  }, [currentTrack, isYTMode, isPlaying, setDuration]);

  // 2. Play / Pause Synchronization
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack) return;

    if (isPlaying) {
      if (isYTMode) {
        if (audio && audio.src !== SILENT_AUDIO_URI) {
          audio.src = SILENT_AUDIO_URI;
          audio.loop = true;
          audio.volume = 0.001;
        }
        audio?.play().catch(() => {});
        postYT('playVideo');
      } else if (audio) {
        audio.play().catch(() => {});
      }
    } else {
      audio?.pause();
      postYT('pauseVideo');
    }
  }, [isPlaying, isYTMode, currentTrack]);

  // 3. Seeking Synchronization (Instant scrubbing response)
  useEffect(() => {
    if (seekTarget === null || !isFinite(seekTarget)) return;

    const audio = audioRef.current;
    if (isYTMode) {
      postYT('seekTo', [seekTarget, true]);
      setProgress(seekTarget);
    } else if (audio) {
      audio.currentTime = seekTarget;
      setProgress(seekTarget);
    }
    clearSeek();
  }, [seekTarget, isYTMode, clearSeek, setProgress]);

  // 4. Volume & Mute Synchronization
  useEffect(() => {
    const audio = audioRef.current;
    const vol = isMuted ? 0 : volume;
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, vol));
    }
    postYT('setVolume', [Math.round(vol * 100)]);
    if (isMuted) postYT('mute');
    else postYT('unMute');
  }, [volume, isMuted]);

  // 5. High-Precision Playback Timer (Updates progress every 200ms)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (isYTMode) {
        // Poll YouTube currentTime
        postYT('getCurrentTime');
        const next = progress + 0.2;
        if (duration > 5 && next >= duration) {
          handleTrackEnded();
        } else {
          setProgress(duration > 0 ? Math.min(next, duration) : next);
        }
      } else {
        const audio = audioRef.current;
        if (audio && !audio.paused && isFinite(audio.currentTime)) {
          setProgress(audio.currentTime);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, isYTMode, progress, duration, setProgress, repeatMode, nextTrack, sleepTimerMinutes]);

  // 6. Media Session API (Lock screen, dynamic notifications, Bluetooth metadata)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!currentTrack) {
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumName || 'Wavelength Master',
      artwork: currentTrack.artworkUrl
        ? [
            { src: currentTrack.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: currentTrack.artworkUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: currentTrack.artworkUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: currentTrack.artworkUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: currentTrack.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    if ('setPositionState' in navigator.mediaSession && duration > 0 && isFinite(progress)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, duration),
          playbackRate: 1,
          position: Math.max(0, Math.min(progress, duration)),
        });
      } catch (e) {}
    }

    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') {
        seek(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      fastForward(details.seekOffset || 10);
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      fastForward(-(details.seekOffset || 10));
    });
  }, [currentTrack, isPlaying, progress, duration, togglePlay, nextTrack, prevTrack, seek, fastForward]);

  const ytDirectUrl = currentTrack
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${currentTrack.title} ${currentTrack.artistName} official music video`,
      )}`
    : '';

  return (
    <>
      {/* Primary HTML5 Audio Engine (Used when audio stream is active) */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={() => {
          if (!isYTMode && audioRef.current && isFinite(audioRef.current.currentTime)) {
            setProgress(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (!isYTMode && audioRef.current) {
            const d = audioRef.current.duration;
            if (isFinite(d) && d > 0) {
              setDuration(d);
            }
          }
        }}
        onDurationChange={() => {
          if (!isYTMode && audioRef.current) {
            const d = audioRef.current.duration;
            if (isFinite(d) && d > 0) {
              setDuration(d);
            }
          }
        }}
        onEnded={() => {
          if (!isYTMode) {
            handleTrackEnded();
          }
        }}
        onError={async (e) => {
          console.warn('Audio stream error, attempting self-healing:', e);
          if (currentTrack && currentTrack.provider === 'official') {
            try {
              const { searchOfficialMusic } = await import('../lib/officialMusic');
              const fresh = await searchOfficialMusic(
                `${currentTrack.title} ${currentTrack.artistName}`,
                1,
              );
              if (fresh.length > 0 && fresh[0].streamUrl && audioRef.current) {
                audioRef.current.src = fresh[0].streamUrl;
                audioRef.current.play().catch(() => {});
              }
            } catch {}
          }
        }}
      />

      {/* Official YouTube Full Song & Video Engine */}
      {currentTrack && videoId && (
        <div
          className={
            isNowPlayingVideoOpen
              ? 'fixed bottom-24 right-4 md:right-8 z-50 w-80 md:w-96 aspect-video rounded-xl overflow-hidden shadow-2xl border border-spotify-border bg-black transition-all animate-in fade-in slide-in-from-bottom-4 flex flex-col'
              : 'fixed bottom-1 right-1 w-2 h-2 opacity-[0.02] pointer-events-none z-0 overflow-hidden'
          }
        >
          {isNowPlayingVideoOpen && (
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
          )}

          <iframe
            ref={ytIframeRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&iv_load_policy=3&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full"
            title="Official Master Audio / Video"
          />
        </div>
      )}

      {/* Fallback card when Video Mode is explicitly opened but no videoId found */}
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
