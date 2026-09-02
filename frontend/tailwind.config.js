/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          surface: 'rgba(255, 255, 255, 0.06)',
          card: 'rgba(255, 255, 255, 0.08)',
          'card-hover': 'rgba(255, 255, 255, 0.13)',
          border: 'rgba(255, 255, 255, 0.16)',
          'border-highlight': 'rgba(255, 255, 255, 0.3)',
          input: 'rgba(255, 255, 255, 0.08)',
        },
        aurora: {
          cyan: '#06B6D4',
          teal: '#14B8A6',
          emerald: '#10B981',
          mint: '#34D399',
          violet: '#8B5CF6',
          purple: '#A855F7',
          indigo: '#6366F1',
          rose: '#F43F5E',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glass-card': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.22), 0 12px 32px 0 rgba(0, 0, 0, 0.32)',
        'glass-card-hover': 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.38), 0 20px 48px -10px rgba(6, 182, 212, 0.3)',
        'glow-cyan': '0 0 30px -4px rgba(6, 182, 212, 0.45)',
        'glow-violet': '0 0 30px -4px rgba(139, 92, 246, 0.45)',
        'glow-emerald': '0 0 30px -4px rgba(16, 185, 129, 0.45)',
      },
      keyframes: {
        auroraFloat: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(40px, -60px) scale(1.15)' },
          '66%': { transform: 'translate(-30px, 40px) scale(0.95)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'aurora-slow': 'auroraFloat 18s ease-in-out infinite',
        'aurora-reverse': 'auroraFloat 22s ease-in-out infinite reverse',
        'shimmer': 'shimmer 2.5s infinite',
      }
    },
  },
  plugins: [],
}
