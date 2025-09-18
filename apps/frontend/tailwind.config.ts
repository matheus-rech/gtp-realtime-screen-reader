import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1A73E8',
        accent: '#F2994A'
      }
    }
  },
  plugins: []
};

export default config;
