'use client';

import { Check, Clock, Moon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

const TIMER_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour', value: 60 },
  { label: 'End of track', value: -1 },
];

export default function SleepTimerModal() {
  const {
    isSleepTimerModalOpen,
    closeSleepTimerModal,
    sleepTimerMinutes,
    sleepTimerEndTime,
    setSleepTimer,
  } = usePlayerStore();

  const [remainingText, setRemainingText] = useState<string>('');

  useEffect(() => {
    if (!sleepTimerEndTime) {
      if (sleepTimerMinutes === -1) {
        setRemainingText('Stops at end of this track');
      } else {
        setRemainingText('');
      }
      return;
    }

    const update = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((sleepTimerEndTime - now) / 1000));
      if (diffSecs <= 0) {
        setRemainingText('Timer expiring...');
        return;
      }
      const m = Math.floor(diffSecs / 60);
      const s = diffSecs % 60;
      setRemainingText(`${m}m ${s < 10 ? '0' : ''}${s}s remaining`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEndTime, sleepTimerMinutes]);

  if (!isSleepTimerModalOpen) return null;

  const handleSelect = (val: number | null) => {
    setSleepTimer(val);
    closeSleepTimerModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-[#1e1e1e] rounded-t-3xl md:rounded-2xl border-t md:border border-white/10 p-5 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3 md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-spotify-green" />
            <h3 className="text-base font-bold text-white">Sleep timer</h3>
          </div>
          <button
            onClick={closeSleepTimerModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Timer Indicator */}
        {remainingText && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-spotify-green/10 border border-spotify-green/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-spotify-green">
              <Clock className="w-3.5 h-3.5" />
              <span>{remainingText}</span>
            </div>
            <button
              onClick={() => handleSelect(null)}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 underline"
            >
              Turn off
            </button>
          </div>
        )}

        {/* Options List */}
        <div className="flex flex-col divide-y divide-white/5 overflow-y-auto max-h-[60vh]">
          {TIMER_OPTIONS.map((opt) => {
            const isSelected = sleepTimerMinutes === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="py-3 px-2 flex items-center justify-between hover:bg-white/5 active:bg-white/10 rounded-lg transition-colors text-left group"
              >
                <span
                  className={`text-sm font-medium transition-colors ${
                    isSelected ? 'text-spotify-green font-bold' : 'text-white/90 group-hover:text-white'
                  }`}
                >
                  {opt.label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-spotify-green" />}
              </button>
            );
          })}

          {/* Turn Off Button */}
          {sleepTimerMinutes !== null && (
            <button
              onClick={() => handleSelect(null)}
              className="py-3 px-2 flex items-center justify-between text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors text-left"
            >
              <span className="text-sm font-semibold">Turn off timer</span>
              <X className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
