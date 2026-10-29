'use client';

import { Check, Heart, MoreHorizontal, Play, User, X } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function NowPlayingPanel() {
  const {
    currentTrack,
    isPlaying,
    queue,
    queueIndex,
    likedTrackIds,
    toggleLike,
    isNowPlayingViewOpen,
    setIsNowPlayingViewOpen,
    setTrack,
  } = usePlayerStore();

  if (!isNowPlayingViewOpen) return null;

  const isLiked = currentTrack ? likedTrackIds.has(currentTrack.id) : false;
  const nextTrack = queue[queueIndex + 1] || null;

  return (
    <aside
      aria-label="Now playing view"
      className="hidden lg:flex w-[320px] xl:w-[360px] bg-spotify-base rounded-lg p-4 flex-col gap-4 overflow-y-auto custom-scrollbar shrink-0 select-none border border-white/5 animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between sticky top-0 bg-spotify-base/90 backdrop-blur-md pb-2 z-10">
        <h2 className="font-bold text-white text-base truncate pr-2">
          {currentTrack?.title || 'Now playing'}
        </h2>
        <button
          onClick={() => setIsNowPlayingViewOpen(false)}
          aria-label="Close"
          className="p-1 rounded-full text-spotify-subtext hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {currentTrack ? (
        <>
          {/* Large Album Artwork */}
          <div className="aspect-square w-full rounded-lg overflow-hidden bg-spotify-card shadow-2xl relative group">
            {currentTrack.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-4xl text-spotify-subtext">
                W
              </div>
            )}
          </div>

          {/* Title & Artist & Action */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <h3 className="font-black text-xl text-white truncate hover:underline cursor-pointer">
                {currentTrack.title}
              </h3>
              <p className="text-spotify-subtext text-sm truncate hover:underline cursor-pointer mt-0.5">
                {currentTrack.artistName}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0 pt-1">
              <button
                onClick={() => toggleLike(currentTrack.id)}
                className="p-1.5 text-spotify-subtext hover:text-white transition-colors"
                title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
              >
                <Heart
                  className={`w-5 h-5 transition-transform active:scale-125 ${
                    isLiked
                      ? 'text-spotify-green fill-spotify-green'
                      : 'text-spotify-subtext hover:text-white'
                  }`}
                />
              </button>
              <button
                className="p-1.5 text-spotify-subtext hover:text-white transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* About the Artist Card (Authentic Spotify Desktop Card) */}
          <div className="rounded-xl bg-spotify-card hover:bg-spotify-elevated transition-colors overflow-hidden flex flex-col p-4 relative group cursor-pointer border border-white/5 shadow-lg">
            <span className="font-bold text-sm text-white mb-2">About the artist</span>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-spotify-elevated shrink-0 shadow-md">
                {currentTrack.artworkUrl ? (
                  <img
                    src={currentTrack.artworkUrl}
                    alt={currentTrack.artistName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-base truncate group-hover:underline">
                  {currentTrack.artistName}
                </span>
                <span className="text-xs text-spotify-subtext mt-0.5">
                  Verified Artist • 48,912,400 monthly listeners
                </span>
              </div>
            </div>
            <p className="text-xs text-spotify-subtext mt-3 line-clamp-3 leading-relaxed">
              Top streaming artist featured across global charts, official playlists, and studio masters on Wavelength.
            </p>
          </div>

          {/* Next In Queue Card */}
          {nextTrack && (
            <div className="rounded-xl bg-spotify-card p-4 flex flex-col gap-2 border border-white/5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Next in queue</span>
                <span className="text-xs font-bold text-spotify-subtext">Up next</span>
              </div>
              <div
                onClick={() => setTrack(nextTrack, queue)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-spotify-hover transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded overflow-hidden bg-spotify-elevated shrink-0">
                    {nextTrack.artworkUrl ? (
                      <img
                        src={nextTrack.artworkUrl}
                        alt={nextTrack.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white">
                        W
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-white truncate group-hover:text-spotify-green transition-colors">
                      {nextTrack.title}
                    </span>
                    <span className="text-[11px] text-spotify-subtext truncate">
                      {nextTrack.artistName}
                    </span>
                  </div>
                </div>
                <button
                  className="w-8 h-8 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md shrink-0"
                >
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* Credits & Audio Quality Info */}
          <div className="rounded-xl bg-spotify-card p-4 flex flex-col gap-2 border border-white/5 text-xs text-spotify-subtext">
            <span className="font-bold text-white text-sm">Credits</span>
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex justify-between">
                <span>Performer</span>
                <span className="text-white font-medium truncate max-w-[160px]">
                  {currentTrack.artistName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Audio Engine</span>
                <span className="text-spotify-green font-medium">
                  {currentTrack.audioQuality || '320kbps Master AAC'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Source</span>
                <span className="text-white font-medium uppercase text-[10px]">
                  {currentTrack.provider}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-spotify-subtext">
          <p className="font-bold text-sm text-white">Find something to play</p>
          <p className="text-xs mt-1">Select a song from your library or search to see live credits and artist insights.</p>
        </div>
      )}
    </aside>
  );
}
