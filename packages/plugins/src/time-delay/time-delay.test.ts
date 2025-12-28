/** @module timeDelayPlugin */

import { SDK } from '@lytics/sdk-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { timeDelayPlugin } from './time-delay';
import type { TimeDelayEvent, TimeDelayPluginConfig } from './types';

describe('Time Delay Plugin', () => {
  // Use fake timers for time-based tests
  beforeEach(() => {
    vi.useFakeTimers();
    // Ensure document is visible by default
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * Helper to initialize SDK with time delay plugin
   */
  function initPlugin(config: TimeDelayPluginConfig = {}) {
    const sdk = new SDK(config);
    sdk.use(timeDelayPlugin);
    return sdk;
  }

  describe('Basic Functionality', () => {
    it('should trigger after configured delay', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 5000, pauseWhenHidden: false } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      // Before delay
      expect(events.length).toBe(0);

      // Fast forward to trigger time
      vi.advanceTimersByTime(5000);

      // Should have triggered
      expect(events.length).toBe(1);
      expect(events[0].elapsed).toBeGreaterThanOrEqual(5000);
      expect(events[0].activeElapsed).toBeGreaterThanOrEqual(5000);
      expect(events[0].wasPaused).toBe(false);
    });

    it('should not trigger if delay is 0', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 0 } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      // Advance some time
      vi.advanceTimersByTime(10000);

      // Should not trigger
      expect(events.length).toBe(0);
    });

    it('should update context with elapsed time', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 3000, pauseWhenHidden: false } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      vi.advanceTimersByTime(3000);

      expect(events.length).toBe(1);
      expect(events[0].timestamp).toBeDefined();
      expect(events[0].elapsed).toBeGreaterThanOrEqual(3000);
      expect(events[0].activeElapsed).toBeGreaterThanOrEqual(3000);
    });

    it('should only trigger once', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 2000, pauseWhenHidden: false } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      vi.advanceTimersByTime(2000);
      expect(events.length).toBe(1);

      // Advance more time
      vi.advanceTimersByTime(5000);
      expect(events.length).toBe(1); // Still only 1
    });
  });

  describe('Visibility Handling', () => {
    it('should pause timer when tab is hidden', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 5000, pauseWhenHidden: true } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      // 2 seconds active
      vi.advanceTimersByTime(2000);

      // Hide tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // 3 seconds hidden (should be paused)
      vi.advanceTimersByTime(3000);

      // Should NOT have triggered yet
      expect(events.length).toBe(0);

      // Show tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // 3 more seconds active (total 5 active)
      vi.advanceTimersByTime(3000);

      // Should have triggered
      expect(events.length).toBe(1);
      expect(events[0].activeElapsed).toBeGreaterThanOrEqual(5000);
      expect(events[0].elapsed).toBeGreaterThanOrEqual(8000); // 2 + 3 + 3
      expect(events[0].wasPaused).toBe(true);
      expect(events[0].visibilityChanges).toBeGreaterThan(0);
    });

    it('should not pause if pauseWhenHidden is false', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 5000, pauseWhenHidden: false } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      // 2 seconds active
      vi.advanceTimersByTime(2000);

      // Hide tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // 3 more seconds (should still count)
      vi.advanceTimersByTime(3000);

      // Should have triggered (total 5 seconds)
      expect(events.length).toBe(1);
      expect(events[0].elapsed).toBeGreaterThanOrEqual(5000);
      expect(events[0].wasPaused).toBe(false); // Never paused
    });

    it('should handle rapid visibility changes', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 10000, pauseWhenHidden: true } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      // Multiple hide/show cycles
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(1000); // 1s active

        // Hide
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
        vi.advanceTimersByTime(500); // 0.5s hidden

        // Show
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: false,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      }

      // Total: 5s active, 2.5s hidden = 7.5s elapsed, 5s active
      expect(events.length).toBe(0); // Not triggered yet (need 10s active)

      // Add 5 more seconds active (total 10s active)
      vi.advanceTimersByTime(5000);

      // Should trigger
      expect(events.length).toBe(1);
      expect(events[0].activeElapsed).toBeGreaterThanOrEqual(9000); // Allow some tolerance
      expect(events[0].wasPaused).toBe(true);
      expect(events[0].visibilityChanges).toBeGreaterThan(5);
    });

    it('should handle starting hidden', async () => {
      // Set document hidden before init
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });

      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 3000, pauseWhenHidden: true } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      // 2 seconds hidden (should be paused from start)
      vi.advanceTimersByTime(2000);
      expect(events.length).toBe(0);

      // Show tab
      Object.defineProperty(document, 'hidden', { writable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));

      // 3 seconds active
      vi.advanceTimersByTime(3000);

      // Should trigger
      expect(events.length).toBe(1);
      expect(events[0].activeElapsed).toBeGreaterThanOrEqual(3000);
    });
  });

  describe('API Methods', () => {
    it('should expose getElapsed method', async () => {
      const sdk = initPlugin({ timeDelay: { delay: 5000, pauseWhenHidden: false } });
      await sdk.init();

      vi.advanceTimersByTime(2000);

      const elapsed = sdk.timeDelay.getElapsed();
      expect(elapsed).toBeGreaterThanOrEqual(2000);
      expect(elapsed).toBeLessThan(3000);
    });

    it('should expose getActiveElapsed method', async () => {
      const sdk = initPlugin({ timeDelay: { delay: 5000, pauseWhenHidden: true } });
      await sdk.init();

      // 2s active
      vi.advanceTimersByTime(2000);

      // Hide for 3s
      Object.defineProperty(document, 'hidden', { writable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(3000);

      const activeElapsed = sdk.timeDelay.getActiveElapsed();
      const totalElapsed = sdk.timeDelay.getElapsed();

      expect(activeElapsed).toBeGreaterThanOrEqual(2000);
      expect(activeElapsed).toBeLessThan(3000);
      expect(totalElapsed).toBeGreaterThanOrEqual(5000);
    });

    it('should expose getRemaining method', async () => {
      const sdk = initPlugin({ timeDelay: { delay: 5000, pauseWhenHidden: false } });
      await sdk.init();

      vi.advanceTimersByTime(2000);

      const remaining = sdk.timeDelay.getRemaining();
      expect(remaining).toBeGreaterThan(2000);
      expect(remaining).toBeLessThanOrEqual(3000);
    });

    it('should return 0 for getRemaining after trigger', async () => {
      const sdk = initPlugin({ timeDelay: { delay: 2000, pauseWhenHidden: false } });
      await sdk.init();

      vi.advanceTimersByTime(2000);

      const remaining = sdk.timeDelay.getRemaining();
      expect(remaining).toBe(0);
    });

    it('should expose isPaused method', async () => {
      const sdk = initPlugin({ timeDelay: { delay: 5000, pauseWhenHidden: true } });
      await sdk.init();

      expect(sdk.timeDelay.isPaused()).toBe(false);

      // Hide tab
      Object.defineProperty(document, 'hidden', { writable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(sdk.timeDelay.isPaused()).toBe(true);
    });

    it('should expose isTriggered method', async () => {
      const sdk = initPlugin({ timeDelay: { delay: 2000, pauseWhenHidden: false } });
      await sdk.init();

      expect(sdk.timeDelay.isTriggered()).toBe(false);

      vi.advanceTimersByTime(2000);

      expect(sdk.timeDelay.isTriggered()).toBe(true);
    });

    it('should expose reset method', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 3000, pauseWhenHidden: false } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      vi.advanceTimersByTime(3000);
      expect(events.length).toBe(1);
      expect(sdk.timeDelay.isTriggered()).toBe(true);

      // Reset
      sdk.timeDelay.reset();
      expect(sdk.timeDelay.isTriggered()).toBe(false);

      // Should trigger again after 3s
      vi.advanceTimersByTime(3000);
      expect(events.length).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timers on destroy', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 5000, pauseWhenHidden: false } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      vi.advanceTimersByTime(2000);

      // Destroy SDK
      await sdk.destroy();

      // Advance past trigger time
      vi.advanceTimersByTime(5000);

      // Should NOT have triggered (timer was cleared)
      expect(events.length).toBe(0);
    });

    it('should cleanup visibility listeners on destroy', async () => {
      const sdk = initPlugin({ timeDelay: { delay: 5000, pauseWhenHidden: true } });
      await sdk.init();

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      // Destroy SDK
      await sdk.destroy();

      // Should have removed visibility listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });

  describe('Edge Cases', () => {
    it('should handle delay elapsed during pause', async () => {
      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 2000, pauseWhenHidden: true } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      // 1s active
      vi.advanceTimersByTime(1000);

      // Hide tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // 5s hidden (enough to complete delay if not paused)
      vi.advanceTimersByTime(5000);

      // Should NOT have triggered yet
      expect(events.length).toBe(0);

      // Show tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // 1 more second active (total 2s active)
      vi.advanceTimersByTime(1000);

      // Should trigger
      expect(events.length).toBe(1);
    });

    it('should work in environments without Page Visibility API', async () => {
      // Mock missing document.hidden
      const originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden');
      Object.defineProperty(document, 'hidden', {
        get: () => undefined,
        configurable: true,
      });

      const events: TimeDelayEvent[] = [];
      const sdk = initPlugin({ timeDelay: { delay: 2000, pauseWhenHidden: true } });

      sdk.on('trigger:timeDelay', (event) => {
        events.push(event);
      });

      await sdk.init();

      vi.advanceTimersByTime(2000);

      // Should still trigger (falls back to no pause)
      expect(events.length).toBe(1);

      // Restore
      if (originalHidden) {
        Object.defineProperty(document, 'hidden', originalHidden);
      }
    });
  });
});
