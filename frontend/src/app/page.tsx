'use client';

import { Flame, Heart, Headphones, Music2, Radio, Sparkles, Play, Disc3, Mic2, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TrackCard from '../components/TrackCard';
import { CURATED_OFFICIAL_HITS, searchOfficialMusic } from '../lib/officialMusic';
import { generateDailyMixes } from '../lib/recommendations';
import { usePlayerStore } from '../stores/usePlayerStore';
import { UnifiedTrack } from '../types';

interface PopularArtistItem {
  id: string;
  name: string;
  image: string;
  genre: string;
}

const POPULAR_ARTISTS_CATALOG: PopularArtistItem[] = [
  {
    id: 'pritam',
    name: 'Pritam',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/3d/c7/43/3dc74387-e7f4-2342-397c-4cf2037c69a5/8902894623223_cover.jpg/600x600bb.jpg',
    genre: 'Bollywood',
  },
  {
    id: 'arijit',
    name: 'Arijit Singh',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2c/ca/64/2cca640a-e221-6063-23d0-fef1c78d263d/8909024123639.png/600x600bb.jpg',
    genre: 'Soulful & Melodic',
  },
  {
    id: 'ar-rahman',
    name: 'A.R. Rahman',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/70/c2/f2/70c2f254-1eb5-2c77-f21c-55d953a65483/1200220383139.jpg/600x600bb.jpg',
    genre: 'Composer & Master',
  },
  {
    id: 'anirudh',
    name: 'Anirudh Ravichander',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/47/61/88/476188e2-5cd5-2320-8f0b-f9cd978560fd/885288695823.jpg/600x600bb.jpg',
    genre: 'Tamil & Bollywood Rock',
  },
  {
    id: 'taylor-swift',
    name: 'Taylor Swift',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/dd/fd/a0ddfd72-ee9e-f046-6466-a5dbefc696fa/26UM1IM21436.rgb.jpg/600x600bb.jpg',
    genre: 'Pop Superstar',
  },
  {
    id: 'sabrina-carpenter',
    name: 'Sabrina Carpenter',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f6/15/d0/f615d0ab-e0c4-575d-907e-1cc084642357/24UMGIM61704.rgb.jpg/600x600bb.jpg',
    genre: 'Pop & Dance',
  },
  {
    id: 'billie-eilish',
    name: 'Billie Eilish',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg',
    genre: 'Alternative Pop',
  },
  {
    id: 'bruno-mars',
    name: 'Bruno Mars',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/600x600bb.jpg',
    genre: 'R&B & Pop',
  },
  {
    id: 'the-weeknd',
    name: 'The Weeknd',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/600x600bb.jpg',
    genre: 'Synthwave & R&B',
  },
  {
    id: 'diljit',
    name: 'Diljit Dosanjh',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/97/86/86/97868694-9413-a543-514a-a6374469ff97/859736427250_cover.jpg/600x600bb.jpg',
    genre: 'Punjabi & Global Fusion',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [greeting, setGreeting] = useState('Good evening');
  const [activeCategory, setActiveCategory] = useState<'all' | 'music' | 'podcasts'>('all');
  const [topHits, setTopHits] = useState<UnifiedTrack[]>(CURATED_OFFICIAL_HITS.todayTopHits);
  const [bollywood, setBollywood] = useState<UnifiedTrack[]>(CURATED_OFFICIAL_HITS.bollywoodHits);
  const [global50, setGlobal50] = useState<UnifiedTrack[]>(CURATED_OFFICIAL_HITS.global50);
  const [chillLoFi, setChillLoFi] = useState<UnifiedTrack[]>(CURATED_OFFICIAL_HITS.chillLoFi);
  const [favTracks, setFavTracks] = useState<UnifiedTrack[]>([]);
  const [favArtistNames, setFavArtistNames] = useState<string[]>([]);
  const [loadingArtist, setLoadingArtist] = useState<string | null>(null);

  const { setTrack, history } = usePlayerStore();

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

    // Load user's favorite artists and query custom recommendations
    try {
      const saved = localStorage.getItem('wavelength_favorite_artists');
      const list = saved ? JSON.parse(saved) : ['Taylor Swift', 'Arijit Singh', 'Bruno Mars', 'Anirudh Ravichander'];
      if (Array.isArray(list) && list.length > 0) {
        setFavArtistNames(list);
        searchOfficialMusic(list.slice(0, 3).join(' '), 12).then((tracks) => {
          if (tracks && tracks.length > 0) {
            setFavTracks(tracks);
          }
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const handlePlayArtist = async (e: React.MouseEvent, artistName: string) => {
    e.stopPropagation();
    setLoadingArtist(artistName);
    try {
      const results = await searchOfficialMusic(artistName, 10);
      if (results && results.length > 0) {
        setTrack(results[0], results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingArtist(null);
    }
  };

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
    <div className="flex flex-col min-h-full pb-16 relative overflow-hidden bg-gradient-to-b from-[#1e3264]/40 via-spotify-base to-spotify-base">
      <div className="p-6 flex flex-col gap-6">
        {/* Category Pills */}
        <div className="flex items-center gap-2 sticky top-0 py-2 -mt-2 bg-spotify-base/80 backdrop-blur-md z-20">
          {(['all', 'music', 'podcasts'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize transition-colors ${
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

        {/* Shelf: Recently Played (Listening History) */}
        {history && history.length > 0 && (
          <section className="flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                  Recently Played
                </h2>
                <p className="text-spotify-subtext text-xs">
                  Pick up right where you left off
                </p>
              </div>
              <Link href="/history" className="text-xs font-bold text-spotify-subtext hover:text-white hover:underline">
                Show all
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {history.slice(0, 6).map((track) => (
                <TrackCard key={track.id} track={track} queue={history} />
              ))}
            </div>
          </section>
        )}

        {/* Shelf: Made For You (AI Daily Mixes) */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Made For You
              </h2>
              <p className="text-spotify-subtext text-xs">
                Your personalized mixes based on listening affinity &amp; acoustic moods
              </p>
            </div>
            <span className="text-xs font-semibold text-spotify-green uppercase tracking-wider bg-spotify-green/10 px-2.5 py-1 rounded-full">
              Personalized
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {generateDailyMixes().map((mix) => (
              <div
                key={mix.id}
                onClick={() => {
                  if (mix.tracks.length > 0) {
                    setTrack(mix.tracks[0], mix.tracks);
                  }
                }}
                className="p-4 rounded-xl bg-spotify-card hover:bg-spotify-hover transition-all duration-300 flex flex-col gap-3 group cursor-pointer shadow-lg relative border border-white/5"
              >
                {/* Mix Cover Artwork with Gradient & Spotify badge */}
                <div
                  className={`aspect-square w-full rounded-lg bg-gradient-to-br ${mix.gradient} p-4 flex flex-col justify-between shadow-md relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
                      Wavelength
                    </span>
                    <Disc3 className="w-5 h-5 text-white/60 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white leading-tight">
                      {mix.title}
                    </h3>
                  </div>

                  {/* Play Button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mix.tracks.length > 0) setTrack(mix.tracks[0], mix.tracks);
                    }}
                    className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95"
                  >
                    <Play className="w-6 h-6 fill-black ml-0.5" />
                  </button>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate">
                    {mix.title}
                  </span>
                  <p className="text-xs text-spotify-subtext line-clamp-2 mt-0.5 leading-snug">
                    {mix.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shelf: Recommended Based on Your Favorites */}
        {favTracks && favTracks.length > 0 && (
          <section className="flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer flex items-center gap-2">
                  <Star className="w-5 h-5 text-spotify-green fill-spotify-green" />
                  Recommended Based on Your Favorites
                </h2>
                <p className="text-spotify-subtext text-xs">
                  Tailored hits from {favArtistNames.slice(0, 3).join(', ')}{favArtistNames.length > 3 ? ' and more' : ''}
                </p>
              </div>
              <Link
                href="/settings"
                className="text-xs font-bold text-spotify-green hover:underline flex items-center gap-1"
              >
                Manage Favorites &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {favTracks.slice(0, 6).map((track) => (
                <TrackCard key={track.id} track={track} queue={favTracks} />
              ))}
            </div>
          </section>
        )}

        {/* Shelf: Popular Artists (Circular Cards matching Image 2) */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Popular artists
              </h2>
              <p className="text-spotify-subtext text-xs">
                Top charting musicians, producers and vocalists
              </p>
            </div>
            <Link
              href="/settings"
              className="text-xs font-bold text-spotify-subtext hover:text-white hover:underline"
            >
              Customize
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {POPULAR_ARTISTS_CATALOG.map((artist) => (
              <div
                key={artist.id}
                onClick={() => router.push(`/search?q=${encodeURIComponent(artist.name)}`)}
                className="group bg-spotify-card hover:bg-spotify-hover p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col items-center text-center relative shadow-md hover:shadow-xl"
              >
                {/* Circular Portrait with Hover Play Button */}
                <div className="relative aspect-square w-full rounded-full overflow-hidden bg-spotify-elevated shadow-lg mb-3">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Floating Green Play Button on hover */}
                  <button
                    onClick={(e) => handlePlayArtist(e, artist.name)}
                    aria-label={`Play ${artist.name}`}
                    className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    {loadingArtist === artist.name ? (
                      <Disc3 className="w-5 h-5 fill-black animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    )}
                  </button>
                </div>

                <div className="flex flex-col items-center w-full min-w-0">
                  <h3 className="font-bold text-sm text-white truncate w-full group-hover:underline">
                    {artist.name}
                  </h3>
                  <span className="text-xs text-spotify-subtext font-medium capitalize mt-0.5">
                    Artist
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Album: Aashiqui 2 (Matching User Reference Screenshot #4) */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Featured Album
              </h2>
              <p className="text-spotify-subtext text-xs">
                Stream the complete master soundtrack
              </p>
            </div>
            <Link
              href="/album"
              className="text-xs font-bold text-spotify-green hover:underline uppercase tracking-wider"
            >
              View Album →
            </Link>
          </div>

          <Link
            href="/album"
            className="group bg-gradient-to-r from-[#0d3d34] via-[#112d27] to-[#121212] p-5 rounded-2xl border border-teal-500/30 flex items-center justify-between shadow-xl hover:border-teal-400 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-xl overflow-hidden shadow-2xl border border-white/20 shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/12/35/4a123561-1c5c-7d35-30df-5953018e69ee/8902894354228.jpg/600x600bb.jpg"
                  alt="Aashiqui 2"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-spotify-green">
                  Master Studio Album
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                  Aashiqui 2
                </h3>
                <p className="text-xs text-[#b3b3b3] mt-1">
                  Mithoon • Ankit Tiwari • Jeet Gannguli • Arijit Singh
                </p>
                <span className="text-[11px] text-white/60 mt-1">
                  9 Songs • Full Master Audio &amp; Synchronized Lyrics
                </span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-all shrink-0">
              <Play className="w-6 h-6 fill-black ml-0.5" />
            </div>
          </Link>
        </section>

        {/* Shelf: Popular Radio (Matching Screenshot #2) */}
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                Popular radio
              </h2>
              <p className="text-spotify-subtext text-xs">
                Stations based on your favorite artists
              </p>
            </div>
            <span className="text-xs font-semibold text-spotify-green uppercase tracking-wider bg-spotify-green/10 px-2.5 py-1 rounded-full">
              Radio Mix
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Arijit Singh Radio */}
            <div
              onClick={async () => {
                const tracks = await searchOfficialMusic('Arijit Singh Pritam Anirudh', 12);
                if (tracks.length > 0) setTrack(tracks[0], tracks);
              }}
              className="bg-[#242424] hover:bg-[#2e2e2e] p-4 rounded-xl border border-white/5 cursor-pointer shadow-md group transition-all"
            >
              <div className="w-full h-36 rounded-lg bg-gradient-to-br from-amber-300 via-amber-200 to-amber-100 flex flex-col justify-between p-3 relative overflow-hidden shadow-inner mb-3">
                <div className="flex items-center justify-between text-black">
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center text-[8px] text-white font-bold">W</div>
                    <span className="text-[10px] font-black uppercase tracking-wider">RADIO</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 my-auto">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500" alt="Arijit" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow z-10 scale-105">
                    <img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500" alt="Pritam" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500" alt="Anirudh" className="w-full h-full object-cover" />
                  </div>
                </div>

                <h4 className="text-lg font-black text-black tracking-tight leading-tight">
                  Arijit Singh
                </h4>
              </div>

              <span className="text-xs font-bold text-white block">Arijit Singh Radio</span>
              <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                With Pritam, Anirudh Ravichander, Atif Aslam...
              </p>
            </div>

            {/* Sidhu Moose Wala Radio */}
            <div
              onClick={async () => {
                const tracks = await searchOfficialMusic('Sidhu Moose Wala Karan Aujla AP Dhillon', 12);
                if (tracks.length > 0) setTrack(tracks[0], tracks);
              }}
              className="bg-[#242424] hover:bg-[#2e2e2e] p-4 rounded-xl border border-white/5 cursor-pointer shadow-md group transition-all"
            >
              <div className="w-full h-36 rounded-lg bg-gradient-to-br from-indigo-300 via-indigo-200 to-indigo-100 flex flex-col justify-between p-3 relative overflow-hidden shadow-inner mb-3">
                <div className="flex items-center justify-between text-black">
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center text-[8px] text-white font-bold">W</div>
                    <span className="text-[10px] font-black uppercase tracking-wider">RADIO</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 my-auto">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500" alt="Punjabi" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow z-10 scale-105">
                    <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500" alt="Sidhu" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500" alt="Karan" className="w-full h-full object-cover" />
                  </div>
                </div>

                <h4 className="text-lg font-black text-black tracking-tight leading-tight">
                  Sidhu Moose Wala
                </h4>
              </div>

              <span className="text-xs font-bold text-white block">Sidhu Moose Wala Radio</span>
              <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                With Karan Aujla, Shubh, Diljit Dosanjh...
              </p>
            </div>

            {/* Diljit Dosanjh Radio */}
            <div
              onClick={async () => {
                const tracks = await searchOfficialMusic('Diljit Dosanjh Hass Hass G.O.A.T', 12);
                if (tracks.length > 0) setTrack(tracks[0], tracks);
              }}
              className="bg-[#242424] hover:bg-[#2e2e2e] p-4 rounded-xl border border-white/5 cursor-pointer shadow-md group transition-all"
            >
              <div className="w-full h-36 rounded-lg bg-gradient-to-br from-emerald-300 via-teal-200 to-emerald-100 flex flex-col justify-between p-3 relative overflow-hidden shadow-inner mb-3">
                <div className="flex items-center justify-between text-black">
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center text-[8px] text-white font-bold">W</div>
                    <span className="text-[10px] font-black uppercase tracking-wider">RADIO</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 my-auto">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500" alt="Diljit" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow z-10 scale-105">
                    <img src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500" alt="Badshah" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500" alt="Yo Yo" className="w-full h-full object-cover" />
                  </div>
                </div>

                <h4 className="text-lg font-black text-black tracking-tight leading-tight">
                  Diljit Dosanjh
                </h4>
              </div>

              <span className="text-xs font-bold text-white block">Diljit Dosanjh Radio</span>
              <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                With Badshah, Yo Yo Honey Singh, Guru Randhawa...
              </p>
            </div>
          </div>
        </section>

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
