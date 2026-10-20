'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  } = usePlayerStore();

  // Sync seeking directly into HTMLAudioElement
  useEffect(() => {
    const audio = audioRef.current;
    if (seekTarget !== null && audio && isFinite(seekTarget)) {
      audio.currentTime = seekTarget;
      clearSeek();
    }
  }, [seekTarget, clearSeek]);

  // Initialize Audio Source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.streamUrl) {
      if (audio.src !== currentTrack.streamUrl) {
        audio.src = currentTrack.streamUrl;
        audio.load();
      }
      if (isPlaying) {
        audio.play().catch(() => {
          // Auto-play policy blocked, user will press play
        });
      }
    } else {
      audio.pause();
    }
  }, [currentTrack]);

  // Sync Play / Pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Sync Volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

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

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      }}
      onLoadedMetadata={() => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      }}
      onEnded={() => {
        nextTrack();
      }}
      onError={async (e) => {
        console.warn('Audio playback error, attempting live stream refresh:', e);
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
          } catch (refreshErr) {
            console.error('Failed to refresh audio stream:', refreshErr);
          }
        }
      }}
    />
  );
}
