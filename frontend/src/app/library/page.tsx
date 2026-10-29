'use client';

import {
  ArrowDownToLine,
  ArrowUpDown,
  ChevronRight,
  Disc3,
  Download,
  Grid,
  Heart,
  Music,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOfflineTracks } from '../../lib/offlineStorage';
import { searchOfficialMusic } from '../../lib/officialMusic';
import { deleteUserPlaylist, getUserPlaylists, UserPlaylist } from '../../lib/userPlaylists';
import { usePlayerStore } from '../../stores/usePlayerStore';

const CURATED_ALBUMS = [
  {
    title: 'Aashiqui 2',
    artist: 'Mithoon, Ankit Tiwari',
    year: '2013',
    coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/fb/11/bffb111e-b834-c360-1e5b-b98a0033faea/8902894358899.jpg/600x600bb.jpg',
    query: 'Aashiqui 2 songs',
  },
  {
    title: "1989 (Taylor's Version)",
    artist: 'Taylor Swift',
    year: '2023',
    coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/dd/fd/a0ddfd72-ee9e-f046-6466-a5dbefc696fa/26UM1IM21436.rgb.jpg/600x600bb.jpg',
    query: 'Taylor Swift 1989',
  },
  {
    title: "Short n' Sweet",
    artist: 'Sabrina Carpenter',
    year: '2024',
    coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f6/15/d0/f615d0ab-e0c4-575d-907e-1cc084642357/24UMGIM61704.rgb.jpg/600x600bb.jpg',
    query: 'Sabrina Carpenter Taste Espresso',
  },
  {
    title: 'Starboy',
    artist: 'The Weeknd',
    year: '2016',
    coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/600x600bb.jpg',
    query: 'The Weeknd Starboy',
  },
  {
    title: '24K Magic',
    artist: 'Bruno Mars',
    year: '2016',
    coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/600x600bb.jpg',
    query: 'Bruno Mars 24K Magic',
  },
  {
    title: 'Rockstar',
    artist: 'A.R. Rahman',
    year: '2011',
    coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/70/c2/f2/70c2f254-1eb5-2c77-f21c-55d953a65483/1200220383139.jpg/600x600bb.jpg',
    query: 'Rockstar AR Rahman',
  },
];

const LIBRARY_ARTISTS = [
  {
    name: 'Anirudh Ravichander',
    listeners: '28.4M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/47/61/88/476188e2-5cd5-2320-8f0b-f9cd978560fd/885288695823.jpg/600x600bb.jpg',
  },
  {
    name: 'A.R. Rahman',
    listeners: '32.1M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/70/c2/f2/70c2f254-1eb5-2c77-f21c-55d953a65483/1200220383139.jpg/600x600bb.jpg',
  },
  {
    name: 'Arijit Singh',
    listeners: '44.8M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2c/ca/64/2cca640a-e221-6063-23d0-fef1c78d263d/8909024123639.png/600x600bb.jpg',
  },
  {
    name: 'Taylor Swift',
    listeners: '104.2M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/dd/fd/a0ddfd72-ee9e-f046-6466-a5dbefc696fa/26UM1IM21436.rgb.jpg/600x600bb.jpg',
  },
  {
    name: 'Billie Eilish',
    listeners: '98.5M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg',
  },
  {
    name: 'Bruno Mars',
    listeners: '110.3M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/600x600bb.jpg',
  },
  {
    name: 'Sabrina Carpenter',
    listeners: '86.7M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f6/15/d0/f615d0ab-e0c4-575d-907e-1cc084642357/24UMGIM61704.rgb.jpg/600x600bb.jpg',
  },
  {
    name: 'The Weeknd',
    listeners: '118.0M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/600x600bb.jpg',
  },
  {
    name: 'Diljit Dosanjh',
    listeners: '24.9M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/97/86/86/97868694-9413-a543-514a-a6374469ff97/859736427250_cover.jpg/600x600bb.jpg',
  },
  {
    name: 'Karan Aujla',
    listeners: '18.2M monthly listeners',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f7/6d/78/f76d78c5-cc9c-f2d6-8603-ba690eaa5c7d/5064089826918_cover.jpg/600x600bb.jpg',
  },
];

const CURATED_PLAYLISTS = [
  { title: "Today's Top Hits", author: 'Spotify Curated', coverBg: 'bg-emerald-900', tracksCount: 50 },
  { title: 'Global Top 50', author: 'Daily Chart', coverBg: 'bg-cyan-900', tracksCount: 50 },
  { title: 'Hot Hits India', author: 'Bollywood & Desi', coverBg: 'bg-amber-900', tracksCount: 40 },
  { title: 'Chill Waves & Lo-Fi', author: 'Lofi Records', coverBg: 'bg-violet-900', tracksCount: 60 },
];

export default function LibraryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'playlists' | 'artists' | 'albums'>('all');
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const { setIsCreateSheetOpen, setIsSpotifyImportOpen, setTrack } = usePlayerStore();

  useEffect(() => {
    setUserPlaylists(getUserPlaylists());
    const handleUpdate = () => setUserPlaylists(getUserPlaylists());
    window.addEventListener('wavelength_playlists_updated', handleUpdate);
    return () => window.removeEventListener('wavelength_playlists_updated', handleUpdate);
  }, []);

  const handlePlayQuery = async (key: string, queryText: string) => {
    try {
      setLoadingKey(key);
      const tracks = await searchOfficialMusic(queryText, 25);
      if (tracks.length > 0) {
        setTrack(tracks[0], tracks);
      }
    } catch (err) {
      console.error('Failed to load tracks for library item:', err);
    } finally {
      setLoadingKey(null);
    }
  };

  const filteredPlaylists = userPlaylists.filter((p) =>
    p.title.toLowerCase().includes(searchFilter.toLowerCase()),
  );
  const filteredArtists = LIBRARY_ARTISTS.filter((a) =>
    a.name.toLowerCase().includes(searchFilter.toLowerCase()),
  );
  const filteredAlbums = CURATED_ALBUMS.filter((al) =>
    al.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    al.artist.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  return (
    <div className="min-h-full bg-[#121212] text-white p-4 md:p-8 select-none pb-28">
      {/* Top Header: Avatar, Your Library, Search, Plus (+) */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-md">
            W
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Your Library</h1>
        </div>

        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center gap-1.5 bg-[#242424] px-2.5 py-1 rounded-full border border-white/10">
              <Search className="w-3.5 h-3.5 text-spotify-subtext" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search library..."
                className="bg-transparent text-white text-xs outline-none w-28 md:w-40"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchFilter('');
                }}
                className="text-spotify-subtext hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              title="Search Library"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setIsCreateSheetOpen(true)}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            title="Create Playlist"
          >
            <Plus className="w-6 h-6 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
        {(['all', 'playlists', 'artists', 'albums'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all shrink-0 ${
              filter === tab
                ? 'bg-white text-black'
                : 'bg-[#232323] hover:bg-[#2a2a2a] text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* "Import your music from other apps" Banner */}
      <div
        onClick={() => setIsSpotifyImportOpen(true)}
        className="w-full bg-[#181818] hover:bg-[#202020] border border-white/5 rounded-2xl p-4 flex items-center justify-between mb-6 cursor-pointer active:scale-[0.99] transition-all shadow-md"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
            <Download className="w-5 h-5 text-spotify-green" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white">Import your music from other apps</h3>
            <span className="text-xs text-[#b3b3b3]">Sync Spotify, Apple Music & local files</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/50" />
      </div>

      {/* Recents row */}
      <div className="flex items-center justify-between mb-4 text-[#b3b3b3] text-xs font-semibold">
        <div className="flex items-center gap-1.5 hover:text-white cursor-pointer">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Recents</span>
        </div>
      </div>

      {/* Library Items List */}
      <div className="flex flex-col gap-1">
        {/* Playlists Section */}
        {(filter === 'all' || filter === 'playlists') && (
          <>
            {/* Pinned: Liked Songs */}
            <Link
              href="/search"
              className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white text-base font-bold truncate group-hover:text-spotify-green transition-colors">
                  Liked Songs
                </span>
                <span className="text-xs text-[#b3b3b3] flex items-center gap-1 mt-0.5">
                  <span className="text-spotify-green font-bold">📌 Pinned</span> • Playlist
                </span>
              </div>
            </Link>

            {/* Pinned: Downloaded Songs */}
            <div
              onClick={async () => {
                const offTracks = await getOfflineTracks();
                if (offTracks.length > 0) {
                  setTrack(offTracks[0], offTracks);
                } else {
                  alert('No tracks saved offline yet. Click the download checkmark on any track to save it offline!');
                }
              }}
              className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shrink-0 shadow-md">
                <ArrowDownToLine className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white text-base font-bold truncate group-hover:text-spotify-green transition-colors">
                  Downloaded Songs
                </span>
                <span className="text-xs text-[#b3b3b3] flex items-center gap-1 mt-0.5">
                  <span className="text-spotify-green font-bold">📌 Pinned</span> • Offline Storage
                </span>
              </div>
            </div>

            {/* Custom User Playlists */}
            {filteredPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  if (pl.tracks.length > 0) {
                    setTrack(pl.tracks[0], pl.tracks);
                  }
                }}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-spotify-green to-emerald-950 overflow-hidden flex items-center justify-center text-black shrink-0 font-bold shadow">
                    {pl.coverArt ? (
                      <img src={pl.coverArt} alt={pl.title} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-6 h-6 stroke-[2.5]" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-base font-bold truncate group-hover:text-spotify-green transition-colors">
                      {pl.title}
                    </span>
                    <span className="text-xs text-[#b3b3b3] truncate mt-0.5">
                      Playlist • {pl.tracks.length} songs
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteUserPlaylist(pl.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:text-rose-400 text-spotify-subtext transition-all"
                  title="Delete playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Curated Presets */}
            {CURATED_PLAYLISTS.map((cp, idx) => (
              <div
                key={idx}
                onClick={() => setIsSpotifyImportOpen(true)}
                className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-lg ${cp.coverBg} flex items-center justify-center text-white/80 shrink-0 font-bold shadow`}>
                  <Music className="w-6 h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-base font-bold truncate group-hover:text-spotify-green transition-colors">
                    {cp.title}
                  </span>
                  <span className="text-xs text-[#b3b3b3] truncate mt-0.5">
                    Playlist • {cp.author}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Artists Section */}
        {(filter === 'all' || filter === 'artists') && (
          <>
            {filter === 'all' && (
              <div className="pt-4 pb-1 px-2 text-xs font-bold text-spotify-subtext uppercase tracking-wider">
                Artists
              </div>
            )}
            {filteredArtists.map((artist) => (
              <div
                key={artist.name}
                onClick={() => handlePlayQuery(`artist-${artist.name}`, artist.name)}
                className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-neutral-800 shrink-0 border border-white/10 shadow-md">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {loadingKey === `artist-${artist.name}` && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Disc3 className="w-6 h-6 text-spotify-green animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-white text-base font-bold truncate group-hover:text-spotify-green transition-colors">
                    {artist.name}
                  </span>
                  <span className="text-xs text-[#b3b3b3] truncate mt-0.5">
                    Artist • {artist.listeners}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Albums Section */}
        {(filter === 'all' || filter === 'albums') && (
          <>
            {filter === 'all' && (
              <div className="pt-4 pb-1 px-2 text-xs font-bold text-spotify-subtext uppercase tracking-wider">
                Albums
              </div>
            )}
            {filteredAlbums.map((album) => (
              <div
                key={album.title}
                onClick={() => handlePlayQuery(`album-${album.title}`, album.query)}
                className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-white/10 shadow-md">
                  <img
                    src={album.coverArt}
                    alt={album.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {loadingKey === `album-${album.title}` && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Disc3 className="w-6 h-6 text-spotify-green animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-white text-base font-bold truncate group-hover:text-spotify-green transition-colors">
                    {album.title}
                  </span>
                  <span className="text-xs text-[#b3b3b3] truncate mt-0.5">
                    Album • {album.artist} • {album.year}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
