'use client';

import { Clock, Play, Trash2 } from 'lucide-react';
import TopBar from '../../components/TopBar';
import TrackCard from '../../components/TrackCard';
import { usePlayerStore } from '../../stores/usePlayerStore';

export default function HistoryPage() {
  const { history, setTrack } = usePlayerStore();

  const handleClearHistory = () => {
    localStorage.removeItem('wavelength_listening_history');
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-full pb-32 md:pb-16 select-none">
      <TopBar />

      <div className="px-6 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-white shadow-xl">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-spotify-green">
                Your Library
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Recently Played
              </h1>
              <p className="text-xs text-spotify-subtext mt-0.5">
                {history.length} songs you&apos;ve listened to recently
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTrack(history[0], history)}
                className="px-5 py-2.5 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-black ml-0.5" />
                <span>Play All</span>
              </button>
              <button
                onClick={handleClearHistory}
                title="Clear listening history"
                className="p-2.5 rounded-full hover:bg-white/10 text-spotify-subtext hover:text-white transition-colors text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* History Tracks Grid */}
        {history.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {history.map((track) => (
              <TrackCard key={track.id} track={track} queue={history} />
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Clock className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white">No listening history yet</h3>
            <p className="text-xs text-spotify-subtext mt-1 max-w-sm">
              Songs you play will appear here so you can easily jump back into your recent favorites.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
