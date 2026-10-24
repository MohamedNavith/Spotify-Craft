'use client';

import React from 'react';
import {
  X,
  ExternalLink,
  Radio,
  Headphones,
  Sliders,
  Sparkles,
  ShieldCheck,
  Music2,
  Terminal,
  Volume2,
} from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';

const BOT_INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1563521762656780299&permissions=8&scope=bot%20applications.commands';

export const DiscordBotModal: React.FC = () => {
  const { isDiscordModalOpen, setIsDiscordModalOpen } = usePlayerStore();

  if (!isDiscordModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-neutral-100 flex flex-col gap-6 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsDiscordModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Hero */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
          {/* Logo Badge */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-black">
              <Radio className="w-10 h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-neutral-900"></span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-2xl font-bold tracking-tight text-white">Wavelength Bot</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Wavelength#9248
              </span>
            </div>
            <p className="text-sm text-neutral-400">
              Audiophile 320kbps music bot with real-time DSP filters, Spotify & YouTube sync, and Discord DAVE E2EE support.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-[#5865F2]/20 via-neutral-800 to-emerald-500/20 border border-[#5865F2]/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shrink-0 shadow-md">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Add to Your Discord Server</h3>
              <p className="text-xs text-neutral-400">One-click invite with slash commands & full permissions</p>
            </div>
          </div>

          <a
            href={BOT_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-sm transition-all shadow-lg shadow-[#5865F2]/25 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <span>Invite Bot</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-800 flex items-start gap-3">
            <Headphones className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">320kbps Master Audio</p>
              <p className="text-xs text-neutral-400">Lossless resolution directly from master CDN & YouTube audio fallback.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-800 flex items-start gap-3">
            <Sliders className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">DSP Filter Suite</p>
              <p className="text-xs text-neutral-400">8D spatial audio, sub-bass booster, nightcore, vaporwave, and karaoke.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-800 flex items-start gap-3">
            <Terminal className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Prefix & Slash Commands</p>
              <p className="text-xs text-neutral-400">Use default <code className="text-emerald-400">!</code> or customize to any prefix like <code className="text-emerald-400">!prefix ?</code>.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Discord DAVE E2EE Ready</p>
              <p className="text-xs text-neutral-400">Fully compatible with Discord's newest voice encryption architecture.</p>
            </div>
          </div>
        </div>

        {/* Command Cheat Sheet */}
        <div className="rounded-2xl bg-neutral-950 border border-neutral-800/80 p-4">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Essential Commands Reference</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-emerald-400 font-bold">!play &lt;query/link&gt;</span>
              <span className="text-neutral-400 font-sans">Play any track/playlist</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-emerald-400 font-bold">!join / !leave</span>
              <span className="text-neutral-400 font-sans">Connect/disconnect</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-emerald-400 font-bold">!skip / !previous</span>
              <span className="text-neutral-400 font-sans">Navigate tracks</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-emerald-400 font-bold">!queue / !np</span>
              <span className="text-neutral-400 font-sans">View queue & now playing</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-emerald-400 font-bold">!bass / !8d</span>
              <span className="text-neutral-400 font-sans">Toggle sound filters</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-emerald-400 font-bold">!prefix &lt;symbol&gt;</span>
              <span className="text-neutral-400 font-sans">Change server prefix</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-emerald-400 font-bold">/setup</span>
              <span className="text-neutral-400 font-sans">Dedicated song request channel</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-emerald-400 font-bold">!247</span>
              <span className="text-neutral-400 font-sans">Stay in voice channel 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
