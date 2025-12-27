// packages/plugins/src/exit-intent/exit-intent.test.ts

import { SDK } from '@lytics/sdk-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exitIntentPlugin } from './index';

describe('Exit Intent Plugin', () => {
  let sdk: SDK;
  let mouseEventListeners: Record<string, EventListener> = {};

  beforeEach(() => {
    // Clear sessionStorage
    sessionStorage.clear();

    // Create fresh SDK instance
    sdk = new SDK({ name: 'test-sdk' });

    // Mock document event listeners
    mouseEventListeners = {};
    vi.spyOn(document, 'addEventListener').mockImplementation((event: string, handler: any) => {
      mouseEventListeners[event] = handler;
    });

    vi.spyOn(document, 'removeEventListener').mockImplementation((event: string) => {
      delete mouseEventListeners[event];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to initialize plugin with config
  async function initPlugin(config: any = { sensitivity: 50, minTimeOnPage: 0 }) {
    sdk.set('exitIntent', config);
    sdk.use(exitIntentPlugin);
    await sdk.init();
  }

  describe('Plugin Initialization', () => {
    it('should register exitIntent namespace', async () => {
      await initPlugin();
      expect((sdk as any).exitIntent).toBeDefined();
    });

    it('should set up mouse event listeners', async () => {
      await initPlugin({ sensitivity: 20 });
      expect(mouseEventListeners.mousemove).toBeDefined();
      expect(mouseEventListeners.mouseout).toBeDefined();
    });

    it('should not initialize on mobile devices', async () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });

      await initPlugin({ disableOnMobile: true });

      expect(mouseEventListeners.mousemove).toBeUndefined();
      expect(mouseEventListeners.mouseout).toBeUndefined();

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it('should initialize on mobile if disableOnMobile is false', async () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });

      await initPlugin({ disableOnMobile: false });

      expect(mouseEventListeners.mousemove).toBeDefined();
      expect(mouseEventListeners.mouseout).toBeDefined();

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it('should not initialize if already triggered this session', async () => {
      sessionStorage.setItem('xp:exitIntent:triggered', Date.now().toString());

      await initPlugin();

      expect(mouseEventListeners.mousemove).toBeUndefined();
      expect(mouseEventListeners.mouseout).toBeUndefined();
    });
  });

  describe('Mouse Position Tracking', () => {
    it('should track mouse positions', async () => {
      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));

      const positions = (sdk as any).exitIntent.getPositions();
      expect(positions).toHaveLength(2);
      expect(positions[0]).toEqual({ x: 100, y: 200 });
      expect(positions[1]).toEqual({ x: 150, y: 250 });
    });

    it('should limit position history to configured size', async () => {
      await initPlugin({ positionHistorySize: 3 });

      const mouseMoveHandler = mouseEventListeners.mousemove;
      for (let i = 0; i < 5; i++) {
        mouseMoveHandler(new MouseEvent('mousemove', { clientX: i * 10, clientY: i * 10 }));
      }

      const positions = (sdk as any).exitIntent.getPositions();
      expect(positions).toHaveLength(3);
      expect(positions[0]).toEqual({ x: 20, y: 20 });
      expect(positions[1]).toEqual({ x: 30, y: 30 });
      expect(positions[2]).toEqual({ x: 40, y: 40 });
    });
  });

  describe('Exit Intent Detection (Pathfora Test Cases)', () => {
    it('should NOT trigger immediately on page load', async () => {
      const triggerSpy = vi.fn();
      sdk.on('trigger:exitIntent', triggerSpy);

      await initPlugin();

      expect(triggerSpy).not.toHaveBeenCalled();
    });

    it('should NOT trigger when exiting from left edge', async () => {
      const triggerSpy = vi.fn();
      sdk.on('trigger:exitIntent', triggerSpy);

      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 100, clientY: 300 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 50, clientY: 300 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 10, clientY: 300 }));

      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 0, clientY: 300, relatedTarget: null })
      );

      expect(triggerSpy).not.toHaveBeenCalled();
    });

    it('should NOT trigger when exiting from bottom', async () => {
      const triggerSpy = vi.fn();
      sdk.on('trigger:exitIntent', triggerSpy);

      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 300 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 500 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 700 }));

      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 800, relatedTarget: null })
      );

      expect(triggerSpy).not.toHaveBeenCalled();
    });

    it('should NOT trigger on downward movement', async () => {
      const triggerSpy = vi.fn();
      sdk.on('trigger:exitIntent', triggerSpy);

      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 10 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 30 }));

      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 50, relatedTarget: null })
      );

      expect(triggerSpy).not.toHaveBeenCalled();
    });

    it('SHOULD trigger on upward movement + top exit (Pathfora algorithm)', async () => {
      const triggerSpy = vi.fn();
      sdk.on('trigger:exitIntent', triggerSpy);

      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 200 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));

      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      expect(triggerSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect min time on page setting', async () => {
      const triggerSpy = vi.fn();
      sdk.on('trigger:exitIntent', triggerSpy);

      await initPlugin({ sensitivity: 50, minTimeOnPage: 2000 });

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      // Try immediately (should fail)
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      expect(triggerSpy).not.toHaveBeenCalled();

      // Wait and try again
      await new Promise((resolve) => setTimeout(resolve, 2100));

      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      expect(triggerSpy).toHaveBeenCalledTimes(1);
    });

    it('should trigger only once per session', async () => {
      const triggerSpy = vi.fn();
      sdk.on('trigger:exitIntent', triggerSpy);

      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      // First trigger
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      expect(triggerSpy).toHaveBeenCalledTimes(1);

      // Try again
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      expect(triggerSpy).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should respect configurable sensitivity threshold', async () => {
      const triggerSpy = vi.fn();
      sdk.on('trigger:exitIntent', triggerSpy);

      await initPlugin({ sensitivity: 20, minTimeOnPage: 0 });

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      // Far from top with slow movement - should NOT trigger
      // y=100, py=110, velocity=10
      // 100 - 10 = 90, which is > 20, so won't trigger
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 110 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 95, relatedTarget: null })
      );

      expect(triggerSpy).not.toHaveBeenCalled();

      // Near top with upward movement - SHOULD trigger
      // y=10, py=30, velocity=20
      // 10 - 20 = -10, which is <= 20, so will trigger
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 30 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 10 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      expect(triggerSpy).toHaveBeenCalledTimes(1);
    });

    it('should clean up event listeners after trigger', async () => {
      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      expect(mouseMoveHandler).toBeDefined();
      expect(mouseOutHandler).toBeDefined();

      // Trigger exit intent
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      // Listeners should be removed
      expect(mouseEventListeners.mousemove).toBeUndefined();
      expect(mouseEventListeners.mouseout).toBeUndefined();
    });

    it('should apply delay before emitting trigger event', async () => {
      const triggerSpy = vi.fn();
      sdk.on('trigger:exitIntent', triggerSpy);

      await initPlugin({ sensitivity: 50, minTimeOnPage: 0, delay: 1000 });

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      // Trigger exit intent
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      // Should not trigger immediately
      expect(triggerSpy).not.toHaveBeenCalled();

      // Wait for delay
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(triggerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Methods', () => {
    it('should expose isTriggered() method', async () => {
      await initPlugin();

      expect((sdk as any).exitIntent.isTriggered()).toBe(false);

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      expect((sdk as any).exitIntent.isTriggered()).toBe(true);
    });

    it('should expose reset() method for testing', async () => {
      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      expect((sdk as any).exitIntent.isTriggered()).toBe(true);

      // Reset
      (sdk as any).exitIntent.reset();

      expect((sdk as any).exitIntent.isTriggered()).toBe(false);
      expect((sdk as any).exitIntent.getPositions()).toHaveLength(0);
    });

    it('should expose getPositions() method', async () => {
      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));

      const positions = (sdk as any).exitIntent.getPositions();
      expect(positions).toEqual([
        { x: 100, y: 200 },
        { x: 150, y: 250 },
      ]);
    });
  });

  describe('SessionStorage Persistence', () => {
    it('should store trigger state in sessionStorage', async () => {
      await initPlugin();

      const mouseMoveHandler = mouseEventListeners.mousemove;
      const mouseOutHandler = mouseEventListeners.mouseout;

      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }));
      mouseMoveHandler(new MouseEvent('mousemove', { clientX: 500, clientY: 40 }));
      mouseOutHandler(
        new MouseEvent('mouseout', { clientX: 500, clientY: 5, relatedTarget: null })
      );

      expect(sessionStorage.getItem('xp:exitIntent:triggered')).toBeTruthy();
    });
  });
});
