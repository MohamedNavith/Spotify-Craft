'use client';

import { Film, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { resolveVideoCanvas, VideoCanvasConfig } from '../lib/videoResolver';

interface TrackVideoCanvasProps {
  title: string;
  artist: string;
  duration?: number;
  artworkUrl?: string | null;
  className?: string;
  isMuted?: boolean;
  showToggle?: boolean;
  onToggleCanvas?: (isCanvas: boolean) => void;
  preferredMode?: 'canvas' | 'art';
}

export default function TrackVideoCanvas({
  title,
  artist,
  duration = 180,
  artworkUrl,
  className = 'w-full h-full',
  isMuted = true,
  showToggle = true,
  onToggleCanvas,
  preferredMode,
}: TrackVideoCanvasProps) {
  const [internalMode, setInternalMode] = useState<'canvas' | 'art'>('canvas');
  const [muted, setMuted] = useState(isMuted);
  const [hasError, setHasError] = useState(false);

  const activeMode = preferredMode || internalMode;

  const canvasConfig: VideoCanvasConfig | null = useMemo(() => {
    return resolveVideoCanvas(title, artist, duration);
  }, [title, artist, duration]);

  const hasCanvas = !!canvasConfig && !hasError;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMode = activeMode === 'canvas' ? 'art' : 'canvas';
    setInternalMode(nextMode);
    onToggleCanvas?.(nextMode === 'canvas');
  };

  // If no canvas available or user explicitly chose 'art', display artwork
  if (!hasCanvas || activeMode === 'art') {
    return (
      <div className={`relative overflow-hidden bg-black ${className}`}>
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#181818] text-spotify-green font-black text-4xl">
            W
          </div>
        )}

        {/* If canvas IS available, give the user the toggle pill to switch to 25s Video Canvas */}
        {hasCanvas && showToggle && (
          <button
            onClick={handleToggle}
            title="Switch to 25s Video Canvas"
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black/90 text-white/90 text-[10px] font-extrabold uppercase tracking-wider border border-white/20 backdrop-blur-md shadow-lg active:scale-95 transition-all"
          >
            <Film className="w-3 h-3 text-spotify-green animate-pulse" />
            <span>Canvas</span>
          </button>
        )}
      </div>
    );
  }

  // Active 20-30 Second Highlight Loop
  const embedUrl = `https://www.youtube-nocookie.com/embed/${canvasConfig.videoId}?autoplay=1&mute=${
    muted ? 1 : 0
  }&controls=0&loop=1&playlist=${canvasConfig.videoId}&start=${canvasConfig.clipStart}&end=${
    canvasConfig.clipEnd
  }&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1`;

  return (
    <div className={`relative overflow-hidden bg-black select-none group ${className}`}>
      {/* 25-30s Highlight Video Looper Frame */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center scale-105">
        <iframe
          src={embedUrl}
          title={`${title} Canvas Video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="w-[140%] h-[140%] pointer-events-none object-cover border-0"
          onError={() => setHasError(true)}
        />
      </div>

      {/* Specular Edge & Gradient Sheen */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-black/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]" />

      {/* Floating Badges & Controls Header */}
      {showToggle && (
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
          {/* Highlight Badge */}
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 text-white/90 text-[9px] font-extrabold uppercase tracking-wider border border-white/15 backdrop-blur-md shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-spotify-green animate-ping" />
            <span>25s Climax</span>
          </span>

          {/* Toggle Buttons: Canvas / Art & Sound */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMuted((prev) => !prev);
              }}
              title={muted ? 'Unmute video audio' : 'Mute video audio'}
              className="p-1.5 rounded-full bg-black/75 hover:bg-black text-white/80 hover:text-white border border-white/20 backdrop-blur-md shadow-md active:scale-90 transition-all"
            >
              {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-spotify-green" />}
            </button>

            <button
              onClick={handleToggle}
              title="Switch to Album Artwork"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-white/90 text-[10px] font-extrabold uppercase tracking-wider border border-white/20 backdrop-blur-md shadow-md active:scale-95 transition-all"
            >
              <ImageIcon className="w-3 h-3 text-white/70" />
              <span>Art</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
