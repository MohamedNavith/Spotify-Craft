'use client';

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/useAuthStore';

interface TopBarProps {
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export default function TopBar({
  showSearch = false,
  searchQuery = '',
  onSearchChange,
}: TopBarProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="h-16 bg-spotify-base/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left Navigation controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            title="Go back"
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.forward()}
            title="Go forward"
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search bar */}
        {showSearch && (
          <div className="relative w-80">
            <Search className="w-5 h-5 text-spotify-subtext absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="What do you want to play?"
              className="w-full bg-spotify-elevated hover:bg-spotify-hover focus:bg-spotify-hover text-white text-sm pl-10 pr-4 py-3 rounded-full outline-none border border-transparent focus:border-white transition-all placeholder:text-spotify-subtext"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => alert('Wavelength is ready for Mobile APK & Windows PC Desktop!')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black text-white text-xs font-bold transition-all hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span>Install App</span>
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/60 rounded-full p-1 pr-3 hover:bg-black transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-spotify-elevated flex items-center justify-center text-white">
                <User className="w-4 h-4" />
              </div>
              <span className="text-white text-xs font-bold truncate max-w-[120px]">
                {user.displayName}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="text-xs text-spotify-subtext hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/register"
              className="text-spotify-subtext hover:text-white text-sm font-bold transition-colors"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 rounded-full bg-white text-black text-sm font-bold hover:scale-105 active:scale-100 transition-transform"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
