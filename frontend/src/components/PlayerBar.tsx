'use client';

import {
  ArrowDownToLine,
  Check,
  Download,
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
  Sparkles,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { saveTrackOffline } from '../lib/offlineStorage';
import { usePlayerStore } from '../stores/usePlayerStore';
import EqualizerModal from './EqualizerModal';
import LyricsModal from './LyricsModal';
import QueueDrawer from './QueueDrawer';
import SpotifyImportModal from './SpotifyImportModal';
import SpotifyMobilePlayer from './SpotifyMobilePlayer';

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
    downloadedTrackIds,
    playbackMode,
    isNowPlayingVideoOpen,
    isSpotifyImportOpen,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    fastForward,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    markTrackDownloaded,
    togglePlaybackMode,
    toggleNowPlayingVideo,
    setIsSpotifyImportOpen,
  } = usePlayerStore();

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
          if (e.ctrlKey) {
            nextTrack();
          } else {
            fastForward(10);
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey) {
            prevTrack();
          } else {
            fastForward(-10);
          }
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
        case 'KeyV':
          toggleNowPlayingVideo();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    nextTrack,
    prevTrack,
    fastForward,
    volume,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    currentTrack,
    toggleLike,
    toggleNowPlayingVideo,
  ]);

  const isLiked = currentTrack ? likedTrackIds.has(currentTrack.id) : false;
  const isDownloaded = currentTrack ? downloadedTrackIds.has(currentTrack.id) : false;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleDownload = async () => {
    if (!currentTrack) return;
    setIsDownloading(true);
    const ok = await saveTrackOffline(currentTrack);
    if (ok) {
      markTrackDownloaded(currentTrack.id);
    }
    setIsDownloading(false);
  };

  return (
    <>
      {/* Authentic Spotify Mobile Player (Mini Player + Expandable Bottom Sheet) */}
      <SpotifyMobilePlayer
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
      />

      {/* Main Persistent Desktop Player Bar */}
      <footer className="hidden md:grid grid-cols-12 items-center h-24 bg-spotify-base border-t border-spotify-border px-4 select-none z-30 shrink-0">
        {/* Left (Col 1-3): Current Track Info, Cover, Like & Download */}
        <div className="col-span-3 flex items-center gap-3 min-w-0 pr-4">
          {currentTrack ? (
            <>
              <div
                onClick={() => setIsLyricsOpen(true)}
                className="w-14 h-14 rounded bg-spotify-card overflow-hidden shrink-0 shadow-md cursor-pointer group relative"
              >
                {currentTrack.artworkUrl ? (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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

              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <button
                  onClick={() => toggleLike(currentTrack.id)}
                  className="text-spotify-subtext hover:text-white transition-colors"
                  title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs (L)'}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform active:scale-125 ${
                      isLiked
                        ? 'text-spotify-green fill-spotify-green'
                        : 'text-spotify-subtext hover:text-white'
                    }`}
                  />
                </button>

                <button
                  onClick={handleDownload}
                  className="text-spotify-subtext hover:text-white transition-colors p-1"
                  title={isDownloaded ? 'Saved in App Storage (Offline)' : 'Download song for offline listening'}
                >
                  {isDownloaded ? (
                    <Check className="w-4 h-4 text-spotify-green" />
                  ) : (
                    <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce text-spotify-green' : ''}`} />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-spotify-subtext text-xs italic">
              Select a track to play
            </div>
          )}
        </div>

        {/* Center (Col 4-9): Transport Controls & Progress Slider */}
        <div className="col-span-6 flex flex-col items-center gap-1.5 max-w-2xl mx-auto w-full">
          {/* Controls Row */}
          <div className="flex items-center gap-5">
            {/* Mode Switch Badge */}
            <button
              onClick={() => togglePlaybackMode()}
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border transition-all ${
                playbackMode === 'full'
                  ? 'border-spotify-green text-spotify-green bg-spotify-green/10 shadow-sm'
                  : 'border-white/20 text-spotify-subtext hover:text-white'
              }`}
              title="Toggle Full Song Version (Official Audio) vs 30s Snippet"
            >
              {playbackMode === 'full' ? '● Full Song' : '30s Snippet'}
            </button>

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

            {/* Skip Back 10s */}
            <button
              onClick={() => fastForward(-10)}
              className="text-spotify-subtext hover:text-white transition-colors p-1 text-xs font-bold"
              title="Rewind 10s (Left Arrow)"
            >
              -10s
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

            {/* Skip Forward 10s */}
            <button
              onClick={() => fastForward(10)}
              className="text-spotify-subtext hover:text-white transition-colors p-1 text-xs font-bold"
              title="Forward 10s (Right Arrow)"
            >
              +10s
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
                max={duration > 0 ? duration : 180}
                step={0.1}
                value={progress}
                onInput={(e) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  seek(val);
                }}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  seek(val);
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right (Col 10-12): Video, Lyrics, Volume & Panels */}
        <div className="col-span-3 flex items-center justify-end gap-3 text-spotify-subtext">
          {/* Official Video Screen Toggle */}
          <button
            onClick={() => toggleNowPlayingVideo()}
            title={isNowPlayingVideoOpen ? 'Hide Video (V)' : 'Watch Official Music Video (V)'}
            className={`p-1 transition-colors ${
              isNowPlayingVideoOpen ? 'text-spotify-green' : 'hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
          </button>

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
          <div className="flex items-center gap-2 group w-24">
            <button
              onClick={() => toggleMute()}
              className="hover:text-white transition-colors"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-spotify-subtext" />
              ) : (
                <Volume2 className="w-4 h-4" />
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
            title="Fullscreen Lyrics"
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
      <SpotifyImportModal
        isOpen={isSpotifyImportOpen}
        onClose={() => setIsSpotifyImportOpen(false)}
      />
    </>
  );
}
