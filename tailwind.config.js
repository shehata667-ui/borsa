/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Cairo', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { 950: '#070d1c', 900: '#0b1428', 800: '#111c36', 700: '#1a2848', 600: '#27375e' },
        up: { DEFAULT: '#22c58b', soft: '#0f3d31' },
        down: { DEFAULT: '#f0586a', soft: '#44171f' },
        gold: '#d8b25a',
      },
    },
  },
  plugins: [],
};
