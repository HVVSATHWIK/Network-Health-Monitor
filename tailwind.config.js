/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // The Deep Gunmetal Semantic Palette
        gunmetal: {
          950: '#020617', // Global Void
          900: '#0f172a', // Surface Level 1
          800: '#1e293b', // Surface Level 2 (Cards)
          700: '#334155', // UI Boundaries
          600: '#475569',
          500: '#64748b', // Muted Text
          400: '#94a3b8',
          300: '#cbd5e1', // Primary Body 
          200: '#e2e8f0',
          100: '#f1f5f9', // High Emphasis
        },
        alert: {
          critical: '#ef4444', // Red-500
          warning: '#f59e0b',  // Amber-500
          info: '#3b82f6',     // Blue-500
          success: '#10b981',  // Emerald-500
        },
        terminal: {
          bg: '#0c0e14', // specialized near-black
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
};
