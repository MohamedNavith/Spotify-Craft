'use client';

import { Copy, Headphones, Music, Play, Radio, Share2, Users } from 'lucide-react';
import { useState } from 'react';
import TopBar from '../../components/TopBar';
import { usePlayerStore } from '../../stores/usePlayerStore';

export default function JamSessionPage() {
  const { currentTrack, isPlaying } = usePlayerStore();
  const [copied, setCopied] = useState(false);
  const [roomId, setRoomId] = useState('wave-7749');

  const listeners = [
    { name: 'Navith (Host)', avatarBg: 'bg-emerald-600', isHost: true },
    { name: 'Sarah', avatarBg: 'bg-indigo-600', isHost: false },
    { name: 'Alex', avatarBg: 'bg-purple-600', isHost: false },
    { name: 'Dev Team', avatarBg: 'bg-rose-600', isHost: false },
  ];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(`https://mohamednavith.github.io/Spotify-Craft/#/jam?room=${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-full pb-16 select-none">
      <TopBar />

      <div className="px-8 max-w-4xl mx-auto w-full flex flex-col gap-8 mt-6">
        {/* Header Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-emerald-950 via-spotify-card to-spotify-elevated border border-spotify-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-spotify-green flex items-center justify-center text-black shadow-lg">
              <Radio className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-spotify-green animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-spotify-green">
                  Live Jam Session
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white mt-1">
                Room #{roomId}
              </h1>
              <p className="text-xs text-spotify-subtext mt-0.5">
                Everyone in this room hears the exact same sound at the exact same millisecond.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-6 py-3 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            <Share2 className="w-4 h-4" />
            <span>{copied ? 'Copied Invite Link!' : 'Invite Friends to Jam'}</span>
          </button>
        </div>

        {/* Current Synced Track Card */}
        <div className="bg-spotify-card border border-spotify-border rounded-xl p-6 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-spotify-subtext uppercase">
            <span>Now Broadcasting to All Room Members</span>
            <span className="text-spotify-green font-mono">{isPlaying ? 'SYNCED PLAYING' : 'PAUSED'}</span>
          </div>

          {currentTrack ? (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-spotify-elevated shadow">
              <div className="w-16 h-16 rounded-md overflow-hidden bg-spotify-card shrink-0">
                {currentTrack.artworkUrl ? (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-white">
                    W
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-white truncate">
                  {currentTrack.title}
                </span>
                <span className="text-sm text-spotify-subtext truncate">
                  {currentTrack.artistName}
                </span>
                <span className="text-xs text-spotify-green font-semibold mt-1">
                  Broadcasting via WebSockets (Low Latency)
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-spotify-subtext italic">
              No track currently broadcasting. Pick a song to start the jam!
            </div>
          )}
        </div>

        {/* Listeners Presence List */}
        <div className="bg-spotify-card border border-spotify-border rounded-xl p-6 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-spotify-green" />
              <span>In This Jam ({listeners.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {listeners.map((listener, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-spotify-elevated"
              >
                <div
                  className={`w-9 h-9 rounded-full ${listener.avatarBg} flex items-center justify-center text-white font-bold text-sm shadow`}
                >
                  {listener.name.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {listener.name}
                  </span>
                  <span className="text-[10px] text-spotify-green font-medium">
                    {listener.isHost ? 'Host & DJ' : 'Listening in sync'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
