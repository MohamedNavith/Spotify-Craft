'use client';

import {
  ArrowDownToLine,
  ArrowLeft,
  Check,
  Download,
  Heart,
  MoreVertical,
  Play,
  Plus,
  Share2,
  Shuffle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { UnifiedTrack } from '../../types';

const AASHIQUI_2_ALBUM: {
  id: string;
  title: string;
  artists: string;
  releaseDate: string;
  coverUrl: string;
  tracks: UnifiedTrack[];
} = {
  id: 'album:aashiqui-2',
  title: 'Aashiqui 2',
  artists: 'Mithoon • Ankit Tiwari • Jeet Gannguli',
  releaseDate: 'Album • 6 Apr 2013',
  coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/12/35/4a123561-1c5c-7d35-30df-5953018e69ee/8902894354228.jpg/600x600bb.jpg',
  tracks: [
    {
      id: 'official:tum-hi-ho',
      provider: 'official',
      providerTrackId: '633800685',
      title: 'Tum Hi Ho',
      artistName: 'Arijit Singh, Mithoon',
      albumName: 'Aashiqui 2',
      duration: 262,
      streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e0/65/55/e06555c8-1090-bb7f-94ad-0a5d45465551/mzaf_6436270634698547247.plus.aac.p.m4a',
      streamFormat: 'aac',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/12/35/4a123561-1c5c-7d35-30df-5953018e69ee/8902894354228.jpg/600x600bb.jpg',
      license: 'T-Series / Official Release',
      audioQuality: '320kbps (Master Studio)',
      explicit: false,
      year: 2013,
      genres: ['Bollywood', 'Romantic'],
    },
    {
      id: 'official:sunn-raha-hai',
      provider: 'official',
      providerTrackId: '633800686',
      title: 'Sunn Raha Hai',
      artistName: 'Ankit Tiwari, Sandeep Nath',
      albumName: 'Aashiqui 2',
      duration: 390,
      streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e0/65/55/e06555c8-1090-bb7f-94ad-0a5d45465551/mzaf_6436270634698547247.plus.aac.p.m4a',
      streamFormat: 'aac',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/12/35/4a123561-1c5c-7d35-30df-5953018e69ee/8902894354228.jpg/600x600bb.jpg',
      license: 'T-Series / Official Release',
      audioQuality: '320kbps (Master Studio)',
      explicit: false,
      year: 2013,
      genres: ['Bollywood', 'Rock'],
    },
    {
      id: 'official:chahun-main-ya-naa',
      provider: 'official',
      providerTrackId: '633800687',
      title: 'Chahun Main Ya Naa',
      artistName: 'Palak Muchhal, Arijit Singh, Jeet Gannguli',
      albumName: 'Aashiqui 2',
      duration: 304,
      streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e0/65/55/e06555c8-1090-bb7f-94ad-0a5d45465551/mzaf_6436270634698547247.plus.aac.p.m4a',
      streamFormat: 'aac',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/12/35/4a123561-1c5c-7d35-30df-5953018e69ee/8902894354228.jpg/600x600bb.jpg',
      license: 'T-Series / Official Release',
      audioQuality: '320kbps (Master Studio)',
      explicit: false,
      year: 2013,
      genres: ['Bollywood', 'Romantic'],
    },
    {
      id: 'official:milne-hai-mujhse-aayi',
      provider: 'official',
      providerTrackId: '633800688',
      title: 'Milne Hai Mujhse Aayi',
      artistName: 'Arijit Singh, Jeet Gannguli, Irshad Kamil',
      albumName: 'Aashiqui 2',
      duration: 295,
      streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e0/65/55/e06555c8-1090-bb7f-94ad-0a5d45465551/mzaf_6436270634698547247.plus.aac.p.m4a',
      streamFormat: 'aac',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/12/35/4a123561-1c5c-7d35-30df-5953018e69ee/8902894354228.jpg/600x600bb.jpg',
      license: 'T-Series / Official Release',
      audioQuality: '320kbps (Master Studio)',
      explicit: false,
      year: 2013,
      genres: ['Bollywood', 'Romantic'],
    },
    {
      id: 'official:hum-mar-jayenge',
      provider: 'official',
      providerTrackId: '633800689',
      title: 'Hum Mar Jayenge',
      artistName: 'Tulsi Kumar, Arijit Singh, Jeet Gannguli',
      albumName: 'Aashiqui 2',
      duration: 306,
      streamUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e0/65/55/e06555c8-1090-bb7f-94ad-0a5d45465551/mzaf_6436270634698547247.plus.aac.p.m4a',
      streamFormat: 'aac',
      artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4a/12/35/4a123561-1c5c-7d35-30df-5953018e69ee/8902894354228.jpg/600x600bb.jpg',
      license: 'T-Series / Official Release',
      audioQuality: '320kbps (Master Studio)',
      explicit: false,
      year: 2013,
      genres: ['Bollywood'],
    },
  ],
};

function AlbumViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const { setTrack, currentTrack, isPlaying, openShareModal } = usePlayerStore();

  const album = AASHIQUI_2_ALBUM;

  const handlePlayAll = () => {
    if (album.tracks.length > 0) {
      setTrack(album.tracks[0], album.tracks);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-[#0b3b32] via-[#121212] to-[#121212] text-white p-4 md:p-8 select-none pb-28">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => openShareModal(album.tracks[0])}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Album Artwork & Metadata Header (Screenshot #4) */}
      <div className="flex flex-col items-start gap-4 mb-6">
        <div className="w-52 md:w-64 aspect-square rounded-xl overflow-hidden shadow-2xl border border-white/10 mx-auto md:mx-0">
          <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col mt-2">
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">{album.title}</h1>
          <p className="text-xs md:text-sm font-semibold text-white/90 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-spotify-green" />
            <span>{album.artists}</span>
          </p>
          <span className="text-[11px] text-[#b3b3b3] mt-1">{album.releaseDate}</span>
        </div>
      </div>

      {/* Action Row: (+), Download, Share, Shuffle, Big Green Play Button */}
      <div className="flex items-center justify-between py-2 mb-6">
        <div className="flex items-center gap-4">
          {/* Add to library */}
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white active:scale-75 transition-transform"
          >
            <Plus className={`w-5 h-5 ${isSaved ? 'text-spotify-green' : ''}`} />
          </button>

          {/* Download */}
          <button
            onClick={() => setIsDownloaded(!isDownloaded)}
            className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white active:scale-75 transition-transform"
          >
            {isDownloaded ? (
              <Check className="w-4 h-4 text-spotify-green" />
            ) : (
              <Download className="w-4 h-4 text-white" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={() => openShareModal(album.tracks[0])}
            className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white active:scale-75 transition-transform"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>

          {/* Shuffle Toggle */}
          <button className="text-spotify-green p-1 active:scale-75 transition-transform">
            <Shuffle className="w-6 h-6" />
          </button>
        </div>

        {/* Big Green Circular Play Button (Screenshot #4) */}
        <button
          onClick={handlePlayAll}
          className="w-14 h-14 rounded-full bg-spotify-green hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl transition-all"
        >
          <Play className="w-7 h-7 fill-black ml-1" />
        </button>
      </div>

      {/* Tracklist List (Screenshot #4) */}
      <div className="flex flex-col divide-y divide-white/5">
        {album.tracks.map((track, i) => {
          const isTrackPlaying = currentTrack?.id === track.id && isPlaying;
          return (
            <div
              key={track.id}
              onClick={() => setTrack(track, album.tracks)}
              className="py-3 flex items-center justify-between cursor-pointer group hover:bg-white/5 px-2 rounded-lg transition-colors"
            >
              <div className="flex flex-col min-w-0 pr-4">
                <span className={`text-base font-bold truncate ${isTrackPlaying ? 'text-spotify-green' : 'text-white'}`}>
                  {track.title}
                </span>
                <span className="text-xs text-[#b3b3b3] truncate mt-0.5">{track.artistName}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openShareModal(track);
                  }}
                  className="p-1 text-[#b3b3b3] hover:text-white"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AlbumPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading album...</div>}>
      <AlbumViewContent />
    </Suspense>
  );
}
