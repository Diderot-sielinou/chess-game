// eslint.config.mjs
import eslint from '@eslint/js';
import globals from 'globals';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts'], // ✅ ici on dit quels fichiers on veut lint

    ignores: [
      'eslint.config.mjs',
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.tsbuildinfo',
      '.env',
      '.env.*',
      'logs/**',
      '*.log',
      'test-results/**',
      'tests/**',
      '*.spec.ts',
      '*.test.ts',
      '*.js',
      '*.js.map',
      '*.d.ts',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.vscode/**',
      '.idea/**',
      '.DS_Store',
      'Thumbs.db',
      'scripts/**',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
      'public/**',
    ],
  },
  eslint.configs.recommended,
  prettierRecommended,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
];
