'use client';

import { getLikedTracks } from '../lib/userPlaylists';
import { playlistUrl, rockAndPop } from '../lib/playlistCatalog';
import { artistPortrait } from '../lib/artistPortrait';

import { ChevronLeft, ChevronRight, Disc3, Flame, Headphones, Heart, Mic2, Music2, Play, Radio, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CURRENT_APP_VERSION } from '../components/AppUpdateChecker';
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
    image: artistPortrait('pritam'),
    genre: 'Bollywood',
  },
  {
    id: 'arijit',
    name: 'Arijit Singh',
    image: artistPortrait('arijit-singh'),
    genre: 'Soulful & Melodic',
  },
  {
    id: 'ar-rahman',
    name: 'A.R. Rahman',
    image: artistPortrait('a-r-rahman'),
    genre: 'Composer & Master',
  },
  {
    id: 'anirudh',
    name: 'Anirudh Ravichander',
    image: artistPortrait('anirudh-ravichander'),
    genre: 'Tamil & Bollywood Rock',
  },
  {
    id: 'taylor-swift',
    name: 'Taylor Swift',
    image: artistPortrait('taylor-swift'),
    genre: 'Pop Superstar',
  },
  {
    id: 'sabrina-carpenter',
    name: 'Sabrina Carpenter',
    image: artistPortrait('sabrina-carpenter'),
    genre: 'Pop & Dance',
  },
  {
    id: 'billie-eilish',
    name: 'Billie Eilish',
    image: artistPortrait('billie-eilish'),
    genre: 'Alternative Pop',
  },
  {
    id: 'bruno-mars',
    name: 'Bruno Mars',
    image: artistPortrait('bruno-mars'),
    genre: 'R&B & Pop',
  },
  {
    id: 'the-weeknd',
    name: 'The Weeknd',
    image: artistPortrait('the-weeknd'),
    genre: 'Synthwave & R&B',
  },
  {
    id: 'diljit',
    name: 'Diljit Dosanjh',
    image: artistPortrait('diljit-dosanjh'),
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

  const setTrack = usePlayerStore(state => state.setTrack);
  const history = usePlayerStore(state => state.history);
  const [likedTracks, setLikedTracks] = useState<UnifiedTrack[]>([]);
  useEffect(() => {
    const refresh = () => setLikedTracks(getLikedTracks());
    refresh();
    window.addEventListener('wavelength_liked_tracks_updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('wavelength_liked_tracks_updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const historyScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollShelf = (direction: 'left' | 'right') => {
    if (historyScrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      historyScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
      playlistId: 'collection-todayTopHits',
      title: "Today's Top Hits",
      gradient: 'from-emerald-700 to-green-600',
      icon: <Flame className="w-6 h-6 text-white" />,
      tracks: CURATED_OFFICIAL_HITS.todayTopHits,
    },
    {
      playlistId: 'collection-bollywoodHits',
      title: 'Bollywood & Indian Hits',
      gradient: 'from-amber-600 to-rose-600',
      icon: <Sparkles className="w-6 h-6 text-white" />,
      tracks: CURATED_OFFICIAL_HITS.bollywoodHits,
    },
    {
      playlistId: 'collection-global50',
      title: 'Global Top 50',
      gradient: 'from-indigo-700 to-purple-600',
      icon: <Radio className="w-6 h-6 text-white" />,
      tracks: CURATED_OFFICIAL_HITS.global50,
    },
    {
      playlistId: 'collection-chillLoFi',
      title: 'Chill Lo-Fi Study',
      gradient: 'from-teal-800 to-cyan-700',
      icon: <Headphones className="w-6 h-6 text-white" />,
      tracks: CURATED_OFFICIAL_HITS.chillLoFi,
    },
    {
      playlistId: 'liked',
      title: 'Liked Songs',
      gradient: 'from-purple-800 to-indigo-900',
      icon: <Heart className="w-6 h-6 fill-white text-white" />,
      tracks: likedTracks,
    },
    {
      playlistId: rockAndPop.id,
      title: 'Rock & Pop Legends',
      gradient: 'from-rose-800 to-pink-700',
      icon: <Music2 className="w-6 h-6 text-white" />,
      tracks: rockAndPop.tracks,
    },
  ];

  return (
    <div className="flex flex-col min-h-full pb-16 relative overflow-hidden wl-home">
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
        <h1 className="wl-heading font-extrabold text-spotify-text">
          {greeting}
        </h1>

        {/* Spotify 6-Item Quick Play Grid */}
        <div className="wl-quick-grid wl-stagger grid gap-2 md:gap-3">
          {quickTiles.map((tile, idx) => (
            <div
              key={idx}
              className="group bg-white/5 hover:bg-white/10 rounded overflow-hidden flex items-center justify-between transition-colors cursor-pointer shadow-sm relative pr-4"
            >
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div
                  className={`w-10 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${tile.gradient} flex items-center justify-center shrink-0 shadow-md`}
                >
                  {tile.icon}
                </div>
                <Link href={playlistUrl(tile.playlistId)} className="font-bold text-sm text-white truncate after:absolute after:inset-0">
                  {tile.title}
                </Link>
              </div>

              {/* Floating green play button on hover */}
              <button
                className="absolute right-2 hidden md:flex w-10 h-10 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black items-center justify-center shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95 shrink-0"
                onClick={event => { event.stopPropagation(); if (tile.tracks.length) setTrack(tile.tracks[0], tile.tracks); else router.push(playlistUrl('liked')); }}
                title={`Play ${tile.title}`}
              >
                <Play className="w-5 h-5 fill-black ml-0.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Shelf: Recently Played (Listening History - Smooth Horizontally Scrollable across Mobile, Web & Desktop) */}
        {history && history.length > 0 && (
          <section className="flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                  Recently Played
                </h2>
                <p className="text-spotify-subtext text-xs">
                  Pick up right where you left off &bull; Scroll to browse full history
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollShelf('left')}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow"
                  title="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollShelf('right')}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow"
                  title="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <Link href="/history" className="text-xs font-bold text-spotify-subtext hover:text-white hover:underline ml-2">
                  Show all
                </Link>
              </div>
            </div>

            <div
              ref={historyScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-3 pt-1 -mx-2 px-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {history.map((track) => (
                <div key={track.id} className="w-40 sm:w-44 md:w-48 shrink-0">
                  <TrackCard track={track} queue={history} />
                </div>
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
                A mix for each mood
              </p>
            </div>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {generateDailyMixes().map((mix) => (
              <div
                key={mix.id}
                className="p-4 rounded-xl bg-spotify-card hover:bg-spotify-hover transition-all duration-300 flex flex-col gap-3 group cursor-pointer shadow-lg relative border border-white/5"
              >
                {/* Mix Cover Artwork with Gradient & Spotify badge */}
                <div
                  className={`aspect-square w-full rounded-lg bg-gradient-to-br ${mix.gradient} p-4 flex flex-col justify-between shadow-md relative overflow-hidden`}
                >
                  <img src={mix.id === 'daily-mix-3' ? mix.tracks[0]?.artworkUrl || undefined : artistPortrait(({ 'daily-mix-1':'bruno-mars', 'daily-mix-2':'arijit-singh', 'daily-mix-3':'billie-eilish', 'daily-mix-4':'the-weeknd' } as Record<string,string>)[mix.id])} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_25%]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
                  <div className="relative flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
                      Wavelength
                    </span>
                    <Disc3 className="w-5 h-5 text-white/60 animate-spin" style={{ animationDuration: '8s' }} />
                  </div>


                  {/* Play Button on hover */}
                  <button
                    aria-label={`Play ${mix.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mix.tracks.length > 0) setTrack(mix.tracks[0], mix.tracks);
                    }}
                    className="absolute z-10 bottom-3 right-3 w-12 h-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95"
                  >
                    <Play className="w-6 h-6 fill-black ml-0.5" />
                  </button>
                </div>

                <div className="flex flex-col min-w-0">
                  <Link href={playlistUrl(mix.id)} className="font-bold text-white after:absolute after:inset-0">
                    {mix.title}
                  </Link>
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
                    loading="lazy"
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
                Music from the film
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
                  onError={event => { event.currentTarget.hidden = true; }}
                  src="https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/600x600bb.jpg"
                  alt="Aashiqui 2"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-spotify-green">
                  Film soundtrack
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
                    <img src={artistPortrait('arijit-singh')} alt="Arijit" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow z-10 scale-105">
                    <img src={artistPortrait('pritam')} alt="Pritam" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img src={artistPortrait('anirudh-ravichander')} alt="Anirudh" className="w-full h-full object-cover" />
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
                    <img src={artistPortrait('diljit-dosanjh')} alt="Diljit Dosanjh" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow z-10 scale-105">
                    <img src={artistPortrait('sidhu-moose-wala')} alt="Sidhu" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img src={artistPortrait('karan-aujla')} alt="Karan" className="w-full h-full object-cover" />
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
                    <img src={artistPortrait('diljit-dosanjh')} alt="Diljit" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow z-10 scale-105">
                    <img src={artistPortrait('badshah-rapper')} alt="Badshah" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img src={artistPortrait('yo-yo-honey-singh')} alt="Yo Yo" className="w-full h-full object-cover" />
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

        {/* Start Page Footer: Ecosystem Links & Current/Latest Release Version */}
        <footer className="mt-16 pt-8 pb-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-spotify-subtext">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white tracking-tight text-sm">Wavelength Ecosystem</span>
              <span className="px-2 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green border border-spotify-green/30 font-mono font-bold text-[10px]">
                {CURRENT_APP_VERSION} (Latest Release)
              </span>
            </div>
            <p className="text-[11px] text-spotify-subtext text-center md:text-left">
              ALAC/FLAC 24-bit/192kHz Hi-Res Lossless Audio &bull; Fluid Touch Gestures &bull; Synced Lyrics
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <Link href="/settings" className="hover:text-white transition-colors">Settings</Link>
            <a href="https://github.com/MohamedNavith/Spotify-Craft/releases/latest" target="_blank" rel="noopener noreferrer" className="hover:text-spotify-green transition-colors flex items-center gap-1">
              <span>Android APK</span>
            </a>
            <a href="https://github.com/MohamedNavith/Spotify-Craft/releases/latest" target="_blank" rel="noopener noreferrer" className="hover:text-spotify-green transition-colors">
              Windows PC (.exe)
            </a>
            <a href="https://discord.com/oauth2/authorize?client_id=1563521762656780299&permissions=8&scope=bot%20applications.commands" target="_blank" rel="noopener noreferrer" className="hover:text-[#5865F2] transition-colors">
              Discord Bot
            </a>
            <a href="https://github.com/MohamedNavith/Spotify-Craft" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              GitHub Repository
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
