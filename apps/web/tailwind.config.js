/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171C36',
        paper: '#F7F8FC',
        blue: '#5145CD',
        softblue: '#EDEBFF',
        warm: '#FFB09C',
        border: '#E4E6F0',
        muted: '#626B82',
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
