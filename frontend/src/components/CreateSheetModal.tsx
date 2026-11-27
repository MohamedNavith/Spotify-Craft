'use client';

import { Check, Heart, ListPlus, Music, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSongSearch } from '../lib/useSongSearch';
import { useRouter } from 'next/navigation';
import { playlistUrl } from '../lib/playlistCatalog';
import { createCustomUserPlaylist } from '../lib/userPlaylists';
import { usePlayerStore } from '../stores/usePlayerStore';
import { UnifiedTrack } from '../types';

export default function CreateSheetModal() {
  const isCreateSheetOpen = usePlayerStore(state => state.isCreateSheetOpen);
  const setIsCreateSheetOpen = usePlayerStore(state => state.setIsCreateSheetOpen);
  const setTrack = usePlayerStore(state => state.setTrack);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { tracks:searchResults, loading:isSearching } = useSongSearch(isCreateSheetOpen ? searchQuery : '',8);
  const [selectedTracks, setSelectedTracks] = useState<UnifiedTrack[]>([]);

  const [activeTab, setActiveTab] = useState<'playlist' | 'liked'>('playlist');
  const [feedback, setFeedback] = useState<string | null>(null);

  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (isCreateSheetOpen) dialog.current?.showModal();
  }, [isCreateSheetOpen]);
  if (!isCreateSheetOpen) return null;

  const handleAddTrack = (track: UnifiedTrack) => {
    if (activeTab === 'playlist') {
      if (!selectedTracks.some((t) => t.id === track.id)) {
        setSelectedTracks([...selectedTracks, track]);
      }
    } else {
      // Add directly to Liked Songs
      if (!usePlayerStore.getState().likedTrackIds.has(track.id)) usePlayerStore.getState().toggleLike(track);
      setFeedback(`Added "${track.title}" to Liked Songs!`);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    setSelectedTracks(selectedTracks.filter((t) => t.id !== trackId));
  };

  const handleSavePlaylist = () => {
    const title = playlistTitle.trim() || 'My Favorite Songs';
    let created;
    try { created = createCustomUserPlaylist(title, selectedTracks); }
    catch { setFeedback('Could not save this playlist in this browser.'); return; }
    setIsCreateSheetOpen(false);
    setPlaylistTitle('');
    setSelectedTracks([]);
    setSearchQuery('');
    router.push(playlistUrl(created.id));

    // If tracks exist, optionally play immediately
    if (created.tracks.length > 0) {
      setTrack(created.tracks[0], created.tracks);
    }
  };

  return (
    <dialog ref={dialog} aria-labelledby="create-playlist-heading"
      onCancel={() => setIsCreateSheetOpen(false)}
      onClick={event => { if (event.target === event.currentTarget) setIsCreateSheetOpen(false); }}
      className="m-auto bg-transparent p-3 w-full max-w-lg backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#181818] border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95 duration-200 text-white max-h-[88dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-spotify-green/20 text-spotify-green flex items-center justify-center">
              <ListPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 id="create-playlist-heading" className="text-xl font-black text-white">Add to Your Library</h2>
              <p className="text-xs text-spotify-subtext">Add any songs you desire to your library or playlists</p>
            </div>
          </div>
          <button
            aria-label="Close playlist editor"
            onClick={() => setIsCreateSheetOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-spotify-subtext hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection: Create Playlist vs Add to Liked Songs */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/5">
          <button
            onClick={() => setActiveTab('playlist')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'playlist'
                ? 'bg-white text-black shadow'
                : 'text-spotify-subtext hover:text-white'
            }`}
          >
            Create Custom Playlist
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'liked'
                ? 'bg-white text-black shadow'
                : 'text-spotify-subtext hover:text-white'
            }`}
          >
            Add to Liked Songs
          </button>
        </div>

        {feedback && (
          <div className="p-2.5 rounded-xl bg-spotify-green/20 border border-spotify-green/40 text-spotify-green text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Playlist Name Input (Only in playlist tab) */}
        {activeTab === 'playlist' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-list-title" className="text-xs font-bold text-white/80">Playlist Title</label>
            <input
              type="text"
              id="create-list-title"
              value={playlistTitle}
              onChange={(e) => setPlaylistTitle(e.target.value)}
              placeholder="e.g. My Favorite Bangers, Late Night Vibe..."
              className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-spotify-subtext outline-none focus:border-spotify-green transition-colors"
            />
          </div>
        )}

        {/* Live Search Any Song Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="create-list-query" className="text-xs font-bold text-white/80">
            {activeTab === 'playlist' ? 'Search songs to add to playlist' : 'Search any song to add to Liked Songs'}
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-spotify-subtext absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              id="create-list-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by song name, singer, or album..."
              className="w-full bg-[#242424] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-spotify-subtext outline-none focus:border-spotify-green transition-colors"
            />
            {isSearching && (
              <span className="text-[10px] text-spotify-green font-mono absolute right-3">Searching...</span>
            )}
          </div>
        </div>

        {/* Search Results List */}
        {searchResults.length > 0 && (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar border border-white/5 rounded-2xl p-2 bg-black/30">
            <span className="text-[10px] uppercase font-bold text-spotify-subtext px-2 py-1">Search Results</span>
            {searchResults.map((track) => {
              const isAdded = activeTab === 'playlist' && selectedTracks.some((t) => t.id === track.id);
              return (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-black overflow-hidden shrink-0 shadow">
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-white">W</div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-bold text-white truncate">{track.title}</span>
                      <span className="text-[11px] text-spotify-subtext truncate">{track.artistName}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddTrack(track)}
                    disabled={isAdded}
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                      isAdded
                        ? 'bg-white/10 text-white/50 cursor-not-allowed'
                        : 'bg-spotify-green hover:bg-spotify-green-hover text-black shadow active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Tracks for Playlist */}
        {activeTab === 'playlist' && selectedTracks.length > 0 && (
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto custom-scrollbar border border-spotify-green/20 rounded-2xl p-2 bg-spotify-green/5">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-spotify-green">
                Playlist Tracks ({selectedTracks.length})
              </span>
              <button
                onClick={() => setSelectedTracks([])}
                className="text-[10px] text-red-400 hover:underline"
              >
                Clear all
              </button>
            </div>
            {selectedTracks.map((trk, i) => (
              <div
                key={trk.id}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 text-xs text-white"
              >
                <span className="truncate flex-1 pr-2">
                  <span className="text-white/40 font-mono mr-1.5">{i + 1}.</span>
                  {trk.title} &bull; <span className="text-spotify-subtext">{trk.artistName}</span>
                </span>
                <button
                  aria-label={'Remove '+trk.title}
                  onClick={() => handleRemoveTrack(trk.id)}
                  className="text-white/40 hover:text-red-400 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Save / Create Action */}
        {activeTab === 'playlist' && (
          <button
            onClick={handleSavePlaylist}
            disabled={!playlistTitle.trim() && selectedTracks.length === 0}
            className="w-full py-3 bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-sm rounded-full transition-transform active:scale-95 disabled:opacity-50 shadow-lg mt-1"
          >
            Save Playlist to Library ({selectedTracks.length} {selectedTracks.length === 1 ? 'track' : 'tracks'})
          </button>
        )}
      </div>
    </dialog>
  );
}
