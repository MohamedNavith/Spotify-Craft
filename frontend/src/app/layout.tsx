import type { Metadata, Viewport } from 'next';
import { Figtree } from 'next/font/google';
import InterfaceEffects from '../components/InterfaceEffects';
import AppUpdateChecker from '../components/AppUpdateChecker';
import AudioEngine from '../components/AudioEngine';
import BackButtonManager from '../components/BackButtonManager';
import CreateSheetModal from '../components/CreateSheetModal';
import { DiscordBotModal } from '../components/DiscordBotModal';
import DynamicIsland from '../components/DynamicIsland';
import MobileBottomNav from '../components/MobileBottomNav';
import NowPlayingPanel from '../components/NowPlayingPanel';
import PlayerBar from '../components/PlayerBar';
import ShareModal from '../components/ShareModal';
import Sidebar from '../components/Sidebar';
import SleepTimerModal from '../components/SleepTimerModal';
import StreamingQualityModal from '../components/StreamingQualityModal';
import TopBar from '../components/TopBar';
import VerciExperience from '../components/VerciExperience';
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
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/manifest.json`,
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/icon.svg`,
    shortcut: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`,
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/apple-touch-icon.png`,
  },
};

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${figtree.variable}`}>
      <body className={`${figtree.className} font-sans wl-shell w-full flex flex-col overflow-hidden`}>
        {/* Global Spotify Top Navigation Bar */}
        <a href="#main-content" className="wl-skip">Skip to content</a>
        <InterfaceEffects />
        <TopBar />

        {/* Main 3-Column Bento Shell */}
        <div className="flex-1 flex overflow-hidden min-h-0 px-2 pb-2 gap-2">
          {/* Left Navigation Sidebar ("Your Library") */}
          <Sidebar />

          {/* Main Content Viewport */}
          <main id="main-content" tabIndex={-1} className="wl-main wl-workspace wl-scroll min-w-0 flex-1 overflow-y-auto flex flex-col relative">
            {children}
          </main>

          {/* Right-Hand Spotify "Now Playing View" Drawer */}
          <NowPlayingPanel />
        </div>

        {/* Bottom Persistent Spotify Playback Bar */}
        <PlayerBar />

        {/* Dedicated Mobile Spotify Bottom Navigation Bar */}
        <MobileBottomNav />

        {/* Dedicated Lumn & Verci Cosmic Mode Visualizer */}
        <VerciExperience />

        {/* Floating Dynamic Island Media Controller (Mobile & Desktop) */}
        <DynamicIsland />

        {/* Global Social Share Modal (Snapchat, Instagram, WhatsApp) */}
        <ShareModal />

        {/* Sleep Timer Modal */}
        <SleepTimerModal />

        {/* Discord Bot Integration Modal */}
        <DiscordBotModal />

        {/* Apple Music Mobile Data & Streaming Quality Modal */}
        <StreamingQualityModal />

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
