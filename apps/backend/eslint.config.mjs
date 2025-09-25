import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: {
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import': importPlugin
    },
    rules: {
      ...tseslint.configs['recommended-type-checked'].rules,
      'import/no-unresolved': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }]
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json'
        },
        node: {
          extensions: ['.js', '.ts']
        }
      }
    }
  },
  {
    ignores: ['dist', 'src/**/*.spec.ts']
  }
];