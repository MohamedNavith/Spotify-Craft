'use client';

import { Award, Clock, Flame, Headphones, Music, Radio, Share2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import TopBar from '../../components/TopBar';

export default function WrappedPage() {
  const stats = {
    minutesListened: 48290,
    topArtist: 'Both',
    topGenre: 'Electronic / Synthwave',
    topTrack: 'Simple Exercice',
    soundPersonality: 'The Luminary Explorer',
    soundDescription: 'You dive deep into electronic soundscapes and ambient waves before anyone else catches on.',
    topSongs: [
      { rank: 1, title: 'Simple Exercice', artist: 'Both', plays: 142 },
      { rank: 2, title: 'Starlight Dream', artist: 'Cosmic Voyager', plays: 118 },
      { rank: 3, title: 'Retrowave Synthwave', artist: 'Konstantin Ogorelin', plays: 97 },
      { rank: 4, title: 'Synthwave Phonk', artist: 'Janevo', plays: 84 },
      { rank: 5, title: 'Midnight Sun', artist: 'Aurora Glow', plays: 63 },
    ],
    genres: [
      { name: 'Electronic', percent: 45, color: 'bg-emerald-500' },
      { name: 'Synthwave', percent: 25, color: 'bg-cyan-500' },
      { name: 'Ambient & Lo-Fi', percent: 18, color: 'bg-indigo-500' },
      { name: 'Acoustic / Indie', percent: 12, color: 'bg-amber-500' },
    ],
  };

  return (
    <div className="flex flex-col min-h-full pb-16 bg-gradient-to-b from-indigo-950/60 via-spotify-base to-black select-none">
      <TopBar />

      <div className="px-8 max-w-5xl mx-auto w-full flex flex-col gap-10 mt-6">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-900 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col gap-2 z-10">
            <span className="px-3 py-1 rounded-full bg-black/40 text-spotify-green text-xs font-black tracking-widest uppercase w-max">
              Wavelength Wrapped
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mt-2">
              Your Year in Sound
            </h1>
            <p className="text-white/80 text-sm max-w-lg">
              You explored thousands of minutes of open, licensed music across Jamendo, Audius, and Internet Archive.
            </p>
          </div>

          <div className="flex items-center gap-4 z-10">
            <button
              onClick={() => alert('Wavelength Wrapped card copied to clipboard!')}
              className="px-6 py-3 rounded-full bg-white text-black font-extrabold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              <Share2 className="w-4 h-4" />
              <span>Share My Wrapped</span>
            </button>
          </div>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Minutes Listened */}
          <div className="bg-spotify-card border border-spotify-border p-6 rounded-xl flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-spotify-subtext">
              <span className="text-xs font-bold uppercase tracking-wider">Minutes Listened</span>
              <Clock className="w-5 h-5 text-spotify-green" />
            </div>
            <div className="my-4">
              <span className="text-4xl font-black text-white font-mono">
                {stats.minutesListened.toLocaleString()}
              </span>
              <p className="text-xs text-spotify-subtext mt-1">That's more than 91% of listeners</p>
            </div>
            <div className="w-full h-1.5 bg-spotify-elevated rounded-full overflow-hidden">
              <div className="w-[91%] h-full bg-spotify-green" />
            </div>
          </div>

          {/* Top Artist */}
          <div className="bg-spotify-card border border-spotify-border p-6 rounded-xl flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-spotify-subtext">
              <span className="text-xs font-bold uppercase tracking-wider">Top Artist</span>
              <Headphones className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="my-4">
              <span className="text-3xl font-black text-white truncate block">
                {stats.topArtist}
              </span>
              <p className="text-xs text-spotify-subtext mt-1">Your #1 stream of the year</p>
            </div>
            <span className="text-xs text-spotify-green font-bold">Top 0.5% fan</span>
          </div>

          {/* Sound Personality */}
          <div className="bg-spotify-card border border-spotify-border p-6 rounded-xl flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-spotify-subtext">
              <span className="text-xs font-bold uppercase tracking-wider">Sound Personality</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="my-4">
              <span className="text-2xl font-black text-white">
                {stats.soundPersonality}
              </span>
              <p className="text-xs text-spotify-subtext mt-1 line-clamp-2">
                {stats.soundDescription}
              </p>
            </div>
            <span className="text-xs text-amber-400 font-bold">Aura: Emerald Glow</span>
          </div>
        </div>

        {/* Top Songs & Genres Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Songs (Col 1-7) */}
          <div className="lg:col-span-7 bg-spotify-card border border-spotify-border p-6 rounded-xl flex flex-col gap-4 shadow-lg">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span>Your Top Songs</span>
            </h2>

            <div className="flex flex-col divide-y divide-spotify-border">
              {stats.topSongs.map((song) => (
                <div key={song.rank} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-lg text-spotify-green w-4 text-center">
                      {song.rank}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{song.title}</span>
                      <span className="text-xs text-spotify-subtext">{song.artist}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-spotify-subtext">{song.plays} plays</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Genres (Col 8-12) */}
          <div className="lg:col-span-5 bg-spotify-card border border-spotify-border p-6 rounded-xl flex flex-col gap-6 shadow-lg">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-spotify-green" />
              <span>Top Genres</span>
            </h2>

            <div className="flex flex-col gap-4">
              {stats.genres.map((g) => (
                <div key={g.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white">{g.name}</span>
                    <span className="text-spotify-subtext font-mono">{g.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-spotify-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full ${g.color} rounded-full`}
                      style={{ width: `${g.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
