'use client';

import {
  Compass,
  Home,
  Play,
  Radio,
  Search,
  Settings,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { searchOfficialMusic } from '../lib/officialMusic';
import { useAuthStore } from '../stores/useAuthStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { UnifiedTrack } from '../types';

interface TopBarProps {
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export default function TopBar({
  searchQuery: externalQuery,
  onSearchChange,
}: TopBarProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { setTrack, setIsSpotifyImportOpen, setIsDiscordModalOpen } = usePlayerStore();

  const [query, setQuery] = useState(externalQuery || '');
  const [suggestions, setSuggestions] = useState<UnifiedTrack[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Sync external query if passed
  useEffect(() => {
    if (externalQuery !== undefined && externalQuery !== query) {
      setQuery(externalQuery);
    }
  }, [externalQuery]);

  // Live autocomplete search as user types
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchOfficialMusic(query.trim(), 6);
        setSuggestions(results);
        setIsDropdownOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    onSearchChange?.(val);
  };

  const handleSelectTrack = (track: UnifiedTrack) => {
    setTrack(track, suggestions);
    setIsDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-black px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 select-none border-b border-[#282828]/60 shrink-0">
      {/* Left: Official Wavelength Brand Logo + Signature Spotify Home Button */}
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-spotify-green flex items-center justify-center text-black font-black shadow-lg group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <span className="font-black text-xl tracking-tight text-white group-hover:text-spotify-green transition-colors">
            Wavelength
          </span>
        </Link>

        {/* Circular Spotify Home Pill Button */}
        <Link
          href="/"
          title="Home"
          className="w-12 h-12 rounded-full bg-[#1f1f1f] hover:bg-[#282828] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md ml-1"
        >
          <Home className="w-6 h-6 stroke-[2.2]" />
        </Link>
      </div>

      {/* Center: Authentic Spotify Search Pill with Browse Icon & Shortcut */}
      <div className="flex-1 max-w-[500px] mx-4 relative" ref={dropdownRef}>
        <div className="w-full h-12 bg-[#1f1f1f] hover:bg-[#282828] focus-within:bg-[#282828] rounded-full flex items-center px-3 border border-transparent focus-within:border-white/70 transition-all shadow-inner group">
          {/* Search Icon */}
          <button
            onClick={() => {
              if (query.trim()) {
                setIsDropdownOpen(false);
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }
            }}
            title="Search"
            className="p-1.5 text-spotify-subtext group-hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                setIsDropdownOpen(false);
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }
            }}
            placeholder="What do you want to play?"
            className="w-full bg-transparent text-white text-sm px-2 outline-none placeholder:text-spotify-subtext font-medium"
          />

          {/* Clear Button */}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                onSearchChange?.('');
                setSuggestions([]);
                setIsDropdownOpen(false);
              }}
              className="text-spotify-subtext hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Vertical Divider */}
          <div className="w-px h-6 bg-white/20 mx-1 shrink-0" />

          {/* Browse Icon Button (Spotify Browse drawer) */}
          <Link
            href="/search"
            title="Browse all categories"
            className="p-1.5 text-spotify-subtext hover:text-white transition-colors shrink-0"
          >
            <Compass className="w-5 h-5" />
          </Link>
        </div>

        {/* Live Spotify Autocomplete Dropdown */}
        {isDropdownOpen && suggestions.length > 0 && (
          <div className="absolute top-14 left-0 right-0 bg-[#282828] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 max-h-96 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-spotify-subtext px-3 py-1">
              Top Results
            </span>

            {suggestions.map((track) => (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded bg-[#181818] overflow-hidden shrink-0 shadow">
                    {track.artworkUrl ? (
                      <img
                        src={track.artworkUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white">
                        W
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-white text-xs font-bold truncate group-hover:text-spotify-green transition-colors">
                      {track.title}
                    </span>
                    <span className="text-spotify-subtext text-[11px] truncate">
                      {track.artistName}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTrack(track);
                  }}
                  className="w-8 h-8 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center opacity-0 group-hover:opacity-100 shadow transition-all hover:scale-105 shrink-0"
                >
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </button>
              </div>
            ))}

            <div
              onClick={() => {
                setIsDropdownOpen(false);
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="p-2 text-center text-xs text-spotify-green hover:underline cursor-pointer font-bold border-t border-white/5 mt-1"
            >
              View all results for &ldquo;{query}&rdquo; →
            </div>
          </div>
        )}
      </div>

      {/* Right: Quick Action Pills & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sync Spotify Pill */}
        <button
          onClick={() => setIsSpotifyImportOpen(true)}
          title="Sync & Import Spotify Playlists"
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-spotify-green" />
          <span>Sync Spotify</span>
        </button>

        {/* Discord Bot Pill */}
        <button
          onClick={() => setIsDiscordModalOpen(true)}
          title="Connect Wavelength Discord Bot"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5865F2]/20 hover:bg-[#5865F2] text-[#5865F2] hover:text-white border border-[#5865F2]/40 font-bold text-xs transition-all hover:scale-105 active:scale-95"
        >
          <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <span>Discord Bot</span>
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          title="Settings"
          className="w-9 h-9 rounded-full hover:bg-white/10 text-spotify-subtext hover:text-white flex items-center justify-center transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* User Profile Avatar */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div
              title={user.displayName}
              className="w-9 h-9 rounded-full bg-[#282828] hover:scale-105 border-2 border-black flex items-center justify-center cursor-pointer transition-transform shadow-md"
            >
              <User className="w-4 h-4 text-white" />
            </div>
            <button
              onClick={() => logout()}
              className="hidden lg:inline text-xs text-spotify-subtext hover:text-white transition-colors ml-1"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="hidden sm:inline text-spotify-subtext hover:text-white text-xs font-bold transition-colors"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-xs transition-transform active:scale-95"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
