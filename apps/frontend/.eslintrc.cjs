module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  env: {
    browser: true,
    es2021: true
  },
  plugins: ['@typescript-eslint', 'tailwindcss'],
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'plugin:tailwindcss/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
};
