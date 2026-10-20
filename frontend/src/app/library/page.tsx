'use client';

import {
  ArrowDownToLine,
  ArrowUpDown,
  ChevronRight,
  Download,
  Grid,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { searchOfficialMusic } from '../../lib/officialMusic';

const LIBRARY_ARTISTS = [
  {
    id: 'ilaiyaraaja',
    name: 'Ilaiyaraaja',
    type: 'Artist',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    query: 'Ilaiyaraaja classics Tamil hits',
  },
  {
    id: 'unnikrishnan',
    name: 'Unnikrishnan',
    type: 'Artist',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    query: 'Unnikrishnan Tamil songs',
  },
  {
    id: 'p-susheela',
    name: 'P. Susheela',
    type: 'Artist',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    query: 'P. Susheela classic songs',
  },
  {
    id: 's-janaki',
    name: 'S. Janaki',
    type: 'Artist',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80',
    query: 'S. Janaki melody hits',
  },
  {
    id: 'kamal-haasan',
    name: 'Kamal Haasan',
    type: 'Artist',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80',
    query: 'Kamal Haasan songs Vikram',
  },
  {
    id: 'arijit-singh',
    name: 'Arijit Singh',
    type: 'Artist',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    query: 'Arijit Singh Tum Hi Ho',
  },
];

export default function LibraryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'artists' | 'playlists' | 'all'>('artists');
  const [loadingArtist, setLoadingArtist] = useState<string | null>(null);

  const { setIsCreateSheetOpen, setIsSpotifyImportOpen, setTrack } = usePlayerStore();

  const handleArtistClick = async (artist: typeof LIBRARY_ARTISTS[0]) => {
    try {
      setLoadingArtist(artist.name);
      const tracks = await searchOfficialMusic(artist.query, 10);
      if (tracks.length > 0) {
        setTrack(tracks[0], tracks);
      }
    } catch {} finally {
      setLoadingArtist(null);
    }
  };

  return (
    <div className="min-h-full bg-[#121212] text-white p-4 md:p-8 select-none pb-28">
      {/* Top Header: Avatar, Your Library, Search, Plus (+) (Screenshot #5) */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-md">
            MN
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Your Library</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/search')}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          >
            <Search className="w-6 h-6" />
          </button>

          {/* Plus (+) opens Create Sheet Modal (Screenshot #1) */}
          <button
            onClick={() => setIsCreateSheetOpen(true)}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          >
            <Plus className="w-7 h-7 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter('artists')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            filter === 'artists' ? 'bg-[#2a2a2a] text-white border border-white/20' : 'bg-[#181818] text-[#b3b3b3] hover:text-white'
          }`}
        >
          Artists
        </button>
        <button
          onClick={() => setFilter('playlists')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            filter === 'playlists' ? 'bg-[#2a2a2a] text-white border border-white/20' : 'bg-[#181818] text-[#b3b3b3] hover:text-white'
          }`}
        >
          Playlists
        </button>
      </div>

      {/* Recents and Grid toggle row (Screenshot #5) */}
      <div className="flex items-center justify-between mb-4 text-[#b3b3b3]">
        <div className="flex items-center gap-1.5 text-xs font-semibold hover:text-white cursor-pointer">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Recents</span>
        </div>
        <button className="p-1 hover:text-white transition-colors">
          <Grid className="w-4 h-4" />
        </button>
      </div>

      {/* "Import your music from other apps" Banner (Screenshot #5) */}
      <div
        onClick={() => setIsSpotifyImportOpen(true)}
        className="w-full bg-[#181818] hover:bg-[#202020] border border-white/5 rounded-2xl p-4 flex items-center justify-between mb-6 cursor-pointer active:scale-[0.99] transition-all shadow-md"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
            <Download className="w-5 h-5 text-spotify-green" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white">Import your music from other apps</h3>
            <span className="text-xs text-[#b3b3b3]">Sync Spotify, Apple Music & local files</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/50" />
      </div>

      {/* Circular Artist Avatar List (Screenshot #5) */}
      <div className="flex flex-col divide-y divide-white/5">
        {LIBRARY_ARTISTS.map((artist) => (
          <div
            key={artist.id}
            onClick={() => handleArtistClick(artist)}
            className="py-3 flex items-center gap-4 cursor-pointer group hover:bg-white/5 px-2 rounded-xl transition-colors"
          >
            <div className="w-14 h-14 rounded-full overflow-hidden bg-black shrink-0 border border-white/10 shadow-md group-hover:scale-105 transition-transform">
              <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-base font-bold text-white group-hover:text-spotify-green transition-colors truncate">
                {artist.name}
              </span>
              <span className="text-xs text-[#b3b3b3]">
                {loadingArtist === artist.name ? 'Loading official tracks...' : artist.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
