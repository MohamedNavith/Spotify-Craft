'use client';

import { Play, Pause } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { UnifiedTrack } from '../types';

interface TrackCardProps {
  track: UnifiedTrack;
  queue?: UnifiedTrack[];
}

export default function TrackCard({ track, queue }: TrackCardProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      setTrack(track, queue);
    }
  };

  return (
    <div
      onClick={() => setTrack(track, queue)}
      className="group bg-spotify-card hover:bg-spotify-hover p-4 rounded-md transition-all duration-300 cursor-pointer flex flex-col gap-3 relative shadow-md hover:shadow-xl"
    >
      {/* Artwork container */}
      <div className="relative aspect-square w-full rounded overflow-hidden bg-spotify-elevated shadow-lg">
        {track.artworkUrl ? (
          <img
            src={track.artworkUrl}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-spotify-subtext font-bold text-2xl">
            W
          </div>
        )}

        {/* Floating Spotify Green Play Button */}
        <button
          onClick={handlePlayClick}
          aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
          className={`absolute bottom-2 right-2 w-12 h-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isCurrent
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 fill-black" />
          ) : (
            <Play className="w-5 h-5 fill-black ml-0.5" />
          )}
        </button>
      </div>

      {/* Metadata */}
      <div className="flex flex-col min-w-0">
        <h3
          className={`font-bold text-sm truncate ${
            isCurrent ? 'text-spotify-green' : 'text-white'
          }`}
        >
          {track.title}
        </h3>
        <p className="text-spotify-subtext text-xs truncate mt-1">
          {track.artistName}
        </p>
        {track.license && (
          <span className="text-[10px] text-spotify-subtext/70 truncate mt-1">
            {track.license}
          </span>
        )}
      </div>
    </div>
  );
}
