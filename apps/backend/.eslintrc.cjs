module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'prettier'
  ],
  env: {
    node: true,
    es2022: true
  },
  ignorePatterns: ['dist', 'src/**/*.spec.ts'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json'
      },
      node: {
        extensions: ['.js', '.ts']
      }
    }
  },
  rules: {
    'import/no-unresolved': 'error',
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }]
  }
};
