'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function BackButtonManager() {
  const router = useRouter();
  const pathname = usePathname();
  const lastPressRef = useRef(0);

  const {
    isExpandedNowPlaying,
    setIsExpandedNowPlaying,
    isShareModalOpen,
    closeShareModal,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
  } = usePlayerStore();

  useEffect(() => {
    const handleBack = (e?: Event) => {
      // 1. If full screen player is open, close it
      if (isExpandedNowPlaying) {
        e?.preventDefault();
        setIsExpandedNowPlaying(false);
        return;
      }

      // 2. If share modal is open, close it
      if (isShareModalOpen) {
        e?.preventDefault();
        closeShareModal();
        return;
      }

      // 3. If create (+) modal is open, close it
      if (isCreateSheetOpen) {
        e?.preventDefault();
        setIsCreateSheetOpen(false);
        return;
      }

      // 4. If on a subpage (Search, Library, Album, Settings, etc.), navigate back to Home
      if (pathname && pathname !== '/' && pathname !== '/Spotify-Craft/') {
        e?.preventDefault();
        router.push('/');
        return;
      }

      // 5. If already on Home, require double-press within 2 seconds to exit app
      const now = Date.now();
      if (now - lastPressRef.current > 2000) {
        lastPressRef.current = now;
        e?.preventDefault();
        // Show subtle notification toast
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-white/10 animate-in fade-in';
        toast.innerText = 'Press back again to exit';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1800);
      }
    };

    // Standard Android Capacitor 'backbutton' event
    document.addEventListener('backbutton', handleBack);

    // Browser history popstate
    window.addEventListener('popstate', handleBack);

    // Keyboard 'Escape' key on PC desktop
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('backbutton', handleBack);
      window.removeEventListener('popstate', handleBack);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isExpandedNowPlaying,
    setIsExpandedNowPlaying,
    isShareModalOpen,
    closeShareModal,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    pathname,
    router,
  ]);

  return null;
}
