'use client';

import {
  ChevronDown,
  Clock,
  Film,
  Flame,
  Heart,
  Maximize2,
  Minimize2,
  Moon,
  Music,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Settings,
  SkipBack,
  SkipForward,
  Sparkles,
  Sliders,
  Sun,
  X,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import TrackVideoCanvas from './TrackVideoCanvas';

interface LyricLine {
  time: number;
  text: string;
}

interface WordNode {
  word: string;
  startTime: number;
  endTime: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

function cleanTitleString(str: string): string {
  return str
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*/i, '')
    .replace(/ft\..*/i, '')
    .replace(/official.*/i, '')
    .trim();
}

function hashLyricLine(str: string, time: number): number {
  let hash = 2166136261;
  const combined = `${str}_${Math.floor(time * 10)}`;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createLineRng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
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

export default function VerciExperience() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    isVerciOpen,
    setIsVerciOpen,
    verciStyle,
    setVerciStyle,
    isLumnGlowEnabled,
    toggleLumnGlow,
  } = usePlayerStore();

  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [fontChoice, setFontChoice] = useState<'sf' | 'figtree' | 'serif' | 'mono'>('figtree');
  const [textSize, setTextSize] = useState<number>(100); // 75% to 150%
  const [glowIntensity, setGlowIntensity] = useState<number>(80);
  const [dominantColor, setDominantColor] = useState<string>('rgba(29, 185, 84, 0.45)');
  const [secondaryColor, setSecondaryColor] = useState<string>('rgba(255, 255, 255, 0.2)');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('12:00');
  const [currentDateStr, setCurrentDateStr] = useState<string>('Sun, Oct 25');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLyricRef = useRef<HTMLDivElement | null>(null);
  const lyricsScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Real-time clock for Lockscreen / Kinetic Screensaver mode
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })
      );
      setCurrentDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null && touchStartX.current !== null) {
      const diffY = e.changedTouches[0].clientY - touchStartY.current;
      const diffX = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
      // Downward swipe of more than 75px that is mostly vertical triggers exit
      if (diffY > 75 && diffY > diffX * 1.2) {
        setIsVerciOpen(false);
      }
    }
    touchStartY.current = null;
    touchStartX.current = null;
  };

  // Extract dynamic colors from album artwork for Lumn ambient rim
  useEffect(() => {
    const artUrl = currentTrack?.artworkUrl;
    if (!artUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = artUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        const count = data.length / 4;
        const avgR = Math.min(255, Math.floor((r / count) * 1.2));
        const avgG = Math.min(255, Math.floor((g / count) * 1.2));
        const avgB = Math.min(255, Math.floor((b / count) * 1.2));
        setDominantColor(`rgba(${avgR}, ${avgG}, ${avgB}, 0.55)`);
        setSecondaryColor(`rgba(${Math.floor(avgR * 0.7)}, ${Math.floor(avgG * 0.7)}, ${Math.floor(avgB * 0.9)}, 0.35)`);
      } catch {
        setDominantColor('rgba(29, 185, 84, 0.45)');
      }
    };
  }, [currentTrack?.artworkUrl]);

  // Fetch Synced Lyrics
  useEffect(() => {
    if (!isVerciOpen || !currentTrack) return;

    let isMounted = true;
    async function fetchTrackLyrics() {
      setIsLoading(true);
      const cleanTitle = cleanTitleString(currentTrack?.title || '');
      const cleanArtist = cleanTitleString(currentTrack?.artistName || '');

      try {
        const res = await fetch(
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`
        );
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const withSynced = list.find((item) => item.syncedLyrics);
            if (withSynced && withSynced.syncedLyrics) {
              const parsed = parseLRC(withSynced.syncedLyrics);
              if (isMounted && parsed.length > 0) {
                setLyrics(parsed);
                setPlainLyrics(null);
                setIsLoading(false);
                return;
              }
            }
            if (isMounted && list[0].plainLyrics) {
              setPlainLyrics(list[0].plainLyrics);
              setLyrics([]);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('[Verci] Failed to load synced lyrics:', e);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    }

    fetchTrackLyrics();
    return () => {
      isMounted = false;
    };
  }, [isVerciOpen, currentTrack?.id]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcut listener (Esc to close, F to fullscreen)
  useEffect(() => {
    if (!isVerciOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVerciOpen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVerciOpen]);

  // Find active lyric index
  const activeLineIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (progress >= lyrics[i].time - 0.2) {
        return i;
      }
    }
    return 0;
  }, [lyrics, progress]);

  const activeLine = lyrics[activeLineIndex] || null;
  const nextLine = lyrics[activeLineIndex + 1] || null;

  // Build Constellation Node coordinates for the active line's words (Procedural Celestial Placement)
  const constellationNodes: WordNode[] = useMemo(() => {
    if (!activeLine || !activeLine.text) return [];

    const words = activeLine.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const lineStart = activeLine.time;
    const lineEnd = nextLine ? nextLine.time : lineStart + 4.5;
    const totalDuration = Math.max(1.5, lineEnd - lineStart);
    const wordDuration = totalDuration / words.length;

    // Seeded procedural random generator for this specific lyric sentence
    const seed = hashLyricLine(activeLine.text, activeLine.time);
    const rng = createLineRng(seed);

    // Anchors across distinct canvas sectors (right corner, top left, center, bottom, etc.)
    const anchorZones = [
      { x: 74, y: 28 }, // Top right
      { x: 24, y: 32 }, // Top left
      { x: 76, y: 64 }, // Bottom right
      { x: 26, y: 68 }, // Bottom left
      { x: 50, y: 28 }, // Top center
      { x: 50, y: 70 }, // Bottom center
      { x: 50, y: 50 }, // Dead center
      { x: 80, y: 46 }, // Center right
      { x: 20, y: 46 }, // Center left
    ];

    // Select starting anchor randomly for word 0
    const startZone = anchorZones[Math.floor(rng() * anchorZones.length)];
    let curX = Math.max(16, Math.min(84, startZone.x + (rng() * 16 - 8)));
    let curY = Math.max(22, Math.min(76, startZone.y + (rng() * 14 - 7)));

    // Direction vector of constellation drift
    let heading = rng() * Math.PI * 2;
    const nodes: WordNode[] = [];

    for (let i = 0; i < words.length; i++) {
      if (i > 0) {
        // Step distance between 18% and 28% of canvas for wide, dynamic celestial leaps
        const stepDist = 18 + rng() * 10;

        // REAL ZIGZAG: Alternate sharp angle turns so words zigzag dynamically!
        const zigzagSign = i % 2 === 1 ? 1 : -1;
        const turnAngle = (Math.PI * 0.45) + (rng() * 0.45); // 81 deg to 162 deg turn
        heading += zigzagSign * turnAngle;

        let nextX = curX + Math.cos(heading) * stepDist;
        let nextY = curY + Math.sin(heading) * stepDist;

        // Bounce back from horizontal boundaries
        if (nextX < 14 || nextX > 86) {
          heading = Math.PI - heading;
          nextX = Math.max(14, Math.min(86, nextX));
        }

        // Bounce back from vertical boundaries
        if (nextY < 20 || nextY > 78) {
          heading = -heading;
          nextY = Math.max(20, Math.min(78, nextY));
        }

        // Steer towards center if near perimeter
        if (nextX < 18 || nextX > 82 || nextY < 24 || nextY > 74) {
          const toCenterX = 50 - nextX;
          const toCenterY = 50 - nextY;
          heading = Math.atan2(toCenterY, toCenterX) + (zigzagSign * 0.5);
          nextX = Math.max(14, Math.min(86, curX + Math.cos(heading) * stepDist));
          nextY = Math.max(20, Math.min(78, curY + Math.sin(heading) * stepDist));
        }

        curX = nextX;
        curY = nextY;
      }

      nodes.push({
        word: words[i],
        startTime: lineStart + i * wordDuration,
        endTime: lineStart + (i + 1) * wordDuration,
        x: Math.round(curX * 10) / 10,
        y: Math.round(curY * 10) / 10,
      });
    }

    return nodes;
  }, [activeLine, nextLine]);

  // Active word index in constellation
  const activeWordIndex = useMemo(() => {
    if (constellationNodes.length === 0) return -1;
    const idx = constellationNodes.findIndex(
      (node) => progress >= node.startTime && progress < node.endTime
    );
    if (idx !== -1) return idx;
    // If progress is past the last word but before next line, keep last word active
    if (progress >= constellationNodes[constellationNodes.length - 1].endTime) {
      return constellationNodes.length - 1;
    }
    return 0;
  }, [constellationNodes, progress]);

  // Auto-scroll active lyric into view for Spicetify mode
  useEffect(() => {
    if (verciStyle === 'spicetify' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, verciStyle]);

  // Kinetic Word Blocks for Lockscreen / Screensaver Pop Mode (From reel2.mp4)
  const kineticBlocks = useMemo(() => {
    if (!activeLine || !activeLine.text) return [];
    const words = activeLine.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    if (words.length <= 2) {
      return [
        { text: words[0], type: 'italic', icon: '✦' },
        ...(words[1] ? [{ text: words[1], type: 'badge', icon: '🧡' }] : []),
      ];
    }

    if (words.length === 3) {
      return [
        { text: words[0], type: 'italic', icon: '👼' },
        { text: words[1], type: 'huge', icon: '🔊' },
        { text: words[2], type: 'badge', icon: '✨' },
      ];
    }

    // 4 or more words: group into 3 rows
    const chunk1 = words.slice(0, Math.ceil(words.length / 3)).join(' ');
    const chunk2 = words.slice(Math.ceil(words.length / 3), Math.ceil((2 * words.length) / 3)).join(' ');
    const chunk3 = words.slice(Math.ceil((2 * words.length) / 3)).join(' ');

    return [
      { text: chunk1, type: 'italic', icon: '✦' },
      { text: chunk2, type: 'huge', icon: '🧡' },
      { text: chunk3, type: 'badge', icon: '🔥' },
    ];
  }, [activeLine]);

  if (!isVerciOpen || !currentTrack) return null;

  const fontClass =
    fontChoice === 'sf'
      ? 'font-sans tracking-tight'
      : fontChoice === 'serif'
      ? 'font-serif'
      : fontChoice === 'mono'
      ? 'font-mono'
      : 'font-sans font-black';

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[100] bg-black text-white select-none flex flex-col items-center justify-between overflow-hidden"
      style={{
        boxShadow: isLumnGlowEnabled
          ? `inset 0 0 ${glowIntensity * 1.4}px ${glowIntensity * 0.35}px ${dominantColor}, inset 0 0 ${glowIntensity * 0.8}px ${glowIntensity * 0.2}px ${secondaryColor}`
          : 'none',
      }}
    >
      {/* LUMN AMBIENT RIM BORDER (trylumn.xyz) */}
      {isLumnGlowEnabled && (
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-all duration-700 animate-pulse"
          style={{
            border: `${Math.max(4, Math.floor(glowIntensity / 10))}px solid ${dominantColor}`,
            boxShadow: `0 0 ${glowIntensity}px ${dominantColor}, inset 0 0 ${glowIntensity * 1.2}px ${dominantColor}`,
          }}
        />
      )}

      {/* BACKGROUND PARTICLES & NEBULA (PURE PITCH-BLACK OLED SPACE) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] opacity-20"
          style={{ backgroundColor: dominantColor }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[160px] opacity-20"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>

      {/* TOP BAR: Track Info + Verci Controls */}
      <header
        className="w-full relative z-30 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between backdrop-blur-xl bg-black/40 border-b border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px) + 6px, 0.75rem)',
        }}
      >
        {/* Left: Active Track Badge */}
        <div className="flex items-center gap-3.5">
          {currentTrack.artworkUrl ? (
            <img
              src={currentTrack.artworkUrl}
              alt={currentTrack.title}
              className="w-11 h-11 rounded-lg object-cover shadow-2xl border border-white/10"
            />
          ) : (
            <div className="w-11 h-11 rounded-lg bg-black border border-white/10 flex items-center justify-center text-spotify-green font-bold text-xs">
              W
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-white tracking-tight truncate max-w-[200px] md:max-w-md">
              {currentTrack.title}
            </span>
            <span className="text-xs text-white/60 truncate max-w-[180px] md:max-w-xs">
              {currentTrack.artistName}
            </span>
          </div>
        </div>

        {/* Right: Verci Style Pill, Settings Menu Toggle, Fullscreen, Close */}
        <div className="flex items-center gap-2">
          {/* Style Selector Badge */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-all backdrop-blur-md"
            >
              <Orbit className="w-3.5 h-3.5 text-spotify-green animate-spin-slow" />
              <span className="capitalize">{verciStyle}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {/* VERCI SETTINGS DROPDOWN (Matches video menu frame 2!) */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#181818]/95 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl z-50 text-xs flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-spotify-green" />
                    Verci &amp; Lumn
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/50">
                    Pro Studio
                  </span>
                </div>

                {/* Style Choices */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Visual Style
                  </span>
                  {(['constellation', 'canvas', 'spicetify', 'kinetic', 'fisheye', 'minimal'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        setVerciStyle(style);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg capitalize font-bold transition-all ${
                        verciStyle === style
                          ? 'bg-spotify-green text-black shadow-lg'
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <span>
                        {style === 'constellation'
                          ? '✨ Constellation (Zigzag Map)'
                          : style === 'canvas'
                          ? '🎬 Video Canvas & Lyrics (Reel Climax)'
                          : style === 'spicetify'
                          ? '🌸 Spicetify Studio (Fluid Aurora)'
                          : style === 'kinetic'
                          ? '⚡ Kinetic Pop (Lockscreen)'
                          : style === 'fisheye'
                          ? '🎯 Fisheye Karaoke Focus'
                          : '📄 Minimalist HUD'}
                      </span>
                      {verciStyle === style && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>

                {/* Font Choices */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Typography Font
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'figtree', label: 'Figtree' },
                      { id: 'sf', label: 'SF Pro' },
                      { id: 'serif', label: 'New York (Serif)' },
                      { id: 'mono', label: 'Code Monospace' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFontChoice(f.id as any)}
                        className={`px-2.5 py-1.5 rounded-md font-semibold text-center transition-all ${
                          fontChoice === f.id
                            ? 'bg-white text-black'
                            : 'bg-white/5 hover:bg-white/10 text-white/80'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lumn Rim Glow Controls */}
                <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      Lumn Ambient Rim Glow
                    </span>
                    <input
                      type="checkbox"
                      checked={isLumnGlowEnabled}
                      onChange={toggleLumnGlow}
                      className="accent-spotify-green w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {isLumnGlowEnabled && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-white/50">Intensity</span>
                      <input
                        type="range"
                        min={20}
                        max={140}
                        value={glowIntensity}
                        onChange={(e) => setGlowIntensity(parseInt(e.target.value, 10))}
                        className="flex-1 accent-spotify-green cursor-pointer h-1 bg-white/20 rounded-full"
                      />
                    </div>
                  )}
                </div>

                {/* Text Size Slider */}
                <div className="flex flex-col gap-1 pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between text-[11px] text-white/70">
                    <span>Text Size</span>
                    <span className="font-mono">{textSize}%</span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={150}
                    value={textSize}
                    onChange={(e) => setTextSize(parseInt(e.target.value, 10))}
                    className="w-full accent-spotify-green cursor-pointer h-1 bg-white/20 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Single Unified Exit Button */}
          <button
            onClick={() => setIsVerciOpen(false)}
            title="Exit Verci Mode (Esc)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-xs font-bold backdrop-blur-md transition-all shadow-md shrink-0 ml-1"
          >
            <X className="w-3.5 h-3.5 text-spotify-green" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* CENTER STAGE: THE CHOSEN VISUALIZER ENGINE */}
      <main className="flex-1 w-full relative z-20 flex items-center justify-center p-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Sparkles className="w-8 h-8 text-spotify-green animate-spin" />
            <span className="text-sm font-semibold tracking-wide">
              Aligning Constellation &amp; Syncing Lyrics...
            </span>
          </div>
        ) : lyrics.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-4 max-w-lg">
            <Sparkles className="w-12 h-12 text-spotify-green/80 animate-pulse" />
            <h2 className="text-2xl font-black text-white">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-white/60">
              {plainLyrics
                ? plainLyrics.slice(0, 300) + '...'
                : 'Instrumental or pure audio experience. Enjoy the ambient Lumn glow around your display.'}
            </p>
          </div>
        ) : verciStyle === 'constellation' ? (
          /* ========================================================== */
          /* 1. CONSTELLATION MODE (The exact one from the user's video) */
          /* ========================================================== */
          <div className="relative w-full h-full max-w-5xl max-h-[75vh] flex items-center justify-center">
            {/* SVG Constellation Linking Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {constellationNodes.map((node, i) => {
                if (i === 0) return null;
                const prev = constellationNodes[i - 1];
                const isPastLine = i <= activeWordIndex;
                return (
                  <line
                    key={`line-${i}`}
                    x1={`${prev.x}%`}
                    y1={`${prev.y}%`}
                    x2={`${node.x}%`}
                    y2={`${node.y}%`}
                    stroke={isPastLine ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.2)'}
                    strokeWidth={isPastLine ? '1.8' : '1'}
                    strokeDasharray={isPastLine ? 'none' : '3 3'}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Constellation Word Nodes */}
            <div className="absolute inset-0 w-full h-full">
              {constellationNodes.map((node, i) => {
                const isActive = i === activeWordIndex;
                const isPast = i < activeWordIndex;

                return (
                  <div
                    key={`node-${i}`}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${(textSize / 100) * (isActive ? 2.4 : 1.15)}rem`,
                    }}
                    className={`absolute z-20 flex flex-col items-center transition-all duration-300 pointer-events-none ${
                      isActive
                        ? 'scale-110 z-30 font-black text-white drop-shadow-[0_0_35px_rgba(255,255,255,1)]'
                        : isPast
                        ? 'font-bold text-white/80 opacity-90 scale-95'
                        : 'font-semibold text-white/35 opacity-40 scale-90'
                    }`}
                  >
                    {/* Glowing Diamond Star Marker (✦) */}
                    <div
                      className={`text-sm mb-1 transition-all duration-300 ${
                        isActive
                          ? 'text-spotify-green scale-150 drop-shadow-[0_0_15px_#1DB954]'
                          : isPast
                          ? 'text-white/60 scale-90'
                          : 'text-white/20 scale-75'
                      }`}
                    >
                      ✦
                    </div>

                    {/* Word Typography */}
                    <span className={`${fontClass} tracking-tight leading-none`}>
                      {node.word}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : verciStyle === 'spicetify' || verciStyle === 'canvas' ? (
          /* ========================================================== */
          /* 2. SPICETIFY & 25s VIDEO CANVAS MODE (From Spotify gif Lyrics Reel) */
          /* ========================================================== */
          <div className="w-full h-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-14 px-4 md:px-8 py-2 overflow-hidden">
            {/* Left Column: 20-30s Video Canvas Card, Metadata & Scrubber */}
            <div className="w-full md:w-[42%] flex flex-col items-center md:items-start text-center md:text-left shrink-0">
              {/* 25s Video Canvas Card with Floating Specular Glow */}
              <div className="relative group mb-5">
                <div
                  className="absolute -inset-4 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"
                  style={{ backgroundColor: dominantColor }}
                />
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-80 md:h-80 rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/10 ring-1 ring-white/15 bg-black">
                  <TrackVideoCanvas
                    title={currentTrack.title}
                    artist={currentTrack.artistName}
                    duration={duration}
                    artworkUrl={currentTrack.artworkUrl}
                    className="w-full h-full"
                    preferredMode="canvas"
                  />
                </div>
              </div>

              {/* Title & Artist */}
              <h2 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight mb-1 truncate max-w-full drop-shadow-md">
                {currentTrack.title}
              </h2>
              <p className="text-xs md:text-base text-white/60 font-semibold mb-4 truncate max-w-full">
                {currentTrack.artistName}
              </p>

              {/* Scrubber & Time */}
              <div className="w-full max-w-sm flex flex-col gap-1.5">
                <div className="relative flex items-center h-2 group cursor-pointer">
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-spotify-green transition-all"
                      style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 180}
                    value={progress}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-white/50">
                  <span>
                    {Math.floor(progress / 60)}:
                    {Math.floor(progress % 60).toString().padStart(2, '0')}
                  </span>
                  <span>
                    {Math.floor(duration / 60)}:
                    {Math.floor(duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Synced Lyrics with Chromatic Fluid Aura */}
            <div
              ref={lyricsScrollContainerRef}
              className="w-full md:w-[58%] h-[50vh] md:h-[72vh] overflow-y-auto no-scrollbar flex flex-col gap-6 py-[24vh] px-2 relative"
            >
              {lyrics.map((line, idx) => {
                const isActive = idx === activeLineIndex;
                const isPast = idx < activeLineIndex;

                return (
                  <div
                    key={`lyric-${idx}`}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => seek(line.time)}
                    className={`relative p-3 rounded-2xl cursor-pointer transition-all duration-500 ${
                      isActive
                        ? 'scale-105 z-10'
                        : isPast
                        ? 'opacity-35 hover:opacity-75 blur-[0.6px] hover:blur-none'
                        : 'opacity-30 hover:opacity-70 blur-[0.6px] hover:blur-none'
                    }`}
                  >
                    {/* Chromatic Fluid Aura Blob behind active line (From Spicetify Reel!) */}
                    {isActive && (
                      <div
                        className="absolute -inset-x-6 -inset-y-3 rounded-3xl blur-2xl opacity-75 pointer-events-none -z-10 animate-pulse transition-all duration-700"
                        style={{
                          background: `radial-gradient(ellipse at center, ${dominantColor} 0%, rgba(168, 85, 247, 0.5) 40%, rgba(6, 182, 212, 0.35) 75%, transparent 100%)`,
                        }}
                      />
                    )}

                    <p
                      className={`${fontClass} leading-tight font-black transition-colors ${
                        isActive
                          ? 'text-white text-2xl sm:text-3xl md:text-4xl drop-shadow-[0_0_30px_rgba(255,255,255,0.85)]'
                          : 'text-white/60 text-lg sm:text-xl md:text-2xl font-bold'
                      }`}
                      style={{
                        fontSize: isActive ? `${(textSize / 100) * 2.3}rem` : `${(textSize / 100) * 1.35}rem`,
                      }}
                    >
                      {line.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : verciStyle === 'kinetic' ? (
          /* ========================================================== */
          /* 3. KINETIC POP & LOCKSCREEN MODE (From reel2.mp4)         */
          /* ========================================================== */
          <div className="w-full h-full max-w-4xl flex flex-col items-center justify-between py-6 px-4 select-none">
            {/* Top Lockscreen Clock & Date Header */}
            <div className="flex flex-col items-center text-center animate-in fade-in duration-500">
              <span className="text-xs font-semibold text-white/50 tracking-widest uppercase">
                {currentDateStr}
              </span>
              <span className="text-5xl md:text-7xl font-extralight tracking-tight text-white/95 font-mono mt-1 drop-shadow-md">
                {currentTimeStr}
              </span>
            </div>

            {/* Kinetic Typography & Pop Badges */}
            <div className="flex flex-col items-center justify-center gap-3 md:gap-5 text-center my-auto w-full px-2">
              {kineticBlocks.map((block, bIdx) => {
                if (block.type === 'badge') {
                  return (
                    <div
                      key={`kblock-${bIdx}`}
                      className="flex items-center justify-center gap-3 animate-in zoom-in-90 duration-300"
                    >
                      <span
                        className={`${fontClass} inline-block px-5 py-2 md:px-7 md:py-3 rounded-2xl bg-amber-400 text-black font-black text-2xl sm:text-4xl md:text-6xl shadow-[0_0_35px_rgba(251,191,36,0.65)] tracking-tight leading-none scale-105`}
                        style={{ fontSize: `${(textSize / 100) * 3}rem` }}
                      >
                        {block.text}
                      </span>
                      {block.icon && (
                        <span className="text-2xl sm:text-4xl md:text-5xl filter drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
                          {block.icon}
                        </span>
                      )}
                    </div>
                  );
                }

                if (block.type === 'huge') {
                  return (
                    <div
                      key={`kblock-${bIdx}`}
                      className="flex items-center justify-center gap-3 animate-in fade-in duration-300"
                    >
                      <span
                        className={`${fontClass} text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-none drop-shadow-[0_0_35px_rgba(255,255,255,0.7)]`}
                        style={{ fontSize: `${(textSize / 100) * 3.4}rem` }}
                      >
                        {block.text}
                      </span>
                      {block.icon && (
                        <span className="text-2xl sm:text-4xl filter drop-shadow-lg">
                          {block.icon}
                        </span>
                      )}
                    </div>
                  );
                }

                // Default italic / serif styling
                return (
                  <div
                    key={`kblock-${bIdx}`}
                    className="flex items-center justify-center gap-2 animate-in fade-in duration-300"
                  >
                    <span
                      className="font-serif italic font-bold text-2xl sm:text-3xl md:text-5xl text-amber-300/90 tracking-wide leading-none drop-shadow-md"
                      style={{ fontSize: `${(textSize / 100) * 2.2}rem` }}
                    >
                      {block.text}
                    </span>
                    {block.icon && (
                      <span className="text-xl sm:text-3xl">
                        {block.icon}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Song Info Pill */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs text-white/70 font-semibold shadow-lg">
              <Music className="w-3.5 h-3.5 text-spotify-green" />
              <span>{currentTrack.title}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/50">{currentTrack.artistName}</span>
            </div>
          </div>
        ) : verciStyle === 'fisheye' ? (
          /* ========================================================== */
          /* 2. FISHEYE KARAOKE MODE (Apple Music / Focused Roll)       */
          /* ========================================================== */
          <div className="w-full max-w-3xl flex flex-col items-center gap-6 text-center">
            {/* Previous Line */}
            {lyrics[activeLineIndex - 1] && (
              <p
                onClick={() => seek(lyrics[activeLineIndex - 1].time)}
                className="text-lg md:text-2xl text-white/30 font-bold blur-[0.6px] cursor-pointer hover:text-white/50 transition-all"
                style={{ fontSize: `${(textSize / 100) * 1.3}rem` }}
              >
                {lyrics[activeLineIndex - 1].text}
              </p>
            )}

            {/* Active Magnified Line */}
            {activeLine && (
              <div
                className="py-4 my-2 px-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl transition-all scale-105"
                style={{ fontSize: `${(textSize / 100) * 2.5}rem` }}
              >
                <p className={`${fontClass} font-black text-white leading-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]`}>
                  {activeLine.text}
                </p>
              </div>
            )}

            {/* Next Line */}
            {nextLine && (
              <p
                onClick={() => seek(nextLine.time)}
                className="text-lg md:text-2xl text-white/30 font-bold blur-[0.6px] cursor-pointer hover:text-white/50 transition-all"
                style={{ fontSize: `${(textSize / 100) * 1.3}rem` }}
              >
                {nextLine.text}
              </p>
            )}
          </div>
        ) : (
          /* ========================================================== */
          /* 3. MINIMALIST HUD MODE                                     */
          /* ========================================================== */
          <div className="flex flex-col items-center text-center gap-4 max-w-2xl px-6 py-10 rounded-3xl bg-[#141414]/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
            <span className="text-xs uppercase font-mono tracking-widest text-spotify-green">
              Now Singing • Line #{activeLineIndex + 1}
            </span>
            <h1
              className={`${fontClass} text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-2xl`}
              style={{ fontSize: `${(textSize / 100) * 2.2}rem` }}
            >
              {activeLine ? activeLine.text : currentTrack.title}
            </h1>
            {nextLine && (
              <p className="text-sm md:text-base text-white/40 font-medium mt-2">
                Up next: &ldquo;{nextLine.text}&rdquo;
              </p>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM FLOATING PLAYER HUD */}
      <footer
        className="w-full relative z-30 px-4 md:px-6 py-3 md:py-4 flex flex-col items-center gap-2 backdrop-blur-xl bg-black/40 border-t border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 6px, 0.75rem)',
        }}
      >
        {/* Scrubber Range */}
        <div className="w-full max-w-xl flex items-center gap-3 text-xs text-white/60 font-mono">
          <span>
            {Math.floor(progress / 60)}:
            {Math.floor(progress % 60).toString().padStart(2, '0')}
          </span>
          <div className="flex-1 relative flex items-center h-2 group cursor-pointer">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-spotify-green"
                style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 180}
              value={progress}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span>
            {Math.floor(duration / 60)}:
            {Math.floor(duration % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Playback Controls & Explicit Exit Mode Button */}
        <div className="w-full max-w-xl flex items-center justify-between px-2 pt-1">
          {/* Left indicator / hint */}
          <div className="w-20 hidden sm:block text-[10px] text-white/40 font-mono">
            ESC to exit
          </div>
          <div className="w-20 sm:hidden" />

          {/* Center Playback Controls */}
          <div className="flex items-center gap-5 md:gap-6">
            <button
              onClick={prevTrack}
              aria-label="Previous track"
              className="p-2 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={nextTrack}
              aria-label="Next track"
              className="p-2 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Right Spacer (Keeps transport controls centered) */}
          <div className="w-20" />
        </div>
      </footer>
    </div>
  );
}
