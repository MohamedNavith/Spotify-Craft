'use client';

import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

function normalizePath(rawPath: string | null | undefined): string {
  if (!rawPath) return '/';
  let p = rawPath.trim();
  if (p.startsWith('/Spotify-Craft')) {
    p = p.replace('/Spotify-Craft', '');
  }
  p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export default function BackButtonManager() {
  const router = useRouter();
  const pathname = usePathname();
  const lastPressRef = useRef(0);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { pushTabHistory } = usePlayerStore();

  // Track page transitions for Android back button tab history
  useEffect(() => {
    if (pathname) {
      pushTabHistory(pathname);
    }
  }, [pathname, pushTabHistory]);

  const handleBackNavigationRef = useRef<() => void>(() => {});

  const handleBackNavigation = () => {
    const state = usePlayerStore.getState();

    // Priority 1: Dismiss full-screen player or top-level modals
    if (state.isExpandedNowPlaying) {
      state.setIsExpandedNowPlaying(false);
      return;
    }
    if (state.isLyricsOpen) {
      state.setIsLyricsOpen(false);
      return;
    }
    if (state.isQualityModalOpen) {
      state.setIsQualityModalOpen(false);
      return;
    }
    if (state.isQueueOpen) {
      state.setIsQueueOpen(false);
      return;
    }
    if (state.isEqualizerOpen) {
      state.setIsEqualizerOpen(false);
      return;
    }
    if (state.isSleepTimerModalOpen) {
      state.closeSleepTimerModal();
      return;
    }
    if (state.isShareModalOpen) {
      state.closeShareModal();
      return;
    }
    if (state.isCreateSheetOpen) {
      state.setIsCreateSheetOpen(false);
      return;
    }
    if (state.isDiscordModalOpen) {
      state.setIsDiscordModalOpen(false);
      return;
    }
    if (state.isVerciOpen) {
      state.setIsVerciOpen(false);
      return;
    }
    if (state.isNowPlayingViewOpen) {
      state.setIsNowPlayingViewOpen(false);
      return;
    }
    if (state.isSpotifyImportOpen) {
      state.setIsSpotifyImportOpen(false);
      return;
    }

    // Priority 2: Navigate back to the previous tab or page viewed
    const prevTab = state.popTabHistory();
    if (prevTab) {
      router.push(prevTab);
      return;
    }

    // If no previous tab exists in history but not on root home, go to Home
    const currentPath = normalizePath(
      pathname || (typeof window !== 'undefined' ? window.location.pathname : '/')
    );
    if (currentPath !== '/') {
      router.push('/');
      return;
    }

    // Priority 3: On Root Home with no prior history: Require double-press within 2 seconds to exit app
    const now = Date.now();
    if (now - lastPressRef.current <= 2000) {
      try {
        App.exitApp();
      } catch {
        // In browser or webview fallback
      }
    } else {
      lastPressRef.current = now;
      if (typeof navigator !== 'undefined') {
        navigator.vibrate?.(15);
      }

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

  handleBackNavigationRef.current = handleBackNavigation;

  useEffect(() => {
    // 1. Native Capacitor Android Back Button Listener (captures hardware key & Android system gesture)
    let backListenerHandle: any = null;
    try {
      App.addListener('backButton', () => {
        handleBackNavigationRef.current?.();
      }).then((handle) => {
        backListenerHandle = handle;
      });
    } catch {
      // Browser fallback
    }

    // 2. Standard document 'backbutton' event (Cordova / Webview fallback)
    const onBackButton = (e: Event) => {
      e.preventDefault();
      handleBackNavigationRef.current?.();
    };
    document.addEventListener('backbutton', onBackButton);

    // 3. Desktop Escape key
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackNavigationRef.current?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // 4. In-App Fluid Edge Swipe Gesture Listener (Left-edge swipe & Right-edge swipe)
    let touchStartX = 0;
    let touchStartY = 0;
    let isEdgeSwipe = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const screenWidth = window.innerWidth;

      // Edge swipe starts within 35px of left edge or 35px of right edge
      if (x <= 35 || x >= screenWidth - 35) {
        touchStartX = x;
        touchStartY = y;
        isEdgeSwipe = true;
      } else {
        isEdgeSwipe = false;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipe || e.changedTouches.length !== 1) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - touchStartX;
      const diffY = endY - touchStartY;
      const screenWidth = window.innerWidth;

      // Left-to-right edge swipe (swipe from left edge inwards)
      const isLeftEdgeSwipe =
        touchStartX <= 35 && diffX > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.4;
      // Right-to-left edge swipe (swipe from right edge inwards)
      const isRightEdgeSwipe =
        touchStartX >= screenWidth - 35 &&
        diffX < -60 &&
        Math.abs(diffX) > Math.abs(diffY) * 1.4;

      if (isLeftEdgeSwipe || isRightEdgeSwipe) {
        if (typeof navigator !== 'undefined') {
          navigator.vibrate?.(12);
        }
        handleBackNavigationRef.current?.();
      }
      isEdgeSwipe = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove?.();
      }
      document.removeEventListener('backbutton', onBackButton);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return null;
}
