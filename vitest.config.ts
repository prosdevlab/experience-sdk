import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/test/**'],
    },
  },
  resolve: {
    alias: {
      '@prosdevlab/experience-sdk': resolve(__dirname, 'packages/core/src'),
      '@prosdevlab/experience-sdk-plugins': resolve(__dirname, 'packages/plugins/src'),
    },
  },
});