/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#142B36',
        paper: '#F3F7F7',
        blue: '#087F82',
        softblue: '#DDF3EF',
        warm: '#F4B860',
        border: '#DCE7E7',
        muted: '#596E78',
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
