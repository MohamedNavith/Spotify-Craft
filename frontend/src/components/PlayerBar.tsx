'use client';

import {
  ArrowDownToLine,
  Check,
  Download,
  Heart,
  ListMusic,
  Maximize2,
  Mic2,
  Moon,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  SquarePlay,
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
    isNowPlayingViewOpen,
    isSpotifyImportOpen,
    openSleepTimerModal,
    sleepTimerMinutes,
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
    toggleNowPlayingView,
    setIsSpotifyImportOpen,
  } = usePlayerStore();

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      {/* Mobile Player Bottom Sheet */}
      <SpotifyMobilePlayer
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
      />

      {/* Persistent Spotify Desktop Playback Bar */}
      <footer
        aria-label="Now playing bar"
        className="hidden md:grid grid-cols-12 items-center h-[76px] lg:h-[84px] bg-black border-t border-[#282828] px-4 select-none z-40 shrink-0 text-white"
      >
        {/* Left (Col 1-3): Current Track Cover & Details & Heart */}
        <div className="col-span-3 flex items-center gap-3.5 min-w-0 pr-4">
          {currentTrack ? (
            <>
              <div
                onClick={() => toggleNowPlayingView()}
                className="w-14 h-14 rounded-md bg-[#242424] overflow-hidden shrink-0 shadow-lg cursor-pointer group relative"
              >
                {currentTrack.artworkUrl ? (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-spotify-subtext font-black text-sm">
                    W
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span
                  onClick={() => toggleNowPlayingView()}
                  className="text-white text-sm font-bold truncate hover:underline cursor-pointer"
                >
                  {currentTrack.title}
                </span>
                <span className="text-spotify-subtext text-xs truncate hover:underline cursor-pointer mt-0.5">
                  {currentTrack.artistName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <button
                  onClick={() => toggleLike(currentTrack.id)}
                  className="text-spotify-subtext hover:text-white p-1 transition-colors"
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
                  className="text-spotify-subtext hover:text-white p-1 transition-colors"
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

        {/* Center (Col 4-9): Transport Controls & Scrubber */}
        <div className="col-span-6 flex flex-col items-center gap-1.5 max-w-2xl mx-auto w-full">
          {/* Controls Row */}
          <div className="flex items-center gap-5">
            {/* Mode Switch Badge */}
            <button
              onClick={() => togglePlaybackMode()}
              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border transition-all ${
                playbackMode === 'full'
                  ? 'border-spotify-green text-spotify-green bg-spotify-green/10 shadow-sm'
                  : 'border-white/20 text-spotify-subtext hover:text-white'
              }`}
              title="Toggle Full Song Version (Official Audio) vs 30s Snippet"
            >
              {playbackMode === 'full' ? '● Full Master' : '30s Snippet'}
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
                <span className="w-1 h-1 bg-spotify-green rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2" />
              )}
            </button>

            {/* Skip Back 10s */}
            <button
              onClick={() => fastForward(-10)}
              className="text-spotify-subtext hover:text-white transition-colors p-1 text-[11px] font-bold"
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

            {/* Main Spotify Play/Pause White Circle */}
            <button
              onClick={() => togglePlay()}
              disabled={!currentTrack}
              className="w-8 h-8 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center transition-all shadow-md disabled:opacity-50"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
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
              className="text-spotify-subtext hover:text-white transition-colors p-1 text-[11px] font-bold"
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
                <span className="w-1 h-1 bg-spotify-green rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2" />
              )}
            </button>
          </div>

          {/* Progress Bar & Timestamps */}
          <div className="w-full flex items-center gap-2 text-[11px] text-spotify-subtext font-mono">
            <span className="w-10 text-right tabular-nums">{formatTime(progress)}</span>

            <div className="flex-1 relative group flex items-center cursor-pointer h-3">
              {/* Background Bar */}
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                {/* Progress Fill (White turning Spotify Green on Hover) */}
                <div
                  className="h-full bg-white group-hover:bg-spotify-green transition-colors"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Spotify Circular Scrubber Thumb */}
              <div
                className="w-3 h-3 bg-white rounded-full shadow-lg absolute -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercent}%` }}
              />

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

            <span className="w-10 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right (Col 10-12): Video, Lyrics, Now Playing View, Volume */}
        <div className="col-span-3 flex items-center justify-end gap-2.5 text-spotify-subtext">
          {/* Now Playing View Toggle */}
          <button
            onClick={() => toggleNowPlayingView()}
            title={isNowPlayingViewOpen ? 'Hide Now Playing View' : 'Now Playing View'}
            className={`p-1.5 transition-colors relative ${
              isNowPlayingViewOpen ? 'text-spotify-green' : 'hover:text-white'
            }`}
          >
            <SquarePlay className="w-4 h-4" />
            {isNowPlayingViewOpen && (
              <span className="w-1 h-1 bg-spotify-green rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
            )}
          </button>

          {/* Lyrics Button */}
          <button
            onClick={() => setIsLyricsOpen((prev) => !prev)}
            title="Lyrics"
            className={`p-1.5 transition-colors relative ${
              isLyricsOpen ? 'text-spotify-green' : 'hover:text-white'
            }`}
          >
            <Mic2 className="w-4 h-4" />
            {isLyricsOpen && (
              <span className="w-1 h-1 bg-spotify-green rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
            )}
          </button>

          {/* Queue Button */}
          <button
            onClick={() => setIsQueueOpen((prev) => !prev)}
            title="Queue (Q)"
            className={`p-1.5 transition-colors relative ${
              isQueueOpen ? 'text-spotify-green' : 'hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            {isQueueOpen && (
              <span className="w-1 h-1 bg-spotify-green rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
            )}
          </button>

          {/* Equalizer */}
          <button
            onClick={() => setIsEqualizerOpen(true)}
            title="10-Band Equalizer & Crossfade"
            className="hover:text-white transition-colors p-1.5"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Sleep Timer */}
          <button
            onClick={() => openSleepTimerModal()}
            title={sleepTimerMinutes !== null ? 'Sleep Timer Active' : 'Sleep Timer'}
            className={`p-1.5 transition-colors relative ${
              sleepTimerMinutes !== null ? 'text-spotify-green' : 'hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" />
            {sleepTimerMinutes !== null && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-spotify-green animate-pulse" />
            )}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 group w-28">
            <button
              onClick={() => toggleMute()}
              className="hover:text-white transition-colors p-0.5"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-spotify-subtext" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <div className="flex-1 relative flex items-center h-3 cursor-pointer">
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-spotify-green transition-colors"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>

              {/* Thumb */}
              <div
                className="w-3 h-3 bg-white rounded-full shadow-lg absolute -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${isMuted ? 0 : volume * 100}%` }}
              />

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

          {/* Fullscreen Lyrics / Video */}
          <button
            onClick={() => setIsLyricsOpen(true)}
            title="Fullscreen Lyrics"
            className="hover:text-white transition-colors p-1.5"
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
