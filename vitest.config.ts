import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'db/**',
        'tests/**',
        'vitest.config.ts',
        'next.config.ts',
        'eslint.config.mjs',
        'postcss.config.mjs',
      ],
    },
  },
});
