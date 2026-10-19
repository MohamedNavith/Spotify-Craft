'use client';

import { Heart, Music, Play, Radio, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import TrackCard from '../components/TrackCard';
import VisualBackground from '../components/VisualBackground';
import { fetchTrendingTracks, searchTracks } from '../lib/api';
import { usePlayerStore } from '../stores/usePlayerStore';
import { UnifiedTrack } from '../types';

export default function HomePage() {
  const [greeting, setGreeting] = useState('Good evening');
  const [activeCategory, setActiveCategory] = useState<'all' | 'music' | 'podcasts'>('all');
  const [trendingTracks, setTrendingTracks] = useState<UnifiedTrack[]>([]);
  const [chillTracks, setChillTracks] = useState<UnifiedTrack[]>([]);
  const [electronicTracks, setElectronicTracks] = useState<UnifiedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { setTrack } = usePlayerStore();

  useEffect(() => {
    // Dynamic greeting calculation
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Fetch initial tracks from API
    async function loadFeed() {
      setIsLoading(true);
      try {
        const [trending, chillRes, elecRes] = await Promise.allSettled([
          fetchTrendingTracks(),
          searchTracks('chill ambient', 10),
          searchTracks('electronic dance', 10),
        ]);

        if (trending.status === 'fulfilled' && trending.value.length > 0) {
          setTrendingTracks(trending.value);
        }
        if (chillRes.status === 'fulfilled' && chillRes.value.tracks.length > 0) {
          setChillTracks(chillRes.value.tracks);
        }
        if (elecRes.status === 'fulfilled' && elecRes.value.tracks.length > 0) {
          setElectronicTracks(elecRes.value.tracks);
        }
      } catch (err) {
        console.error('Failed to load feed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFeed();
  }, []);

  return (
    <div className="flex flex-col min-h-full pb-12 relative overflow-hidden">
      <VisualBackground />
      <TopBar />

      <div className="px-6 flex flex-col gap-6">
        {/* Category Pills */}
        <div className="flex items-center gap-2">
          {(['all', 'music', 'podcasts'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                activeCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-spotify-elevated hover:bg-spotify-hover text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dynamic Greeting */}
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {greeting}
        </h1>

        {/* Spotify 6-Item Quick Play Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              title: 'Liked Songs',
              gradient: 'from-indigo-700 to-purple-600',
              icon: <Heart className="w-6 h-6 fill-white text-white" />,
            },
            {
              title: 'Daily Mix 1 (Electronic)',
              gradient: 'from-teal-800 to-emerald-700',
              icon: <Sparkles className="w-6 h-6 text-white" />,
            },
            {
              title: 'Top Open Wave Hits',
              gradient: 'from-amber-700 to-orange-600',
              icon: <Radio className="w-6 h-6 text-white" />,
            },
            {
              title: 'Deep Ambient Focus',
              gradient: 'from-blue-900 to-indigo-800',
              icon: <Music className="w-6 h-6 text-white" />,
            },
            {
              title: 'Chillout Lounge',
              gradient: 'from-rose-900 to-pink-700',
              icon: <Music className="w-6 h-6 text-white" />,
            },
            {
              title: 'Synthesizer Dreams',
              gradient: 'from-purple-900 to-violet-700',
              icon: <Radio className="w-6 h-6 text-white" />,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (trendingTracks.length > 0) {
                  setTrack(trendingTracks[idx % trendingTracks.length], trendingTracks);
                }
              }}
              className="group bg-white/5 hover:bg-white/10 rounded overflow-hidden flex items-center justify-between transition-colors cursor-pointer shadow-sm relative pr-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 shadow-md`}
                >
                  {item.icon}
                </div>
                <span className="font-bold text-sm text-white truncate">
                  {item.title}
                </span>
              </div>

              {/* Floating green play button on hover */}
              <button
                className="w-10 h-10 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95"
                title="Play"
              >
                <Play className="w-5 h-5 fill-black ml-0.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Shelf: Featured & Trending on Jamendo */}
        <section className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Trending on Jamendo
              </h2>
              <p className="text-spotify-subtext text-xs">
                Popular legally licensed tracks with full playback streams
              </p>
            </div>
            <button className="text-spotify-subtext hover:text-white text-xs font-bold uppercase tracking-wider">
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trendingTracks.slice(0, 6).map((track) => (
              <TrackCard key={track.id} track={track} queue={trendingTracks} />
            ))}
          </div>
        </section>

        {/* Shelf: Chill & Ambient Waves */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Chill & Ambient
              </h2>
              <p className="text-spotify-subtext text-xs">
                Relaxing soundscapes and meditative tones
              </p>
            </div>
            <button className="text-spotify-subtext hover:text-white text-xs font-bold uppercase tracking-wider">
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {chillTracks.slice(0, 6).map((track) => (
              <TrackCard key={track.id} track={track} queue={chillTracks} />
            ))}
          </div>
        </section>

        {/* Shelf: Electronic Energy */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Electronic Energy
              </h2>
              <p className="text-spotify-subtext text-xs">
                Dance, electro, and synthwave productions
              </p>
            </div>
            <button className="text-spotify-subtext hover:text-white text-xs font-bold uppercase tracking-wider">
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {electronicTracks.slice(0, 6).map((track) => (
              <TrackCard key={track.id} track={track} queue={electronicTracks} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
