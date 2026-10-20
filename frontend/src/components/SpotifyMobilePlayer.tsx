'use client';

import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  Download,
  Heart,
  Maximize2,
  Minimize2,
  MoreVertical,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Tv,
  Volume2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { isTrackOffline, saveTrackOffline } from '../lib/offlineStorage';
import { usePlayerStore } from '../stores/usePlayerStore';

interface SpotifyMobilePlayerProps {
  onOpenLyrics?: () => void;
}

export default function SpotifyMobilePlayer({ onOpenLyrics }: SpotifyMobilePlayerProps) {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    isShuffled,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    toggleLike,
    likedTrackIds,
    downloadedTrackIds,
    markTrackDownloaded,
    playbackMode,
    togglePlaybackMode,
    isNowPlayingVideoOpen,
    toggleNowPlayingVideo,
  } = usePlayerStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Check if current track is already downloaded offline
  useEffect(() => {
    if (!currentTrack) return;
    isTrackOffline(currentTrack.id).then((saved) => {
      setIsDownloaded(saved || downloadedTrackIds.has(currentTrack.id));
    });
  }, [currentTrack, downloadedTrackIds]);

  if (!currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack || isDownloading || isDownloaded) return;

    try {
      setIsDownloading(true);
      await saveTrackOffline(currentTrack);
      markTrackDownloaded(currentTrack.id);
      setIsDownloaded(true);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([15, 50, 15]);
      }
    } catch (err) {
      console.warn('Offline download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const triggerHaptic = (ms = 10) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(ms);
    }
  };

  // Touch handlers for swipe left/right (next/prev track) and swipe down (dismiss expanded sheet)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    if (isExpanded) {
      // If user swipes down in expanded view -> collapse sheet
      if (diffY > 80 && Math.abs(diffX) < 100) {
        setIsExpanded(false);
        triggerHaptic(15);
      }
    } else {
      // If user swipes horizontally on mini player -> next / prev track
      if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
        if (diffX < 0) {
          nextTrack();
          triggerHaptic(20);
        } else {
          prevTrack();
          triggerHaptic(20);
        }
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <>
      {/* 1. Spotify Mobile Floating Mini Player (Visible above mobile navigation) */}
      {!isExpanded && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            setIsExpanded(true);
            triggerHaptic(12);
          }}
          className="md:hidden fixed bottom-[60px] left-2 right-2 z-40 bg-[#212121]/95 backdrop-blur-md border border-white/10 rounded-lg p-2 flex items-center justify-between shadow-2xl transition-all duration-150 active:scale-[0.98] select-none cursor-pointer"
        >
          {/* Left: Thumbnail & Song Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-spotify-elevated shrink-0 shadow">
              {currentTrack.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-bold text-xs">
                  W
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-bold text-white truncate tracking-tight">
                {currentTrack.title}
              </span>
              <span className="text-[11px] text-[#b3b3b3] truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-spotify-green" />
                <span>{currentTrack.artistName}</span>
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Heart / Like */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(currentTrack.id);
                triggerHaptic(15);
              }}
              className="p-2 text-spotify-subtext hover:text-white active:scale-75 transition-all"
            >
              <Heart
                className={`w-5 h-5 ${
                  isLiked ? 'text-spotify-green fill-spotify-green' : 'text-[#b3b3b3]'
                }`}
              />
            </button>

            {/* Play / Pause Circular Tap */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
                triggerHaptic(15);
              }}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center ml-1 shadow-md active:scale-90 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>
          </div>

          {/* Micro Progress Line on bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-spotify-green transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. Full-Screen Spotify Mobile Now Playing Bottom Sheet */}
      {isExpanded && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="md:hidden fixed inset-0 z-50 bg-gradient-to-b from-[#3a2f2f] via-[#121212] to-[#121212] flex flex-col justify-between p-6 pb-10 text-white select-none animate-in slide-in-from-bottom duration-300 overflow-y-auto"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between shrink-0 pt-2">
            <button
              onClick={() => {
                setIsExpanded(false);
                triggerHaptic(10);
              }}
              className="p-2 -ml-2 text-spotify-subtext hover:text-white active:scale-75 transition-transform"
            >
              <ChevronDown className="w-7 h-7" />
            </button>

            <div className="flex flex-col items-center min-w-0 px-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#b3b3b3]">
                Playing from Album
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[200px]">
                {currentTrack.albumName || 'Wavelength Official'}
              </span>
            </div>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: currentTrack.title,
                    text: `Listening to ${currentTrack.title} by ${currentTrack.artistName} on Wavelength!`,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard?.writeText?.(window.location.href);
                  alert('Copied track link to clipboard!');
                }
                triggerHaptic(15);
              }}
              className="p-2 -mr-2 text-spotify-subtext hover:text-white active:scale-75 transition-transform"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Centerpiece: Large Square Artwork */}
          <div className="my-auto py-4 flex flex-col items-center">
            <div className="w-[82vw] max-w-[340px] aspect-square rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.8)] bg-spotify-elevated border border-white/5 transition-transform duration-300">
              {currentTrack.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-black text-4xl">
                  W
                </div>
              )}
            </div>
          </div>

          {/* Track Details & Like */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex flex-col min-w-0 pr-4">
              <h2 className="text-2xl font-black text-white truncate tracking-tight">
                {currentTrack.title}
              </h2>
              <p className="text-sm text-[#b3b3b3] font-medium truncate mt-0.5">
                {currentTrack.artistName}
              </p>
            </div>

            <button
              onClick={() => {
                toggleLike(currentTrack.id);
                triggerHaptic(15);
              }}
              className="p-2 text-spotify-subtext hover:text-white active:scale-75 transition-transform shrink-0"
            >
              <Heart
                className={`w-7 h-7 ${
                  isLiked ? 'text-spotify-green fill-spotify-green' : 'text-[#b3b3b3]'
                }`}
              />
            </button>
          </div>

          {/* Scrubber Timeline Slider */}
          <div className="flex flex-col gap-1 mb-4 shrink-0">
            <div className="relative w-full flex items-center h-5">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-spotify-green transition-all"
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

            <div className="flex items-center justify-between text-xs text-[#b3b3b3] font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Transport Controls (Spotify Mobile Layout) */}
          <div className="flex items-center justify-between mb-6 shrink-0 px-2">
            {/* Shuffle */}
            <button
              onClick={() => {
                toggleShuffle();
                triggerHaptic(10);
              }}
              className={`p-2 transition-transform active:scale-75 ${
                isShuffled ? 'text-spotify-green' : 'text-[#b3b3b3]'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous */}
            <button
              onClick={() => {
                prevTrack();
                triggerHaptic(15);
              }}
              className="p-2 text-white active:scale-75 transition-transform"
            >
              <SkipBack className="w-8 h-8 fill-current" />
            </button>

            {/* Large 64px Play/Pause Circle */}
            <button
              onClick={() => {
                togglePlay();
                triggerHaptic(20);
              }}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-black" />
              ) : (
                <Play className="w-7 h-7 fill-black ml-1" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={() => {
                nextTrack();
                triggerHaptic(15);
              }}
              className="p-2 text-white active:scale-75 transition-transform"
            >
              <SkipForward className="w-8 h-8 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={() => {
                cycleRepeat();
                triggerHaptic(10);
              }}
              className={`p-2 transition-transform active:scale-75 ${
                repeatMode !== 'off' ? 'text-spotify-green' : 'text-[#b3b3b3]'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Bottom Utility Row: Devices, Video mode, Download & Lyrics */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 shrink-0">
            {/* Download Offline */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-[#b3b3b3] hover:text-white active:scale-90 transition-transform"
            >
              {isDownloaded ? (
                <Check className="w-4 h-4 text-spotify-green" />
              ) : (
                <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce text-spotify-green' : ''}`} />
              )}
              <span>{isDownloaded ? 'Saved' : 'Download'}</span>
            </button>

            {/* Video Mode Toggle */}
            <button
              onClick={() => {
                toggleNowPlayingVideo();
                triggerHaptic(10);
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                isNowPlayingVideoOpen
                  ? 'border-spotify-green bg-spotify-green text-black'
                  : 'border-white/20 text-[#b3b3b3]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>

            {/* Lyrics Card / Pill */}
            {onOpenLyrics && (
              <button
                onClick={() => {
                  onOpenLyrics();
                  triggerHaptic(15);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-spotify-green hover:underline active:scale-90 transition-transform"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lyrics</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
