'use client';

import { Clock3, Heart, Pause, Play, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  {
    name: 'Bollywood & Desi',
    query: 'Bollywood Hits Arijit Singh Pritam',
    color: 'from-amber-600 to-orange-800',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/fb/11/bffb111e-b834-c360-1e5b-b98a0033faea/8902894358899.jpg/300x300bb.jpg',
  },
  {
    name: 'Pop Hits',
    query: 'Pop Music Hits Charts 2024',
    color: 'from-pink-600 to-rose-700',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f6/15/d0/f615d0ab-e0c4-575d-907e-1cc084642357/24UMGIM61704.rgb.jpg/300x300bb.jpg',
  },
  {
    name: 'Punjabi Hits',
    query: 'Punjabi Hits Diljit Dosanjh Karan Aujla',
    color: 'from-emerald-600 to-teal-800',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/97/86/86/97868694-9413-a543-514a-a6374469ff97/859736427250_cover.jpg/300x300bb.jpg',
  },
  {
    name: 'Hip-Hop & Rap',
    query: 'Hip Hop Rap Top Hits',
    color: 'from-orange-600 to-amber-700',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f7/6d/78/f76d78c5-cc9c-f2d6-8603-ba690eaa5c7d/5064089826918_cover.jpg/300x300bb.jpg',
  },
  {
    name: 'Tamil & South Beats',
    query: 'Tamil Hits Anirudh Ravichander AR Rahman',
    color: 'from-red-600 to-red-900',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/47/61/88/476188e2-5cd5-2320-8f0b-f9cd978560fd/885288695823.jpg/300x300bb.jpg',
  },
  {
    name: 'Chill & Lo-Fi',
    query: 'Chill Lo-Fi study beats relaxing',
    color: 'from-indigo-600 to-blue-800',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/300x300bb.jpg',
  },
  {
    name: 'Rock Classics',
    query: 'Rock Classics Legends Queen AC/DC',
    color: 'from-stone-700 to-stone-900',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/70/c2/f2/70c2f254-1eb5-2c77-f21c-55d953a65483/1200220383139.jpg/300x300bb.jpg',
  },
  {
    name: 'R&B & Soul',
    query: 'R&B Soul Bruno Mars The Weeknd',
    color: 'from-purple-600 to-violet-800',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/300x300bb.jpg',
  },
  {
    name: 'Alternative & Indie',
    query: 'Alternative Indie Billie Eilish',
    color: 'from-teal-600 to-cyan-800',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/300x300bb.jpg',
  },
  {
    name: 'Romantic Melodies',
    query: 'Romantic Love Songs Melodies Arijit',
    color: 'from-rose-600 to-pink-800',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2c/ca/64/2cca640a-e221-6063-23d0-fef1c78d263d/8909024123639.png/300x300bb.jpg',
  },
  {
    name: 'Workout Energy',
    query: 'Workout Gym High Energy EDM Beats',
    color: 'from-fuchsia-600 to-pink-800',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/dd/fd/a0ddfd72-ee9e-f046-6466-a5dbefc696fa/26UM1IM21436.rgb.jpg/300x300bb.jpg',
  },
  {
    name: 'Punjabi Legends',
    query: 'Sidhu Moose Wala Punjabi Classics',
    color: 'from-blue-700 to-indigo-950',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/37/ca/50/37ca5028-a2dc-975b-6366-6427c2b81761/5064089945930_cover.jpg/300x300bb.jpg',
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { currentTrack, isPlaying, setTrack, togglePlay, likedTrackIds, toggleLike } =
    usePlayerStore();

  // Read URL query parameter on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q');
      if (q) setQuery(q);
    }
  }, []);

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
    <div className="flex flex-col min-h-full pb-12 p-6">
      {/* Inline Search Bar on Search Page for Mobile / Direct Typing */}
      <div className="relative max-w-md w-full mb-6">
        <Search className="w-5 h-5 text-spotify-subtext absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to play?"
          className="w-full h-12 bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white text-sm pl-11 pr-10 rounded-full outline-none border border-transparent focus:border-white/40 transition-all shadow-inner placeholder:text-spotify-subtext"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-spotify-subtext hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* If no query, show Spotify Browse Categories */}
        {!query.trim() && (
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-white">Browse all</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {BROWSE_CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => setQuery(cat.query)}
                  className={`group h-44 rounded-xl p-4 bg-gradient-to-br ${cat.color} cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-xl relative overflow-hidden flex flex-col justify-between`}
                >
                  <span className="text-white font-extrabold text-lg leading-tight tracking-tight z-10 drop-shadow">
                    {cat.name}
                  </span>

                  {/* Rotated Album Cover Art */}
                  <div className="absolute -bottom-2 -right-3 w-24 h-24 rounded-lg shadow-2xl overflow-hidden rotate-[25deg] group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-300">
                    <img
                      src={cat.cover}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Hover Floating Play Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setQuery(cat.query);
                    }}
                    title={`Play ${cat.name}`}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105 active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </button>
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
