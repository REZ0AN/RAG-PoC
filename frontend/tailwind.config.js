/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:        '#1a1a1a',
        sidebar:   '#141414',
        surface:   '#242424',
        hover:     '#2a2a2a',
        active:    '#303030',
        border:    '#2e2e2e',
        accent:    '#10a37f',
        'accent-h':'#0e9270',
        muted:     '#555555',
        sub:       '#999999',
        primary:   '#e8e8e8',
      },
      maxWidth: { chat: '720px' },
    },
  },
  plugins: [],
}