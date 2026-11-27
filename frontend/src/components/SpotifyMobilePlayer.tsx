'use client';

import {
  Cast,
  Check,
  ChevronDown,
  Download,
  Film,
  Heart,
  ListMusic,
  MoreVertical,
  Orbit,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Timer,
  Tv,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { isTrackOffline, saveTrackOffline } from '../lib/offlineStorage';
import { usePlayerStore } from '../stores/usePlayerStore';
import TrackVideoCanvas from './TrackVideoCanvas';

interface SpotifyMobilePlayerProps {
  onOpenLyrics?: () => void;
  onOpenQueue?: () => void;
}

export default function SpotifyMobilePlayer({
  onOpenLyrics,
  onOpenQueue,
}: SpotifyMobilePlayerProps) {
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
    isNowPlayingVideoOpen,
    toggleNowPlayingVideo,
    openShareModal,
    openSleepTimerModal,
    sleepTimerMinutes,
    isExpandedNowPlaying,
    setIsExpandedNowPlaying,
    setIsVerciOpen,
    isCanvasModeEnabled,
    toggleCanvasMode,
    queue,
    queueIndex,
    audioStreamDetails,
    streamingQuality,
    setIsQualityModalOpen,
  } = usePlayerStore();

  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDraggingY, setIsDraggingY] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const miniGestureHandledRef = useRef(false);

  // Next and previous preview tracks for swipe-peeking
  const nextTrackPreview = queue.length > 0 ? queue[(queueIndex + 1) % queue.length] : null;
  const prevTrackPreview = queue.length > 0 ? queue[(queueIndex - 1 + queue.length) % queue.length] : null;

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

  const triggerHaptic = (ms = 10) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(ms);
    }
  };

  // Mini Player Touch Handlers (Smooth swipe to skip track or swipe up to expand)
  const handleMiniTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    miniGestureHandledRef.current = false;
  };

  const handleMiniTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      miniGestureHandledRef.current = true;
      if (diffX < 0) nextTrack();
      else prevTrack();
      triggerHaptic(15);
    } else if (diffY < -35 && Math.abs(diffY) > Math.abs(diffX)) {
      miniGestureHandledRef.current = true;
      setIsExpandedNowPlaying(true);
      triggerHaptic(12);
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Full-Screen Artwork Deck Touch Handlers (Artwork horizontal swipe & pull-down collapse)
  const handleDeckTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setDragX(0);
    setDragY(0);
    setIsDraggingY(false);
  };

  const handleDeckTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;

    if (diffY > 0 && diffY > Math.abs(diffX)) {
      setDragY(diffY);
      setIsDraggingY(true);
      setDragX(0);
    } else if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragX(diffX);
      setDragY(0);
      setIsDraggingY(false);
    }
  };

  const handleDeckTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) {
      setDragX(0);
      setDragY(0);
      setIsDraggingY(false);
      return;
    }
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    // Pull down to minimize full player
    if (diffY > 70 && diffY > Math.abs(diffX)) {
      setIsExpandedNowPlaying(false);
      triggerHaptic(15);
    }
    // Horizontal swipe -> next or previous track
    else if (diffX < -50) {
      nextTrack();
      triggerHaptic(20);
    } else if (diffX > 50) {
      prevTrack();
      triggerHaptic(20);
    }

    setDragX(0);
    setDragY(0);
    setIsDraggingY(false);
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Top Bar Touch Handlers (Fluid real-time drag down to collapse)
  const handleTopBarTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setDragY(0);
    setIsDraggingY(false);
  };

  const handleTopBarTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const diffY = e.touches[0].clientY - touchStartY;
    if (diffY > 0) {
      setDragY(diffY);
      setIsDraggingY(true);
    }
  };

  const handleTopBarTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) {
      setDragY(0);
      setIsDraggingY(false);
      return;
    }
    const diffY = e.changedTouches[0].clientY - touchStartY;
    if (diffY > 50) {
      setIsExpandedNowPlaying(false);
      triggerHaptic(12);
    }
    setDragY(0);
    setIsDraggingY(false);
    setTouchStartY(null);
  };

  return (
    <>
      {/* 1. Mobile Floating Mini Player (Sticky above bottom tabs) */}
      {!isExpandedNowPlaying && (
        <div
          onTouchStart={handleMiniTouchStart}
          onTouchEnd={handleMiniTouchEnd}
          onClick={() => {
            if (miniGestureHandledRef.current) {
              miniGestureHandledRef.current = false;
              return;
            }
            setIsExpandedNowPlaying(true);
            triggerHaptic(12);
          }}
          style={{
            bottom: 'calc(58px + max(env(safe-area-inset-bottom, 0px), 8px))',
          }}
          className="wl-mini wl-glass md:hidden fixed left-2 right-2 z-40 border border-white/10 rounded-xl p-2 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.85)] transition-all duration-150 active:scale-[0.98] select-none cursor-pointer overflow-hidden touch-manipulation"
        >
          {/* Left: Thumbnail & Info */}
          <button type="button" aria-label="Expand now playing" className="flex items-center text-left gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-black shrink-0 shadow">
              {currentTrack.artworkUrl ? (
                <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-bold text-xs">W</div>
              )}
            </div>

            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-bold text-white truncate tracking-tight">{currentTrack.title}</span>
              <span className="text-[11px] text-[#b3b3b3] truncate">{currentTrack.artistName}</span>
            </div>
          </button>

          {/* Right: Cast icon, (+), Play/Pause */}
          <div className="flex items-center gap-1 shrink-0">
            <button aria-label="Share track"
              onClick={(e) => {
                e.stopPropagation();
                openShareModal(currentTrack);
              }}
              className="p-1.5 text-white/70 hover:text-white"
            >
              <Cast className="w-4 h-4" />
            </button>

            <button aria-label={isLiked ? 'Unlike track' : 'Like track'} aria-pressed={isLiked}
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(currentTrack);
                triggerHaptic(15);
              }}
              className="p-1.5 text-white/70 hover:text-white"
            >
              <Plus className={`w-5 h-5 ${isLiked ? 'text-spotify-green' : ''}`} />
            </button>

            <button aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
                triggerHaptic(15);
              }}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center ml-1 shadow active:scale-90 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
            </button>
          </div>

          {/* Micro Progress Bar on bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 rounded-b-lg overflow-hidden">
            <div className="h-full bg-white transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {/* 2. Full-Screen Now Playing View (Matching Screenshot #1 & #3) */}
      {isExpandedNowPlaying && (
        <div
          style={{
            transform:
              dragY > 0
                ? `translateY(${dragY}px) scale(${Math.max(0.92, 1 - dragY / 1400)})`
                : 'translateY(0px)',
            transition: isDraggingY
              ? 'none'
              : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.2s ease',
            borderRadius: dragY > 10 ? `${Math.min(32, 16 + dragY / 8)}px` : '0px',
          }}
          className="md:hidden fixed inset-0 z-50 bg-[#121212] flex flex-col justify-between text-white select-none animate-in slide-in-from-bottom duration-300 overflow-hidden touch-manipulation shadow-2xl"
        >
          {/* Native Pull-Down Drag Pill Handle */}
          <div
            onTouchStart={handleTopBarTouchStart}
            onTouchMove={handleTopBarTouchMove}
            onTouchEnd={handleTopBarTouchEnd}
            className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing shrink-0 z-20"
          >
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>

          {/* Immersive Video/Canvas Dimmed Background */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {currentTrack.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover scale-125 blur-3xl opacity-35"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
          </div>

          {/* Top Bar (ChevronDown, Album Title, 3-dots) with pull-down gesture */}
          <div
            onTouchStart={handleTopBarTouchStart}
            onTouchMove={handleTopBarTouchMove}
            onTouchEnd={handleTopBarTouchEnd}
            style={{
              paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
            }}
            className="relative z-10 flex items-center justify-between px-5 pb-2 shrink-0 touch-none"
          >
            <button aria-label="Minimize player"
              onClick={() => {
                setIsExpandedNowPlaying(false);
                triggerHaptic(10);
              }}
              className="p-2 -ml-2 text-white/80 hover:text-white active:scale-75 transition-transform"
            >
              <ChevronDown className="w-7 h-7" />
            </button>

            <div className="flex flex-col items-center min-w-0 px-2 text-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#b3b3b3]">
                Playing from Album
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[220px]">
                {currentTrack.albumName || 'Official Studio Master'}
              </span>
            </div>

            <button aria-label="Share track"
              onClick={() => openShareModal(currentTrack)}
              className="p-2 -mr-2 text-white/80 hover:text-white active:scale-75 transition-transform"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Center Area: Swipeable Card Container with Adjacent Peeking (Screenshot #3) */}
          <div
            onTouchStart={handleDeckTouchStart}
            onTouchMove={handleDeckTouchMove}
            onTouchEnd={handleDeckTouchEnd}
            className="relative z-10 my-auto flex flex-col items-center justify-center w-full overflow-hidden py-4 touch-none cursor-grab active:cursor-grabbing"
          >
            {/* Center Lyrics Line Overlay (Screenshot #1) */}
            <div className="mb-4 px-6 text-center pointer-events-none">
              <p className="text-lg md:text-xl font-black text-white/95 tracking-tight drop-shadow-lg animate-in fade-in">
                {currentTrack.title === 'Tum Hi Ho'
                  ? 'Hum tere bin ab reh nahin sakte'
                  : `Now playing: ${currentTrack.title}`}
              </p>
            </div>

            {/* Swipeable Artwork Deck */}
            <div className="relative w-full flex items-center justify-center h-[320px]">
              {/* Previous Track Card Peek (Left) */}
              {dragX > 30 && prevTrackPreview && (
                <div
                  className="absolute w-[240px] aspect-square rounded-2xl overflow-hidden shadow-2xl opacity-40 transition-all pointer-events-none"
                  style={{ transform: `translateX(${dragX - 280}px) scale(0.85)` }}
                >
                  <img src={prevTrackPreview.artworkUrl} alt={prevTrackPreview.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Active Current Track Artwork / 25s Climax Video Card with Realtime Drag Transform */}
              <div
                className="w-[280px] aspect-square rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] bg-black/60 border border-white/10 transition-transform duration-75 relative group"
                style={{
                  transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`,
                }}
              >
                <TrackVideoCanvas
                  title={currentTrack.title}
                  artist={currentTrack.artistName}
                  duration={duration}
                  artworkUrl={currentTrack.artworkUrl}
                  className="w-full h-full"
                  preferredMode={isCanvasModeEnabled ? 'canvas' : 'art'}
                  onToggleCanvas={(isCanvas) => {
                    if (isCanvas !== isCanvasModeEnabled) toggleCanvasMode();
                  }}
                />
              </div>

              {/* Next Track Card Peek (Right) */}
              {dragX < -30 && nextTrackPreview && (
                <div
                  className="absolute w-[240px] aspect-square rounded-2xl overflow-hidden shadow-2xl opacity-40 transition-all pointer-events-none"
                  style={{ transform: `translateX(${dragX + 280}px) scale(0.85)` }}
                >
                  <img src={nextTrackPreview.artworkUrl} alt={nextTrackPreview.title} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Peek hint message if dragged (Screenshot #3) */}
            {dragX < -40 && (
              <span className="text-[11px] text-emerald-400 font-semibold mt-2 animate-pulse">
                Release to play next track →
              </span>
            )}
            {dragX > 40 && (
              <span className="text-[11px] text-emerald-400 font-semibold mt-2 animate-pulse">
                ← Release to play previous track
              </span>
            )}
          </div>

          {/* Bottom Controls Area (Isolated touch to prevent deck swipe conflict) */}
          <div
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
            }}
            className="relative z-10 px-6 pt-2 flex flex-col shrink-0"
          >
            {/* Track Info & Plus (+) button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col min-w-0 pr-4">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-xl font-black text-white truncate tracking-tight">{currentTrack.title}</h2>
                  <button aria-label="Audio settings"
                    onClick={() => setIsQualityModalOpen(true)}
                    title="Audio settings"
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 transition-transform active:scale-95 cursor-pointer border ${
                      audioStreamDetails?.isRealLossless
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                        : streamingQuality === 'high-efficiency'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/10 text-white/70 border-white/15'
                    }`}
                  >
                    {audioStreamDetails?.codec || 'Audio'}
                  </button>
                </div>
                <p className="text-xs text-[#b3b3b3] font-medium truncate mt-0.5">{currentTrack.artistName}</p>
              </div>

              <button aria-label={isLiked ? 'Unlike track' : 'Like track'} aria-pressed={isLiked}
                onClick={() => {
                  toggleLike(currentTrack);
                  triggerHaptic(15);
                }}
                className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-75 transition-all shrink-0 ${
                  isLiked ? 'border-spotify-green bg-spotify-green/10 text-spotify-green' : 'border-white/20 text-white'
                }`}
              >
                {isLiked ? <Check className="w-5 h-5 text-spotify-green" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {/* Scrubber Timeline */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="relative w-full flex items-center h-4 cursor-pointer">
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <input
                  type="range" aria-label="Playback position"
                  min={0}
                  max={duration > 0 ? duration : 180}
                  step={0.1}
                  value={progress}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#b3b3b3] font-mono">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls (Shuffle, Prev, Big White Circle, Next, Sleep Timer) */}
            <div className="flex items-center justify-between mb-4 px-2">
              <button aria-label="Shuffle" aria-pressed={isShuffled}
                onClick={() => {
                  toggleShuffle();
                  triggerHaptic(10);
                }}
                className={`p-2 transition-transform active:scale-75 ${isShuffled ? 'text-spotify-green' : 'text-[#b3b3b3]'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button aria-label="Previous track"
                onClick={() => {
                  prevTrack();
                  triggerHaptic(15);
                }}
                className="p-2 text-white active:scale-75 transition-transform"
              >
                <SkipBack className="w-8 h-8 fill-current" />
              </button>

              {/* Big White Circular Play/Pause Button */}
              <button aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={() => {
                  togglePlay();
                  triggerHaptic(20);
                }}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-1" />}
              </button>

              <button aria-label="Next track"
                onClick={() => {
                  nextTrack();
                  triggerHaptic(15);
                }}
                className="p-2 text-white active:scale-75 transition-transform"
              >
                <SkipForward className="w-8 h-8 fill-current" />
              </button>

              <button aria-label="Sleep timer"
                onClick={() => {
                  openSleepTimerModal();
                  triggerHaptic(10);
                }}
                className={`p-2 transition-transform active:scale-75 relative ${
                  sleepTimerMinutes !== null ? 'text-spotify-green' : 'text-[#b3b3b3] hover:text-white'
                }`}
                title={sleepTimerMinutes !== null ? 'Sleep Timer Active' : 'Sleep Timer'}
              >
                <Timer className="w-5 h-5" />
                {sleepTimerMinutes !== null && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-spotify-green animate-pulse" />
                )}
              </button>
            </div>

            {/* Bottom Quick Row: Device, Share, Verci Cosmic, Queue */}
            <div className="flex items-center justify-between pt-1 pb-3 text-white/80">
              <button aria-label="Open visualizer"
                onClick={() => {
                  setIsVerciOpen(true);
                  triggerHaptic(15);
                }}
                className="p-2 hover:text-white active:scale-90 flex items-center gap-1.5 text-amber-400"
                title="Launch Verci & Lumn Cosmic Mode"
              >
                <Orbit className="w-5 h-5 animate-spin-slow" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">Verci</span>
              </button>

              <button aria-label="Share track"
                onClick={() => {
                  openShareModal(currentTrack);
                  triggerHaptic(12);
                }}
                className="p-2 hover:text-white active:scale-90 flex items-center gap-1.5"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button aria-label="Open queue"
                onClick={() => {
                  onOpenQueue?.();
                  triggerHaptic(12);
                }}
                className="p-2 hover:text-white active:scale-90"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>

            {/* Lyrics Preview Pull-Up Pill (Screenshot #1) */}
            <div
              onClick={() => {
                onOpenLyrics?.();
                triggerHaptic(15);
              }}
              className="w-full bg-[#134e4a]/90 hover:bg-[#134e4a] border border-teal-500/30 rounded-2xl p-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-spotify-green" />
                <span className="text-xs font-bold text-white">Lyrics preview</span>
              </div>
              <span className="text-xs font-bold text-spotify-green">Tap for karaoke ↑</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
