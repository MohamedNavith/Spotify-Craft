'use client';

import {
  ArrowDownToLine,
  Clock,
  Compass,
  Download,
  FolderPlus,
  Heart,
  Home,
  Library,
  ListPlus,
  Music,
  Plus,
  Radio,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOfflineTracks } from '../lib/offlineStorage';
import { deleteUserPlaylist, getUserPlaylists, UserPlaylist } from '../lib/userPlaylists';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { setTrack, setIsSpotifyImportOpen } = usePlayerStore();
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);

  useEffect(() => {
    setUserPlaylists(getUserPlaylists());
    const handleUpdate = () => setUserPlaylists(getUserPlaylists());
    window.addEventListener('wavelength_playlists_updated', handleUpdate);
    return () => window.removeEventListener('wavelength_playlists_updated', handleUpdate);
  }, []);

  return (
    <>
      <aside className="hidden md:flex w-64 flex-col gap-2 p-2 select-none h-full text-spotify-subtext text-sm font-medium shrink-0">
      {/* Top Nav Block */}
      <div className="bg-spotify-card rounded-lg p-4 flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center text-black">
            <Radio className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="tracking-tight text-white font-black text-xl">Wavelength</span>
        </Link>

        <nav className="flex flex-col gap-1">
          <Link
            href="/"
            className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
              pathname === '/'
                ? 'text-white bg-spotify-hover font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Home className="w-6 h-6" />
            <span>Home</span>
          </Link>
          <Link
            href="/search"
            className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
              pathname === '/search'
                ? 'text-white bg-spotify-hover font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Search className="w-6 h-6" />
            <span>Search</span>
          </Link>
          <button
            onClick={() => setIsSpotifyImportOpen(true)}
            className="flex items-center gap-4 px-3 py-2 rounded-md transition-colors hover:text-white text-spotify-green font-semibold text-left"
          >
            <Sparkles className="w-6 h-6 text-spotify-green" />
            <span className="flex items-center gap-1.5">
              <span>Sync Spotify</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-spotify-green text-black">
                Pro
              </span>
            </span>
          </button>
          <Link
            href="/wrapped"
            className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
              pathname === '/wrapped'
                ? 'text-white bg-spotify-hover font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Compass className="w-6 h-6" />
            <span>Wrapped</span>
          </Link>
          <Link
            href="/podcasts"
            className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
              pathname === '/podcasts'
                ? 'text-white bg-spotify-hover font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Radio className="w-6 h-6" />
            <span>Podcasts</span>
          </Link>
          <Link
            href="/jam"
            className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
              pathname === '/jam'
                ? 'text-white bg-spotify-hover font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Users className="w-6 h-6" />
            <span>Jam Session</span>
          </Link>
          <Link
            href="/history"
            className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
              pathname === '/history'
                ? 'text-white bg-spotify-hover font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Clock className="w-6 h-6" />
            <span>Recently Played</span>
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
              pathname === '/settings'
                ? 'text-white bg-spotify-hover font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Settings className="w-6 h-6" />
            <span>Settings</span>
          </Link>
          <Link
            href="/upload"
            className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
              pathname === '/upload'
                ? 'text-white bg-spotify-hover font-semibold'
                : 'hover:text-white'
            }`}
          >
            <UploadCloud className="w-6 h-6" />
            <span>Upload Audio</span>
          </Link>
        </nav>
      </div>

      {/* Your Library Block */}
      <div className="bg-spotify-card rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="p-4 pb-2 flex items-center justify-between">
          <button className="flex items-center gap-3 text-spotify-subtext hover:text-white transition-colors">
            <Library className="w-6 h-6" />
            <span className="font-bold text-base">Your Library</span>
          </button>
          <button
            onClick={() => setIsSpotifyImportOpen(true)}
            title="Import or Sync Spotify Playlist"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Import</span>
          </button>
        </div>

        {/* Scrollable Library List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1 custom-scrollbar">
          {/* Liked Songs Entry */}
          <Link
            href="/search"
            className="flex items-center gap-3 p-2 rounded-md hover:bg-spotify-hover transition-colors group"
          >
            <div className="w-12 h-12 rounded bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-medium truncate group-hover:text-spotify-green transition-colors">
                Liked Songs
              </span>
              <span className="text-xs text-spotify-subtext">Playlist • Auto</span>
            </div>
          </Link>

          {/* Offline Downloaded Songs */}
          <div
            onClick={async () => {
              const offTracks = await getOfflineTracks();
              if (offTracks.length > 0) {
                setTrack(offTracks[0], offTracks);
              } else {
                alert('No tracks saved offline yet. Click the download icon on any track to save it to your device storage!');
              }
            }}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-spotify-hover transition-colors group cursor-pointer"
          >
            <div className="w-12 h-12 rounded bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shrink-0 shadow-md">
              <ArrowDownToLine className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-medium truncate group-hover:text-spotify-green transition-colors">
                Downloaded Songs
              </span>
              <span className="text-xs text-spotify-subtext">Offline Storage • In-App</span>
            </div>
          </div>

          {/* User Imported / Synced Spotify Playlists */}
          {userPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => {
                if (playlist.tracks.length > 0) {
                  setTrack(playlist.tracks[0], playlist.tracks);
                }
              }}
              className="flex items-center justify-between p-2 rounded-md hover:bg-spotify-hover transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded bg-gradient-to-br from-spotify-green to-emerald-950 overflow-hidden flex items-center justify-center text-black shrink-0 font-bold shadow">
                  {playlist.coverArt ? (
                    <img src={playlist.coverArt} alt={playlist.title} className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-6 h-6 stroke-[2.5]" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-medium truncate group-hover:text-spotify-green transition-colors">
                    {playlist.title}
                  </span>
                  <span className="text-xs text-spotify-subtext truncate">
                    Playlist • {playlist.tracks.length} songs
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteUserPlaylist(playlist.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-white text-spotify-subtext transition-opacity text-xs"
                title="Remove from Library"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Spotify Synced Presets */}
          {[
            { title: "Today's Top Hits", author: 'Spotify Curated', coverBg: 'bg-emerald-900' },
            { title: 'Global Top 50', author: 'Daily Chart', coverBg: 'bg-cyan-900' },
            { title: 'Hot Hits India', author: 'Bollywood & Desi', coverBg: 'bg-amber-900' },
            { title: 'Chill Waves & Lo-Fi', author: 'Lofi Records', coverBg: 'bg-violet-900' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => setIsSpotifyImportOpen(true)}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-spotify-hover transition-colors cursor-pointer group"
            >
              <div
                className={`w-12 h-12 rounded ${item.coverBg} flex items-center justify-center text-white/70 shrink-0 font-bold text-base shadow`}
              >
                <Music className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-medium truncate group-hover:text-spotify-green transition-colors">
                  {item.title}
                </span>
                <span className="text-xs text-spotify-subtext truncate">
                  Playlist • {item.author}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: App Version & Check for Updates */}
        <div className="p-3 border-t border-spotify-border bg-black/20 flex items-center justify-between text-[11px] text-spotify-subtext">
          <span className="font-mono">v1.2.0</span>
          <button
            onClick={async () => {
              try {
                const res = await fetch('https://api.github.com/repos/MohamedNavith/Spotify-Craft/releases/latest');
                if (res.ok) {
                  const data = await res.json();
                  if (data.tag_name && data.tag_name !== 'v1.2.0') {
                    window.open(data.html_url, '_blank');
                  } else {
                    alert('You are on the latest version of Wavelength (v1.2.0)!');
                  }
                }
              } catch {
                alert('You are on the latest version of Wavelength (v1.2.0)!');
              }
            }}
            className="hover:text-spotify-green hover:underline font-semibold transition-colors"
          >
            Check for Updates
          </button>
        </div>
      </div>
    </aside>

    {/* Authentic Spotify Mobile Bottom Navigation Bar (Smartphones & Android APK) */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black/95 to-black/90 backdrop-blur-lg border-t border-spotify-border flex items-center justify-around py-2 px-3 text-spotify-subtext safe-area-pb">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 py-1 transition-colors ${
          pathname === '/' ? 'text-white font-bold' : 'hover:text-white'
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
      <button
        onClick={() => setIsSpotifyImportOpen(true)}
        className="flex flex-col items-center gap-1 py-1 transition-colors hover:text-white text-spotify-green"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-[10px] tracking-tight font-bold">Sync</span>
      </button>
      <button
        onClick={async () => {
          const offTracks = await getOfflineTracks();
          if (offTracks.length > 0) setTrack(offTracks[0], offTracks);
          else alert('No tracks saved offline yet. Click the download icon on any song!');
        }}
        className="flex flex-col items-center gap-1 py-1 transition-colors hover:text-white"
      >
        <ArrowDownToLine className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Offline</span>
      </button>
    </nav>
    </>
  );
}
