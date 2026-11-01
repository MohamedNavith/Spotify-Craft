'use client';

import { Heart, Pause, Play, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function MobileMiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    toggleLike,
    likedTrackIds,
    setIsExpandedNowPlaying,
    setIsVerciOpen,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div
      onClick={() => setIsExpandedNowPlaying(true)}
      style={{
        bottom: 'calc(58px + max(env(safe-area-inset-bottom, 0px), 8px))',
      }}
      className="md:hidden fixed left-2 right-2 z-30 bg-[#222222]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.85)] cursor-pointer select-none overflow-hidden transition-transform active:scale-[0.99]"
    >
      <div className="flex items-center justify-between p-2 gap-3">
        {/* Left: Thumbnail + Titles */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 shadow-md flex items-center justify-center">
            {currentTrack.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-spotify-green font-bold text-xs">W</div>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-white truncate leading-tight">
              {currentTrack.title}
            </span>
            <span className="text-[10px] text-spotify-subtext truncate leading-tight">
              {currentTrack.artistName}
            </span>
          </div>
        </div>

        {/* Right: Verci Sparkle, Heart, Play/Pause */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Verci Sparkle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVerciOpen(true);
            }}
            title="Launch Verci Cosmic Visualizer"
            className="p-2 text-white/60 hover:text-white active:scale-90 transition-transform"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>

          {/* Like Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(currentTrack.id);
            }}
            className="p-2 text-white/60 hover:text-white active:scale-90 transition-transform"
          >
            <Heart
              className={`w-4 h-4 ${
                isLiked ? 'text-spotify-green fill-spotify-green' : 'text-white/60'
              }`}
            />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform ml-1"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Slim Progress Stripe */}
      <div className="w-full h-[2.5px] bg-white/10">
        <div
          className="h-full bg-spotify-green transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
