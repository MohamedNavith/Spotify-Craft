'use client';

import { Clock, Disc3, Heart, ListMusic, LogOut, ShieldCheck, User, X } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { getUserPlaylists } from '../lib/userPlaylists';

export default function UserProfileModal() {
  const { user, logout, isProfileModalOpen, setIsProfileModalOpen } = useAuthStore();
  const { likedTrackIds } = usePlayerStore();

  if (!isProfileModalOpen || !user) return null;

  const playlists = getUserPlaylists();
  const totalSeconds = user.watchTimeSeconds || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const formattedWatchTime =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes} mins (${totalSeconds}s)`;

  return (
    <div
      onClick={() => setIsProfileModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm mt-14 bg-[#1f1f1f] border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white animate-in zoom-in-95 duration-150 relative"
      >
        {/* Close Button */}
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-spotify-subtext hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-spotify-elevated border-2 border-spotify-green shadow-lg shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-black text-xl">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-white truncate max-w-[180px]">
                {user.displayName}
              </span>
              <ShieldCheck className="w-4 h-4 text-spotify-green shrink-0" />
            </div>
            <span className="text-xs text-spotify-subtext truncate max-w-[190px]">
              {user.email}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-spotify-green mt-1">
              Wavelength Member
            </span>
          </div>
        </div>

        {/* Real Listening & Library Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Watch Time Metric */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-spotify-green text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Watch Time</span>
            </div>
            <span className="text-lg font-black text-white font-mono mt-0.5">
              {formattedWatchTime}
            </span>
            <span className="text-[10px] text-spotify-subtext">Total time listened</span>
          </div>

          {/* Songs Listened Metric */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-spotify-green text-xs font-bold">
              <Disc3 className="w-3.5 h-3.5" />
              <span>Songs Played</span>
            </div>
            <span className="text-lg font-black text-white font-mono mt-0.5">
              {user.songsWatchedCount || 0}
            </span>
            <span className="text-[10px] text-spotify-subtext">Tracks listened</span>
          </div>

          {/* Liked Songs in Library */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-spotify-green text-xs font-bold">
              <Heart className="w-3.5 h-3.5 fill-spotify-green" />
              <span>Liked Songs</span>
            </div>
            <span className="text-lg font-black text-white font-mono mt-0.5">
              {likedTrackIds.size}
            </span>
            <span className="text-[10px] text-spotify-subtext">Favorite tracks</span>
          </div>

          {/* Custom Playlists */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-spotify-green text-xs font-bold">
              <ListMusic className="w-3.5 h-3.5" />
              <span>Playlists</span>
            </div>
            <span className="text-lg font-black text-white font-mono mt-0.5">
              {playlists.length}
            </span>
            <span className="text-[10px] text-spotify-subtext">Custom playlists</span>
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={() => {
            logout();
            setIsProfileModalOpen(false);
          }}
          className="w-full py-2.5 px-4 rounded-full bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-all mt-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out of Wavelength</span>
        </button>
      </div>
    </div>
  );
}
