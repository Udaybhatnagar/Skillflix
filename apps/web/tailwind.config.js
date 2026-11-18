/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#211638',
        paper: '#FDFCFE',
        blue: '#7547EA',
        softblue: '#F2ECFC',
        warm: '#C6AFE8',
        border: '#E6DFED',
        muted: '#81768E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Inter', 'sans-serif'],
      },
      maxWidth: { site: '1280px' },
    },
  },
  plugins: [],
};
