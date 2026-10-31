/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      opacity: {
        '8': '0.08',
      },
      colors: {
        // Midnight Charcoal + Emerald Green + Soft White design tokens
        app: {
          bg: '#0B0F14',
          sidebar: '#10151C',
          card: '#151C25',
          elevated: '#1B2633',
          border: '#273241',
        },
        emerald: {
          DEFAULT: '#20C997',
          hover: '#16A87A',
          50: '#E6FAF4',
          100: '#C0F3E4',
          200: '#91E9D0',
          300: '#5FDEBA',
          400: '#34D399',
          500: '#20C997',
          600: '#16A87A',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        charcoal: {
          950: '#070A0E',
          900: '#0B0F14',
          850: '#10151C',
          800: '#151C25',
          700: '#1B2633',
          600: '#273241',
          500: '#37475D',
          400: '#4D617D',
        },
        content: {
          main: '#F5F7FA',
          secondary: '#A7B0BE',
          muted: '#778293',
        },
        ink: {
          DEFAULT: '#0B0F14',
          50: '#10151C',
          100: '#151C25',
          200: '#1B2633',
          300: '#273241',
          400: '#37475D',
        },
        rose: {
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        // Warm Lavender accent
        lavender: {
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        // Peachy accent
        peach: {
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
        },
      },
      fontFamily: {
        sans   : ['"DM Sans"','system-ui','sans-serif'],
        display: ['"Space Grotesk"','system-ui','sans-serif'],
        mono   : ['"JetBrains Mono"','monospace'],
      },
      animation: {
        'spin-slow' : 'spin 12s linear infinite',
        'eq'        : 'eq 1s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'slide-up'  : 'slideUp .3s ease-out',
        'fade-in'   : 'fadeIn .25s ease-out',
        'float'     : 'float 4s ease-in-out infinite',
        'waveform'  : 'waveform .6s ease-in-out infinite alternate',
        'shimmer'   : 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        eq       : { '0%,100%':{ height:'4px' }, '50%':{ height:'20px' } },
        glowPulse: { '0%,100%':{ opacity:.6 }, '50%':{ opacity:1 } },
        slideUp  : { from:{ opacity:0, transform:'translateY(12px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        fadeIn   : { from:{ opacity:0 }, to:{ opacity:1 } },
        float    : { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-8px)' } },
        waveform : { from:{ transform:'scaleY(0.3)' }, to:{ transform:'scaleY(1)' } },
        shimmer  : { from:{ backgroundPosition:'-200% center' }, to:{ backgroundPosition:'200% center' } },
      },
    },
  },
  plugins: [],
}
