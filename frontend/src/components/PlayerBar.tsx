'use client';

import {
  Heart,
  Laptop2,
  ListMusic,
  Maximize2,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import EqualizerModal from './EqualizerModal';
import LyricsModal from './LyricsModal';
import QueueDrawer from './QueueDrawer';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    likedTrackIds,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
  } = usePlayerStore();

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) nextTrack();
          else seek(Math.min(duration, progress + 5));
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) prevTrack();
          else seek(Math.max(0, progress - 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyS':
          toggleShuffle();
          break;
        case 'KeyR':
          cycleRepeat();
          break;
        case 'KeyL':
          if (currentTrack) toggleLike(currentTrack.id);
          break;
        case 'KeyQ':
          setIsQueueOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    progress,
    duration,
    volume,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    currentTrack,
    toggleLike,
  ]);

  const isLiked = currentTrack ? likedTrackIds.has(currentTrack.id) : false;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      <footer className="h-24 bg-black border-t border-spotify-border px-4 grid grid-cols-12 items-center select-none z-40">
        {/* Left (Col 1-3): Currently Playing Track */}
        <div className="col-span-3 flex items-center gap-3 min-w-0">
          {currentTrack ? (
            <>
              <div
                onClick={() => setIsLyricsOpen(true)}
                className="w-14 h-14 rounded bg-spotify-elevated relative overflow-hidden shrink-0 shadow-md cursor-pointer group"
                title="Open Now Playing & Lyrics"
              >
                {currentTrack.artworkUrl ? (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-spotify-subtext font-bold text-xs">
                    W
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-white text-sm font-semibold truncate hover:underline cursor-pointer">
                  {currentTrack.title}
                </span>
                <span className="text-spotify-subtext text-xs truncate hover:underline cursor-pointer">
                  {currentTrack.artistName}
                </span>
              </div>

              <button
                onClick={() => toggleLike(currentTrack.id)}
                className="ml-2 text-spotify-subtext hover:text-white transition-colors"
                title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs (L)'}
              >
                <Heart
                  className={`w-5 h-5 transition-transform active:scale-125 ${
                    isLiked
                      ? 'text-spotify-green fill-spotify-green'
                      : 'text-spotify-subtext hover:text-white'
                  }`}
                />
              </button>
            </>
          ) : (
            <div className="text-spotify-subtext text-xs italic">
              Select a track to play
            </div>
          )}
        </div>

        {/* Center (Col 4-9): Main Transport Controls & Progress Slider */}
        <div className="col-span-6 flex flex-col items-center gap-1.5 max-w-2xl mx-auto w-full">
          {/* Buttons Row */}
          <div className="flex items-center gap-6">
            {/* Shuffle */}
            <button
              onClick={() => toggleShuffle()}
              className={`transition-colors relative p-1 ${
                isShuffled ? 'text-spotify-green' : 'text-spotify-subtext hover:text-white'
              }`}
              title="Enable shuffle (S)"
            >
              <Shuffle className="w-4 h-4" />
              {isShuffled && (
                <span className="w-1 h-1 bg-spotify-green rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
              )}
            </button>

            {/* Previous */}
            <button
              onClick={() => prevTrack()}
              className="text-spotify-subtext hover:text-white transition-colors p-1"
              title="Previous (Ctrl+Left)"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play/Pause Main Circle */}
            <button
              onClick={() => togglePlay()}
              disabled={!currentTrack}
              className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center transition-all shadow-md disabled:opacity-50"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={() => nextTrack()}
              className="text-spotify-subtext hover:text-white transition-colors p-1"
              title="Next (Ctrl+Right)"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={() => cycleRepeat()}
              className={`transition-colors relative p-1 ${
                repeatMode !== 'off'
                  ? 'text-spotify-green'
                  : 'text-spotify-subtext hover:text-white'
              }`}
              title={`Repeat mode: ${repeatMode} (R)`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
              {repeatMode !== 'off' && (
                <span className="w-1 h-1 bg-spotify-green rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
              )}
            </button>
          </div>

          {/* Progress Bar & Timestamps */}
          <div className="w-full flex items-center gap-2 text-xs text-spotify-subtext font-mono">
            <span className="w-10 text-right">{formatTime(progress)}</span>

            <div className="flex-1 relative group flex items-center cursor-pointer h-4">
              <div className="w-full h-1 bg-spotify-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-spotify-green transition-colors"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={progress}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right (Col 10-12): Volume & Panels */}
        <div className="col-span-3 flex items-center justify-end gap-3 text-spotify-subtext">
          {/* Lyrics Button */}
          <button
            onClick={() => setIsLyricsOpen((prev) => !prev)}
            title="Lyrics"
            className={`p-1 transition-colors ${
              isLyricsOpen ? 'text-spotify-green' : 'hover:text-white'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* Queue Button */}
          <button
            onClick={() => setIsQueueOpen((prev) => !prev)}
            title="Queue (Q)"
            className={`p-1 transition-colors ${
              isQueueOpen ? 'text-spotify-green' : 'hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Equalizer & Audio Settings */}
          <button
            onClick={() => setIsEqualizerOpen(true)}
            title="10-Band Equalizer & Crossfade"
            className="hover:text-white transition-colors p-1"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Volume controls */}
          <div className="flex items-center gap-2 group w-28">
            <button
              onClick={() => toggleMute()}
              className="hover:text-white transition-colors"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-spotify-subtext" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <div className="flex-1 relative flex items-center h-4 cursor-pointer">
              <div className="w-full h-1 bg-spotify-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-spotify-green transition-colors"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={() => setIsLyricsOpen(true)}
            title="Fullscreen Now Playing"
            className="hover:text-white transition-colors p-1"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Floating Drawers & Modals */}
      <LyricsModal isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
      <QueueDrawer isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
      />
    </>
  );
}
