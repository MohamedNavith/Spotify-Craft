'use client';

import { Sliders, X } from 'lucide-react';
import { useState } from 'react';

const BANDS = [
  '32Hz',
  '64Hz',
  '125Hz',
  '250Hz',
  '500Hz',
  '1kHz',
  '2kHz',
  '4kHz',
  '8kHz',
  '16kHz',
];

const PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  Electronic: [4, 3, 1, 0, -2, 2, 1, 2, 4, 4],
  Rock: [5, 3, 2, 0, -1, 0, 2, 3, 4, 4],
  Acoustic: [3, 2, 1, 1, 2, 2, 3, 3, 2, 1],
  'Vocal Boost': [-2, -2, -1, 1, 3, 4, 4, 3, 1, 0],
};

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EqualizerModal({ isOpen, onClose }: EqualizerModalProps) {
  const [activePreset, setActivePreset] = useState('Flat');
  const [gains, setGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [crossfade, setCrossfade] = useState(3);
  const [normalization, setNormalization] = useState(true);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: string) => {
    setActivePreset(preset);
    setGains([...PRESETS[preset]]);
  };

  const handleGainChange = (index: number, val: number) => {
    const next = [...gains];
    next[index] = val;
    setGains(next);
    setActivePreset('Custom');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-spotify-card border border-spotify-border rounded-xl w-full max-w-xl p-6 flex flex-col gap-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-spotify-border">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Sliders className="w-5 h-5 text-spotify-green" />
            <span>Audio Settings & 10-Band Equalizer</span>
          </div>
          <button
            onClick={onClose}
            className="text-spotify-subtext hover:text-white p-1 rounded-full hover:bg-spotify-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Row */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-spotify-subtext uppercase tracking-wider">
            Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PRESETS).map((p) => (
              <button
                key={p}
                onClick={() => handlePresetSelect(p)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  activePreset === p
                    ? 'bg-spotify-green text-black'
                    : 'bg-spotify-elevated hover:bg-spotify-hover text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 10-Band Slider Sliders */}
        <div className="grid grid-cols-10 gap-2 items-center justify-items-center h-48 bg-black/40 p-4 rounded-lg">
          {BANDS.map((band, idx) => (
            <div key={band} className="flex flex-col items-center h-full justify-between">
              <span className="text-[10px] text-spotify-subtext font-mono">
                {gains[idx] > 0 ? `+${gains[idx]}` : gains[idx]}dB
              </span>

              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={gains[idx]}
                onChange={(e) => handleGainChange(idx, parseInt(e.target.value, 10))}
                className="h-28 -rotate-90 cursor-pointer accent-spotify-green"
              />

              <span className="text-[10px] text-white font-semibold mt-2">{band}</span>
            </div>
          ))}
        </div>

        {/* Crossfade & Volume Normalization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-1.5 p-3 rounded bg-spotify-elevated">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Gapless & Crossfade</span>
              <span className="text-spotify-green font-mono">{crossfade}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              value={crossfade}
              onChange={(e) => setCrossfade(parseInt(e.target.value, 10))}
              className="accent-spotify-green cursor-pointer mt-1"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-spotify-elevated cursor-pointer">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Normalize Volume</span>
              <span className="text-[10px] text-spotify-subtext">
                Dynamic range compression
              </span>
            </div>
            <button
              onClick={() => setNormalization(!normalization)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                normalization ? 'bg-spotify-green' : 'bg-spotify-card'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  normalization ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-sm rounded-full transition-transform active:scale-95"
        >
          Apply Settings
        </button>
      </div>
    </div>
  );
}
