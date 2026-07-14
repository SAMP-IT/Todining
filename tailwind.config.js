/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Warm Editorial — printed-page palette (see DESIGN.md).
        // Token NAMES are frozen; only values are tuned so every existing
        // className inherits the new look with no edits.
        ink: {
          DEFAULT: '#2a211b', // warm near-black, never pure #000
          soft: '#5a4c42',
          muted: '#8a7d6f',
        },
        cream: {
          DEFAULT: '#faf6ef', // paper
          deep: '#f3ebdf',
          3: '#ece0d0',
        },
        ember: {
          50: '#fbf1ec',
          100: '#f6e2d6',
          200: '#eec3ac',
          300: '#e19b78',
          400: '#d06a3c',
          500: '#c0451c', // primary action
          600: '#a53a16',
          700: '#872f13',
          800: '#6e2914',
          900: '#5b2413',
        },
        sage: {
          // deep bottle green — "live / served / success"
          50: '#eef4ef',
          100: '#dbeade',
          200: '#b9d3bf',
          300: '#8fb79a',
          400: '#5f9370',
          500: '#3d6b4c',
          600: '#305640',
        },
        gold: {
          // antique gold — signatures / ratings
          100: '#efe0c2',
          200: '#e3cb9a',
          300: '#d0ad63',
          400: '#b0862f',
          500: '#8f6a22',
          600: '#6f521a',
        },
      },
      borderRadius: {
        xl: '0.7rem',
        '2xl': '1rem',
        '3xl': '1.4rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(42,33,27,0.04), 0 8px 24px -16px rgba(42,33,27,0.18)',
        lift: '0 20px 40px -20px rgba(42,33,27,0.22)',
        glow: '0 0 0 4px rgba(192,69,28,0.14)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulse_ring: {
          '0%': { boxShadow: '0 0 0 0 rgba(217,82,31,0.45)' },
          '70%': { boxShadow: '0 0 0 10px rgba(217,82,31,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(217,82,31,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
        'pulse-ring': 'pulse_ring 1.8s infinite',
      },
    },
  },
  plugins: [],
};
