'use client';

import { App } from '@capacitor/app';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { normalizeAppRoute, usePlayerStore } from '../stores/usePlayerStore';

type OverlayKey =
  | 'profileModal'
  | 'createSheet'
  | 'discordModal'
  | 'spotifyImport'
  | 'shareModal'
  | 'sleepTimer'
  | 'qualityModal'
  | 'equalizer'
  | 'lyrics'
  | 'verci'
  | 'queue'
  | 'expandedNowPlaying'
  | 'nowPlayingView';

const OVERLAY_PRIORITY: OverlayKey[] = [
  'profileModal',
  'createSheet',
  'discordModal',
  'spotifyImport',
  'shareModal',
  'sleepTimer',
  'qualityModal',
  'equalizer',
  'lyrics',
  'verci',
  'queue',
  'expandedNowPlaying',
  'nowPlayingView',
];

function getOpenOverlaySnapshot(): Record<OverlayKey, boolean> {
  const player = usePlayerStore.getState();
  const auth = useAuthStore.getState();
  return {
    profileModal: auth.isProfileModalOpen,
    createSheet: player.isCreateSheetOpen,
    discordModal: player.isDiscordModalOpen,
    spotifyImport: player.isSpotifyImportOpen,
    shareModal: player.isShareModalOpen,
    sleepTimer: player.isSleepTimerModalOpen,
    qualityModal: player.isQualityModalOpen,
    equalizer: player.isEqualizerOpen,
    lyrics: player.isLyricsOpen,
    verci: player.isVerciOpen,
    queue: player.isQueueOpen,
    expandedNowPlaying: player.isExpandedNowPlaying,
    nowPlayingView: player.isNowPlayingViewOpen,
  };
}

function closeOverlayByKey(key: OverlayKey): void {
  const player = usePlayerStore.getState();
  const auth = useAuthStore.getState();
  switch (key) {
    case 'profileModal':
      auth.setIsProfileModalOpen(false);
      break;
    case 'createSheet':
      player.setIsCreateSheetOpen(false);
      break;
    case 'discordModal':
      player.setIsDiscordModalOpen(false);
      break;
    case 'spotifyImport':
      player.setIsSpotifyImportOpen(false);
      break;
    case 'shareModal':
      player.closeShareModal();
      break;
    case 'sleepTimer':
      player.closeSleepTimerModal();
      break;
    case 'qualityModal':
      player.setIsQualityModalOpen(false);
      break;
    case 'equalizer':
      player.setIsEqualizerOpen(false);
      break;
    case 'lyrics':
      player.setIsLyricsOpen(false);
      break;
    case 'verci':
      player.setIsVerciOpen(false);
      break;
    case 'queue':
      player.setIsQueueOpen(false);
      break;
    case 'expandedNowPlaying':
      player.setIsExpandedNowPlaying(false);
      break;
    case 'nowPlayingView':
      player.setIsNowPlayingViewOpen(false);
      break;
  }
}

function RouteTracker({
  pendingBackRef,
  onRouteChange,
}: {
  pendingBackRef: React.MutableRefObject<{ target: string | null; expiresAt: number }>;
  onRouteChange: (route: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pushTabHistory = usePlayerStore((s) => s.pushTabHistory);

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString() || '';
    const fullRoute = normalizeAppRoute(pathname, query ? `?${query}` : '');
    onRouteChange(fullRoute);

    const pending = pendingBackRef.current;
    if (pending.target && Date.now() < pending.expiresAt) {
      if (fullRoute === pending.target) {
        pending.target = null;
      } else {
        // Skip intermediate routes while catching up to a rapid LIFO pop target
        return;
      }
    } else {
      pending.target = null;
    }

    pushTabHistory(fullRoute);
  }, [pathname, searchParams, pushTabHistory, pendingBackRef, onRouteChange]);

  return null;
}

export default function BackButtonManager() {
  const router = useRouter();
  const lastPressRef = useRef(0);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRouteRef = useRef<string>('/');
  const pendingBackRef = useRef<{ target: string | null; expiresAt: number }>({
    target: null,
    expiresAt: 0,
  });
  const overlayStackRef = useRef<OverlayKey[]>([]);
  const prevOverlaySnapshotRef = useRef<Record<OverlayKey, boolean>>(getOpenOverlaySnapshot());

  // Maintain strict LIFO order of open modals & overlays
  useEffect(() => {
    const syncOverlayStack = () => {
      const next = getOpenOverlaySnapshot();
      const prev = prevOverlaySnapshotRef.current;
      let stack = overlayStackRef.current.filter((key) => next[key]);

      for (const key of OVERLAY_PRIORITY) {
        if (next[key] && !prev[key]) {
          stack = stack.filter((k) => k !== key);
          stack.push(key);
        }
      }

      overlayStackRef.current = stack;
      prevOverlaySnapshotRef.current = next;
    };

    syncOverlayStack();
    const unsubPlayer = usePlayerStore.subscribe(syncOverlayStack);
    const unsubAuth = useAuthStore.subscribe(syncOverlayStack);
    return () => {
      unsubPlayer();
      unsubAuth();
    };
  }, []);

  const handleBackNavigationRef = useRef<() => void>(() => {});

  const handleBackNavigation = () => {
    const state = usePlayerStore.getState();
    const snapshot = getOpenOverlaySnapshot();

    // Priority 1 (LIFO Overlays): Pop the most recently opened modal/sheet first
    while (overlayStackRef.current.length > 0) {
      const topOverlay = overlayStackRef.current.pop()!;
      if (snapshot[topOverlay]) {
        closeOverlayByKey(topOverlay);
        return;
      }
    }

    for (const key of OVERLAY_PRIORITY) {
      if (snapshot[key]) {
        closeOverlayByKey(key);
        return;
      }
    }

    // Priority 2 (LIFO Tab/Route Stack): Navigate back to the last visited route
    const activePending =
      pendingBackRef.current.target && Date.now() < pendingBackRef.current.expiresAt
        ? pendingBackRef.current.target
        : undefined;
    const browserRoute =
      typeof window !== 'undefined'
        ? normalizeAppRoute(window.location.pathname, window.location.search)
        : currentRouteRef.current;
    const effectiveCurrent = activePending || currentRouteRef.current || browserRoute;

    const prevTab = state.popTabHistory(effectiveCurrent);
    if (prevTab) {
      pendingBackRef.current = { target: prevTab, expiresAt: Date.now() + 600 };
      currentRouteRef.current = prevTab;
      router.push(prevTab);
      return;
    }

    // If deep-linked onto a non-Home route with no prior stack entries, fall back to Home
    if (effectiveCurrent !== '/') {
      pendingBackRef.current = { target: '/', expiresAt: Date.now() + 600 };
      currentRouteRef.current = '/';
      router.push('/');
      return;
    }

    // Priority 3: On Root Home at bottom of LIFO stack -> Require double-press within 2s to exit
    const now = Date.now();
    if (now - lastPressRef.current <= 2000) {
      try {
        App.exitApp();
      } catch {
        // Browser or desktop webview fallback
      }
    } else {
      lastPressRef.current = now;
      if (typeof navigator !== 'undefined') {
        navigator.vibrate?.(15);
      }

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
    // 1. Native Capacitor Android Back Button Listener (hardware back + Android system edge gesture)
    let backListenerHandle: { remove?: () => void } | null = null;
    try {
      App.addListener('backButton', () => {
        handleBackNavigationRef.current?.();
      }).then((handle) => {
        backListenerHandle = handle;
      });
    } catch {
      // Browser fallback
    }

    // 2. Standard document 'backbutton' event (Cordova / Webview legacy fallback)
    const onBackButton = (e: Event) => {
      e.preventDefault();
      handleBackNavigationRef.current?.();
    };
    document.addEventListener('backbutton', onBackButton);

    // 3. Browser history popstate sync so native browser back preserves the LIFO stack
    const onPopState = () => {
      const dest = normalizeAppRoute(window.location.pathname, window.location.search);
      currentRouteRef.current = dest;
      usePlayerStore.getState().syncTabHistoryOnPop(dest);
    };
    window.addEventListener('popstate', onPopState);

    // 4. Desktop Escape key
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackNavigationRef.current?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // 5. In-App Fluid Edge Swipe Gesture Listener (Left-edge swipe & Right-edge swipe)
    let touchStartX = 0;
    let touchStartY = 0;
    let isEdgeSwipe = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input[type="range"], [data-no-edge-swipe]')) {
        isEdgeSwipe = false;
        return;
      }

      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const screenWidth = window.innerWidth;

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

      const isLeftEdgeSwipe =
        touchStartX <= 35 && diffX > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.4;
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
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Suspense fallback={null}>
      <RouteTracker
        pendingBackRef={pendingBackRef}
        onRouteChange={(route) => {
          currentRouteRef.current = route;
        }}
      />
    </Suspense>
  );
}
