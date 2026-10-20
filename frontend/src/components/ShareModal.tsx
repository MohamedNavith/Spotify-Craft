'use client';

import { Check, Copy, Download, Image as ImageIcon, MessageCircle, Share2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

interface ColorTheme {
  id: string;
  name: string;
  gradient: string;
  dot: string;
  canvasTop: string;
  canvasMid: string;
  canvasBottom: string;
}

const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'slate',
    name: 'Slate Night',
    gradient: 'from-[#2a323d] via-[#12161a] to-black',
    dot: 'bg-[#2a323d]',
    canvasTop: '#2a323d',
    canvasMid: '#12161a',
    canvasBottom: '#050709',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    gradient: 'from-[#064e3b] via-[#022c22] to-black',
    dot: 'bg-[#064e3b]',
    canvasTop: '#064e3b',
    canvasMid: '#022c22',
    canvasBottom: '#01130e',
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    gradient: 'from-[#134e4a] via-[#042f2e] to-black',
    dot: 'bg-[#134e4a]',
    canvasTop: '#134e4a',
    canvasMid: '#042f2e',
    canvasBottom: '#011717',
  },
  {
    id: 'purple',
    name: 'Purple Velvet',
    gradient: 'from-[#4c1d95] via-[#2e1065] to-black',
    dot: 'bg-[#4c1d95]',
    canvasTop: '#4c1d95',
    canvasMid: '#2e1065',
    canvasBottom: '#100524',
  },
];

export default function ShareModal() {
  const { isShareModalOpen, closeShareModal, shareTrack, currentTrack } = usePlayerStore();
  const [mode, setMode] = useState<'song' | 'lyrics'>('song');
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(COLOR_THEMES[0]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isShareModalOpen) return null;

  const track = shareTrack || currentTrack;
  if (!track) return null;

  const songUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/Spotify-Craft/?track=${encodeURIComponent(track.title)}`
    : 'https://mohamednavith.github.io/Spotify-Craft/';

  const shareText = `Listening to "${track.title}" by ${track.artistName} on Wavelength! 🎧 Listen now: ${songUrl}`;

  // Helper to generate the Spotify-Style 9:16 Photo Card
  const generatePhotoBlob = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        // 1. Background Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 1920);
        grad.addColorStop(0, selectedTheme.canvasTop);
        grad.addColorStop(0.55, selectedTheme.canvasMid);
        grad.addColorStop(1, selectedTheme.canvasBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Header Branding
        ctx.fillStyle = '#1db954';
        ctx.beginPath();
        ctx.arc(100, 150, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('W', 100, 152);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('WAVELENGTH', 150, 150);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('SPOTIFY CRAFT', 980, 150);

        // Function to finish drawing rest of the card after image handling
        const finishCard = (hasImage = false, imgElement?: HTMLImageElement) => {
          const cardX = 140;
          const cardY = 320;
          const cardW = 800;
          const cardH = 800;

          // Draw Artwork or Fallback Card
          if (hasImage && imgElement) {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 40;
            ctx.shadowOffsetY = 20;

            // Clip to rounded rect
            const r = 36;
            ctx.beginPath();
            ctx.moveTo(cardX + r, cardY);
            ctx.lineTo(cardX + cardW - r, cardY);
            ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
            ctx.lineTo(cardX + cardW, cardY + cardH - r);
            ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
            ctx.lineTo(cardX + r, cardY + cardH);
            ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
            ctx.lineTo(cardX, cardY + r);
            ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(imgElement, cardX, cardY, cardW, cardH);
            ctx.restore();
          } else {
            // Elegant Fallback Box
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(cardX, cardY, cardW, cardH);
            ctx.fillStyle = '#1db954';
            ctx.font = 'bold 96px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('W', 540, 720);
          }

          // Track Title
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 56px sans-serif';
          ctx.textAlign = 'left';
          const displayTitle = track.title.length > 24 ? track.title.slice(0, 24) + '...' : track.title;
          ctx.fillText(displayTitle, 140, 1220);

          // Artist Name
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '40px sans-serif';
          const displayArtist = track.artistName.length > 30 ? track.artistName.slice(0, 30) + '...' : track.artistName;
          ctx.fillText(displayArtist, 140, 1290);

          // Spotify-Style Sound Wave Barcode
          const waveY = 1420;
          const waveHeightPattern = [30, 55, 80, 45, 90, 120, 60, 40, 110, 85, 45, 95, 125, 70, 35, 100, 75, 40, 60, 30];
          ctx.fillStyle = '#1db954';
          ctx.beginPath();
          ctx.arc(170, waveY, 32, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          waveHeightPattern.forEach((h, i) => {
            const bx = 230 + i * 36;
            const by = waveY - h / 2;
            ctx.beginPath();
            ctx.roundRect(bx, by, 14, h, 7);
            ctx.fill();
          });

          // Bottom Deep Link Badge
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.roundRect(140, 1600, 800, 110, 55);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#1db954';
          ctx.font = 'bold 30px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('▶ Tap to listen on Wavelength', 540, 1665);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '22px monospace';
          ctx.fillText('mohamednavith.github.io/Spotify-Craft', 540, 1770);

          canvas.toBlob((blob) => resolve(blob), 'image/png');
        };

        // Try loading retina artwork
        if (track.artworkUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => finishCard(true, img);
          img.onerror = () => finishCard(false);
          img.src = track.artworkUrl;
        } else {
          finishCard(false);
        }
      } catch {
        resolve(null);
      }
    });
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(songUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  // Primary Photo Sharing Handler (Snapchat, Instagram, Social Media)
  const handleSharePhoto = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePhotoBlob();
      if (!blob) throw new Error('Canvas generation failed');

      const fileName = `${track.title.replace(/[^a-zA-Z0-9]/g, '_')}_Wavelength.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${track.title} - Wavelength`,
          text: `Listening to "${track.title}" by ${track.artistName} on Wavelength! 🎧 ${songUrl}`,
        });
      } else {
        // Fallback: download the photo card directly and copy deep link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        await handleCopyLink();
        alert('Photo card saved to your device! Deep link copied to clipboard.');
      }
    } catch {
      await handleCopyLink();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPhoto = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePhotoBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title.replace(/[^a-zA-Z0-9]/g, '_')}_Wavelength.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleSnapchatShare = async () => {
    // Generate photo card and trigger native sharing sheet with Snapchat priority
    await handleSharePhoto();
  };

  const handleInstagramStories = async () => {
    await handleSharePhoto();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#181818] rounded-t-3xl border-t border-white/10 p-6 flex flex-col items-center shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4 shrink-0" />

        {/* Modal Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-white">Share photo card</span>
          <button
            onClick={closeShareModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shareable Photo Card Preview (Interactive) */}
        <div
          onClick={handleSharePhoto}
          title="Tap to share or download photo card"
          className={`w-[260px] aspect-[9/14] rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all duration-300 bg-gradient-to-b ${selectedTheme.gradient} border border-white/10 relative overflow-hidden cursor-pointer group hover:scale-[1.02] active:scale-95`}
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

          {/* Card Bottom Details & Sound Wave Indicator */}
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 backdrop-blur-sm flex items-center justify-between">
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

        {/* Primary Action Button: Share / Download Card Photo */}
        <div className="w-full flex items-center gap-3 my-4">
          <button
            onClick={handleSharePhoto}
            disabled={isGenerating}
            className="flex-1 py-3 px-4 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Photo Card...' : 'Share Photo Card'}</span>
          </button>

          <button
            onClick={handleDownloadPhoto}
            disabled={isGenerating}
            title="Download Card to Gallery"
            className="p-3 rounded-full bg-[#282828] hover:bg-[#333] text-white active:scale-90 transition-transform shadow-md"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle: Song | Lyrics */}
        <div className="flex bg-[#282828] p-1 rounded-full mb-3 border border-white/5">
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
        <div className="flex items-center gap-3 mb-5">
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
        <div className="w-full grid grid-cols-4 gap-3 pt-3 border-t border-white/10">
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
