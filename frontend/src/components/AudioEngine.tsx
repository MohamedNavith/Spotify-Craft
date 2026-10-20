'use client';

import { useEffect, useRef } from 'react';
import { resolveVideoId } from '../lib/videoResolver';
import { usePlayerStore } from '../stores/usePlayerStore';

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
    isNowPlayingVideoOpen,
    toggleNowPlayingVideo,
  } = usePlayerStore();

  // Helper to send postMessage commands to YouTube IFrame if active
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

  // 1. Audio Source Loading: Load streamUrl whenever currentTrack changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack || !currentTrack.streamUrl) {
      audio.pause();
      audio.removeAttribute('src');
      return;
    }

    if (audio.src !== currentTrack.streamUrl) {
      audio.src = currentTrack.streamUrl;
      audio.load();
      if (currentTrack.duration) {
        setDuration(currentTrack.duration);
      }
    }

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay policy prevented playback until user interaction
          console.warn('Autoplay waiting for user gesture:', err.message);
        });
      }
    }
  }, [currentTrack, setDuration]);

  // 2. Play / Pause Synchronization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
      postYT('playVideo');
    } else {
      audio.pause();
      postYT('pauseVideo');
    }
  }, [isPlaying, currentTrack]);

  // 3. Seeking Synchronization (Instant scrubbing response)
  useEffect(() => {
    if (seekTarget === null || !isFinite(seekTarget)) return;

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = seekTarget;
      setProgress(seekTarget);
    }
    postYT('seekTo', [seekTarget, true]);
    clearSeek();
  }, [seekTarget, clearSeek, setProgress]);

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

  // 5. High-Precision Playback Timer (Updates progress every 150ms for smooth UI)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused && isFinite(audio.currentTime)) {
        setProgress(audio.currentTime);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, setProgress]);

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

  const ytQuery = currentTrack
    ? encodeURIComponent(`${currentTrack.title} ${currentTrack.artistName} official video`)
    : '';

  return (
    <>
      {/* Primary HTML5 Audio Engine */}
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
        onEnded={() => {
          if (repeatMode === 'one' && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          } else {
            nextTrack();
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

      {/* Official YouTube Music Video / Full Song Mode (Picture-in-Picture) */}
      {currentTrack && isNowPlayingVideoOpen && (() => {
        const videoId = resolveVideoId(currentTrack.title, currentTrack.artistName);
        const ytDirectUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${currentTrack.title} ${currentTrack.artistName} official music video`,
        )}`;

        return (
          <div className="fixed bottom-24 right-4 md:right-8 z-50 w-80 md:w-96 aspect-video rounded-xl overflow-hidden shadow-2xl border border-spotify-border bg-black transition-all animate-in fade-in slide-in-from-bottom-4 flex flex-col">
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
              <a
                href={videoId ? `https://www.youtube.com/watch?v=${videoId}` : ytDirectUrl}
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
                title="Close Video"
              >
                ✕
              </button>
            </div>

            {videoId ? (
              <iframe
                ref={ytIframeRef}
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full"
                title="Official Music Video"
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-t from-black via-zinc-900 to-black text-center">
                {currentTrack.artworkUrl && (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-sm"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-spotify-green">
                    Official Video Mode
                  </span>
                  <h4 className="text-sm font-bold text-white truncate max-w-[240px]">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-spotify-subtext truncate max-w-[200px]">
                    {currentTrack.artistName}
                  </p>
                  <a
                    href={ytDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 px-4 py-1.5 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Watch Full Music Video</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
