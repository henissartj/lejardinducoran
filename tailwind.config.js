/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Amiri', 'serif'],
      },
      colors: {
        'teal': {
          50: '#f0fdfc',
          100: '#ccfdf7',
          200: '#99fbf0',
          300: '#5ef4e6',
          400: '#2de4d7',
          500: '#43ada4',
          600: '#43ada4',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        'warm-gray': {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      animation: {
        'in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};