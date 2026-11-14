'use client';

import { Mic2, X } from 'lucide-react';
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

function parseLRC(lrcText: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  for (const raw of lrcText.split('\n')) {
    const match = raw.match(regex);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
      const time = mins * 60 + secs + ms / 1000;
      const text = match[4].trim();
      if (text) {
        lines.push({ time, text });
      }
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export default function LyricsModal({ isOpen, onClose }: LyricsModalProps) {
  const { currentTrack, progress, seek } = usePlayerStore();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSyncButton, setShowSyncButton] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());
  const isUserScrollingRef = useRef(false);
  const userScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Synced & Plain Lyrics from LRCLIB
  useEffect(() => {
    if (!isOpen || !currentTrack) return;

    let active = true;
    async function loadLyrics() {
      setIsLoading(true);
      const rawTitle = currentTrack?.title || '';
      const rawArtist = currentTrack?.artistName || '';
      const cleanTitle = cleanString(rawTitle);
      const cleanArtist = cleanString(rawArtist);

      try {
        // Strategy 1: Search LRCLIB
        const searchRes = await fetch(
          `https://lrclib.net/api/search?q=${encodeURIComponent(
            `${cleanTitle} ${cleanArtist}`,
          )}`,
        );

        if (searchRes.ok && active) {
          const list = await searchRes.json();
          if (Array.isArray(list) && list.length > 0) {
            const withSynced = list.find((item) => item.syncedLyrics);
            if (withSynced && withSynced.syncedLyrics) {
              const parsed = parseLRC(withSynced.syncedLyrics);
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

        // Strategy 2: Exact Get
        const exactRes = await fetch(
          `https://lrclib.net/api/get?track_name=${encodeURIComponent(
            cleanTitle,
          )}&artist_name=${encodeURIComponent(cleanArtist)}`,
        );

        if (exactRes.ok && active) {
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

  // Compute active lyric line with anticipation offset (-0.2s) for vocal onset
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (progress >= lyrics[i].time - 0.2) {
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

  // Detect user manual scroll to prevent fighting their thumb / mouse
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#1c382b]/95 via-[#121212]/98 to-black backdrop-blur-2xl flex flex-col p-6 md:p-10 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-spotify-elevated shadow-lg shrink-0">
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
          <div className="flex flex-col">
            <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
              {currentTrack?.title}
            </h3>
            <p className="text-xs md:text-sm text-spotify-subtext font-medium flex items-center gap-1.5">
              <span>{currentTrack?.artistName}</span>
              <span>•</span>
              <span className="text-spotify-green font-semibold">Live Karaoke Lyrics</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Authentic Spotify Lyrics Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar py-[38vh] px-4 md:px-12 flex flex-col items-start max-w-4xl mx-auto w-full space-y-6 md:space-y-8 relative"
      >
        {isLoading && (
          <div className="text-spotify-subtext text-xl italic mt-10 animate-pulse">
            Loading synchronized lyrics...
          </div>
        )}

        {!isLoading && lyrics.length === 0 && !plainLyrics && (
          <div className="flex flex-col items-start justify-center mt-10">
            <p className="text-3xl font-black text-white/70">
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
