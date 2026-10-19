'use client';

import {
  Compass,
  Heart,
  Home,
  Library,
  Music,
  Plus,
  Radio,
  Search,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex flex-col gap-2 p-2 select-none h-full text-spotify-subtext text-sm font-medium">
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
          <Link
            href="/wrapped"
            className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
              pathname === '/wrapped'
                ? 'text-white bg-spotify-hover font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Sparkles className="w-6 h-6 text-spotify-green" />
            <span className="flex items-center gap-1.5">
              <span>Wrapped</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-spotify-green text-black">
                New
              </span>
            </span>
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
            title="Create playlist"
            className="p-1 rounded-full hover:bg-spotify-hover text-spotify-subtext hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Library Filter Pills */}
        <div className="px-4 py-2 flex gap-2">
          <button className="px-3 py-1 bg-spotify-elevated hover:bg-spotify-hover text-white text-xs font-semibold rounded-full transition-colors">
            Playlists
          </button>
          <button className="px-3 py-1 bg-spotify-elevated hover:bg-spotify-hover text-white text-xs font-semibold rounded-full transition-colors">
            Artists
          </button>
        </div>

        {/* Scrollable Library List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1 custom-scrollbar">
          {/* Liked Songs Entry */}
          <Link
            href="/collection/tracks"
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

          {/* Sample Spotify-style Playlists */}
          {[
            { title: 'Discover Weekly', author: 'Wavelength AI', coverBg: 'bg-emerald-900' },
            { title: 'Daily Mix 1', author: 'Synthwave & Electronic', coverBg: 'bg-cyan-900' },
            { title: 'Chill Waves & Lo-Fi', author: 'Curated by Jamendo', coverBg: 'bg-amber-900' },
            { title: 'Ambient Focus & Study', author: 'Wavelength', coverBg: 'bg-violet-900' },
            { title: 'Indie Discoveries', author: 'Wavelength Community', coverBg: 'bg-rose-900' },
          ].map((item, idx) => (
            <div
              key={idx}
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
      </div>
    </aside>
  );
}
