'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const {
    currentTrack,
    isPlaying,
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
    if (!currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumName || 'Wavelength Master',
      artwork: currentTrack.artworkUrl
        ? [
            { src: currentTrack.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: currentTrack.artworkUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: currentTrack.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });

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
  }, [currentTrack, togglePlay, nextTrack, prevTrack, seek, fastForward]);

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
      {currentTrack && isNowPlayingVideoOpen && (
        <div className="fixed bottom-24 right-4 md:right-8 z-50 w-80 md:w-96 aspect-video rounded-xl overflow-hidden shadow-2xl border border-spotify-border bg-black transition-all animate-in fade-in slide-in-from-bottom-4">
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={toggleNowPlayingVideo}
              className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center text-xs shadow-md"
              title="Close Video"
            >
              ✕
            </button>
          </div>
          <iframe
            ref={ytIframeRef}
            src={`https://www.youtube-nocookie.com/embed?listType=search&list=${ytQuery}&autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full"
            title="Official Music Video"
          />
        </div>
      )}
    </>
  );
}
