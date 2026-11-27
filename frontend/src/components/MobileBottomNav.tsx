'use client';

import { Compass, Home, Library, Orbit, Search, Settings, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { setIsVerciOpen } = usePlayerStore();

  const triggerHaptic = (ms = 10) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(ms);
    }
  };

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Library', href: '/library', icon: Library },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const currentPath = pathname ? pathname.replace(/\/+$/, '') || '/' : '/';

  return (
    <nav aria-label="Primary" className="wl-glass md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 select-none pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-2 px-3 flex items-center justify-around shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_-8px_24px_rgba(0,0,0,0.8)]">
      {navItems.map((item) => {
        const isActive = currentPath === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => triggerHaptic(10)}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg transition-all active:scale-95 touch-manipulation ${
              isActive ? 'text-spotify-text font-bold' : 'text-spotify-subtext hover:text-white font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-spotify-green stroke-[2.4]' : 'stroke-[2]'}`} />
            <span className={`text-[10px] tracking-tight ${isActive ? 'text-spotify-text' : 'text-spotify-subtext'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Special Dedicated Mode: Verci & Lumn button on Mobile Nav */}
      <button
        onClick={() => {
          triggerHaptic(12);
          setIsVerciOpen(true);
        }}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg transition-all active:scale-95 text-spotify-subtext hover:text-white touch-manipulation"
        title="Open Verci & Lumn Cosmic Mode"
      >
        <div className="relative">
          <Orbit className="w-5 h-5 text-amber-400 stroke-[2.2] animate-spin-slow" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-spotify-green rounded-full shadow-[0_0_8px_#1DB954]" />
        </div>
        <span className="text-[10px] tracking-tight text-white/80 font-bold">
          Verci
        </span>
      </button>
    </nav>
  );
}
