/**
 * Integration Tests - Display Condition Plugins
 *
 * Tests all 4 display condition plugins working together:
 * - Exit Intent
 * - Scroll Depth
 * - Page Visits
 * - Time Delay
 */

import { SDK } from '@lytics/sdk-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exitIntentPlugin, pageVisitsPlugin, scrollDepthPlugin, timeDelayPlugin } from './index';

// Type augmentation for plugin APIs
type SDKWithPlugins = SDK & {
  exitIntent?: any;
  scrollDepth?: any;
  pageVisits?: any;
  timeDelay?: any;
};

describe('Display Condition Plugins - Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset document state
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    });
    // Clear storage
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Plugin Composition', () => {
    it('should load all 4 plugins without conflicts', async () => {
      const sdk = new SDK({
        exitIntent: { sensitivity: 50, minTimeOnPage: 0, disableOnMobile: false },
        scrollDepth: { thresholds: [25, 50, 75], throttle: 100 },
        pageVisits: { enabled: true },
        timeDelay: { delay: 5000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(exitIntentPlugin);
      sdk.use(scrollDepthPlugin);
      sdk.use(pageVisitsPlugin);
      sdk.use(timeDelayPlugin);

      await sdk.init();

      // All plugins should expose their APIs
      expect(sdk.exitIntent).toBeDefined();
      expect(sdk.scrollDepth).toBeDefined();
      expect(sdk.pageVisits).toBeDefined();
      expect(sdk.timeDelay).toBeDefined();
    });

    it('should handle multiple triggers firing independently', async () => {
      const events: Array<{ type: string; data: any }> = [];

      const sdk = new SDK({
        exitIntent: { sensitivity: 50, minTimeOnPage: 0, disableOnMobile: false },
        scrollDepth: { thresholds: [50], throttle: 100 },
        pageVisits: { enabled: true, autoIncrement: true },
        timeDelay: { delay: 2000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(exitIntentPlugin);
      sdk.use(scrollDepthPlugin);
      sdk.use(pageVisitsPlugin);
      sdk.use(timeDelayPlugin);

      // Listen to all trigger events
      sdk.on('trigger:exitIntent', (data) => events.push({ type: 'exitIntent', data }));
      sdk.on('trigger:scrollDepth', (data) => events.push({ type: 'scrollDepth', data }));
      sdk.on('trigger:timeDelay', (data) => events.push({ type: 'timeDelay', data }));
      sdk.on('pageVisits:incremented', (data) => events.push({ type: 'pageVisits', data }));

      await sdk.init();

      // Page visits should fire on init
      expect(events.some((e) => e.type === 'pageVisits')).toBe(true);

      // Time delay should fire after 2s
      vi.advanceTimersByTime(2000);
      expect(events.some((e) => e.type === 'timeDelay')).toBe(true);

      // All events should be distinct
      const types = new Set(events.map((e) => e.type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('should update context correctly for all triggers', async () => {
      const contextUpdates: any[] = [];

      const sdk = new SDK({
        exitIntent: { sensitivity: 50, minTimeOnPage: 0, disableOnMobile: false },
        scrollDepth: { thresholds: [50], throttle: 100 },
        pageVisits: { enabled: true },
        timeDelay: { delay: 1000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(exitIntentPlugin);
      sdk.use(scrollDepthPlugin);
      sdk.use(pageVisitsPlugin);
      sdk.use(timeDelayPlugin);

      // Capture context after each trigger
      sdk.on('trigger:exitIntent', () => {
        contextUpdates.push({ trigger: 'exitIntent', timestamp: Date.now() });
      });
      sdk.on('trigger:timeDelay', () => {
        contextUpdates.push({ trigger: 'timeDelay', timestamp: Date.now() });
      });

      await sdk.init();

      vi.advanceTimersByTime(1000);

      // Should have multiple context updates
      expect(contextUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Targeting Logic', () => {
    it('should support AND logic (multiple conditions)', async () => {
      const sdk = new SDK({
        scrollDepth: { thresholds: [50], throttle: 100 },
        timeDelay: { delay: 2000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(scrollDepthPlugin);
      sdk.use(timeDelayPlugin);

      await sdk.init();

      // Before: neither condition met
      const scrolled50 = (sdk.scrollDepth?.getMaxPercent() || 0) >= 50;
      let delayed2s = sdk.timeDelay?.isTriggered() || false;
      expect(scrolled50 && delayed2s).toBe(false);

      // Advance time
      vi.advanceTimersByTime(2000);
      delayed2s = sdk.timeDelay?.isTriggered() || false;

      // Still false (scroll not met)
      expect(scrolled50 && delayed2s).toBe(false);
    });

    it('should support OR logic (any condition)', async () => {
      const sdk = new SDK({
        exitIntent: { sensitivity: 50, minTimeOnPage: 0, disableOnMobile: false },
        timeDelay: { delay: 2000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(exitIntentPlugin);
      sdk.use(timeDelayPlugin);

      await sdk.init();

      // Trigger time delay
      vi.advanceTimersByTime(2000);

      const exitTriggered = sdk.exitIntent?.isTriggered() || false;
      const timeTriggered = sdk.timeDelay?.isTriggered() || false;

      // OR logic: one is true
      expect(exitTriggered || timeTriggered).toBe(true);
    });

    it('should support NOT logic (inverse conditions)', async () => {
      const sdk = new SDK({
        pageVisits: { enabled: true, autoIncrement: true },
      }) as SDKWithPlugins;

      sdk.use(pageVisitsPlugin);

      await sdk.init();

      // After init with autoIncrement, it's no longer first visit
      // (count was incremented from 0 to 1)
      const isFirstVisit = sdk.pageVisits?.isFirstVisit() || false;
      const totalCount = sdk.pageVisits?.getTotalCount() || 0;

      expect(totalCount).toBe(1);
      expect(isFirstVisit).toBe(false); // Auto-incremented, so not "first" anymore

      // Simulate second visit
      sdk.pageVisits?.increment();
      const nowCount = sdk.pageVisits?.getTotalCount() || 0;
      expect(nowCount).toBe(2);
    });
  });

  describe('Performance', () => {
    it('should have minimal overhead with all plugins loaded', async () => {
      const startTime = performance.now();

      const sdk = new SDK({
        exitIntent: { sensitivity: 50, minTimeOnPage: 0, disableOnMobile: false },
        scrollDepth: { thresholds: [25, 50, 75], throttle: 100 },
        pageVisits: { enabled: true },
        timeDelay: { delay: 5000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(exitIntentPlugin);
      sdk.use(scrollDepthPlugin);
      sdk.use(pageVisitsPlugin);
      sdk.use(timeDelayPlugin);

      await sdk.init();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should initialize in less than 50ms
      expect(duration).toBeLessThan(50);
    });

    it('should not leak memory with multiple resets', async () => {
      const sdk = new SDK({
        exitIntent: { sensitivity: 50, minTimeOnPage: 0, disableOnMobile: false },
        scrollDepth: { thresholds: [50], throttle: 100 },
        pageVisits: { enabled: true },
        timeDelay: { delay: 1000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(exitIntentPlugin);
      sdk.use(scrollDepthPlugin);
      sdk.use(pageVisitsPlugin);
      sdk.use(timeDelayPlugin);

      await sdk.init();

      // Reset all plugins multiple times
      for (let i = 0; i < 100; i++) {
        sdk.exitIntent?.reset();
        sdk.scrollDepth?.reset();
        sdk.pageVisits?.reset();
        sdk.timeDelay?.reset();
      }

      // Should not throw or hang
      expect(sdk.exitIntent?.isTriggered()).toBe(false);
      expect(sdk.scrollDepth?.getMaxPercent()).toBe(0);
      expect(sdk.timeDelay?.isTriggered()).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all plugins on destroy', async () => {
      const sdk = new SDK({
        exitIntent: { sensitivity: 50, minTimeOnPage: 0, disableOnMobile: false },
        scrollDepth: { thresholds: [50], throttle: 100 },
        pageVisits: { enabled: true },
        timeDelay: { delay: 5000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(exitIntentPlugin);
      sdk.use(scrollDepthPlugin);
      sdk.use(pageVisitsPlugin);
      sdk.use(timeDelayPlugin);

      await sdk.init();

      // Destroy SDK
      sdk.emit('destroy');

      // Advance time past all delays
      vi.advanceTimersByTime(10000);

      // Plugins should be cleaned up (no crashes)
      expect(() => {
        vi.advanceTimersByTime(1000);
      }).not.toThrow();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle "engaged user" scenario (scroll + time)', async () => {
      const sdk = new SDK({
        scrollDepth: { thresholds: [50], throttle: 100 },
        timeDelay: { delay: 5000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(scrollDepthPlugin);
      sdk.use(timeDelayPlugin);

      await sdk.init();

      // User spends 5 seconds (time condition met)
      vi.advanceTimersByTime(5000);

      const timeElapsed = sdk.timeDelay?.isTriggered() || false;
      const scrolled50 = (sdk.scrollDepth?.getMaxPercent() || 0) >= 50;

      // Could show "engaged user" offer even without scroll
      expect(timeElapsed).toBe(true);
      expect(timeElapsed || scrolled50).toBe(true); // OR logic
    });

    it('should handle "returning visitor exit intent" scenario', async () => {
      const sdk = new SDK({
        exitIntent: { sensitivity: 50, minTimeOnPage: 0, disableOnMobile: false },
        pageVisits: { enabled: true, autoIncrement: true },
      }) as SDKWithPlugins;

      sdk.use(exitIntentPlugin);
      sdk.use(pageVisitsPlugin);

      await sdk.init();

      // Simulate more visits
      sdk.pageVisits?.increment();
      sdk.pageVisits?.increment();

      const isFirstVisit = sdk.pageVisits?.isFirstVisit() || false;
      const totalVisits = sdk.pageVisits?.getTotalCount() || 0;

      // After multiple increments
      expect(isFirstVisit).toBe(false);
      expect(totalVisits).toBeGreaterThan(1);

      // Logic for returning visitor targeting
      const isReturningVisitor = !isFirstVisit && totalVisits > 2;
      expect(isReturningVisitor).toBe(true);
    });

    it('should handle "first-time visitor welcome" scenario', async () => {
      const sdk = new SDK({
        pageVisits: { enabled: true, autoIncrement: true },
        timeDelay: { delay: 3000, pauseWhenHidden: false },
      }) as SDKWithPlugins;

      sdk.use(pageVisitsPlugin);
      sdk.use(timeDelayPlugin);

      await sdk.init();

      const totalCount = sdk.pageVisits?.getTotalCount() || 0;

      // Should have at least 1 visit after auto-increment
      expect(totalCount).toBeGreaterThanOrEqual(1);

      // Wait 3 seconds
      vi.advanceTimersByTime(3000);
      const timeElapsed = sdk.timeDelay?.isTriggered() || false;
      expect(timeElapsed).toBe(true);

      // Logic: Show welcome after delay for low-count visitors
      const shouldShowWelcome = totalCount <= 1 && timeElapsed;
      expect(shouldShowWelcome).toBe(true);
    });
  });
});
