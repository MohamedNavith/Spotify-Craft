'use client';

import PlaylistRow from '../components/PlaylistRow';
import { curatedPlaylists } from '../lib/playlistCatalog';
import { notify } from '../components/InterfaceEffects';
import { artistPortrait } from '../lib/artistPortrait';

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
import { CURRENT_APP_VERSION, isNewerVersion } from './AppUpdateChecker';
import { useEffect, useState } from 'react';
import { getOfflineTracks } from '../lib/offlineStorage';
import { deleteUserPlaylist, getUserPlaylists, UserPlaylist } from '../lib/userPlaylists';
import { searchOfficialMusic } from '../lib/officialMusic';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function Sidebar() {
  const pathname = usePathname();
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const setTrack = usePlayerStore(state => state.setTrack);
  const setIsSpotifyImportOpen = usePlayerStore(state => state.setIsSpotifyImportOpen);
  const setIsCreateSheetOpen = usePlayerStore(state => state.setIsCreateSheetOpen);
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
      image: artistPortrait('anirudh-ravichander'),
    },
    {
      name: 'A.R. Rahman',
      listeners: '32.1M listeners',
      image: artistPortrait('a-r-rahman'),
    },
    {
      name: 'Arijit Singh',
      listeners: '44.8M listeners',
      image: artistPortrait('arijit-singh'),
    },
    {
      name: 'Taylor Swift',
      listeners: '104.2M listeners',
      image: artistPortrait('taylor-swift'),
    },
    {
      name: 'Billie Eilish',
      listeners: '98.5M listeners',
      image: artistPortrait('billie-eilish'),
    },
    {
      name: 'Bruno Mars',
      listeners: '110.3M listeners',
      image: artistPortrait('bruno-mars'),
    },
    {
      name: 'Sabrina Carpenter',
      listeners: '86.7M listeners',
      image: artistPortrait('sabrina-carpenter'),
    },
    {
      name: 'The Weeknd',
      listeners: '118.0M listeners',
      image: artistPortrait('the-weeknd'),
    },
    {
      name: 'Diljit Dosanjh',
      listeners: '24.9M listeners',
      image: artistPortrait('diljit-dosanjh'),
    },
    {
      name: 'Karan Aujla',
      listeners: '18.2M listeners',
      image: artistPortrait('karan-aujla'),
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

  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Spotify Bento Sidebar */}
      <aside aria-label="Your library" className={`wl-sidebar hidden md:flex ${collapsed ? 'w-16' : 'w-48 lg:w-60 xl:w-64'} flex-col gap-2 select-none h-full text-spotify-subtext text-sm font-medium shrink-0`}>
        <div className="wl-workspace bg-spotify-base flex-1 flex flex-col overflow-hidden">
          {/* Header Row: Your Library + Create (+) Button */}
          <div className="p-4 pb-2 flex items-center justify-between">
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-expanded={!collapsed}
              aria-controls="library-sidebar-content"
              aria-label={collapsed ? 'Expand library' : 'Collapse library'}
              title={collapsed ? 'Expand library' : 'Collapse library'}
              className="flex items-center gap-3 text-spotify-subtext hover:text-white transition-colors group"
            >
              <Library className="w-6 h-6 group-hover:scale-105 transition-transform" />
              <span className="font-extrabold text-base tracking-tight text-spotify-subtext group-hover:text-white">
                {!collapsed && 'Your Library'}
              </span>
            </button>

            <div hidden={collapsed} className={collapsed ? 'hidden' : 'flex items-center gap-1'}>
              <button
                onClick={() => setIsCreateSheetOpen(true)}
                title="Create playlist or blend"
                className="w-8 h-8 rounded-full hover:bg-white/10 text-spotify-subtext hover:text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div id="library-sidebar-content" className={collapsed ? 'hidden' : 'contents'}>
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
                  href="/playlist?id=liked"
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
                      notify('No downloads yet. Save a track with the download button.');
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

                {filteredPlaylists.map(list => (
                <div key={list.id} className="flex items-center gap-1">
                  <div className="min-w-0 flex-1"><PlaylistRow list={{...list,description:list.description || 'Your playlist'}} /></div>
                  <button type="button" aria-label={'Delete ' + list.title} title="Delete playlist" className="wl-icon-button"
                    onClick={() => { if (window.confirm('Delete ' + list.title + ' from your library?')) deleteUserPlaylist(list.id); }}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}
              {curatedPlaylists.filter(list => list.title.toLowerCase().includes(searchFilter.toLowerCase())).map(list =>
                <PlaylistRow key={list.id} list={list}/>
              )}
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
            <span className="font-mono font-bold text-white/90">{CURRENT_APP_VERSION}</span>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('https://api.github.com/repos/MohamedNavith/Spotify-Craft/releases/latest');
                  if (res.ok) {
                    const data = await res.json();
                    if (data.tag_name && isNewerVersion(data.tag_name, CURRENT_APP_VERSION)) {
                      window.open(data.html_url, '_blank');
                    } else {
                      alert(`You are on the latest version of Wavelength (${CURRENT_APP_VERSION})!`);
                    }
                  }
                } catch {
                  alert(`You are on the latest version of Wavelength (${CURRENT_APP_VERSION})!`);
                }
              }}
              className="hover:text-spotify-green hover:underline font-semibold transition-colors"
            >
              Check for Updates
            </button>
          </div>
          </div>
        </div>
      </aside>

    </>
  );
}
