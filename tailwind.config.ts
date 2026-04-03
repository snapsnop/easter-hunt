import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        easter: {
          yellow: '#FEF08A',
          orange: '#FB923C',
          pink: '#F9A8D4',
          purple: '#C4B5FD',
          green: '#86EFAC',
          blue: '#93C5FD',
        }
      },
      fontFamily: {
        rounded: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
