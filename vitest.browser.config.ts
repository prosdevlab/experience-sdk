import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for browser-based tests
 *
 * These tests run in a real browser (Chromium via Playwright) to test
 * features that depend on actual browser APIs like window.innerWidth,
 * matchMedia, etc.
 *
 * Run with: pnpm test:browser
 */
export default defineConfig({
  test: {
    include: ['**/*.browser.test.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
  },
});
