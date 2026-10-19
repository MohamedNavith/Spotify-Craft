'use client';

import { ListMusic, Play, Trash2, X } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueueDrawer({ isOpen, onClose }: QueueDrawerProps) {
  const { currentTrack, queue, queueIndex, setTrack } = usePlayerStore();

  if (!isOpen) return null;

  const nextTracks = queue.slice(queueIndex + 1);

  return (
    <aside className="fixed top-0 right-0 bottom-24 w-80 md:w-96 bg-spotify-card/95 backdrop-blur-xl border-l border-spotify-border z-40 flex flex-col p-6 shadow-2xl animate-fade-in select-none">
      <div className="flex items-center justify-between pb-4 border-b border-spotify-border">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <ListMusic className="w-5 h-5 text-spotify-green" />
          <span>Play Queue</span>
        </div>
        <button
          onClick={onClose}
          className="text-spotify-subtext hover:text-white p-1 rounded-full hover:bg-spotify-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 py-4">
        {/* Now Playing */}
        {currentTrack && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-spotify-subtext uppercase tracking-wider">
              Now Playing
            </h3>
            <div className="flex items-center gap-3 p-2 rounded-md bg-spotify-elevated shadow">
              <div className="w-12 h-12 rounded overflow-hidden bg-spotify-card shrink-0">
                {currentTrack.artworkUrl && (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-spotify-green truncate">
                  {currentTrack.title}
                </span>
                <span className="text-xs text-spotify-subtext truncate">
                  {currentTrack.artistName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Up */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-spotify-subtext uppercase tracking-wider">
              Next Up ({nextTracks.length})
            </h3>
          </div>

          {nextTracks.length === 0 ? (
            <p className="text-xs text-spotify-subtext italic py-4">
              Queue is empty. Select tracks to play next!
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {nextTracks.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => setTrack(track, queue)}
                  className="group flex items-center justify-between p-2 rounded hover:bg-spotify-hover cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded overflow-hidden bg-spotify-elevated shrink-0 relative">
                      {track.artworkUrl && (
                        <img
                          src={track.artworkUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate group-hover:text-spotify-green">
                        {track.title}
                      </span>
                      <span className="text-[10px] text-spotify-subtext truncate">
                        {track.artistName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
