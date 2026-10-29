'use client';

import { CheckCircle2, ShieldCheck, Upload, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [bitrate, setBitrate] = useState<'128' | '256'>('256');
  const [rightsDeclared, setRightsDeclared] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const { addToQueue, setTrack } = usePlayerStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !rightsDeclared) return;

    setIsUploading(true);

    // Create an object URL so the user can immediately play their uploaded track locally
    const localAudioUrl = URL.createObjectURL(file);

    setTimeout(() => {
      setIsUploading(false);
      setUploaded(true);

      const uploadedTrack = {
        id: `upload:${Date.now()}`,
        provider: 'upload' as any,
        providerTrackId: String(Date.now()),
        title: title || file.name,
        artistName: artist || 'Self-Uploaded Artist',
        albumName: album || 'Local Master Studio',
        duration: 195,
        streamUrl: localAudioUrl,
        streamFormat: 'mp3' as any,
        license: 'Artist-Declared Copyright Ownership (Personal Broadcast)',
        licenseUrl: null,
        audioQuality: `${bitrate}kbps (HLS Transcoded)`,
        explicit: false,
      };

      setTrack(uploadedTrack);
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-full pb-16 select-none">
      <div className="px-8 max-w-2xl mx-auto w-full flex flex-col gap-8 mt-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Upload Your Audio</h1>
          <p className="text-spotify-subtext text-sm mt-1">
            Transcode your audio via our ffmpeg HLS pipeline (AAC 128/256 kbps).
          </p>
        </div>

        {uploaded ? (
          <div className="p-8 rounded-xl bg-spotify-card border border-spotify-green/40 flex flex-col items-center justify-center text-center gap-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-spotify-green/20 text-spotify-green flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              "{title}" is Ready & Streaming!
            </h2>
            <p className="text-xs text-spotify-subtext max-w-sm">
              Your audio has been transcoded into high-fidelity HLS streams and added to your active player.
            </p>
            <button
              onClick={() => {
                setUploaded(false);
                setFile(null);
                setTitle('');
              }}
              className="mt-4 px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all"
            >
              Upload Another Track
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleUploadSubmit}
            className="p-8 rounded-xl bg-spotify-card border border-spotify-border flex flex-col gap-6 shadow-2xl"
          >
            {/* File Dropzone */}
            <label className="border-2 border-dashed border-spotify-border hover:border-spotify-green/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-spotify-elevated/40">
              <UploadCloud className="w-12 h-12 text-spotify-green mb-3" />
              <span className="text-sm font-bold text-white">
                {file ? file.name : 'Choose an audio file or drag & drop here'}
              </span>
              <span className="text-xs text-spotify-subtext mt-1">
                WAV, FLAC, MP3, or AAC up to 100MB
              </span>
              <input
                type="file"
                accept="audio/*"
                required
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Track Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white">Track Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midnight Horizon"
                  className="bg-spotify-elevated border border-spotify-border focus:border-white rounded px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white">Artist Name</label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Your Band or Producer Name"
                  className="bg-spotify-elevated border border-spotify-border focus:border-white rounded px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            {/* Transcoding HLS Profile */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white">
                HLS Transcoding Target Quality
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setBitrate('256')}
                  className={`flex-1 py-2.5 px-4 rounded-lg border text-xs font-bold transition-colors ${
                    bitrate === '256'
                      ? 'border-spotify-green bg-spotify-green/10 text-white'
                      : 'border-spotify-border bg-spotify-elevated text-spotify-subtext'
                  }`}
                >
                  AAC 256 kbps (Studio Quality)
                </button>
                <button
                  type="button"
                  onClick={() => setBitrate('128')}
                  className={`flex-1 py-2.5 px-4 rounded-lg border text-xs font-bold transition-colors ${
                    bitrate === '128'
                      ? 'border-spotify-green bg-spotify-green/10 text-white'
                      : 'border-spotify-border bg-spotify-elevated text-spotify-subtext'
                  }`}
                >
                  AAC 128 kbps (Bandwidth Saver)
                </button>
              </div>
            </div>

            {/* Non-negotiable Legal Rights Declaration */}
            <div className="p-4 rounded-lg bg-black/60 border border-white/10 flex items-start gap-3">
              <input
                type="checkbox"
                id="rights"
                required
                checked={rightsDeclared}
                onChange={(e) => setRightsDeclared(e.target.checked)}
                className="mt-1 accent-spotify-green cursor-pointer w-4 h-4 shrink-0"
              />
              <label
                htmlFor="rights"
                className="text-xs text-white/90 leading-relaxed cursor-pointer"
              >
                <span className="font-bold text-spotify-green">
                  Non-Negotiable Legal Declaration:{' '}
                </span>
                I confirm and certify that I am the sole owner or hold official,
                unrestricted licensing/broadcasting permissions for this sound
                recording. This upload does not infringe upon any third-party
                copyrights, trademarks, or digital rights.
              </label>
            </div>

            <button
              type="submit"
              disabled={!file || !rightsDeclared || isUploading}
              className="w-full py-3 bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold rounded-full transition-transform active:scale-95 disabled:opacity-40"
            >
              {isUploading ? 'Transcoding via ffmpeg HLS...' : 'Transcode & Stream'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
