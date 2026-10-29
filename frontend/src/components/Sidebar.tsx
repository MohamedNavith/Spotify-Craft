'use client';

import {
  ArrowDownToLine,
  ArrowUpDown,
  BookMarked,
  Check,
  Disc3,
  FolderPlus,
  Heart,
  Home,
  Library,
  ListMusic,
  Music,
  Play,
  Plus,
  Radio,
  Search,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOfflineTracks } from '../lib/offlineStorage';
import { deleteUserPlaylist, getUserPlaylists, UserPlaylist } from '../lib/userPlaylists';
import { searchOfficialMusic } from '../lib/officialMusic';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentTrack, isPlaying, setTrack, setIsSpotifyImportOpen, setIsCreateSheetOpen } = usePlayerStore();
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'artists' | 'albums'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setUserPlaylists(getUserPlaylists());
    const handleUpdate = () => setUserPlaylists(getUserPlaylists());
    window.addEventListener('wavelength_playlists_updated', handleUpdate);
    return () => window.removeEventListener('wavelength_playlists_updated', handleUpdate);
  }, []);

  const curatedPlaylists = [
    { title: "Today's Top Hits", author: 'Spotify Curated', coverBg: 'bg-emerald-900', tracksCount: 50 },
    { title: 'Global Top 50', author: 'Daily Chart', coverBg: 'bg-cyan-900', tracksCount: 50 },
    { title: 'Hot Hits India', author: 'Bollywood & Desi', coverBg: 'bg-amber-900', tracksCount: 40 },
    { title: 'Chill Waves & Lo-Fi', author: 'Lofi Records', coverBg: 'bg-violet-900', tracksCount: 60 },
  ];

  const curatedAlbums = [
    {
      title: 'Aashiqui 2',
      artist: 'Mithoon, Ankit Tiwari',
      year: '2013',
      coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/fb/11/bffb111e-b834-c360-1e5b-b98a0033faea/8902894358899.jpg/600x600bb.jpg',
      query: 'Aashiqui 2 songs'
    },
    {
      title: "1989 (Taylor's Version)",
      artist: 'Taylor Swift',
      year: '2023',
      coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/dd/fd/a0ddfd72-ee9e-f046-6466-a5dbefc696fa/26UM1IM21436.rgb.jpg/600x600bb.jpg',
      query: 'Taylor Swift 1989'
    },
    {
      title: "Short n' Sweet",
      artist: 'Sabrina Carpenter',
      year: '2024',
      coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f6/15/d0/f615d0ab-e0c4-575d-907e-1cc084642357/24UMGIM61704.rgb.jpg/600x600bb.jpg',
      query: 'Sabrina Carpenter Taste Espresso'
    },
    {
      title: 'Starboy',
      artist: 'The Weeknd',
      year: '2016',
      coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/600x600bb.jpg',
      query: 'The Weeknd Starboy'
    },
    {
      title: '24K Magic',
      artist: 'Bruno Mars',
      year: '2016',
      coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/600x600bb.jpg',
      query: 'Bruno Mars 24K Magic'
    },
    {
      title: 'Rockstar',
      artist: 'A.R. Rahman',
      year: '2011',
      coverArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/70/c2/f2/70c2f254-1eb5-2c77-f21c-55d953a65483/1200220383139.jpg/600x600bb.jpg',
      query: 'Rockstar AR Rahman'
    },
  ];

  const libraryArtists = [
    {
      name: 'Anirudh Ravichander',
      listeners: '28.4M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/47/61/88/476188e2-5cd5-2320-8f0b-f9cd978560fd/885288695823.jpg/600x600bb.jpg',
    },
    {
      name: 'A.R. Rahman',
      listeners: '32.1M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/70/c2/f2/70c2f254-1eb5-2c77-f21c-55d953a65483/1200220383139.jpg/600x600bb.jpg',
    },
    {
      name: 'Arijit Singh',
      listeners: '44.8M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2c/ca/64/2cca640a-e221-6063-23d0-fef1c78d263d/8909024123639.png/600x600bb.jpg',
    },
    {
      name: 'Taylor Swift',
      listeners: '104.2M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a0/dd/fd/a0ddfd72-ee9e-f046-6466-a5dbefc696fa/26UM1IM21436.rgb.jpg/600x600bb.jpg',
    },
    {
      name: 'Billie Eilish',
      listeners: '98.5M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg',
    },
    {
      name: 'Bruno Mars',
      listeners: '110.3M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/46/bf/ed46bf4e-7cb9-965a-54f3-03059977fe6c/075679589293.jpg/600x600bb.jpg',
    },
    {
      name: 'Sabrina Carpenter',
      listeners: '86.7M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/57/e8/7b/57e87ba0-5057-9bb9-c247-ce7dbe426e89/24UMGIM55213.rgb.jpg/600x600bb.jpg',
    },
    {
      name: 'The Weeknd',
      listeners: '118.0M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/600x600bb.jpg',
    },
    {
      name: 'Diljit Dosanjh',
      listeners: '24.9M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/97/86/86/97868694-9413-a543-514a-a6374469ff97/859736427250_cover.jpg/600x600bb.jpg',
    },
    {
      name: 'Karan Aujla',
      listeners: '18.2M listeners',
      image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f7/6d/78/f76d78c5-cc9c-f2d6-8603-ba690eaa5c7d/5064089826918_cover.jpg/600x600bb.jpg',
    },
  ];

  const [loadingKey, setLoadingKey] = useState<string | null>(null);

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
    p.title.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const filteredArtists = libraryArtists.filter((a) =>
    a.name.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const filteredAlbums = curatedAlbums.filter((al) =>
    al.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    al.artist.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <>
      {/* Desktop Spotify Bento Sidebar */}
      <aside className="hidden md:flex w-[280px] lg:w-[300px] xl:w-[320px] flex-col gap-2 select-none h-full text-spotify-subtext text-sm font-medium shrink-0">
        <div className="bg-spotify-base rounded-lg flex-1 flex flex-col overflow-hidden border border-white/5 shadow-xl">
          {/* Header Row: Your Library + Create (+) Button */}
          <div className="p-4 pb-2 flex items-center justify-between">
            <button
              onClick={() => setActiveFilter('all')}
              className="flex items-center gap-3 text-spotify-subtext hover:text-white transition-colors group"
            >
              <Library className="w-6 h-6 group-hover:scale-105 transition-transform" />
              <span className="font-extrabold text-base tracking-tight text-spotify-subtext group-hover:text-white">
                Your Library
              </span>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCreateSheetOpen(true)}
                title="Create playlist or blend"
                className="w-8 h-8 rounded-full hover:bg-white/10 text-spotify-subtext hover:text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Authentic Spotify Filter Pills: Playlists, Artists, Albums */}
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(['playlists', 'artists', 'albums'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(activeFilter === filter ? 'all' : filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors shrink-0 ${
                  activeFilter === filter
                    ? 'bg-white text-black'
                    : 'bg-[#232323] hover:bg-[#2a2a2a] text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search & Sort Bar inside Library */}
          <div className="px-4 py-1.5 flex items-center justify-between text-xs text-spotify-subtext">
            {isSearchOpen ? (
              <div className="flex items-center gap-1.5 bg-[#242424] px-2 py-1 rounded-md w-full">
                <Search className="w-3.5 h-3.5 text-spotify-subtext" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search in Your Library"
                  className="bg-transparent text-white text-xs outline-none w-full placeholder:text-spotify-subtext"
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
              <>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-spotify-subtext hover:text-white transition-colors"
                  title="Search in Your Library"
                >
                  <Search className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 hover:text-white cursor-pointer group">
                  <span className="font-semibold text-[11px]">Recents</span>
                  <ArrowUpDown className="w-3 h-3 group-hover:scale-110 transition-transform" />
                </div>
              </>
            )}
          </div>

          {/* Scrollable Library List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 flex flex-col gap-0.5 custom-scrollbar">
            {/* Playlists Section */}
            {(activeFilter === 'all' || activeFilter === 'playlists') && (
              <>
                {/* Pinned: Liked Songs */}
                <Link
                  href="/search"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Heart className="w-5 h-5 fill-white" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white text-sm font-bold truncate group-hover:text-spotify-green transition-colors">
                      Liked Songs
                    </span>
                    <span className="text-xs text-spotify-subtext flex items-center gap-1 mt-0.5">
                      <span className="text-spotify-green font-bold">📌 Pinned</span> • Playlist
                    </span>
                  </div>
                </Link>

                {/* Pinned: Downloaded Songs (Offline In-App) */}
                <div
                  onClick={async () => {
                    const offTracks = await getOfflineTracks();
                    if (offTracks.length > 0) {
                      setTrack(offTracks[0], offTracks);
                    } else {
                      alert('No tracks saved offline yet. Click the download checkmark on any track to save it offline!');
                    }
                  }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shrink-0 shadow-md">
                    <ArrowDownToLine className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white text-sm font-bold truncate group-hover:text-spotify-green transition-colors">
                      Downloaded Songs
                    </span>
                    <span className="text-xs text-spotify-subtext flex items-center gap-1 mt-0.5">
                      <span className="text-spotify-green font-bold">📌 Pinned</span> • Offline Storage
                    </span>
                  </div>
                </div>

                {/* User Custom Playlists */}
                {filteredPlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => {
                      if (playlist.tracks.length > 0) {
                        setTrack(playlist.tracks[0], playlist.tracks);
                      }
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded bg-gradient-to-br from-spotify-green to-emerald-950 overflow-hidden flex items-center justify-center text-black shrink-0 font-bold shadow">
                        {playlist.coverArt ? (
                          <img src={playlist.coverArt} alt={playlist.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-5 h-5 stroke-[2.5]" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-sm font-bold truncate group-hover:text-spotify-green transition-colors">
                          {playlist.title}
                        </span>
                        <span className="text-xs text-spotify-subtext truncate mt-0.5">
                          Playlist • {playlist.tracks.length} songs
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUserPlaylist(playlist.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-rose-400 text-spotify-subtext transition-all"
                      title="Remove from Library"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Curated Spotify Presets */}
                {curatedPlaylists.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setIsSpotifyImportOpen(true)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div
                      className={`w-12 h-12 rounded ${item.coverBg} flex items-center justify-center text-white/80 shrink-0 font-bold shadow`}
                    >
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-white text-sm font-bold truncate group-hover:text-spotify-green transition-colors">
                        {item.title}
                      </span>
                      <span className="text-xs text-spotify-subtext truncate mt-0.5">
                        Playlist • {item.author}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Artists Section */}
            {(activeFilter === 'all' || activeFilter === 'artists') && (
              <>
                {activeFilter === 'all' && (
                  <div className="pt-3 pb-1 px-2 text-xs font-bold text-spotify-subtext uppercase tracking-wider">
                    Artists
                  </div>
                )}
                {filteredArtists.map((artist) => (
                  <div
                    key={artist.name}
                    onClick={() => handlePlayQuery(`artist-${artist.name}`, artist.name)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-800 shrink-0 shadow">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {loadingKey === `artist-${artist.name}` && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Disc3 className="w-5 h-5 text-spotify-green animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-white text-sm font-bold truncate group-hover:text-spotify-green transition-colors">
                        {artist.name}
                      </span>
                      <span className="text-xs text-spotify-subtext truncate mt-0.5">
                        Artist • {artist.listeners}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Albums Section */}
            {(activeFilter === 'all' || activeFilter === 'albums') && (
              <>
                {activeFilter === 'all' && (
                  <div className="pt-3 pb-1 px-2 text-xs font-bold text-spotify-subtext uppercase tracking-wider">
                    Albums
                  </div>
                )}
                {filteredAlbums.map((album) => (
                  <div
                    key={album.title}
                    onClick={() => handlePlayQuery(`album-${album.title}`, album.query)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-neutral-800 shrink-0 shadow">
                      <img
                        src={album.coverArt}
                        alt={album.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {loadingKey === `album-${album.title}` && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Disc3 className="w-5 h-5 text-spotify-green animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-white text-sm font-bold truncate group-hover:text-spotify-green transition-colors">
                        {album.title}
                      </span>
                      <span className="text-xs text-spotify-subtext truncate mt-0.5">
                        Album • {album.artist}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer: Version & Check For Updates */}
          <div className="p-3 border-t border-white/5 bg-black/40 flex items-center justify-between text-[11px] text-spotify-subtext">
            <span className="font-mono">v1.5.0</span>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('https://api.github.com/repos/MohamedNavith/Spotify-Craft/releases/latest');
                  if (res.ok) {
                    const data = await res.json();
                    if (data.tag_name && data.tag_name !== 'v1.5.0') {
                      window.open(data.html_url, '_blank');
                    } else {
                      alert('You are on the latest version of Wavelength (v1.5.0)!');
                    }
                  }
                } catch {
                  alert('You are on the latest version of Wavelength (v1.5.0)!');
                }
              }}
              className="hover:text-spotify-green hover:underline font-semibold transition-colors"
            >
              Check for Updates
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Spotify Android/iOS App Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around py-1.5 px-3 text-spotify-subtext safe-area-pb">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            pathname === '/' || pathname === '/Spotify-Craft/' ? 'text-white font-bold' : 'hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </Link>
        <Link
          href="/search"
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            pathname === '/search' ? 'text-white font-bold' : 'hover:text-white'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Search</span>
        </Link>
        <Link
          href="/library"
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            pathname === '/library' ? 'text-white font-bold' : 'hover:text-white'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Your Library</span>
        </Link>
        <button
          onClick={() => setIsCreateSheetOpen(true)}
          className="flex flex-col items-center gap-1 py-1 transition-colors hover:text-white"
          title="Create Playlist or Blend"
        >
          <Plus className="w-6 h-6" />
          <span className="text-[10px] tracking-tight">Create</span>
        </button>
      </nav>
    </>
  );
}
