'use client';

import {
  ChevronDown,
  ChevronUp,
  EyeOff,
  Film,
  GripHorizontal,
  Heart,
  Orbit,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function DynamicIsland() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    toggleLike,
    likedTrackIds,
    queue,
    setTrack,
    setIsVerciOpen,
    isVerciOpen,
    isDynamicIslandVisible,
    setIsDynamicIslandVisible,
  } = usePlayerStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const prevTrackId = useRef<string | null>(null);

  // Auto-pop down from the camera cutout whenever the track changes or play state toggles
  useEffect(() => {
    if (!currentTrack) return;
    if (prevTrackId.current !== currentTrack.id) {
      prevTrackId.current = currentTrack.id;
      setIsPopping(true);
      const timer = setTimeout(() => setIsPopping(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [currentTrack?.id]);

  // If hidden by user, or in Verci/Cosmic mode, or no track is loaded -> hide completely
  if (!isDynamicIslandVisible || isVerciOpen || !currentTrack) {
    return null;
  }

  const isLiked = likedTrackIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Swipe up to dismiss/hide into camera notch
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const diffY = e.changedTouches[0].clientY - touchStartY;
      // Upward flick -> dismiss Dynamic Island to keep screen clean
      if (diffY < -35) {
        setIsDynamicIslandVisible(false);
      }
    }
    setTouchStartY(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        top: 'max(env(safe-area-inset-top, 0px), 8px)',
      }}
      className={`fixed left-1/2 -translate-x-1/2 z-[100] select-none transition-all duration-300 ease-out ${
        isPopping ? 'scale-[1.03] shadow-[0_16px_50px_rgba(0,0,0,0.95)]' : 'scale-100 shadow-[0_10px_35px_rgba(0,0,0,0.85)]'
      }`}
    >
      {/* 1. COLLAPSED DEDICATED CAMERA NOTCH PILL */}
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className="h-9 px-3 bg-black/90 hover:bg-black/95 backdrop-blur-2xl border border-white/20 hover:border-white/35 rounded-full flex items-center gap-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_12px_40px_rgba(0,0,0,0.85)] active:scale-[0.98] transition-all cursor-pointer group"
          title="Tap to expand Dynamic Island • Swipe up or tap ✕ to hide"
        >
          {/* Mini Album Cover / Spinning Vinyl */}
          <div className="w-5 h-5 rounded-full overflow-hidden bg-black shrink-0 border border-white/20 shadow-sm pointer-events-none">
            {currentTrack.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-black text-[7px]">
                W
              </div>
            )}
          </div>

          {/* Equalizer Audio Frequency Bars */}
          <div className="flex items-center gap-0.5 h-3 pointer-events-none">
            <span
              className={`w-0.5 bg-spotify-green rounded-full transition-all ${
                isPlaying ? 'h-3 animate-pulse' : 'h-1.5 opacity-50'
              }`}
            />
            <span
              className={`w-0.5 bg-spotify-green rounded-full transition-all ${
                isPlaying ? 'h-2 animate-bounce' : 'h-1 opacity-50'
              }`}
            />
            <span
              className={`w-0.5 bg-spotify-green rounded-full transition-all ${
                isPlaying ? 'h-3.5 animate-pulse' : 'h-2 opacity-50'
              }`}
            />
          </div>

          {/* Track Title */}
          <span className="text-[11px] font-bold text-white/95 max-w-[110px] sm:max-w-[160px] truncate pointer-events-none tracking-tight">
            {currentTrack.title}
          </span>

          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-5 h-5 rounded-full bg-white hover:bg-spotify-green text-black flex items-center justify-center shrink-0 shadow-md active:scale-90 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-2.5 h-2.5 fill-black" />
            ) : (
              <Play className="w-2.5 h-2.5 fill-black ml-0.5" />
            )}
          </button>

          {/* Direct Hide / Clean Screen Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDynamicIslandVisible(false);
            }}
            title="Hide Dynamic Island (Clean Screen)"
            className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 active:scale-80 transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* 2. EXPANDED CAMERA DYNAMIC ISLAND CARD */
        <div className="w-[94vw] max-w-[360px] bg-black/95 border border-white/20 rounded-3xl p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200 text-white cursor-default">
          {/* Top Row: Cover + Info + Controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-white/15 shadow-lg">
                {currentTrack.artworkUrl ? (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-black text-sm">
                    W
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-sm font-extrabold text-white truncate tracking-tight">
                  {currentTrack.title}
                </span>
                <span className="text-xs text-white/60 truncate font-medium">
                  {currentTrack.artistName}
                </span>
              </div>
            </div>

            {/* Collapse & Hide Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse to Notch Pill"
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsDynamicIslandVisible(false)}
                title="Hide Island completely"
                className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex flex-col gap-1 mb-3">
            <div className="relative w-full flex items-center h-4 cursor-pointer">
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
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls Row */}
          <div className="flex items-center justify-between pt-1">
            {/* Like */}
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className="p-2 text-white/70 hover:text-white transition-colors active:scale-90"
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-5 h-5 ${
                  isLiked ? 'text-spotify-green fill-spotify-green' : ''
                }`}
              />
            </button>

            {/* Prev */}
            <button
              onClick={() => prevTrack()}
              className="p-2 text-white/80 hover:text-white transition-colors active:scale-90"
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => togglePlay()}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              title={isPlaying ? 'Pause' : 'Play'}
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
              className="p-2 text-white/80 hover:text-white transition-colors active:scale-90"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Launch Verci & Lumn Canvas Mode */}
            <button
              onClick={() => {
                setIsExpanded(false);
                setIsVerciOpen(true);
              }}
              className="p-2 text-amber-400 hover:text-amber-300 transition-colors active:scale-90"
              title="Launch Verci & Canvas Mode"
            >
              <Orbit className="w-5 h-5 animate-spin-slow" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
