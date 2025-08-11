// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
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
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
);
