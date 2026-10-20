'use client';

import { ListPlus, Music, Users, X } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function CreateSheetModal() {
  const { isCreateSheetOpen, setIsCreateSheetOpen } = usePlayerStore();

  if (!isCreateSheetOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#242424] rounded-t-3xl border-t border-white/10 p-6 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 relative">
        {/* Modal Options List */}
        <div className="flex flex-col gap-5 py-2">
          {/* 1. Playlist */}
          <div
            onClick={() => {
              alert('New playlist created in Your Library!');
              setIsCreateSheetOpen(false);
            }}
            className="flex items-center gap-4 cursor-pointer group p-2 rounded-xl hover:bg-white/5 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-[#333333] flex items-center justify-center text-white shrink-0 group-hover:bg-[#444] transition-colors">
              <Music className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-white group-hover:text-spotify-green transition-colors">
                Playlist
              </h3>
              <p className="text-xs text-[#b3b3b3]">
                Create a playlist with songs or episodes
              </p>
            </div>
          </div>

          {/* 2. Collaborative Playlist */}
          <div
            onClick={() => {
              alert('Collaborative playlist link ready to share with friends!');
              setIsCreateSheetOpen(false);
            }}
            className="flex items-center gap-4 cursor-pointer group p-2 rounded-xl hover:bg-white/5 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-[#333333] flex items-center justify-center text-white shrink-0 group-hover:bg-[#444] transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-white group-hover:text-spotify-green transition-colors">
                Collaborative playlist
              </h3>
              <p className="text-xs text-[#b3b3b3]">
                Create a playlist together with friends
              </p>
            </div>
          </div>

          {/* 3. Blend */}
          <div
            onClick={() => {
              alert('Spotify Blend session generated! Ready to combine music tastes.');
              setIsCreateSheetOpen(false);
            }}
            className="flex items-center gap-4 cursor-pointer group p-2 rounded-xl hover:bg-white/5 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-[#333333] flex items-center justify-center text-white shrink-0 group-hover:bg-[#444] transition-colors">
              <ListPlus className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-bold text-white group-hover:text-spotify-green transition-colors">
                Blend
              </h3>
              <p className="text-xs text-[#b3b3b3]">
                Combine your friends&apos; tastes into a playlist
              </p>
            </div>
          </div>
        </div>

        {/* Floating circular Close (X) button at bottom right (Screenshot #1) */}
        <div className="flex justify-end pt-4">
          <button
            onClick={() => setIsCreateSheetOpen(false)}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
