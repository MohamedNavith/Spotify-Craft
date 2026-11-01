'use client';

import {
  ChevronDown,
  Maximize2,
  Minimize2,
  Moon,
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

  const containerRef = useRef<HTMLDivElement | null>(null);

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

  // Build Constellation Node coordinates for the active line's words
  const constellationNodes: WordNode[] = useMemo(() => {
    if (!activeLine || !activeLine.text) return [];

    const words = activeLine.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const lineStart = activeLine.time;
    const lineEnd = nextLine ? nextLine.time : lineStart + 4.5;
    const totalDuration = Math.max(1.5, lineEnd - lineStart);
    const wordDuration = totalDuration / words.length;

    // Fixed harmonic constellation positions (like constellations Orion, Ursa, Cassiopeia)
    const basePositions = [
      { x: 18, y: 46 },
      { x: 28, y: 56 },
      { x: 42, y: 42 },
      { x: 50, y: 64 },
      { x: 60, y: 48 },
      { x: 74, y: 38 },
      { x: 84, y: 55 },
      { x: 34, y: 32 },
      { x: 66, y: 68 },
    ];

    return words.map((word, i) => {
      const pos = basePositions[i % basePositions.length];
      // Subtle organic jitter based on index
      const jitterX = ((i * 17) % 8) - 4;
      const jitterY = ((i * 23) % 8) - 4;

      return {
        word,
        startTime: lineStart + i * wordDuration,
        endTime: lineStart + (i + 1) * wordDuration,
        x: Math.max(10, Math.min(90, pos.x + jitterX)),
        y: Math.max(15, Math.min(85, pos.y + jitterY)),
      };
    });
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

      {/* BACKGROUND PARTICLES & NEBULA */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-25"
          style={{ backgroundColor: dominantColor }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[140px] opacity-25"
          style={{ backgroundColor: secondaryColor }}
        />
        {/* Twinkling ambient star field */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* TOP BAR: Track Info + Verci Controls */}
      <header className="w-full relative z-30 px-6 py-5 flex items-center justify-between backdrop-blur-sm bg-black/20">
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
                  {(['constellation', 'fisheye', 'minimal'] as const).map((style) => (
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
                      <span>{style === 'constellation' ? '✨ Constellation (Star Map)' : style === 'fisheye' ? '🎯 Fisheye Karaoke Focus' : '📄 Minimalist HUD'}</span>
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

          {/* Close Button */}
          <button
            onClick={() => setIsVerciOpen(false)}
            title="Exit Verci Mode (Esc)"
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
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
      <footer className="w-full relative z-30 px-6 py-4 flex flex-col items-center gap-2 backdrop-blur-md bg-black/30 border-t border-white/5">
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

        {/* Playback Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={prevTrack}
            className="p-2 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
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
            className="p-2 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
