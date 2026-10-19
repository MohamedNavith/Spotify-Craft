import type { Metadata, Viewport } from 'next';
import AudioEngine from '../components/AudioEngine';
import PlayerBar from '../components/PlayerBar';
import Sidebar from '../components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wavelength - Web Player: Music for everyone',
  description: 'Production-quality Spotify-style music streaming platform powered by Next.js and open licensed music APIs.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#121212',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen flex flex-col overflow-hidden bg-black text-white select-none">
        {/* Main Application Shell */}
        <div className="flex-1 flex overflow-hidden min-h-0 p-2 gap-2">
          {/* Left Navigation Sidebar */}
          <Sidebar />

          {/* Main Content Viewport */}
          <main className="flex-1 bg-spotify-base rounded-lg overflow-y-auto custom-scrollbar flex flex-col relative">
            {children}
          </main>
        </div>

        {/* Bottom Persistent Spotify Playback Bar */}
        <PlayerBar />

        {/* Audio Engine with Web Audio & Media Session API */}
        <AudioEngine />
      </body>
    </html>
  );
}
