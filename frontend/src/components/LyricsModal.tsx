'use client';

import { Check, ChevronDown, ChevronUp, Clock, Mic2, RotateCcw, Sliders, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function cleanString(str: string): string {
  return str
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*/i, '')
    .replace(/ft\..*/i, '')
    .replace(/official.*/i, '')
    .trim();
}

/**
 * Enhanced LRC parser supporting:
 * - standard [mm:ss.xx] timestamps
 * - [offset:+/-ms] tag specification
 */
function parseLRC(lrcText: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  let offsetMs = 0;

  for (const raw of lrcText.split('\n')) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Check for [offset:+/-ms] tag
    const offsetMatch = trimmed.match(/\[offset:\s*([+-]?\d+)\]/i);
    if (offsetMatch) {
      offsetMs = parseInt(offsetMatch[1], 10) || 0;
      continue;
    }

    const match = trimmed.match(regex);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
      const time = mins * 60 + secs + (ms + offsetMs) / 1000;
      const text = match[4].trim();
      if (text) {
        lines.push({ time: Math.max(0, time), text });
      }
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export default function LyricsModal({ isOpen, onClose }: LyricsModalProps) {
  const { currentTrack, progress, seek, lyricsSyncOffset, setLyricsSyncOffset } = usePlayerStore();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSyncButton, setShowSyncButton] = useState(false);
  const [showOffsetControls, setShowOffsetControls] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());
  const isUserScrollingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const userScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const programmaticScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Synced & Plain Lyrics from LRCLIB with duration-aware matching
  useEffect(() => {
    if (!isOpen || !currentTrack) return;

    let active = true;
    async function loadLyrics() {
      setIsLoading(true);
      const rawTitle = currentTrack?.title || '';
      const rawArtist = currentTrack?.artistName || '';
      const cleanTitle = cleanString(rawTitle);
      const cleanArtist = cleanString(rawArtist);
      const targetDuration = currentTrack?.duration ? Math.round(currentTrack.duration) : 0;

      try {
        // Strategy 1: Exact track_name + artist_name + duration query (Most accurate)
        let exactUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(
          cleanTitle,
        )}&artist_name=${encodeURIComponent(cleanArtist)}`;
        if (targetDuration > 0) {
          exactUrl += `&duration=${targetDuration}`;
        }

        const exactRes = await fetch(exactUrl).catch(() => null);
        if (exactRes && exactRes.ok && active) {
          const item = await exactRes.json();
          if (item.syncedLyrics) {
            const parsed = parseLRC(item.syncedLyrics);
            if (parsed.length > 0) {
              setLyrics(parsed);
              setPlainLyrics(null);
              setIsLoading(false);
              return;
            }
          }
          if (item.plainLyrics) {
            setPlainLyrics(item.plainLyrics);
            setLyrics([]);
            setIsLoading(false);
            return;
          }
        }

        // Strategy 2: Search LRCLIB and prioritize candidate matching track duration
        const searchRes = await fetch(
          `https://lrclib.net/api/search?q=${encodeURIComponent(
            `${cleanTitle} ${cleanArtist}`,
          )}`,
        ).catch(() => null);

        if (searchRes && searchRes.ok && active) {
          const list = await searchRes.json();
          if (Array.isArray(list) && list.length > 0) {
            const withSynced = list.filter((item) => item.syncedLyrics);
            if (withSynced.length > 0) {
              // Sort by closest duration match to avoid picking live/extended versions
              if (targetDuration > 0) {
                withSynced.sort(
                  (a, b) =>
                    Math.abs((a.duration || 0) - targetDuration) -
                    Math.abs((b.duration || 0) - targetDuration),
                );
              }
              const best = withSynced[0];
              const parsed = parseLRC(best.syncedLyrics);
              if (parsed.length > 0) {
                setLyrics(parsed);
                setPlainLyrics(null);
                setIsLoading(false);
                return;
              }
            }
            if (list[0].plainLyrics) {
              setPlainLyrics(list[0].plainLyrics);
              setLyrics([]);
              setIsLoading(false);
              return;
            }
          }
        }

        if (active) {
          setLyrics([]);
          setPlainLyrics(null);
        }
      } catch {
        if (active) {
          setLyrics([]);
          setPlainLyrics(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadLyrics();
    return () => {
      active = false;
    };
  }, [isOpen, currentTrack?.id]);

  // Compute active lyric line with user sync calibration offset
  const effectiveProgress = progress + (lyricsSyncOffset || 0);
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (effectiveProgress >= lyrics[i].time - 0.1) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth container-level scroll into viewport center
  const scrollToLine = (index: number, smooth = true) => {
    const container = scrollContainerRef.current;
    const el = lineRefs.current.get(index);
    if (!container || !el) return;

    const containerHeight = container.clientHeight;
    const elTop = el.offsetTop;
    const elHeight = el.clientHeight;

    // Center active lyric at 38% from container top
    const targetTop = elTop - containerHeight * 0.38 + elHeight / 2;

    isProgrammaticScrollRef.current = true;
    if (programmaticScrollTimerRef.current) {
      clearTimeout(programmaticScrollTimerRef.current);
    }
    programmaticScrollTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 650);

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Auto-scroll on lyric progress
  useEffect(() => {
    if (activeIndex >= 0 && !isUserScrollingRef.current) {
      scrollToLine(activeIndex, true);
    }
  }, [activeIndex]);

  // Instant snap on modal open
  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      const timer = setTimeout(() => {
        scrollToLine(activeIndex, false);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Detect explicit user manual scroll/touch/wheel (does NOT trigger on programmatic auto-scroll)
  const handleUserGesture = () => {
    if (isProgrammaticScrollRef.current) return;
    isUserScrollingRef.current = true;
    setShowSyncButton(true);

    if (userScrollTimerRef.current) {
      clearTimeout(userScrollTimerRef.current);
    }
    // Auto-resume sync after 3.2s of inactivity
    userScrollTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      setShowSyncButton(false);
      if (activeIndex >= 0) {
        scrollToLine(activeIndex, true);
      }
    }, 3200);
  };

  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    handleUserGesture();
  };

  const handleSyncClick = () => {
    isUserScrollingRef.current = false;
    setShowSyncButton(false);
    if (activeIndex >= 0) {
      scrollToLine(activeIndex, true);
    }
  };

  const handleLineClick = (time: number, idx: number) => {
    seek(time);
    isUserScrollingRef.current = false;
    setShowSyncButton(false);
    scrollToLine(idx, true);
  };

  const [dragY, setDragY] = useState(0);
  const [isDraggingY, setIsDraggingY] = useState(false);
  const touchStartYRef = useRef<number | null>(null);

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    setDragY(0);
    setIsDraggingY(false);
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const diffY = e.touches[0].clientY - touchStartYRef.current;
    if (diffY > 0) {
      setDragY(diffY);
      setIsDraggingY(true);
    }
  };

  const handleHeaderTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) {
      setDragY(0);
      setIsDraggingY(false);
      return;
    }
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (diffY > 60) {
      onClose();
      if (typeof navigator !== 'undefined') {
        navigator.vibrate?.(12);
      }
    }
    setDragY(0);
    setIsDraggingY(false);
    touchStartYRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        transform:
          dragY > 0
            ? `translateY(${dragY}px) scale(${Math.max(0.92, 1 - dragY / 1400)})`
            : 'translateY(0px)',
        transition: isDraggingY
          ? 'none'
          : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.2s ease',
        borderRadius: dragY > 10 ? `${Math.min(32, 16 + dragY / 8)}px` : '0px',
      }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#1c382b]/95 via-[#121212]/98 to-black backdrop-blur-2xl flex flex-col p-4 md:p-10 animate-fade-in select-none shadow-2xl overflow-hidden"
    >
      {/* Top Pull Handle for mobile gestures */}
      <div
        onTouchStart={handleHeaderTouchStart}
        onTouchMove={handleHeaderTouchMove}
        onTouchEnd={handleHeaderTouchEnd}
        className="md:hidden w-full flex justify-center -mt-2 pb-2 cursor-grab active:cursor-grabbing shrink-0 z-20"
      >
        <div className="w-10 h-1 rounded-full bg-white/30" />
      </div>

      {/* Top Header */}
      <div
        onTouchStart={handleHeaderTouchStart}
        onTouchMove={handleHeaderTouchMove}
        onTouchEnd={handleHeaderTouchEnd}
        className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0 touch-none"
      >
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg overflow-hidden bg-spotify-elevated shadow-lg shrink-0">
            {currentTrack?.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-white">
                <Mic2 className="w-5 h-5 text-spotify-green" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-base md:text-xl font-black text-white tracking-tight truncate">
              {currentTrack?.title}
            </h3>
            <p className="text-xs md:text-sm text-spotify-subtext font-medium flex items-center gap-1.5 truncate">
              <span>{currentTrack?.artistName}</span>
              <span>•</span>
              <span className="text-spotify-green font-semibold">Live Karaoke Lyrics</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync Calibration Toggle Button */}
          <button
            onClick={() => setShowOffsetControls((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              showOffsetControls || lyricsSyncOffset !== 0
                ? 'bg-spotify-green text-black shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white/80'
            }`}
            title="Calibrate lyrics timing"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync:</span>
            <span>{lyricsSyncOffset > 0 ? `+${lyricsSyncOffset.toFixed(1)}s` : `${lyricsSyncOffset.toFixed(1)}s`}</span>
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sync Calibration Sub-Bar (Fine-Tune Timing for Bluetooth / DAC Latency) */}
      {showOffsetControls && (
        <div className="mt-2 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-white/90 animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-spotify-subtext">Calibrate Audio Timing:</span>
            <span className="font-mono font-bold text-spotify-green">
              {lyricsSyncOffset > 0 ? `+${lyricsSyncOffset.toFixed(1)}s` : `${lyricsSyncOffset.toFixed(1)}s`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLyricsSyncOffset(Math.round((lyricsSyncOffset - 0.2) * 10) / 10)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono font-bold text-xs"
              title="Shift lyrics earlier (-0.2s)"
            >
              -0.2s
            </button>
            <button
              onClick={() => setLyricsSyncOffset(Math.round((lyricsSyncOffset + 0.2) * 10) / 10)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono font-bold text-xs"
              title="Shift lyrics later (+0.2s)"
            >
              +0.2s
            </button>
            {lyricsSyncOffset !== 0 && (
              <button
                onClick={() => setLyricsSyncOffset(0)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-white text-xs flex items-center gap-1"
                title="Reset timing to 0.0s"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Authentic Spotify Lyrics Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchMove={handleUserGesture}
        onWheel={handleUserGesture}
        className="flex-1 overflow-y-auto custom-scrollbar py-[38vh] px-4 md:px-12 flex flex-col items-start max-w-4xl mx-auto w-full space-y-6 md:space-y-8 relative touch-manipulation"
      >
        {isLoading && (
          <div className="text-spotify-subtext text-xl italic mt-10 animate-pulse">
            Loading synchronized lyrics...
          </div>
        )}

        {!isLoading && lyrics.length === 0 && !plainLyrics && (
          <div className="flex flex-col items-start justify-center mt-10">
            <p className="text-2xl md:text-3xl font-black text-white/70">
              Lyrics aren&apos;t available for this song yet.
            </p>
            <p className="text-sm text-spotify-subtext mt-2 font-medium">
              Enjoy the full official master audio!
            </p>
          </div>
        )}

        {!isLoading && plainLyrics && (
          <div className="whitespace-pre-line text-2xl md:text-4xl text-white/80 leading-relaxed font-black tracking-tight">
            {plainLyrics}
          </div>
        )}

        {!isLoading &&
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;
            return (
              <p
                key={idx}
                ref={(el) => {
                  if (el) lineRefs.current.set(idx, el);
                  else lineRefs.current.delete(idx);
                }}
                onClick={() => handleLineClick(line.time, idx)}
                className={`cursor-pointer select-none transition-all duration-300 font-black tracking-tight leading-snug md:leading-tight ${
                  isActive
                    ? 'text-white text-3xl md:text-5xl drop-shadow-[0_4px_28px_rgba(255,255,255,0.6)] transform scale-[1.02] origin-left'
                    : isPast
                    ? 'text-white/40 hover:text-white/70 text-2xl md:text-4xl'
                    : 'text-white/25 hover:text-white/60 text-2xl md:text-4xl filter blur-[0.2px]'
                }`}
              >
                {line.text}
              </p>
            );
          })}
      </div>

      {/* Spotify-style Floating Sync Button (appears when user scrolls away from active line) */}
      {showSyncButton && activeIndex >= 0 && (
        <button
          onClick={handleSyncClick}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-black text-xs shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 animate-fade-in"
        >
          <span>Sync lyrics</span>
          <span className="text-sm leading-none font-bold">↺</span>
        </button>
      )}
    </div>
  );
}
