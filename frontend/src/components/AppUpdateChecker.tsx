'use client';

import { ArrowDownToLine, Check, Download, RefreshCw, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export const CURRENT_APP_VERSION = 'v1.3.1';

interface ReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface LatestReleaseInfo {
  tag_name: string;
  name: string;
  body: string;
  assets: ReleaseAsset[];
  html_url: string;
}

export default function AppUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<LatestReleaseInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'windows' | 'web'>('web');

  // Detect platform on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android') || (window as any).Capacitor) {
      setPlatform('android');
    } else if (ua.includes('electron') || (window as any).electron || ua.includes('windows')) {
      setPlatform('windows');
    } else {
      setPlatform('web');
    }
  }, []);

  // Check for updates on startup
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const lastDismissed = localStorage.getItem('wavelength_update_dismissed');
        if (lastDismissed && Date.now() - parseInt(lastDismissed, 10) < 12 * 60 * 60 * 1000) {
          return; // Dismissed recently
        }

        const res = await fetch('https://api.github.com/repos/MohamedNavith/Spotify-Craft/releases/latest', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });

        if (!res.ok) return;
        const data: LatestReleaseInfo = await res.json();

        if (data.tag_name && data.tag_name !== CURRENT_APP_VERSION) {
          setUpdateInfo(data);
          setIsOpen(true);
        }
      } catch (e) {
        // Network or rate limit offline, ignore
      }
    };

    checkUpdate();
  }, []);

  if (!isOpen || !updateInfo) return null;

  const apkAsset = updateInfo.assets.find((a) => a.name.endsWith('.apk'));
  const exeAsset = updateInfo.assets.find((a) => a.name.endsWith('.exe'));
  const zipAsset = updateInfo.assets.find((a) => a.name.endsWith('.zip'));

  const handleDismiss = () => {
    localStorage.setItem('wavelength_update_dismissed', String(Date.now()));
    setIsOpen(false);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-[#242424] border border-spotify-border w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-spotify-green">
                Update Available
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Wavelength {updateInfo.tag_name}
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-spotify-subtext hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description / Release Notes */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 max-h-40 overflow-y-auto text-xs text-spotify-subtext custom-scrollbar space-y-1.5 leading-relaxed">
          <p className="font-semibold text-white">
            A new version is ready with full-length streaming, enhanced touch response, and offline caching.
          </p>
          <div className="whitespace-pre-line font-mono text-[11px] text-gray-300">
            {updateInfo.body ? updateInfo.body.slice(0, 300) + '...' : 'General performance improvements and audio engine upgrades.'}
          </div>
        </div>

        {/* Current vs New Version Pill */}
        <div className="flex items-center justify-between text-xs px-1 text-spotify-subtext font-mono">
          <span>Current: <strong className="text-white">{CURRENT_APP_VERSION}</strong></span>
          <span>Latest: <strong className="text-spotify-green">{updateInfo.tag_name}</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-1">
          {/* Primary Action depending on platform */}
          {platform === 'android' && apkAsset && (
            <a
              href={apkAsset.browser_download_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDismiss}
              className="w-full py-3 px-4 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download Android APK ({formatSize(apkAsset.size)})</span>
            </a>
          )}

          {platform === 'windows' && exeAsset && (
            <a
              href={exeAsset.browser_download_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDismiss}
              className="w-full py-3 px-4 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download Windows Installer ({formatSize(exeAsset.size)})</span>
            </a>
          )}

          {platform === 'web' && (
            <button
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then((regs) => {
                    regs.forEach((r) => r.update());
                  });
                }
                window.location.reload();
              }}
              className="w-full py-3 px-4 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>Reload Web App (Instant Update)</span>
            </button>
          )}

          {/* Fallback to Releases page */}
          <a
            href={updateInfo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <span>View All Downloads on GitHub</span>
          </a>

          <button
            onClick={handleDismiss}
            className="text-xs text-spotify-subtext hover:text-white py-1 transition-colors"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
}
