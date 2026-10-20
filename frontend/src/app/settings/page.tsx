'use client';

import { Check, Download, Heart, Music, Plus, RefreshCw, Settings, Sparkles, Trash2, UserCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import { usePlayerStore } from '../../stores/usePlayerStore';

interface PopularArtist {
  name: string;
  image: string;
  genre: string;
}

const DEFAULT_POPULAR_ARTISTS: PopularArtist[] = [
  {
    name: 'Anirudh Ravichander',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
    genre: 'Tamil & Bollywood Rock',
  },
  {
    name: 'A.R. Rahman',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
    genre: 'Composer & Master',
  },
  {
    name: 'Arijit Singh',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
    genre: 'Soulful & Melodic',
  },
  {
    name: 'Taylor Swift',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300',
    genre: 'Pop & Singer-Songwriter',
  },
  {
    name: 'Billie Eilish',
    image: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=300',
    genre: 'Alternative Pop',
  },
  {
    name: 'Bruno Mars',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',
    genre: 'R&B & Funk',
  },
  {
    name: 'Sabrina Carpenter',
    image: 'https://images.unsplash.com/photo-1520523839898-50712213388b?w=300',
    genre: 'Pop & Dance',
  },
  {
    name: 'The Weeknd',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300',
    genre: 'Synthwave & R&B',
  },
  {
    name: 'Pritam',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300',
    genre: 'Bollywood Hits',
  },
  {
    name: 'Diljit Dosanjh',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300',
    genre: 'Punjabi & Global Fusion',
  },
  {
    name: 'Karan Aujla',
    image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=300',
    genre: 'Desi Hip-Hop',
  },
  {
    name: 'Sidhu Moose Wala',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=300',
    genre: 'Punjabi Legend',
  },
];

export default function SettingsPage() {
  const { playbackMode, togglePlaybackMode } = usePlayerStore();
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [customArtistInput, setCustomArtistInput] = useState('');
  const [audioQuality, setAudioQuality] = useState<'320' | '256' | '128'>('320');
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wavelength_favorite_artists');
      if (saved) {
        setFavoriteArtists(JSON.parse(saved));
      } else {
        // Default favorites
        const defaults = ['Taylor Swift', 'Arijit Singh', 'Bruno Mars', 'Anirudh Ravichander'];
        setFavoriteArtists(defaults);
        localStorage.setItem('wavelength_favorite_artists', JSON.stringify(defaults));
      }

      const savedQuality = localStorage.getItem('wavelength_audio_quality') as any;
      if (savedQuality) setAudioQuality(savedQuality);
    } catch {}
  }, []);

  const toggleFavorite = (name: string) => {
    const updated = favoriteArtists.includes(name)
      ? favoriteArtists.filter((a) => a !== name)
      : [...favoriteArtists, name];

    setFavoriteArtists(updated);
    localStorage.setItem('wavelength_favorite_artists', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wavelength_favorites_updated'));
  };

  const handleAddCustomArtist = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customArtistInput.trim();
    if (!name || favoriteArtists.includes(name)) return;

    const updated = [...favoriteArtists, name];
    setFavoriteArtists(updated);
    localStorage.setItem('wavelength_favorite_artists', JSON.stringify(updated));
    setCustomArtistInput('');
    window.dispatchEvent(new CustomEvent('wavelength_favorites_updated'));
  };

  const handleQualityChange = (q: '320' | '256' | '128') => {
    setAudioQuality(q);
    localStorage.setItem('wavelength_audio_quality', q);
  };

  return (
    <div className="flex flex-col min-h-full pb-32 md:pb-16 select-none">
      <TopBar />

      <div className="px-6 md:px-8 py-6 max-w-5xl mx-auto w-full flex flex-col gap-10">
        {/* Settings Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-spotify-elevated flex items-center justify-center text-spotify-green shadow-xl border border-white/5">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-spotify-green">
              Preferences &amp; Personalization
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-spotify-subtext mt-0.5">
              Customize your favorite artists, audio quality, and playback preferences
            </p>
          </div>
        </div>

        {/* Section 1: Favourite Singers & Artists */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Your Favourite Singers &amp; Artists
              </h2>
              <p className="text-xs text-spotify-subtext">
                Select your favorite singers so Wavelength can recommend their songs on your home screen
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-spotify-green bg-spotify-green/10 px-3 py-1 rounded-full">
              {favoriteArtists.length} Selected
            </span>
          </div>

          {/* Add Custom Artist Form */}
          <form onSubmit={handleAddCustomArtist} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={customArtistInput}
              onChange={(e) => setCustomArtistInput(e.target.value)}
              placeholder="Add another singer (e.g. Ed Sheeran, Adele...)"
              className="flex-1 bg-spotify-elevated border border-white/10 rounded-full px-4 py-2 text-xs md:text-sm text-white outline-none focus:border-spotify-green transition-colors"
            />
            <button
              type="submit"
              disabled={!customArtistInput.trim()}
              className="px-5 py-2 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add</span>
            </button>
          </form>

          {/* Artists Circular Grid (Spotify Style) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-2">
            {DEFAULT_POPULAR_ARTISTS.map((artist) => {
              const isSelected = favoriteArtists.includes(artist.name);
              return (
                <div
                  key={artist.name}
                  onClick={() => toggleFavorite(artist.name)}
                  className={`p-3 rounded-2xl flex flex-col items-center text-center gap-2.5 cursor-pointer transition-all duration-200 group relative border ${
                    isSelected
                      ? 'bg-spotify-green/10 border-spotify-green shadow-[0_0_20px_rgba(30,215,96,0.2)]'
                      : 'bg-spotify-card hover:bg-spotify-hover border-white/5'
                  }`}
                >
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-xl border-2 border-transparent group-hover:scale-105 transition-transform">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-spotify-green/30 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs md:text-sm font-bold text-white truncate max-w-[120px]">
                      {artist.name}
                    </span>
                    <span className="text-[10px] text-spotify-subtext truncate max-w-[110px]">
                      {artist.genre}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Audio & Playback Preferences */}
        <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Playback &amp; Audio Quality
            </h2>
            <p className="text-xs text-spotify-subtext">
              Fine-tune how music is fetched and played on your device
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Song Default vs Snippet */}
            <div className="p-5 rounded-2xl bg-spotify-card border border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Default Playback Mode</h3>
                <p className="text-xs text-spotify-subtext mt-0.5">
                  Play full 3-5 minute song streams by default
                </p>
              </div>

              <button
                onClick={togglePlaybackMode}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase transition-all border ${
                  playbackMode === 'full'
                    ? 'bg-spotify-green text-black border-spotify-green shadow-md'
                    : 'bg-white/10 text-white border-white/20'
                }`}
              >
                {playbackMode === 'full' ? '● Full Song (Active)' : '30s Snippet'}
              </button>
            </div>

            {/* Audio Quality */}
            <div className="p-5 rounded-2xl bg-spotify-card border border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Audio Streaming Bitrate</h3>
                <p className="text-xs text-spotify-subtext mt-0.5">
                  Master 320kbps MP3 / Lossless AAC audio
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {(['320', '256', '128'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQualityChange(q)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                      audioQuality === q
                        ? 'bg-white text-black font-extrabold'
                        : 'bg-white/10 text-spotify-subtext hover:text-white'
                    }`}
                  >
                    {q}k
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: App Releases & Offline Storage */}
        <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              App Information &amp; Updates
            </h2>
            <p className="text-xs text-spotify-subtext">
              Multi-platform builds for Android, Windows PC, and Web
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-r from-spotify-card via-spotify-elevated to-black border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-spotify-green">
                Installed Application Version
              </span>
              <h3 className="text-2xl font-black text-white font-mono mt-0.5">
                v1.3.0 (Latest Release)
              </h3>
              <p className="text-xs text-spotify-subtext mt-1">
                Full song streaming engine &bull; Lock screen notifications &bull; Spotify Mobile APK UI
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://github.com/MohamedNavith/Spotify-Craft/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-xs shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Download Latest APK / EXE</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
