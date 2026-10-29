'use client';

import {
  Cast,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
  Heart,
  Maximize2,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  } = usePlayerStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const dragData = useRef({
    startX: 0,
    startY: 0,
    elemX: 0,
    elemY: 0,
    moved: false,
  });

  // Load saved position or set clean default (bottom right corner, safely clear of top navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('wavelength_dynamic_island_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Verify it's within current screen bounds
          const safeX = Math.min(Math.max(10, parsed.x), window.innerWidth - 180);
          const safeY = Math.min(Math.max(10, parsed.y), window.innerHeight - 100);
          setPosition({ x: safeX, y: safeY });
          return;
        }
      }
    } catch {}

    // Default position: top right or bottom right (above player bar, away from center search)
    const defX = Math.max(16, window.innerWidth - 260);
    const defY = Math.max(76, window.innerHeight - 150);
    setPosition({ x: defX, y: defY });
  }, []);

  if (!currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const upcomingTracks = queue.filter((t) => t.id !== currentTrack.id).slice(0, 4);

  // Pointer drag events for unrestricted free movement anywhere on screen
  const handlePointerDown = (e: React.PointerEvent) => {
    // Don't drag if interacting with buttons or sliders
    if (['BUTTON', 'INPUT', 'A'].includes((e.target as HTMLElement).tagName)) {
      return;
    }

    const currentX = position ? position.x : 20;
    const currentY = position ? position.y : 80;

    dragData.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemX: currentX,
      elemY: currentY,
      moved: false,
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragData.current.startX;
    const deltaY = e.clientY - dragData.current.startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragData.current.moved = true;
    }

    const elemWidth = elementRef.current?.offsetWidth || 220;
    const elemHeight = elementRef.current?.offsetHeight || 44;

    const newX = Math.min(Math.max(8, dragData.current.elemX + deltaX), window.innerWidth - elemWidth - 8);
    const newY = Math.min(Math.max(8, dragData.current.elemY + deltaY), window.innerHeight - elemHeight - 76);

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Save position if user dragged it
    if (dragData.current.moved && position) {
      try {
        localStorage.setItem('wavelength_dynamic_island_pos', JSON.stringify(position));
      } catch {}
    } else {
      // Toggle expand if it was just a tap/click
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div
      ref={elementRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : 'auto',
        top: position ? `${position.y}px` : 'auto',
        right: position ? 'auto' : '24px',
        bottom: position ? 'auto' : '96px',
        touchAction: 'none',
      }}
      className={`z-50 select-none transition-shadow ${
        isDragging ? 'cursor-grabbing scale-102 shadow-2xl' : 'cursor-grab'
      }`}
      title="Drag anywhere to move • Tap to expand"
    >
      {/* 1. Translucent Collapsed Dynamic Island Pill */}
      {!isExpanded ? (
        <div className="h-10 px-3.5 bg-black/60 hover:bg-black/85 backdrop-blur-2xl border border-white/20 hover:border-white/40 rounded-full flex items-center gap-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] active:scale-95 transition-all">
          {/* Drag Handle Grip Icon */}
          <GripHorizontal className="w-3.5 h-3.5 text-white/30 shrink-0" />

          {/* Mini Album Cover */}
          <div className="w-6 h-6 rounded-full overflow-hidden bg-black shrink-0 border border-white/20 shadow-sm">
            {currentTrack.artworkUrl ? (
              <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="w-full h-full object-cover pointer-events-none" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-black text-[8px]">W</div>
            )}
          </div>

          {/* Animated Wave Indicator if playing */}
          <div className="flex items-center gap-0.5 h-3">
            <span className={`w-0.5 bg-spotify-green rounded-full ${isPlaying ? 'h-3 animate-pulse' : 'h-1.5'}`} />
            <span className={`w-0.5 bg-spotify-green rounded-full ${isPlaying ? 'h-2 animate-bounce' : 'h-1'}`} />
            <span className={`w-0.5 bg-spotify-green rounded-full ${isPlaying ? 'h-3.5 animate-pulse' : 'h-2'}`} />
          </div>

          {/* Track Title */}
          <span className="text-xs font-semibold text-white/90 max-w-[120px] md:max-w-[150px] truncate pointer-events-none">
            {currentTrack.title}
          </span>

          {/* Quick Play/Pause */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow active:scale-90 transition-transform"
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5 fill-black" /> : <Play className="w-2.5 h-2.5 fill-black ml-0.5" />}
          </button>

          <ChevronDown className="w-3.5 h-3.5 text-white/50" />
        </div>
      ) : (
        /* 2. Expanded Dynamic Island Floating Card */
        <div className="w-[92vw] max-w-[360px] bg-black/90 border border-white/20 rounded-3xl p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200 text-white">
          {/* Top Row: Drag Handle + Cover + Info + Collapse */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <GripHorizontal className="w-4 h-4 text-white/30 shrink-0" />

              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 shadow-lg">
                {currentTrack.artworkUrl ? (
                  <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="w-full h-full object-cover pointer-events-none" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-black text-sm">W</div>
                )}
              </div>

              <div className="flex flex-col min-w-0 pr-2 pointer-events-none">
                <span className="text-sm font-bold text-white truncate">{currentTrack.title}</span>
                <span className="text-xs text-white/60 truncate">{currentTrack.artistName}</span>
              </div>
            </div>

            {/* Collapse */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex flex-col gap-1 mb-3">
            <div className="relative w-full flex items-center h-4 cursor-pointer">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-spotify-green transition-all" style={{ width: `${progressPercent}%` }} />
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
            <div className="flex items-center justify-between text-[10px] text-white/60 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between px-2 mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevTrack();
              }}
              className="text-white hover:text-spotify-green active:scale-75 p-1 transition-transform"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextTrack();
              }}
              className="text-white hover:text-spotify-green active:scale-75 p-1 transition-transform"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(currentTrack.id);
              }}
              className={`p-1 active:scale-75 transition-transform ${isLiked ? 'text-spotify-green' : 'text-white/70'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-spotify-green' : ''}`} />
            </button>
          </div>

          {/* Bottom Upcoming / Recommended Tiles */}
          {upcomingTracks.length > 0 && (
            <div className="pt-2 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {upcomingTracks.map((trk) => (
                <div
                  key={trk.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTrack(trk);
                  }}
                  className="w-16 h-16 rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/10 relative group cursor-pointer active:scale-95 transition-transform shadow"
                >
                  {trk.artworkUrl ? (
                    <img src={trk.artworkUrl} alt={trk.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-white/50">W</div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-end p-1">
                    <span className="text-[9px] font-bold text-white truncate drop-shadow">{trk.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
