'use client';

import { useEffect, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent<string>('wavelength:notice', { detail: message }));
}

export default function InterfaceEffects() {
  const artwork = usePlayerStore((state) => state.currentTrack?.artworkUrl);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.style.removeProperty('--wl-art');
    if (!artwork) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 12;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0, 12, 12);
      const pixels = context.getImageData(0, 0, 12, 12).data;
      const channels = [0, 0, 0];
      let total = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        const rgb = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
        const weight = (Math.max(...rgb) - Math.min(...rgb)) * pixels[offset + 3];
        total += weight;
        rgb.forEach((value, index) => {
          channels[index] += value * weight;
        });
      }
      if (total)
        main.style.setProperty(
          '--wl-art',
          channels.map((value) => Math.round(value / total)).join(' '),
        );
    };
    image.src = artwork;
    return () => {
      image.onload = null;
    };
  }, [artwork]);

  useEffect(() => {
    let timeout: number;
    const show = (event: Event) => {
      window.clearTimeout(timeout);
      setMessage((event as CustomEvent<string>).detail);
      timeout = window.setTimeout(() => setMessage(''), 3500);
    };
    window.addEventListener('wavelength:notice', show);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('wavelength:notice', show);
    };
  }, []);

  return (
    <div role="status" aria-atomic="true" className={message ? 'wl-toast' : 'sr-only'}>
      {message}
    </div>
  );
}
