'use client';

import React, { useState } from 'react';
import { ChevronLeft, Check, AlertTriangle, Disc3, Info, X } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { StreamingQuality } from '../types';

interface QualityOption {
  id: StreamingQuality;
  title: string;
  subtitle?: string;
  isLosslessTier?: boolean;
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    id: 'none',
    title: 'None',
  },
  {
    id: 'high-efficiency',
    title: 'High Efficiency',
    subtitle: 'HE-AAC with low data usage',
  },
  {
    id: 'high-quality',
    title: 'High Quality',
    subtitle: 'AAC 256 kbps',
  },
  {
    id: 'lossless',
    title: 'Lossless',
    subtitle: 'ALAC up to 24-bit/48 kHz',
    isLosslessTier: true,
  },
  {
    id: 'hi-res-lossless',
    title: 'Hi-Res Lossless',
    subtitle: 'ALAC up to 24-bit/192 kHz',
    isLosslessTier: true,
  },
];

export default function StreamingQualityModal() {
  const {
    isQualityModalOpen,
    setIsQualityModalOpen,
    streamingQuality,
    setStreamingQuality,
    audioStreamDetails,
    currentTrack,
  } = usePlayerStore();

  const [pendingQuality, setPendingQuality] = useState<StreamingQuality | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  if (!isQualityModalOpen) return null;

  const handleSelectQuality = (id: StreamingQuality) => {
    if ((id === 'lossless' || id === 'hi-res-lossless') && streamingQuality !== id) {
      setPendingQuality(id);
      setShowWarningDialog(true);
    } else {
      setStreamingQuality(id);
    }
  };

  const confirmPendingQuality = () => {
    if (pendingQuality) {
      setStreamingQuality(pendingQuality);
      setPendingQuality(null);
    }
    setShowWarningDialog(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 sm:p-6 select-none">
      <div
        className="relative w-full max-w-md bg-[#000000] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl flex flex-col text-white max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Bar (Apple Style) */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 bg-[#121214]/60 backdrop-blur-lg">
          <button
            onClick={() => setIsQualityModalOpen(false)}
            className="flex items-center gap-1 text-[#0A84FF] hover:opacity-80 transition-opacity text-base font-normal -ml-1 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            <span>Settings</span>
          </button>
          <span className="font-semibold text-white text-[15px] tracking-tight">
            Mobile Data Streaming
          </span>
          <button
            onClick={() => setIsQualityModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-thin">
          {/* Grouped Table Box (Apple iOS Style) */}
          <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/5 shadow-inner divide-y divide-[#2C2C2E]">
            {QUALITY_OPTIONS.map((opt) => {
              const isSelected = streamingQuality === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectQuality(opt.id)}
                  className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors"
                >
                  <div className="flex flex-col pr-3">
                    <span className="text-[15px] font-normal text-white tracking-tight">
                      {opt.title}
                    </span>
                    {opt.subtitle && (
                      <span className="text-[12px] text-[#8E8E93] font-normal mt-0.5">
                        {opt.subtitle}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-[#0A84FF] stroke-[2.5] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Apple Music Streaming Advisory Description */}
          <div className="px-1 text-[13px] text-[#8E8E93] leading-relaxed space-y-3 font-normal">
            <p>Lossless streaming will consume significantly more data.</p>

            <div className="space-y-1">
              <p>A three-minute song will be approximately:</p>
              <ul className="space-y-0.5 pl-1 text-[#A1A1A6]">
                <li>– 1.5 MB with High Efficiency</li>
                <li>– 6 MB with High Quality at 256 kbps</li>
                <li>– 36 MB with Lossless at 24-bit/48 kHz</li>
                <li>– 145 MB with Hi-Res Lossless at 24-bit/192 kHz</li>
              </ul>
            </div>

            <p className="text-[12px] text-[#71717A] pt-1 leading-normal">
              Support varies and depends on song availability, network conditions, and connected speaker or headphone capability.
            </p>
          </div>

          {/* Live Audio Stream Details (Verified Engine Specs) */}
          {currentTrack && (
            <div className="p-3.5 rounded-2xl bg-[#1C1C1E]/90 border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#8E8E93] flex items-center gap-1.5">
                  <Disc3 className="w-3.5 h-3.5 text-[#0A84FF] animate-spin-slow" />
                  Now Playing Stream Specs
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    audioStreamDetails?.isRealLossless
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-white/10 text-white/80'
                  }`}
                >
                  {audioStreamDetails?.tierLabel || 'High Quality AAC'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                <div>
                  <span className="text-[#71717A] block">Format &amp; Codec:</span>
                  <span className="text-white font-mono font-medium">
                    {audioStreamDetails?.codec || 'AAC'} ({audioStreamDetails?.channels || 'Stereo 2.0'})
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A] block">Bitrate:</span>
                  <span className="text-white font-mono font-medium">
                    {audioStreamDetails?.bitrate || '320 kbps'}
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A] block">Sample Rate &amp; Depth:</span>
                  <span className="text-white font-mono font-medium">
                    {audioStreamDetails?.sampleRate || '44.1 kHz'} / {audioStreamDetails?.bitDepth || '16-bit'}
                  </span>
                </div>
                <div>
                  <span className="text-[#71717A] block">Est. Data Consumption:</span>
                  <span className="text-white font-mono font-medium">
                    ~{audioStreamDetails?.sizeEstimateMb || 6.8} MB / song
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* High Data Consumption Warning Confirmation Dialog */}
        {showWarningDialog && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-5 max-w-sm w-full text-center flex flex-col items-center gap-3 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>

              <h4 className="text-[17px] font-bold text-white tracking-tight">
                Turn On {pendingQuality === 'hi-res-lossless' ? 'Hi-Res Lossless' : 'Lossless'}?
              </h4>

              <p className="text-[13px] text-[#8E8E93] leading-relaxed">
                Lossless audio streams consume significantly more bandwidth—up to{' '}
                <strong className="text-white">
                  {pendingQuality === 'hi-res-lossless' ? '145 MB' : '36 MB'} per 3-minute song
                </strong>
                . Streaming over cellular data may quickly exhaust your mobile data plan.
              </p>

              <div className="flex flex-col w-full gap-2 pt-2">
                <button
                  onClick={confirmPendingQuality}
                  className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-[14px] transition-colors cursor-pointer"
                >
                  Turn On Lossless
                </button>
                <button
                  onClick={() => {
                    setPendingQuality(null);
                    setShowWarningDialog(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 font-medium text-[14px] transition-colors cursor-pointer"
                >
                  Keep High Quality (Default)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
