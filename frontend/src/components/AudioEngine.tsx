'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    progress,
    seekTarget,
    clearSeek,
    seek,
    fastForward,
    setProgress,
    setDuration,
    nextTrack,
    prevTrack,
    togglePlay,
    playbackMode,
    isNowPlayingVideoOpen,
    toggleNowPlayingVideo,
  } = usePlayerStore();

  // Helper to send postMessage commands to YouTube IFrame
  const postYT = (func: string, args: any[] = []) => {
    try {
      if (ytIframeRef.current?.contentWindow) {
        ytIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*',
        );
      }
    } catch (e) {}
  };

  // Sync Seeking (YouTube full stream or HTML5 audio)
  useEffect(() => {
    if (seekTarget === null || !isFinite(seekTarget)) return;

    if (playbackMode === 'full') {
      postYT('seekTo', [seekTarget, true]);
      clearSeek();
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = seekTarget;
        clearSeek();
      }
    }
  }, [seekTarget, clearSeek, playbackMode]);

  // Sync Play / Pause
  useEffect(() => {
    if (playbackMode === 'full') {
      postYT(isPlaying ? 'playVideo' : 'pauseVideo');
      if (audioRef.current) audioRef.current.pause();
    } else {
      const audio = audioRef.current;
      if (!audio || !currentTrack) return;
      if (isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      postYT('pauseVideo');
    }
  }, [isPlaying, playbackMode, currentTrack]);

  // Sync Volume
  useEffect(() => {
    const vol = isMuted ? 0 : volume;
    if (playbackMode === 'full') {
      postYT('setVolume', [Math.round(vol * 100)]);
      if (isMuted) postYT('mute');
      else postYT('unMute');
    } else {
      if (audioRef.current) audioRef.current.volume = vol;
    }
  }, [volume, isMuted, playbackMode]);

  // HTML5 Audio Source loader for Preview Mode or Offline Blobs
  useEffect(() => {
    if (playbackMode !== 'preview') {
      if (audioRef.current) audioRef.current.pause();
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.streamUrl) {
      if (audio.src !== currentTrack.streamUrl) {
        audio.src = currentTrack.streamUrl;
        audio.load();
      }
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
    }
  }, [currentTrack, playbackMode, isPlaying]);

  // Listen to YouTube postMessage events (time update, duration, song ended)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data) return;

        // infoDelivery event contains currentTime and duration
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setProgress(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (data.info.playerState === 0) {
            // 0 = ENDED -> Advance to next track in queue!
            nextTrack();
          }
        }

        // initialDelivery on player start
        if (data.event === 'initialDelivery' && data.info) {
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setProgress, setDuration, nextTrack]);

  // Media Session API (Spotify lock screen & notification controls)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumName || 'Wavelength',
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
    ? encodeURIComponent(`${currentTrack.title} ${currentTrack.artistName} official audio`)
    : '';

  return (
    <>
      {/* HTML5 Audio Tag for AAC Previews and Downloaded Offline Blobs */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (playbackMode === 'preview' && audioRef.current) {
            setProgress(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (playbackMode === 'preview' && audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          if (playbackMode === 'preview') {
            nextTrack();
          }
        }}
        onError={async (e) => {
          console.warn('Audio preview error, self-healing:', e);
          if (playbackMode === 'preview' && currentTrack && currentTrack.provider === 'official') {
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

      {/* Official YouTube Full Song Audio/Video Player */}
      {currentTrack && (
        <div
          className={`fixed z-30 transition-all duration-300 rounded-lg overflow-hidden shadow-2xl border border-spotify-border bg-black ${
            isNowPlayingVideoOpen
              ? 'bottom-24 right-6 w-96 aspect-video opacity-100 pointer-events-auto'
              : 'w-1 h-1 opacity-0 pointer-events-none -bottom-96 -right-96'
          }`}
        >
          {/* Header if video view is expanded */}
          {isNowPlayingVideoOpen && (
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={toggleNowPlayingVideo}
                className="w-7 h-7 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center text-xs"
                title="Minimize Video"
              >
                ✕
              </button>
            </div>
          )}

          <iframe
            ref={ytIframeRef}
            key={currentTrack.id}
            src={`https://www.youtube-nocookie.com/embed?listType=search&list=${ytQuery}&enablejsapi=1&autoplay=1&playsinline=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full"
            title="Wavelength Full Song Stream"
            onLoad={() => {
              // Handshake with YouTube iframe to activate full-length playback and state messages
              setTimeout(() => {
                postYT('listening');
                postYT('setVolume', [Math.round((isMuted ? 0 : volume) * 100)]);
                if (isPlaying) postYT('playVideo');
              }, 600);
            }}
          />
        </div>
      )}
    </>
  );
}
