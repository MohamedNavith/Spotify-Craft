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

export default function LyricsModal({ isOpen, onClose }: LyricsModalProps) {
  const { currentTrack, progress, seek } = usePlayerStore();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const activeLineRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (!isOpen || !currentTrack) return;

    async function loadLyrics() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `http://localhost:4000/api/lyrics?track=${encodeURIComponent(
            currentTrack?.title || '',
          )}&artist=${encodeURIComponent(
            currentTrack?.artistName || '',
          )}&duration=${currentTrack?.duration || 0}`,
        );
        const data = await res.json();
        if (data.parsedLines && data.parsedLines.length > 0) {
          setLyrics(data.parsedLines);
          setPlainLyrics(null);
        } else if (data.plainLyrics) {
          setPlainLyrics(data.plainLyrics);
          setLyrics([]);
        } else {
          setLyrics([]);
          setPlainLyrics(null);
        }
      } catch (err) {
        console.warn('Failed to load lyrics:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLyrics();
  }, [isOpen, currentTrack]);

  // Find active line index based on progress
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (progress >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth auto-scroll active lyric into center view
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#18342b]/95 via-spotify-base/98 to-black backdrop-blur-xl flex flex-col p-8 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center text-black">
            <Mic2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {currentTrack?.title}
            </h2>
            <p className="text-xs text-spotify-subtext font-semibold">
              {currentTrack?.artistName} • Synced Lyrics by LRCLIB
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Lyrics Display */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-12 flex flex-col items-center justify-start gap-8 max-w-3xl mx-auto w-full text-center">
        {isLoading && (
          <div className="text-spotify-subtext text-lg italic mt-20 animate-pulse">
            Fetching time-synced lyrics...
          </div>
        )}

        {!isLoading && lyrics.length === 0 && !plainLyrics && (
          <div className="flex flex-col items-center justify-center mt-24 text-center">
            <p className="text-2xl font-bold text-white/80">
              Looks like we don't have the lyrics for this song yet.
            </p>
            <p className="text-sm text-spotify-subtext mt-2">
              Enjoy the music or try another track!
            </p>
          </div>
        )}

        {!isLoading && plainLyrics && (
          <div className="whitespace-pre-line text-lg md:text-xl text-white/80 leading-relaxed font-semibold">
            {plainLyrics}
          </div>
        )}

        {!isLoading &&
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => seek(line.time)}
                className={`lyric-line cursor-pointer select-none transition-all duration-300 ${
                  isActive
                    ? 'active text-2xl md:text-3xl font-extrabold text-white scale-105'
                    : 'inactive text-lg md:text-xl text-white/40 hover:text-white/80 font-bold'
                }`}
              >
                {line.text}
              </p>
            );
          })}
      </div>
    </div>
  );
}
