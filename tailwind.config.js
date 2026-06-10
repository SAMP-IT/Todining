/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Warm "modern dining" palette
        ink: {
          DEFAULT: '#1c1714',
          soft: '#4a4039',
          muted: '#8a7d72',
        },
        cream: {
          DEFAULT: '#fbf7f1',
          deep: '#f4ece1',
        },
        ember: {
          50: '#fdf3ef',
          100: '#fbe2d8',
          200: '#f6c1ad',
          300: '#ef9a7c',
          400: '#e76f4b',
          500: '#d9521f', // primary accent
          600: '#bf3f12',
          700: '#9c3110',
          800: '#7c2912',
          900: '#662513',
        },
        sage: {
          50: '#f1f6f1',
          100: '#dde9dd',
          500: '#4f8a5b',
          600: '#3d6e48',
        },
        gold: {
          400: '#e0a83c',
          500: '#c98a1f',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,23,20,0.04), 0 4px 16px rgba(28,23,20,0.06)',
        lift: '0 8px 30px rgba(28,23,20,0.10)',
        glow: '0 0 0 4px rgba(217,82,31,0.12)',
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
