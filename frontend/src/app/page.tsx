'use client';

import { Flame, Heart, Headphones, Music2, Radio, Sparkles, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import TrackCard from '../components/TrackCard';
import VisualBackground from '../components/VisualBackground';
import { CURATED_OFFICIAL_HITS, searchOfficialMusic } from '../lib/officialMusic';
import { usePlayerStore } from '../stores/usePlayerStore';
import { UnifiedTrack } from '../types';

export default function HomePage() {
  const [greeting, setGreeting] = useState('Good evening');
  const [activeCategory, setActiveCategory] = useState<'all' | 'music' | 'podcasts'>('all');
  const [topHits, setTopHits] = useState<UnifiedTrack[]>(CURATED_OFFICIAL_HITS.todayTopHits);
  const [bollywood, setBollywood] = useState<UnifiedTrack[]>(CURATED_OFFICIAL_HITS.bollywoodHits);
  const [global50, setGlobal50] = useState<UnifiedTrack[]>(CURATED_OFFICIAL_HITS.global50);
  const [chillLoFi, setChillLoFi] = useState<UnifiedTrack[]>(CURATED_OFFICIAL_HITS.chillLoFi);

  const { setTrack } = usePlayerStore();

  useEffect(() => {
    // Dynamic greeting calculation
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Fetch fresh live tracks from the official studio master catalog
    async function loadFreshOfficial() {
      try {
        const [freshPop, freshBollywood, freshGlobal, freshLoFi] = await Promise.allSettled([
          searchOfficialMusic('Taylor Swift Bruno Mars Billie Eilish Sabrina Carpenter', 12),
          searchOfficialMusic('Arijit Singh Anirudh Ravichander Bad Newz', 12),
          searchOfficialMusic('Kendrick Lamar Coldplay Harry Styles Dua Lipa', 12),
          searchOfficialMusic('Lofi Study Beats Chillhop', 12),
        ]);

        if (freshPop.status === 'fulfilled' && freshPop.value.length > 0) {
          setTopHits(freshPop.value);
        }
        if (freshBollywood.status === 'fulfilled' && freshBollywood.value.length > 0) {
          setBollywood(freshBollywood.value);
        }
        if (freshGlobal.status === 'fulfilled' && freshGlobal.value.length > 0) {
          setGlobal50(freshGlobal.value);
        }
        if (freshLoFi.status === 'fulfilled' && freshLoFi.value.length > 0) {
          setChillLoFi(freshLoFi.value);
        }
      } catch (err) {
        // Fallback already pre-loaded via CURATED_OFFICIAL_HITS
      }
    }

    loadFreshOfficial();
  }, []);

  const quickTiles = [
    {
      title: "Today's Top Hits",
      gradient: 'from-emerald-700 to-green-600',
      icon: <Flame className="w-6 h-6 text-white" />,
      tracks: topHits,
      startTrack: topHits[0],
    },
    {
      title: 'Bollywood & Indian Hits',
      gradient: 'from-amber-600 to-rose-600',
      icon: <Sparkles className="w-6 h-6 text-white" />,
      tracks: bollywood,
      startTrack: bollywood[0],
    },
    {
      title: 'Global Top 50',
      gradient: 'from-indigo-700 to-purple-600',
      icon: <Radio className="w-6 h-6 text-white" />,
      tracks: global50,
      startTrack: global50[0],
    },
    {
      title: 'Chill Lo-Fi Study',
      gradient: 'from-teal-800 to-cyan-700',
      icon: <Headphones className="w-6 h-6 text-white" />,
      tracks: chillLoFi,
      startTrack: chillLoFi[0],
    },
    {
      title: 'Liked Songs',
      gradient: 'from-purple-800 to-indigo-900',
      icon: <Heart className="w-6 h-6 fill-white text-white" />,
      tracks: topHits,
      startTrack: topHits[1] || topHits[0],
    },
    {
      title: 'Rock & Pop Legends',
      gradient: 'from-rose-800 to-pink-700',
      icon: <Music2 className="w-6 h-6 text-white" />,
      tracks: global50,
      startTrack: global50[2] || global50[0],
    },
  ];

  return (
    <div className="flex flex-col min-h-full pb-16 relative overflow-hidden">
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
          {quickTiles.map((tile, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (tile.startTrack) {
                  setTrack(tile.startTrack, tile.tracks);
                }
              }}
              className="group bg-white/5 hover:bg-white/10 rounded overflow-hidden flex items-center justify-between transition-colors cursor-pointer shadow-sm relative pr-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${tile.gradient} flex items-center justify-center shrink-0 shadow-md`}
                >
                  {tile.icon}
                </div>
                <span className="font-bold text-sm text-white truncate">
                  {tile.title}
                </span>
              </div>

              {/* Floating green play button on hover */}
              <button
                className="w-10 h-10 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95 shrink-0"
                title={`Play ${tile.title}`}
              >
                <Play className="w-5 h-5 fill-black ml-0.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Shelf: Today's Top Hits */}
        <section className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Today&apos;s Top Hits
              </h2>
              <p className="text-spotify-subtext text-xs">
                Official Studio Masters &middot; Chart-topping songs by Bruno Mars, Billie Eilish, Sabrina Carpenter &amp; more
              </p>
            </div>
            <span className="text-xs font-semibold text-spotify-green uppercase tracking-wider bg-spotify-green/10 px-2.5 py-1 rounded-full">
              Official Master
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {topHits.slice(0, 6).map((track) => (
              <TrackCard key={track.id} track={track} queue={topHits} />
            ))}
          </div>
        </section>

        {/* Shelf: Bollywood & Indian Chartbusters */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Bollywood &amp; Indian Chartbusters
              </h2>
              <p className="text-spotify-subtext text-xs">
                Arijit Singh, Anirudh Ravichander, Karan Aujla, Sachin-Jigar
              </p>
            </div>
            <span className="text-xs font-semibold text-spotify-green uppercase tracking-wider bg-spotify-green/10 px-2.5 py-1 rounded-full">
              Studio Audio
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {bollywood.slice(0, 6).map((track) => (
              <TrackCard key={track.id} track={track} queue={bollywood} />
            ))}
          </div>
        </section>

        {/* Shelf: Global Top 50 */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Global Top 50
              </h2>
              <p className="text-spotify-subtext text-xs">
                The most played official tracks around the world right now
              </p>
            </div>
            <span className="text-xs font-semibold text-spotify-green uppercase tracking-wider bg-spotify-green/10 px-2.5 py-1 rounded-full">
              Lossless AAC
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {global50.slice(0, 6).map((track) => (
              <TrackCard key={track.id} track={track} queue={global50} />
            ))}
          </div>
        </section>

        {/* Shelf: Chill & Lo-Fi Beats */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Chill &amp; Lo-Fi Study Beats
              </h2>
              <p className="text-spotify-subtext text-xs">
                Lofi Records official master study &amp; focus sessions
              </p>
            </div>
            <span className="text-xs font-semibold text-spotify-green uppercase tracking-wider bg-spotify-green/10 px-2.5 py-1 rounded-full">
              Focus
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {chillLoFi.slice(0, 6).map((track) => (
              <TrackCard key={track.id} track={track} queue={chillLoFi} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
