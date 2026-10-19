'use client';

import { Clock3, Heart, Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import TrackCard from '../../components/TrackCard';
import { searchTracks } from '../../lib/api';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { UnifiedSearchResult, UnifiedTrack } from '../../types';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const BROWSE_CATEGORIES = [
  { name: 'Pop', color: 'from-pink-600 to-rose-700' },
  { name: 'Hip-Hop', color: 'from-orange-600 to-amber-700' },
  { name: 'Electronic', color: 'from-teal-600 to-cyan-700' },
  { name: 'Rock', color: 'from-red-600 to-red-800' },
  { name: 'Indie', color: 'from-emerald-600 to-green-700' },
  { name: 'Chill', color: 'from-indigo-600 to-blue-700' },
  { name: 'Focus & Study', color: 'from-sky-600 to-cyan-800' },
  { name: 'Ambient', color: 'from-purple-600 to-violet-800' },
  { name: 'Jazz & Blues', color: 'from-yellow-600 to-amber-800' },
  { name: 'Acoustic', color: 'from-lime-600 to-emerald-800' },
  { name: 'Sleep', color: 'from-slate-700 to-indigo-900' },
  { name: 'Workout', color: 'from-fuchsia-600 to-pink-800' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { currentTrack, isPlaying, setTrack, togglePlay, likedTrackIds, toggleLike } =
    usePlayerStore();

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchTracks(query.trim(), 20);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const topTrack = results?.tracks?.[0];
  const otherTracks = results?.tracks?.slice(1, 5) || [];

  return (
    <div className="flex flex-col min-h-full pb-12">
      <TopBar
        showSearch={true}
        searchQuery={query}
        onSearchChange={setQuery}
      />

      <div className="px-6 flex flex-col gap-6 mt-4">
        {/* If no query, show Spotify Browse Categories */}
        {!query.trim() && (
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-white">Browse all</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {BROWSE_CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => setQuery(cat.name)}
                  className={`h-40 rounded-lg p-4 bg-gradient-to-br ${cat.color} cursor-pointer hover:scale-[1.02] transition-transform shadow-md relative overflow-hidden flex flex-col justify-between`}
                >
                  <span className="text-white font-extrabold text-xl tracking-tight">
                    {cat.name}
                  </span>
                  <div className="w-16 h-16 bg-black/20 rounded-md rotate-25 translate-x-3 translate-y-3 self-end shadow-inner" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* If query has results */}
        {query.trim() && results && results.tracks.length > 0 && (
          <div className="flex flex-col gap-8">
            {/* Top Result + Songs Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Result (Col 1-5) */}
              {topTrack && (
                <div className="lg:col-span-5 flex flex-col gap-3">
                  <h2 className="text-xl font-bold text-white">Top result</h2>
                  <div
                    onClick={() => setTrack(topTrack, results.tracks)}
                    className="group bg-spotify-card hover:bg-spotify-hover p-5 rounded-lg transition-colors cursor-pointer flex flex-col justify-between h-56 relative shadow-lg"
                  >
                    <div className="w-24 h-24 rounded overflow-hidden bg-spotify-elevated shadow-md">
                      {topTrack.artworkUrl ? (
                        <img
                          src={topTrack.artworkUrl}
                          alt={topTrack.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xl">
                          W
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <h3 className="text-white font-black text-2xl truncate">
                        {topTrack.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-spotify-subtext font-semibold">
                          {topTrack.artistName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-black/60 text-white font-bold uppercase text-[10px]">
                          Song
                        </span>
                      </div>
                    </div>

                    {/* Floating green play button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentTrack?.id === topTrack.id) togglePlay();
                        else setTrack(topTrack, results.tracks);
                      }}
                      className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95"
                    >
                      {currentTrack?.id === topTrack.id && isPlaying ? (
                        <Pause className="w-5 h-5 fill-black" />
                      ) : (
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Songs Column (Col 6-12) */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-white">Songs</h2>
                <div className="flex flex-col">
                  {results.tracks.slice(0, 4).map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const isLiked = likedTrackIds.has(track.id);

                    return (
                      <div
                        key={track.id}
                        onClick={() => setTrack(track, results.tracks)}
                        className="group flex items-center justify-between p-2 rounded-md hover:bg-spotify-hover transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Play/Index toggle */}
                          <div className="w-6 text-center text-xs text-spotify-subtext font-mono group-hover:hidden">
                            {idx + 1}
                          </div>
                          <div className="w-6 hidden group-hover:flex items-center justify-center text-white">
                            {isCurrent && isPlaying ? (
                              <Pause className="w-4 h-4 fill-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white" />
                            )}
                          </div>

                          <div className="w-10 h-10 rounded overflow-hidden bg-spotify-elevated shrink-0">
                            {track.artworkUrl && (
                              <img
                                src={track.artworkUrl}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span
                              className={`text-sm font-semibold truncate ${
                                isCurrent ? 'text-spotify-green' : 'text-white'
                              }`}
                            >
                              {track.title}
                            </span>
                            <span className="text-xs text-spotify-subtext truncate">
                              {track.artistName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-spotify-subtext pr-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(track.id);
                            }}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                              isLiked ? 'opacity-100 text-spotify-green' : 'hover:text-white'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isLiked ? 'fill-spotify-green' : ''
                              }`}
                            />
                          </button>
                          <span>{formatDuration(track.duration)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* All Tracks Grid */}
            <section className="flex flex-col gap-4 mt-4">
              <h2 className="text-xl font-bold text-white">All Results</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    queue={results.tracks}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Empty state when searching and no results */}
        {query.trim() && results && results.tracks.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="text-xl font-bold text-white">No results found for "{query}"</h3>
            <p className="text-spotify-subtext text-sm mt-2">
              Please make sure your words are spelled correctly or use less or different keywords.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
