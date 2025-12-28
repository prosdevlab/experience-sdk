import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['packages/**/*.{test,spec}.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.browser.test.ts', // Browser tests run separately with vitest.browser.config.ts
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/test/**',
        '**/*.browser.test.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@prosdevlab/experience-sdk': resolve(__dirname, 'packages/core/src'),
      '@prosdevlab/experience-sdk-plugins': resolve(__dirname, 'packages/plugins/src'),
    },
  },
});
