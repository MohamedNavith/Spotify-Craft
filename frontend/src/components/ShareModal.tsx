'use client';

import { Check, Copy, MessageCircle, Share2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

const COLOR_THEMES = [
  { id: 'slate', name: 'Slate Night', gradient: 'from-[#2a323d] via-[#12161a] to-black', dot: 'bg-[#2a323d]' },
  { id: 'emerald', name: 'Emerald Forest', gradient: 'from-[#064e3b] via-[#022c22] to-black', dot: 'bg-[#064e3b]' },
  { id: 'teal', name: 'Ocean Teal', gradient: 'from-[#134e4a] via-[#042f2e] to-black', dot: 'bg-[#134e4a]' },
  { id: 'purple', name: 'Purple Velvet', gradient: 'from-[#4c1d95] via-[#2e1065] to-black', dot: 'bg-[#4c1d95]' },
];

export default function ShareModal() {
  const { isShareModalOpen, closeShareModal, shareTrack, currentTrack } = usePlayerStore();
  const [mode, setMode] = useState<'song' | 'lyrics'>('song');
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0]);
  const [copied, setCopied] = useState(false);

  if (!isShareModalOpen) return null;

  const track = shareTrack || currentTrack;
  if (!track) return null;

  const songUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/Spotify-Craft/?track=${encodeURIComponent(track.title)}`
    : 'https://mohamednavith.github.io/Spotify-Craft/';

  const shareText = `Listening to "${track.title}" by ${track.artistName} on Wavelength! 🎧 Listen now: ${songUrl}`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(songUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleSnapchatShare = () => {
    // Official Snapchat Creative Kit share web intent
    const snapUrl = `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(songUrl)}`;
    if (navigator.share) {
      navigator.share({
        title: track.title,
        text: shareText,
        url: songUrl,
      }).catch(() => window.open(snapUrl, '_blank'));
    } else {
      window.open(snapUrl, '_blank');
    }
  };

  const handleInstagramStories = () => {
    if (navigator.share) {
      navigator.share({
        title: track.title,
        text: shareText,
        url: songUrl,
      }).catch(() => handleCopyLink());
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#181818] rounded-t-3xl border-t border-white/10 p-6 flex flex-col items-center shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4 shrink-0" />

        {/* Modal Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-white">Share this song</span>
          <button
            onClick={closeShareModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shareable Card Preview (Spotify Style) */}
        <div
          className={`w-[260px] aspect-[9/14] rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all duration-300 bg-gradient-to-b ${selectedTheme.gradient} border border-white/10 relative overflow-hidden`}
        >
          {/* Card Top Branding */}
          <div className="flex items-center justify-between text-white/60">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-spotify-green flex items-center justify-center">
                <span className="text-[9px] font-black text-black">W</span>
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/80">Wavelength</span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">SPOTIFY CRAFT</span>
          </div>

          {/* Centerpiece: Mode-dependent */}
          {mode === 'song' ? (
            <div className="my-auto flex flex-col items-center">
              <div className="w-44 h-44 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
                {track.artworkUrl ? (
                  <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-spotify-green text-black font-black text-3xl">W</div>
                )}
              </div>
            </div>
          ) : (
            <div className="my-auto p-3 bg-black/40 rounded-xl border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-spotify-green mb-2" />
              <p className="text-xs font-semibold text-white/90 leading-relaxed italic">
                &ldquo;Hum tere bin ab reh nahin sakte, tere bina kya wajood mera...&rdquo;
              </p>
              <span className="text-[10px] text-spotify-green block mt-2 font-mono">— {track.artistName}</span>
            </div>
          )}

          {/* Card Bottom Details */}
          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 backdrop-blur-sm flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-bold text-white truncate">{track.title}</span>
              <span className="text-[10px] text-[#b3b3b3] truncate">{track.artistName}</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#1db954] flex items-center justify-center text-black shrink-0">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.215.352-.676.463-1.028.247-2.82-1.722-6.37-2.112-10.55-1.157-.402.092-.803-.158-.895-.56-.092-.403.158-.804.56-.896 4.58-1.045 8.508-.601 11.666 1.337.352.216.463.677.247 1.029zm1.47-3.267c-.27.44-.848.58-1.288.31-3.228-1.984-8.148-2.557-11.966-1.398-.498.151-1.027-.134-1.178-.632-.152-.498.134-1.028.632-1.179 4.37-1.326 9.8-1.09 13.49 1.61.44.27.58.849.31 1.289zm.126-3.41c-3.87-2.298-10.25-2.51-13.93-1.393-.593.18-1.222-.162-1.402-.756-.18-.593.162-1.222.756-1.402 4.238-1.287 11.286-1.036 15.753 1.616.534.316.71 1.007.394 1.54-.316.533-1.007.71-1.54.394l-.031.001z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Mode Toggle: Song | Lyrics */}
        <div className="flex bg-[#282828] p-1 rounded-full my-4 border border-white/5">
          <button
            onClick={() => setMode('song')}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
              mode === 'song' ? 'bg-white text-black shadow-md' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            Song
          </button>
          <button
            onClick={() => setMode('lyrics')}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
              mode === 'lyrics' ? 'bg-white text-black shadow-md' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            Lyrics
          </button>
        </div>

        {/* Color Palette Selector Dots */}
        <div className="flex items-center gap-3 mb-6">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme)}
              className={`w-7 h-7 rounded-full ${theme.dot} transition-transform active:scale-90 ${
                selectedTheme.id === theme.id ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
              }`}
              title={theme.name}
            />
          ))}
        </div>

        {/* Social Sharing Actions Row */}
        <div className="w-full grid grid-cols-4 gap-3 pt-4 border-t border-white/10">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#282828] group-hover:bg-[#333] flex items-center justify-center text-white transition-all active:scale-90 shadow-md">
              {copied ? <Check className="w-5 h-5 text-spotify-green" /> : <Copy className="w-5 h-5" />}
            </div>
            <span className="text-[11px] font-semibold text-[#b3b3b3] group-hover:text-white">
              {copied ? 'Copied!' : 'Copy link'}
            </span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white transition-all active:scale-90 shadow-md">
              <MessageCircle className="w-6 h-6 fill-white" />
            </div>
            <span className="text-[11px] font-semibold text-[#b3b3b3] group-hover:text-white">WhatsApp</span>
          </button>

          {/* Snapchat */}
          <button
            onClick={handleSnapchatShare}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#FFFC00] flex items-center justify-center text-black transition-all active:scale-90 shadow-md font-black text-lg">
              👻
            </div>
            <span className="text-[11px] font-semibold text-[#b3b3b3] group-hover:text-white">Snapchat</span>
          </button>

          {/* Instagram Stories */}
          <button
            onClick={handleInstagramStories}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white transition-all active:scale-90 shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#b3b3b3] group-hover:text-white">Stories</span>
          </button>
        </div>
      </div>
    </div>
  );
}
