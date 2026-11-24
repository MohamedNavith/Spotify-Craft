'use client';

import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function BackButtonManager() {
  const router = useRouter();
  const pathname = usePathname();
  const lastPressRef = useRef(0);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isExpandedNowPlaying,
    setIsExpandedNowPlaying,
    isQualityModalOpen,
    setIsQualityModalOpen,
    isLyricsOpen,
    setIsLyricsOpen,
    isQueueOpen,
    setIsQueueOpen,
    isEqualizerOpen,
    setIsEqualizerOpen,
    isSleepTimerModalOpen,
    closeSleepTimerModal,
    isShareModalOpen,
    closeShareModal,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isDiscordModalOpen,
    setIsDiscordModalOpen,
    isVerciOpen,
    setIsVerciOpen,
    isNowPlayingViewOpen,
    setIsNowPlayingViewOpen,
    isSpotifyImportOpen,
    setIsSpotifyImportOpen,
    pushTabHistory,
  } = usePlayerStore();

  // Track page transitions for Android back button tab history
  useEffect(() => {
    if (pathname) {
      pushTabHistory(pathname);
    }
  }, [pathname, pushTabHistory]);

  const handleBackNavigation = () => {
    // Priority 1: Dismiss full-screen player or top-level modals
    if (isExpandedNowPlaying) {
      setIsExpandedNowPlaying(false);
      return;
    }
    if (isLyricsOpen) {
      setIsLyricsOpen(false);
      return;
    }
    if (isQualityModalOpen) {
      setIsQualityModalOpen(false);
      return;
    }
    if (isQueueOpen) {
      setIsQueueOpen(false);
      return;
    }
    if (isEqualizerOpen) {
      setIsEqualizerOpen(false);
      return;
    }
    if (isSleepTimerModalOpen) {
      closeSleepTimerModal();
      return;
    }
    if (isShareModalOpen) {
      closeShareModal();
      return;
    }
    if (isCreateSheetOpen) {
      setIsCreateSheetOpen(false);
      return;
    }
    if (isDiscordModalOpen) {
      setIsDiscordModalOpen(false);
      return;
    }
    if (isVerciOpen) {
      setIsVerciOpen(false);
      return;
    }
    if (isNowPlayingViewOpen) {
      setIsNowPlayingViewOpen(false);
      return;
    }
    if (isSpotifyImportOpen) {
      setIsSpotifyImportOpen(false);
      return;
    }

    // Priority 2: Navigate back to the previous tab or page viewed
    const tabHistory = usePlayerStore.getState().tabHistory;
    if (tabHistory && tabHistory.length > 1) {
      const prevPath = usePlayerStore.getState().popTabHistory();
      if (prevPath && prevPath !== pathname) {
        router.push(prevPath);
        return;
      }
    }

    const isRootHome =
      !pathname ||
      pathname === '/' ||
      pathname === '/Spotify-Craft' ||
      pathname === '/Spotify-Craft/';

    if (!isRootHome) {
      // Go back to the root home tab if no previous history
      router.push('/');
      return;
    }

    // Priority 3: On Root Home: Require double-press within 2 seconds to exit app
    const now = Date.now();
    if (now - lastPressRef.current <= 2000) {
      // Second press within 2s -> exit native Android app safely
      try {
        App.exitApp();
      } catch {
        // In browser or webview fallback
      }
    } else {
      // First press: record timestamp and show floating Spotify pill toast
      lastPressRef.current = now;

      // Remove any existing toast
      const existing = document.getElementById('wavelength-exit-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'wavelength-exit-toast';
      toast.className =
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-[#282828] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-white/10 select-none animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none flex items-center gap-2';
      toast.innerHTML =
        '<span class="w-2 h-2 rounded-full bg-spotify-green animate-pulse"></span><span>Press back again to exit</span>';
      document.body.appendChild(toast);

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out');
        setTimeout(() => toast.remove(), 200);
      }, 1900);
    }
  };

  useEffect(() => {
    // 1. Native Capacitor Android Back Button Listener (captures hardware key & edge swipe)
    let backListenerHandle: any = null;
    try {
      App.addListener('backButton', () => {
        handleBackNavigation();
      }).then((handle) => {
        backListenerHandle = handle;
      });
    } catch {
      // Browser fallback
    }

    // 2. Standard document 'backbutton' event (Cordova / Webview legacy fallback)
    const onBackButton = (e: Event) => {
      e.preventDefault();
      handleBackNavigation();
    };
    document.addEventListener('backbutton', onBackButton);

    // 3. Desktop Escape key
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackNavigation();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove?.();
      }
      document.removeEventListener('backbutton', onBackButton);
      window.removeEventListener('keydown', onKeyDown);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [
    pathname,
    isExpandedNowPlaying,
    isQualityModalOpen,
    isLyricsOpen,
    isQueueOpen,
    isEqualizerOpen,
    isSleepTimerModalOpen,
    isShareModalOpen,
    isCreateSheetOpen,
    isDiscordModalOpen,
    isVerciOpen,
    isNowPlayingViewOpen,
    isSpotifyImportOpen,
    router,
  ]);

  return null;
}
