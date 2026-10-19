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
          base: '#121212',
          card: '#181818',
          elevated: '#242424',
          hover: '#2a2a2a',
          active: '#333333',
          green: '#1ed760',
          'green-hover': '#1fdf64',
          'green-dark': '#169c46',
          subtext: '#b3b3b3',
          border: '#282828',
          text: '#ffffff',
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
