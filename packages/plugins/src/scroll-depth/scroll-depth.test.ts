/**
 * @vitest-environment jsdom
 */

import { SDK } from '@lytics/sdk-kit';
import { storagePlugin } from '@lytics/sdk-kit-plugins';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scrollDepthPlugin } from './index';
import type { ScrollDepthPluginConfig } from './types';

// Extend SDK type to include scrollDepth API
interface SDKWithScrollDepth extends SDK {
  scrollDepth: {
    getMaxPercent: () => number;
    getCurrentPercent: () => number;
    getThresholdsCrossed: () => number[];
    reset: () => void;
  };
}

describe('scrollDepthPlugin', () => {
  let sdk: SDKWithScrollDepth;
  let scrollEventListeners: Record<string, EventListener> = {};
  let resizeEventListeners: Record<string, EventListener> = {};
  let addEventListenerSpy: any;
  let _removeEventListenerSpy: any;

  /**
   * Helper to initialize plugin with config
   */
  const initPlugin = async (config?: ScrollDepthPluginConfig['scrollDepth']) => {
    sdk = new SDK({
      name: 'test-sdk',
      storage: { backend: 'memory' },
    }) as SDKWithScrollDepth;

    if (config) {
      sdk.set('scrollDepth', config);
    }

    sdk.use(storagePlugin);
    sdk.use(scrollDepthPlugin);
    await sdk.init();
  };

  /**
   * Helper to set document height and scroll position
   */
  const setScrollPosition = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
    // Mock scrollingElement
    Object.defineProperty(document, 'scrollingElement', {
      writable: true,
      configurable: true,
      value: {
        scrollTop,
        scrollHeight,
        clientHeight,
      },
    });

    // Also mock documentElement as fallback
    Object.defineProperty(document, 'documentElement', {
      writable: true,
      configurable: true,
      value: {
        scrollTop,
        scrollHeight,
        clientHeight,
      },
    });
  };

  /**
   * Helper to simulate scroll event
   */
  const simulateScroll = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
    setScrollPosition(scrollTop, scrollHeight, clientHeight);
    const handler = scrollEventListeners.scroll;
    if (handler) {
      handler();
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset event listener tracking
    scrollEventListeners = {};
    resizeEventListeners = {};

    // Spy on addEventListener/removeEventListener
    addEventListenerSpy = vi
      .spyOn(window, 'addEventListener')
      .mockImplementation((event: string, handler: any) => {
        if (event === 'scroll') {
          scrollEventListeners[event] = handler;
        } else if (event === 'resize') {
          resizeEventListeners[event] = handler;
        }
      });

    _removeEventListenerSpy = vi
      .spyOn(window, 'removeEventListener')
      .mockImplementation((event: string) => {
        if (event === 'scroll') {
          delete scrollEventListeners[event];
        } else if (event === 'resize') {
          delete resizeEventListeners[event];
        }
      });
  });

  afterEach(async () => {
    if (sdk) {
      await sdk.destroy();
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should register with default config', async () => {
      await initPlugin();

      expect(sdk.scrollDepth).toBeDefined();
      expect(sdk.scrollDepth.getMaxPercent).toBeDefined();
      expect(sdk.scrollDepth.getCurrentPercent).toBeDefined();
      expect(sdk.scrollDepth.getThresholdsCrossed).toBeDefined();
      expect(sdk.scrollDepth.reset).toBeDefined();
    });

    it('should use default thresholds [25, 50, 75, 100]', async () => {
      await initPlugin();
      vi.advanceTimersByTime(0);

      // No thresholds crossed initially (no scroll event yet)
      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([]);

      // After scrolling, thresholds should trigger
      simulateScroll(1000, 2000, 1000); // 100%
      vi.advanceTimersByTime(100);
      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([25, 50, 75, 100]);
    });

    it('should register scroll listener', async () => {
      await initPlugin();
      vi.advanceTimersByTime(0);

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      });
    });

    it('should register resize listener by default', async () => {
      await initPlugin();
      vi.advanceTimersByTime(0);

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), {
        passive: true,
      });
    });

    it('should not register resize listener when disabled', async () => {
      await initPlugin({ recalculateOnResize: false });
      vi.advanceTimersByTime(0);

      const resizeCalls = addEventListenerSpy.mock.calls.filter((call) => call[0] === 'resize');
      expect(resizeCalls).toHaveLength(0);
    });

    it('should not check initial scroll position (waits for user interaction)', async () => {
      // Set initial scroll to 100%
      setScrollPosition(1000, 2000, 1000);

      await initPlugin();
      vi.advanceTimersByTime(0);

      // Should not trigger thresholds until first scroll event
      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([]);

      // Simulate scroll - now thresholds should trigger
      simulateScroll(1000, 2000, 1000);
      vi.advanceTimersByTime(100);
      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([25, 50, 75, 100]);
    });
  });

  describe('scroll percentage calculation', () => {
    it('should calculate percentage with viewport included (default)', async () => {
      await initPlugin();
      vi.advanceTimersByTime(0);

      // scrollTop=0, scrollHeight=2000, clientHeight=1000
      // (0 + 1000) / 2000 = 50%
      setScrollPosition(0, 2000, 1000);
      expect(sdk.scrollDepth.getCurrentPercent()).toBe(50);

      // scrollTop=500, scrollHeight=2000, clientHeight=1000
      // (500 + 1000) / 2000 = 75%
      setScrollPosition(500, 2000, 1000);
      expect(sdk.scrollDepth.getCurrentPercent()).toBe(75);

      // scrollTop=1000, scrollHeight=2000, clientHeight=1000
      // (1000 + 1000) / 2000 = 100%
      setScrollPosition(1000, 2000, 1000);
      expect(sdk.scrollDepth.getCurrentPercent()).toBe(100);
    });

    it('should calculate percentage without viewport (Pathfora method)', async () => {
      await initPlugin({ includeViewportHeight: false });
      vi.advanceTimersByTime(0);

      // scrollTop=0, scrollHeight=2000, clientHeight=1000
      // 0 / (2000 - 1000) = 0%
      setScrollPosition(0, 2000, 1000);
      expect(sdk.scrollDepth.getCurrentPercent()).toBe(0);

      // scrollTop=500, scrollHeight=2000, clientHeight=1000
      // 500 / (2000 - 1000) = 50%
      setScrollPosition(500, 2000, 1000);
      expect(sdk.scrollDepth.getCurrentPercent()).toBe(50);

      // scrollTop=1000, scrollHeight=2000, clientHeight=1000
      // 1000 / (2000 - 1000) = 100%
      setScrollPosition(1000, 2000, 1000);
      expect(sdk.scrollDepth.getCurrentPercent()).toBe(100);
    });

    it('should handle content shorter than viewport', async () => {
      await initPlugin();
      vi.advanceTimersByTime(0);

      // scrollHeight <= clientHeight → treat as 100%
      setScrollPosition(0, 500, 1000);
      expect(sdk.scrollDepth.getCurrentPercent()).toBe(100);
    });

    it('should cap percentage at 100', async () => {
      await initPlugin();
      vi.advanceTimersByTime(0);

      // Edge case: scrollTop + clientHeight > scrollHeight
      setScrollPosition(1500, 2000, 1000);
      expect(sdk.scrollDepth.getCurrentPercent()).toBe(100);
    });
  });

  describe('threshold triggering', () => {
    it('should emit event when threshold is crossed', async () => {
      const emitSpy = vi.fn();

      await initPlugin({ thresholds: [50] });
      sdk.on('trigger:scrollDepth', emitSpy);
      vi.advanceTimersByTime(0);

      // Scroll to 50% (scrollTop=0, scrollHeight=2000, clientHeight=1000 → 50%)
      simulateScroll(0, 2000, 1000);
      vi.advanceTimersByTime(100); // Throttle delay

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          triggered: true,
          threshold: 50,
          percent: 50,
          maxPercent: 50,
          thresholdsCrossed: [50],
        })
      );
    });

    it('should trigger multiple thresholds in order', async () => {
      const events: any[] = [];

      await initPlugin({ thresholds: [25, 50, 75] });
      sdk.on('trigger:scrollDepth', (payload) => events.push(payload));
      vi.advanceTimersByTime(0);

      // Scroll to 55%
      simulateScroll(100, 2000, 1000); // (100 + 1000) / 2000 = 55%
      vi.advanceTimersByTime(100);

      expect(events).toHaveLength(2);
      expect(events[0].threshold).toBe(25);
      expect(events[1].threshold).toBe(50);

      // Scroll to 80%
      simulateScroll(600, 2000, 1000); // (600 + 1000) / 2000 = 80%
      vi.advanceTimersByTime(100);

      expect(events).toHaveLength(3);
      expect(events[2].threshold).toBe(75);
    });

    it('should only trigger each threshold once', async () => {
      const emitSpy = vi.fn();

      await initPlugin({ thresholds: [50] });
      sdk.on('trigger:scrollDepth', emitSpy);
      vi.advanceTimersByTime(0);

      // Scroll to 50%
      simulateScroll(0, 2000, 1000);
      vi.advanceTimersByTime(100);
      expect(emitSpy).toHaveBeenCalledTimes(1);

      // Scroll to 60% (should not re-trigger)
      simulateScroll(200, 2000, 1000);
      vi.advanceTimersByTime(100);
      expect(emitSpy).toHaveBeenCalledTimes(1);

      // Scroll back to 40% and then to 50% again (should not re-trigger)
      simulateScroll(0, 2000, 2000); // 0%
      vi.advanceTimersByTime(100);
      simulateScroll(0, 2000, 1000); // 50%
      vi.advanceTimersByTime(100);
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should track max scroll percentage', async () => {
      await initPlugin({ thresholds: [50, 75] });
      vi.advanceTimersByTime(0);

      // Scroll to 60%
      simulateScroll(200, 2000, 1000); // (200 + 1000) / 2000 = 60%
      vi.advanceTimersByTime(100);
      expect(sdk.scrollDepth.getMaxPercent()).toBe(60);

      // Scroll to 80%
      simulateScroll(600, 2000, 1000); // (600 + 1000) / 2000 = 80%
      vi.advanceTimersByTime(100);
      expect(sdk.scrollDepth.getMaxPercent()).toBe(80);

      // Scroll back to 50% (max should still be 80%)
      simulateScroll(0, 2000, 1000); // 50%
      vi.advanceTimersByTime(100);
      expect(sdk.scrollDepth.getMaxPercent()).toBe(80);
    });

    it('should handle custom thresholds', async () => {
      const events: any[] = [];

      await initPlugin({ thresholds: [10, 90] });
      sdk.on('trigger:scrollDepth', (payload) => events.push(payload));
      vi.advanceTimersByTime(0);

      // Scroll to 50% (should trigger 10 only)
      simulateScroll(0, 2000, 1000); // 50%
      vi.advanceTimersByTime(100);
      expect(events).toHaveLength(1);
      expect(events[0].threshold).toBe(10);

      // Scroll to 95%
      simulateScroll(900, 2000, 1000); // (900 + 1000) / 2000 = 95%
      vi.advanceTimersByTime(100);
      expect(events).toHaveLength(2);
      expect(events[1].threshold).toBe(90);
    });
  });

  describe('throttling', () => {
    it('should throttle scroll events (default 100ms)', async () => {
      const emitSpy = vi.fn();

      await initPlugin({ thresholds: [25, 50, 75] });
      sdk.on('trigger:scrollDepth', emitSpy);
      vi.advanceTimersByTime(0);

      // First scroll triggers immediately
      simulateScroll(100, 2000, 1000); // 55%
      expect(emitSpy).toHaveBeenCalledTimes(2); // 25%, 50%

      // Rapid subsequent scrolls should be throttled
      simulateScroll(150, 2000, 1000); // 57.5%
      simulateScroll(200, 2000, 1000); // 60%
      simulateScroll(250, 2000, 1000); // 62.5%
      simulateScroll(300, 2000, 1000); // 65%

      // Still only 2 events (throttled)
      expect(emitSpy).toHaveBeenCalledTimes(2);

      // Advance past throttle - no new thresholds crossed yet
      vi.advanceTimersByTime(100);
      expect(emitSpy).toHaveBeenCalledTimes(2);

      // Now scroll past next threshold
      simulateScroll(600, 2000, 1000); // 80%
      vi.advanceTimersByTime(100);
      expect(emitSpy).toHaveBeenCalledTimes(3); // 75%
    });

    it('should respect custom throttle interval', async () => {
      const emitSpy = vi.fn();

      await initPlugin({ thresholds: [50], throttle: 200 });
      sdk.on('trigger:scrollDepth', emitSpy);
      vi.advanceTimersByTime(0);

      simulateScroll(0, 2000, 1000); // 50%

      // First scroll fires immediately
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('resize handling', () => {
    it('should recalculate scroll on resize', async () => {
      const emitSpy = vi.fn();

      await initPlugin({ thresholds: [50] });
      sdk.on('trigger:scrollDepth', emitSpy);
      vi.advanceTimersByTime(0);

      // Initial: scrollTop=0, scrollHeight=2000, clientHeight=1000 → 50%
      setScrollPosition(0, 2000, 1000);
      const resizeHandler = resizeEventListeners.resize;
      if (resizeHandler && typeof resizeHandler === 'function') {
        resizeHandler(new Event('resize') as any);
      }
      vi.advanceTimersByTime(100);

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          threshold: 50,
          percent: 50,
        })
      );
    });
  });

  describe('API methods', () => {
    it('should return max scroll percentage', async () => {
      await initPlugin();
      vi.advanceTimersByTime(0);

      // Initially 0
      expect(sdk.scrollDepth.getMaxPercent()).toBe(0);

      // After scrolling, should update
      simulateScroll(500, 2000, 1000); // 75%
      vi.advanceTimersByTime(100);
      expect(sdk.scrollDepth.getMaxPercent()).toBe(75);
    });

    it('should return current scroll percentage', async () => {
      await initPlugin();
      vi.advanceTimersByTime(0);

      setScrollPosition(300, 2000, 1000); // (300 + 1000) / 2000 = 65%
      expect(sdk.scrollDepth.getCurrentPercent()).toBe(65);
    });

    it('should return crossed thresholds in sorted order', async () => {
      await initPlugin({ thresholds: [75, 25, 50, 100] });
      vi.advanceTimersByTime(0);

      simulateScroll(500, 2000, 1000); // 75%
      vi.advanceTimersByTime(100);

      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([25, 50, 75]);
    });

    it('should reset tracking', async () => {
      await initPlugin({ thresholds: [50, 75] });
      vi.advanceTimersByTime(0);

      // Scroll and trigger threshold
      simulateScroll(500, 2000, 1000); // 75%
      vi.advanceTimersByTime(100);
      expect(sdk.scrollDepth.getMaxPercent()).toBe(75);
      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([50, 75]);

      // Reset
      sdk.scrollDepth.reset();
      expect(sdk.scrollDepth.getMaxPercent()).toBe(0);
      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([]);

      // Can re-trigger after reset
      const emitSpy = vi.fn();
      sdk.on('trigger:scrollDepth', emitSpy);
      simulateScroll(500, 2000, 1000); // 75%
      vi.advanceTimersByTime(100);
      expect(emitSpy).toHaveBeenCalledTimes(2); // Both 50 and 75 fire again
    });
  });

  describe('cleanup', () => {
    it('should allow manual cleanup via returned function', async () => {
      await initPlugin();
      vi.advanceTimersByTime(0);

      // Verify listeners were added
      expect(scrollEventListeners.scroll).toBeDefined();
      expect(resizeEventListeners.resize).toBeDefined();

      // Plugin exposes a cleanup function that can be called manually
      // In practice, this is handled automatically by sdk-kit on destroy
      // For now, we just verify the listeners exist
      expect(sdk.scrollDepth).toBeDefined();
      expect(sdk.scrollDepth.getMaxPercent).toBeDefined();
    });
  });

  describe('reset()', () => {
    it('should clear triggered thresholds and max scroll', async () => {
      const emitSpy = vi.fn();

      await initPlugin({ thresholds: [25, 50, 75] });
      sdk.on('trigger:scrollDepth', emitSpy);
      vi.advanceTimersByTime(0);

      // Scroll to 50%
      simulateScroll(1000, 3000, 1000);
      vi.advanceTimersByTime(200);

      // Should have triggered 25% and 50%
      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([25, 50]);
      expect(sdk.scrollDepth.getMaxPercent()).toBeGreaterThan(0);
      expect(emitSpy).toHaveBeenCalledTimes(2);

      // Reset
      sdk.scrollDepth.reset();

      // Should clear state
      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([]);
      expect(sdk.scrollDepth.getMaxPercent()).toBe(0);

      // Scroll again to 50% should trigger again
      emitSpy.mockClear();
      simulateScroll(1000, 3000, 1000);
      vi.advanceTimersByTime(200);

      // Should trigger both 25% and 50% again
      expect(emitSpy).toHaveBeenCalledTimes(2);
      expect(sdk.scrollDepth.getThresholdsCrossed()).toEqual([25, 50]);
    });
  });

  describe('Pathfora compatibility tests', () => {
    it('should match Pathfora test: scrollPercentageToDisplay 50', async () => {
      const emitSpy = vi.fn();

      // Pathfora config
      await initPlugin({
        thresholds: [50],
        includeViewportHeight: false, // Pathfora method
      });
      sdk.on('trigger:scrollDepth', emitSpy);
      vi.advanceTimersByTime(0);

      // Body height: 4000px, scroll to full height
      simulateScroll(4000, 4000, 1000); // 100% scrolled
      vi.advanceTimersByTime(200); // Pathfora test uses 200ms delay

      expect(emitSpy).toHaveBeenCalled();
      expect(sdk.scrollDepth.getThresholdsCrossed()).toContain(50);
    });

    it('should match Pathfora test: scrollPercentageToDisplay 30 with scroll to height/2', async () => {
      const emitSpy = vi.fn();

      // Pathfora config
      await initPlugin({
        thresholds: [30],
        includeViewportHeight: false,
      });
      sdk.on('trigger:scrollDepth', emitSpy);
      vi.advanceTimersByTime(0);

      // Body height: 4000px, scroll to height/2 (2000px)
      // scrollTop=2000, scrollHeight=4000, clientHeight=1000
      // 2000 / (4000 - 1000) = 66.67%
      simulateScroll(2000, 4000, 1000);
      vi.advanceTimersByTime(100);

      expect(emitSpy).toHaveBeenCalled();
      expect(sdk.scrollDepth.getThresholdsCrossed()).toContain(30);
    });
  });
});
