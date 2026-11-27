'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('wavelength-theme');
    const enabled = stored
      ? stored === 'light'
      : matchMedia('(prefers-color-scheme: light)').matches;
    setLight(enabled);
    document.documentElement.dataset.theme = enabled ? 'light' : 'dark';
  }, []);

  const toggle = () => {
    const theme = light ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('wavelength-theme', theme);
    setLight(!light);
  };

  const Icon = light ? Moon : Sun;
  const label = light ? 'Use dark theme' : 'Use light theme';

  return (
    <button
      type="button"
      className="wl-icon-button"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Icon size={18} />
    </button>
  );
}
