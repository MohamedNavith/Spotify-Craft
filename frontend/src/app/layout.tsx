import type { Metadata, Viewport } from 'next';
import { Figtree } from 'next/font/google';
import AppUpdateChecker from '../components/AppUpdateChecker';
import AudioEngine from '../components/AudioEngine';
import BackButtonManager from '../components/BackButtonManager';
import CreateSheetModal from '../components/CreateSheetModal';
import { DiscordBotModal } from '../components/DiscordBotModal';
import DynamicIsland from '../components/DynamicIsland';
import NowPlayingPanel from '../components/NowPlayingPanel';
import PlayerBar from '../components/PlayerBar';
import ShareModal from '../components/ShareModal';
import Sidebar from '../components/Sidebar';
import SleepTimerModal from '../components/SleepTimerModal';
import TopBar from '../components/TopBar';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Wavelength - Web Player: Music for everyone',
  description: 'Production-quality Spotify-style music streaming platform powered by Next.js and open licensed music APIs.',
  manifest: '/manifest.json',
  icons: {
    icon: './icon.svg',
    shortcut: './icon.svg',
    apple: './icon.svg',
  },
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
    <html lang="en" className={`dark ${figtree.variable}`}>
      <body className={`${figtree.className} font-sans h-screen w-screen flex flex-col overflow-hidden bg-black text-white select-none`}>
        {/* Global Spotify Top Navigation Bar */}
        <TopBar />

        {/* Main 3-Column Bento Shell */}
        <div className="flex-1 flex overflow-hidden min-h-0 px-2 pb-2 gap-2">
          {/* Left Navigation Sidebar ("Your Library") */}
          <Sidebar />

          {/* Main Content Viewport */}
          <main className="flex-1 bg-spotify-base rounded-lg overflow-y-auto custom-scrollbar flex flex-col relative pb-32 md:pb-0 border border-white/5 shadow-2xl">
            {children}
          </main>

          {/* Right-Hand Spotify "Now Playing View" Drawer */}
          <NowPlayingPanel />
        </div>

        {/* Bottom Persistent Spotify Playback Bar */}
        <PlayerBar />

        {/* Floating Dynamic Island Media Controller (Mobile & Desktop) */}
        <DynamicIsland />

        {/* Global Social Share Modal (Snapchat, Instagram, WhatsApp) */}
        <ShareModal />

        {/* Sleep Timer Modal */}
        <SleepTimerModal />

        {/* Discord Bot Integration Modal */}
        <DiscordBotModal />

        {/* Create (+) Modal Sheet */}
        <CreateSheetModal />

        {/* Android Hardware/Software Exit & Back Button Handler */}
        <BackButtonManager />

        {/* Audio Engine with Web Audio & Media Session API */}
        <AudioEngine />

        {/* Global In-App Version Checker & Update Prompt */}
        <AppUpdateChecker />
      </body>
    </html>
  );
}
