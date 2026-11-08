/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fuji: {
          dark: '#0f172a',      // Midnight Obsidian
          slate: '#1e293b',     // Deep Slate
          border: '#334155',    // Card Border
          crimson: '#e11d48',   // Fuji-Q Red (Torii Gate Accent)
          crimsonHover: '#be123c',
          indigo: '#4f46e5',    // High-tech Accent
          cyan: '#06b6d4',      // Telemetry Cyan
          emerald: '#10b981',   // Operational status
          amber: '#f59e0b',     // Wait alert
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
