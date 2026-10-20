'use client';

import { Check, Download, Music, Plus, Sparkles, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { importSpotifyPlaylist, parseUploadedSpotifyList } from '../lib/spotifySync';
import { addSpotifyPlaylistToLibrary } from '../lib/userPlaylists';
import { usePlayerStore } from '../stores/usePlayerStore';
import { UnifiedTrack } from '../types';

interface SpotifyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_PLAYLISTS = [
  { name: "Today's Top Hits", url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' },
  { name: 'Hot Hits India', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUfTFmZeeg' },
  { name: 'Global Top 50', url: 'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF' },
  { name: 'Mega Hit Mix', url: 'https://open.spotify.com/playlist/37i9dQZF1DXbYM3nMM0oPk' },
];

export default function SpotifyImportModal({ isOpen, onClose }: SpotifyImportModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importedTracks, setImportedTracks] = useState<UnifiedTrack[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [isSaved, setIsSaved] = useState(false);

  const { setTrack, addToQueue } = usePlayerStore();

  if (!isOpen) return null;

  const handleImport = async (targetUrl?: string) => {
    const toImport = targetUrl || url.trim();
    if (!toImport) return;

    setIsLoading(true);
    setIsSaved(false);
    setStatusMessage('Syncing with Spotify metadata...');

    try {
      const res = await importSpotifyPlaylist(toImport);
      setPlaylistTitle(res.title);
      setImportedTracks(res.tracks);
      setStatusMessage(`Found ${res.tracks.length} official full-length tracks!`);
    } catch (err: any) {
      setStatusMessage('Could not import playlist. Please check link format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setIsSaved(false);
    setStatusMessage(`Reading ${file.name}...`);

    try {
      const text = await file.text();
      const tracks = await parseUploadedSpotifyList(text);
      setPlaylistTitle(file.name.replace(/\.[^/.]+$/, ''));
      setImportedTracks(tracks);
      setStatusMessage(`Imported ${tracks.length} matching full-length tracks!`);
    } catch (err) {
      setStatusMessage('Failed to parse file. Make sure it contains Song, Artist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (importedTracks.length > 0) {
      addSpotifyPlaylistToLibrary(playlistTitle, importedTracks);
      setTrack(importedTracks[0], importedTracks);
      onClose();
    }
  };

  const handleSaveToLibrary = () => {
    if (importedTracks.length > 0) {
      addSpotifyPlaylistToLibrary(playlistTitle, importedTracks);
      setIsSaved(true);
      setStatusMessage(`Successfully saved "${playlistTitle}" to Your Library!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-spotify-elevated border border-spotify-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-spotify-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center text-black shadow-lg">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Import &amp; Sync Spotify Playlist
              </h2>
              <p className="text-spotify-subtext text-xs">
                Stream your Spotify playlists in 100% full version for free
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-spotify-subtext hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Link Input Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-spotify-subtext uppercase tracking-wider">
              Paste Spotify Playlist Link or URI
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
                className="flex-1 bg-black/50 border border-spotify-border focus:border-spotify-green rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-colors"
              />
              <button
                onClick={() => handleImport()}
                disabled={isLoading || !url.trim()}
                className="px-5 py-2.5 rounded-lg bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-sm transition-all disabled:opacity-50"
              >
                {isLoading ? 'Syncing...' : 'Import'}
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-spotify-subtext font-semibold">Or try popular playlists:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PLAYLISTS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setUrl(p.url);
                    handleImport(p.url);
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-colors"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Export File */}
          <div className="border-t border-spotify-border pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-white text-sm font-semibold">Upload Spotify Export File</span>
              <span className="text-spotify-subtext text-xs">Supports .csv or .json files</span>
            </div>
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Choose File</span>
              <input
                type="file"
                accept=".csv,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-spotify-green flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Imported Tracks Preview */}
          {importedTracks.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-bold text-white truncate max-w-[200px]">
                  {playlistTitle} ({importedTracks.length} songs)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveToLibrary}
                    className="px-3.5 py-1.5 rounded-full border border-white/20 hover:border-spotify-green hover:text-spotify-green text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
                  >
                    {isSaved ? (
                      <Check className="w-3.5 h-3.5 text-spotify-green" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>{isSaved ? 'In Library' : 'Add to Library'}</span>
                  </button>
                  <button
                    onClick={handlePlayAll}
                    className="px-4 py-1.5 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-xs shadow-md transition-all hover:scale-105"
                  >
                    Play All Now
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar bg-black/30 rounded-lg p-2 border border-white/5">
                {importedTracks.map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setTrack(t, importedTracks);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded hover:bg-white/10 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-spotify-subtext w-4 text-center">{idx + 1}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-medium truncate">{t.title}</span>
                        <span className="text-spotify-subtext text-[11px] truncate">
                          {t.artistName}
                        </span>
                      </div>
                    </div>
                    <span className="text-spotify-subtext text-[11px] shrink-0 font-mono">
                      {Math.floor(t.duration / 60)}:
                      {t.duration % 60 < 10 ? '0' : ''}
                      {t.duration % 60}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
