import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          base: 'rgb(var(--wl-surface-1) / <alpha-value>)',
          card: 'rgb(var(--wl-surface-2) / <alpha-value>)',
          elevated: 'rgb(var(--wl-surface-3) / <alpha-value>)',
          hover: 'rgb(var(--wl-surface-4) / <alpha-value>)',
          active: 'rgb(var(--wl-surface-4) / <alpha-value>)',
          green: 'rgb(var(--wl-accent) / <alpha-value>)',
          'green-hover': 'rgb(var(--wl-accent-hover) / <alpha-value>)',
          'green-dark': '#169c46',
          subtext: 'rgb(var(--wl-muted) / <alpha-value>)',
          border: 'rgb(var(--wl-line) / <alpha-value>)',
          text: 'rgb(var(--wl-text) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-figtree)',
          'SpotifyMixUI',
          'CircularSp',
          'CircularStd',
          'Figtree',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        title: [
          'SpotifyMixUITitle',
          'CircularSpTitle',
          'var(--font-figtree)',
          'CircularSp',
          'sans-serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'scale-up': 'scaleUp 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
