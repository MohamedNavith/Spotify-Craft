'use client';

import { Film, Sparkles, Video, VideoOff, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

export type VisualMode = 'none' | 'canvas' | 'ambient' | 'youtube';

export default function VisualBackground() {
  const { currentTrack, isPlaying } = usePlayerStore();
  const [mode, setMode] = useState<VisualMode>('canvas');
  const [dataSaver, setDataSaver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas Waveform Animation Loop
  useEffect(() => {
    if (mode !== 'canvas' || dataSaver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying) {
        phase += 0.03;
      }

      const centerY = canvas.height / 2;
      const lines = 3;

      for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle =
          i === 0
            ? 'rgba(30, 215, 96, 0.25)'
            : i === 1
            ? 'rgba(29, 185, 84, 0.15)'
            : 'rgba(255, 255, 255, 0.1)';

        for (let x = 0; x < canvas.width; x += 5) {
          const freq = 0.008 + i * 0.003;
          const amp = isPlaying ? 35 + i * 15 : 8;
          const y = centerY + Math.sin(x * freq + phase + i) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [mode, isPlaying, dataSaver]);



  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Visual Canvas Loop */}
      {mode === 'canvas' && (
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="w-full h-full object-cover opacity-60"
        />
      )}

      {/* Ambient Looping Video */}
      {mode === 'ambient' && !dataSaver && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-20 filter blur-sm"
          src="https://assets.mixkit.co/videos/preview/mixkit-liquid-shapes-flowing-in-purple-and-blue-neon-light-42416-large.mp4"
        />
      )}

      {/* Official YouTube Embed Video Mode */}
      {mode === 'youtube' && currentTrack && (
        <div className="w-full h-full flex items-center justify-center bg-black/90 pointer-events-auto">
          <iframe
            className="w-full max-w-4xl aspect-video rounded-xl shadow-2xl border border-spotify-border"
            src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(
              `${currentTrack.title} ${currentTrack.artistName} official video`,
            )}&autoplay=1&mute=1`}
            title="Official Video Mode"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Mode Switcher Floating Controls */}
      <div className="absolute top-4 right-4 pointer-events-auto flex items-center gap-2 z-20">
        <div className="bg-black/60 backdrop-blur-md border border-spotify-border rounded-full p-1 flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setMode('canvas')}
            title="Canvas Wave Loop"
            className={`p-1.5 rounded-full text-xs transition-colors ${
              mode === 'canvas' ? 'bg-spotify-green text-black' : 'text-spotify-subtext hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setMode('ambient')}
            title="Ambient Video Loop"
            className={`p-1.5 rounded-full text-xs transition-colors ${
              mode === 'ambient' ? 'bg-spotify-green text-black' : 'text-spotify-subtext hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setMode('youtube')}
            title="YouTube Video Mode"
            className={`p-1.5 rounded-full text-xs transition-colors ${
              mode === 'youtube' ? 'bg-spotify-green text-black' : 'text-spotify-subtext hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setMode('none')}
            title="Disable Visuals"
            className={`p-1.5 rounded-full text-xs transition-colors ${
              mode === 'none' ? 'bg-white text-black' : 'text-spotify-subtext hover:text-white'
            }`}
          >
            <VideoOff className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setDataSaver(!dataSaver)}
          title={dataSaver ? 'Data Saver Active' : 'Data Saver Off'}
          className={`p-2 rounded-full border border-spotify-border backdrop-blur-md transition-colors ${
            dataSaver ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-black/60 text-spotify-subtext hover:text-white'
          }`}
        >
          {dataSaver ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
