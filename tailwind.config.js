/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Waveform channel accents (also referenced in canvas rendering)
        pressure: '#38bdf8', // sky-400
        flow: '#34d399',     // emerald-400
        volume: '#f59e0b',   // amber-500
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
