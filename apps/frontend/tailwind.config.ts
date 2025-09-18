import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#05060a',
        surface: '#0f1118',
        accent: '#4f46e5'
      }
    }
  },
  plugins: []
};

export default config;
