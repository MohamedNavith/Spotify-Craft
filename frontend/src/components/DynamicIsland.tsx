'use client';

import {
  Cast,
  ChevronDown,
  ChevronUp,
  Heart,
  Maximize2,
  Pause,
  Play,
  Plus,
  Radio,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { useState } from 'react';
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
    setIsExpandedNowPlaying,
  } = usePlayerStore();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 4 upcoming tracks for the quick-switcher bottom row
  const upcomingTracks = queue.filter((t) => t.id !== currentTrack.id).slice(0, 4);

  return (
    <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 select-none transition-all duration-300">
      {/* 1. Translucent Collapsed Dynamic Island Pill */}
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className="h-9 px-3 bg-black/40 hover:bg-black/70 backdrop-blur-2xl border border-white/10 hover:border-white/25 rounded-full flex items-center gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] cursor-pointer group active:scale-95 transition-all"
          title="Tap to expand Dynamic Island"
        >
          {/* Mini Album Cover */}
          <div className="w-5 h-5 rounded-full overflow-hidden bg-black shrink-0 border border-white/20 shadow-sm">
            {currentTrack.artworkUrl ? (
              <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
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
          <span className="text-xs font-semibold text-white/90 group-hover:text-white max-w-[130px] md:max-w-[180px] truncate">
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

          <ChevronDown className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
        </div>
      ) : (
        /* 2. Expanded Dynamic Island Floating Card */
        <div className="w-[92vw] max-w-[380px] bg-black/85 border border-white/15 rounded-3xl p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200 text-white">
          {/* Top Row: Cover, Info, Wavelength Badge, Collapse */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 shadow-lg">
                {currentTrack.artworkUrl ? (
                  <img src={currentTrack.artworkUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-black text-sm">W</div>
                )}
              </div>

              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-sm font-bold text-white truncate">{currentTrack.title}</span>
                <span className="text-xs text-white/60 truncate">{currentTrack.artistName}</span>
              </div>
            </div>

            {/* Collapse & Watermark */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-5 h-5 rounded-full bg-spotify-green flex items-center justify-center">
                <span className="text-[10px] font-black text-black">W</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex flex-col gap-1 mb-3">
            <div className="relative w-full flex items-center h-4 cursor-pointer">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all" style={{ width: `${progressPercent}%` }} />
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
            <button className="text-white/70 hover:text-white p-1">
              <Cast className="w-5 h-5" />
            </button>
            <button onClick={prevTrack} className="text-white hover:text-spotify-green active:scale-75 p-1 transition-transform">
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="text-white hover:text-spotify-green active:scale-75 p-1 transition-transform">
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
            <button
              onClick={() => toggleLike(currentTrack.id)}
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
                  onClick={() => setTrack(trk)}
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
