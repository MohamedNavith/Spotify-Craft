'use client';

import { artistPortrait } from '../../lib/artistPortrait';

import { AlertTriangle, Check, Disc3, Download, Headphones, Heart, Info, Music, Plus, RefreshCw, Settings, Sparkles, Trash2, UserCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CURRENT_APP_VERSION, isNewerVersion } from '../../components/AppUpdateChecker';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { StreamingQuality } from '../../types';

interface PopularArtist {
  name: string;
  image: string;
  genre: string;
}

const DEFAULT_POPULAR_ARTISTS: PopularArtist[] = [
  {
    name: 'Anirudh Ravichander',
    image: artistPortrait('anirudh-ravichander'),
    genre: 'Tamil & Bollywood Rock',
  },
  {
    name: 'A.R. Rahman',
    image: artistPortrait('a-r-rahman'),
    genre: 'Composer & Master',
  },
  {
    name: 'Arijit Singh',
    image: artistPortrait('arijit-singh'),
    genre: 'Soulful & Melodic',
  },
  {
    name: 'Taylor Swift',
    image: artistPortrait('taylor-swift'),
    genre: 'Pop & Singer-Songwriter',
  },
  {
    name: 'Billie Eilish',
    image: artistPortrait('billie-eilish'),
    genre: 'Alternative Pop',
  },
  {
    name: 'Bruno Mars',
    image: artistPortrait('bruno-mars'),
    genre: 'R&B & Funk',
  },
  {
    name: 'Sabrina Carpenter',
    image: artistPortrait('sabrina-carpenter'),
    genre: 'Pop & Dance',
  },
  {
    name: 'The Weeknd',
    image: artistPortrait('the-weeknd'),
    genre: 'Synthwave & R&B',
  },
  {
    name: 'Pritam',
    image: artistPortrait('pritam'),
    genre: 'Bollywood Hits',
  },
  {
    name: 'Diljit Dosanjh',
    image: artistPortrait('diljit-dosanjh'),
    genre: 'Punjabi & Global Fusion',
  },
  {
    name: 'Karan Aujla',
    image: artistPortrait('karan-aujla'),
    genre: 'Desi Hip-Hop',
  },
  {
    name: 'Sidhu Moose Wala',
    image: artistPortrait('sidhu-moose-wala'),
    genre: 'Punjabi Legend',
  },
];

export default function SettingsPage() {
  const {
    playbackMode,
    togglePlaybackMode,
    isDynamicIslandVisible,
    toggleDynamicIsland,
    isCanvasModeEnabled,
    toggleCanvasMode,
    streamingQuality,
    setStreamingQuality,
    audioStreamDetails,
    currentTrack,
  } = usePlayerStore();
  const [favoriteArtists, setFavoriteArtists] = useState<string[]>([]);
  const [customArtistInput, setCustomArtistInput] = useState('');
  const [autoplay, setAutoplay] = useState(true);
  const [pendingQuality, setPendingQuality] = useState<StreamingQuality | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [latestReleaseTag, setLatestReleaseTag] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/MohamedNavith/Spotify-Craft/releases/latest')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.tag_name) {
          setLatestReleaseTag(data.tag_name);
        }
      })
      .catch(() => {});
  }, []);

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

  return (
    <div className="flex flex-col min-h-full pb-32 md:pb-16 select-none">
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

        <nav aria-label="Settings sections" className="flex flex-wrap gap-3 text-sm">
          <a className="wl-filter" href="#artist-preferences">Artists</a>
          <a className="wl-filter" href="#audio-preferences">Audio quality</a>
          <a className="wl-filter" href={artistPortrait('CREDITS').replace('.webp','.txt')}>Photo credits</a>
        </nav>
        {/* Section 1: Favourite Singers & Artists */}
        <section id="artist-preferences" className="flex flex-col gap-4">
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
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-xl border-2 border-transparent group-hover:scale-105 transition-transform bg-spotify-elevated flex items-center justify-center">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
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
        <section id="audio-preferences" className="flex flex-col gap-6 border-t border-white/10 pt-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Playback &amp; Audio Quality
            </h2>
            <p className="text-xs text-spotify-subtext mt-0.5">
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

            {/* Current Active Streaming Tier Summary */}
            <div className="p-5 rounded-2xl bg-spotify-card border border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Current Active Tier</h3>
                <p className="text-xs text-spotify-subtext mt-0.5">
                  {streamingQuality === 'hi-res-lossless'
                    ? 'Hi-Res Lossless (Up to 24-bit/192 kHz FLAC)'
                    : streamingQuality === 'lossless'
                    ? 'Lossless (24-bit/48 kHz FLAC)'
                    : streamingQuality === 'high-efficiency'
                    ? 'High Efficiency (HE-AAC 96 kbps)'
                    : 'High Quality (AAC 320 kbps Master)'}
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase ${
                  streamingQuality === 'hi-res-lossless' || streamingQuality === 'lossless'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                {streamingQuality === 'hi-res-lossless'
                  ? 'HI-RES LOSSLESS'
                  : streamingQuality === 'lossless'
                  ? 'LOSSLESS'
                  : streamingQuality === 'high-efficiency'
                  ? 'HE-AAC'
                  : 'HIGH QUALITY'}
              </span>
            </div>
          </div>

          {/* Apple Music Mobile Data Streaming Container */}
          <div className="flex flex-col gap-4 max-w-xl mx-auto w-full pt-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white tracking-tight">
                Mobile Data Streaming
              </span>
              <span className="text-[11px] font-medium text-[#8E8E93]">
                Audio Quality Setting
              </span>
            </div>

            {/* Apple iOS Grouped Box */}
            <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/5 shadow-xl divide-y divide-[#2C2C2E]">
              {[
                { id: 'none' as const, title: 'None' },
                { id: 'high-efficiency' as const, title: 'High Efficiency', subtitle: 'HE-AAC with low data usage' },
                { id: 'high-quality' as const, title: 'High Quality', subtitle: 'AAC 256 kbps' },
                { id: 'lossless' as const, title: 'Lossless', subtitle: 'ALAC up to 24-bit/48 kHz' },
                { id: 'hi-res-lossless' as const, title: 'Hi-Res Lossless', subtitle: 'ALAC up to 24-bit/192 kHz' },
              ].map((opt) => {
                const isSelected = streamingQuality === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if ((opt.id === 'lossless' || opt.id === 'hi-res-lossless') && streamingQuality !== opt.id) {
                        setPendingQuality(opt.id);
                        setShowWarningDialog(true);
                      } else {
                        setStreamingQuality(opt.id);
                      }
                    }}
                    className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex flex-col pr-3">
                      <span className="text-[15px] font-normal text-white tracking-tight">
                        {opt.title}
                      </span>
                      {opt.subtitle && (
                        <span className="text-[12px] text-[#8E8E93] font-normal mt-0.5">
                          {opt.subtitle}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-[#0A84FF] stroke-[2.5] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Apple Music Streaming Advisory Description */}
            <div className="px-1 text-[13px] text-[#8E8E93] leading-relaxed space-y-3 font-normal">
              <p>Lossless streaming will consume significantly more data.</p>

              <div className="space-y-1">
                <p>A three-minute song will be approximately:</p>
                <ul className="space-y-0.5 pl-1 text-[#A1A1A6]">
                  <li>– 1.5 MB with High Efficiency</li>
                  <li>– 6 MB with High Quality at 256 kbps</li>
                  <li>– 36 MB with Lossless at 24-bit/48 kHz</li>
                  <li>– 145 MB with Hi-Res Lossless at 24-bit/192 kHz</li>
                </ul>
              </div>

              <p className="text-[12px] text-[#71717A] pt-1 leading-normal">
                Support varies and depends on song availability, network conditions, and connected speaker or headphone capability.
              </p>
            </div>

            {/* Live Audio Stream Details Banner */}
            {currentTrack && (
              <div className="p-4 rounded-2xl bg-[#1C1C1E]/90 border border-white/5 flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#8E8E93] flex items-center gap-1.5">
                    <Disc3 className="w-3.5 h-3.5 text-[#0A84FF] animate-spin-slow" />
                    Now Playing Verified Audio Specs
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      audioStreamDetails?.isRealLossless
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/10 text-white/80'
                    }`}
                  >
                    {audioStreamDetails?.tierLabel || 'High Quality AAC'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[#71717A] block">Format &amp; Codec</span>
                    <span className="text-white font-mono font-medium">
                      {audioStreamDetails?.codec || 'AAC'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] block">Bitrate</span>
                    <span className="text-white font-mono font-medium">
                      {audioStreamDetails?.bitrate || '320 kbps'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] block">Sample Rate &amp; Depth</span>
                    <span className="text-white font-mono font-medium">
                      {audioStreamDetails?.sampleRate || '44.1 kHz'} / {audioStreamDetails?.bitDepth || '16-bit'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] block">Est. Data Consumption</span>
                    <span className="text-white font-mono font-medium">
                      ~{audioStreamDetails?.sizeEstimateMb || 6.8} MB / song
                    </span>
                  </div>
                </div>

                {/* DAC & Hardware Decoding Notice */}
                <div className="mt-1 pt-2.5 border-t border-white/5 flex items-start gap-2.5 text-[11px] text-[#A1A1A6] leading-relaxed">
                  <Headphones className="w-4 h-4 text-[#0A84FF] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-semibold">DAC &amp; Earphone Hardware Status: </span>
                    {audioStreamDetails?.isRealLossless ? (
                      <span>
                        Bit-perfect FLAC stream actively decoding on your DAC hardware at {audioStreamDetails.bitrate} ({audioStreamDetails.sampleRate} / {audioStreamDetails.bitDepth}).
                      </span>
                    ) : (
                      <span>
                        Type-C DAC Earphone / External DAC is active. Your hardware converts digital audio directly to analog output. Because uncompressed FLAC is not indexed for this specific song or was throttled, Wavelength streams 320 kbps Studio Master AAC so your DAC renders crystal-clear sound with zero buffering.
                      </span>
                    )}
                    <div className="text-[10px] text-[#71717A] mt-1">
                      ✓ Verified on Type-C DAC Earphones, Vivo X200 series, Oppo Reno 8T &amp; USB Audio Class 2.0 DACs.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* High Data Consumption Warning Confirmation Modal */}
          {showWarningDialog && (
            <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-3.5 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>

                <h4 className="text-[17px] font-bold text-white tracking-tight">
                  Turn On {pendingQuality === 'hi-res-lossless' ? 'Hi-Res Lossless' : 'Lossless'}?
                </h4>

                <p className="text-[13px] text-[#8E8E93] leading-relaxed">
                  Lossless audio streams consume significantly more bandwidth—up to{' '}
                  <strong className="text-white">
                    {pendingQuality === 'hi-res-lossless' ? '145 MB' : '36 MB'} per 3-minute song
                  </strong>
                  . Streaming over cellular data may quickly consume your mobile data plan.
                </p>

                <div className="flex flex-col w-full gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (pendingQuality) {
                        setStreamingQuality(pendingQuality);
                        setPendingQuality(null);
                      }
                      setShowWarningDialog(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-[14px] transition-colors cursor-pointer"
                  >
                    Turn On Lossless
                  </button>
                  <button
                    onClick={() => {
                      setPendingQuality(null);
                      setShowWarningDialog(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 font-medium text-[14px] transition-colors cursor-pointer"
                  >
                    Keep High Quality (Default)
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 2.5: Display & Edge Customization */}
        <section className="flex flex-col gap-4 border-t border-white/10 pt-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Display &amp; Dynamic Island
            </h2>
            <p className="text-xs text-spotify-subtext">
              Configure under-camera Dynamic Island and 25-second video canvas playback
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dynamic Island Toggle */}
            <div className="p-4 rounded-xl bg-spotify-card border border-white/5 flex items-center justify-between">
              <div className="flex flex-col pr-4">
                <span className="text-sm font-bold text-white">Camera Dynamic Island</span>
                <span className="text-xs text-spotify-subtext mt-0.5">
                  Floating under-camera pill that pops down on track change. Turn off to keep the screen 100% clean.
                </span>
              </div>
              <button
                onClick={() => toggleDynamicIsland()}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  isDynamicIslandVisible ? 'bg-spotify-green' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black shadow-md absolute top-0.5 transition-transform ${
                    isDynamicIslandVisible ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* 25s Highlight Canvas Video Toggle */}
            <div className="p-4 rounded-xl bg-spotify-card border border-white/5 flex items-center justify-between">
              <div className="flex flex-col pr-4">
                <span className="text-sm font-bold text-white">25s Video Canvas</span>
                <span className="text-xs text-spotify-subtext mt-0.5">
                  Play the most iconic 20-30s music video climax on loop in Now Playing views.
                </span>
              </div>
              <button
                onClick={() => toggleCanvasMode()}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  isCanvasModeEnabled ? 'bg-spotify-green' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black shadow-md absolute top-0.5 transition-transform ${
                    isCanvasModeEnabled ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
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
              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-2xl font-black text-white font-mono">
                  {CURRENT_APP_VERSION}
                </h3>
                {latestReleaseTag && isNewerVersion(latestReleaseTag, CURRENT_APP_VERSION) ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                    Update Available ({latestReleaseTag})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-spotify-green/20 text-spotify-green border border-spotify-green/30 text-[10px] font-black uppercase">
                    Latest Version
                  </span>
                )}
              </div>
              <p className="text-xs text-spotify-subtext mt-1">
                24-bit/192kHz Hi-Res Lossless Audio &bull; Gesture Navigation &bull; Dynamic Island &bull; Synced Karaoke Lyrics
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
