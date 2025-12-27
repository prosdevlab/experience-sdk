/**
 * Page Visits Plugin Tests
 *
 * Comprehensive tests covering:
 * - Session and lifetime counting
 * - First-visit detection
 * - Storage persistence
 * - DNT (Do Not Track) support
 * - API methods
 * - Event emission
 */

import { SDK } from '@lytics/sdk-kit';
import { storagePlugin } from '@lytics/sdk-kit-plugins';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pageVisitsPlugin } from './index';
import type { PageVisitsEvent, PageVisitsPlugin } from './types';

type SDKWithPageVisits = SDK & {
  pageVisits: PageVisitsPlugin;
};

describe('Page Visits Plugin', () => {
  let sdk: SDKWithPageVisits;

  // Helper to initialize plugin with config
  const initPlugin = async (config?: any) => {
    sdk = new SDK({
      pageVisits: config,
      storage: { backend: 'memory' },
    }) as SDKWithPageVisits;
    sdk.use(storagePlugin);
    sdk.use(pageVisitsPlugin);
    await sdk.init();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear storage
    sessionStorage.clear();
    localStorage.clear();
    // Reset DNT mock
    Object.defineProperty(navigator, 'doNotTrack', {
      value: '0',
      configurable: true,
    });
  });

  afterEach(() => {
    if (sdk) {
      sdk.destroy?.();
    }
  });

  describe('Default Configuration', () => {
    it('should initialize with default config', async () => {
      await initPlugin();
      expect(sdk.pageVisits).toBeDefined();
    });

    it('should auto-increment on initialization', async () => {
      await initPlugin();
      expect(sdk.pageVisits.getTotalCount()).toBe(1);
      expect(sdk.pageVisits.getSessionCount()).toBe(1);
    });

    it('should detect first visit', async () => {
      await initPlugin();
      expect(sdk.pageVisits.isFirstVisit()).toBe(false); // After increment, no longer first
    });
  });

  describe('Session Counter (sessionStorage)', () => {
    it('should increment session count on each page load', async () => {
      await initPlugin();
      expect(sdk.pageVisits.getSessionCount()).toBe(1);

      // Simulate second page load (reinitialize)
      sdk.destroy?.();
      await initPlugin();
      expect(sdk.pageVisits.getSessionCount()).toBe(2);
    });

    it('should reset session count when sessionStorage is cleared', async () => {
      await initPlugin();
      expect(sdk.pageVisits.getSessionCount()).toBe(1);

      // Clear session storage
      sessionStorage.clear();

      // Reinitialize
      sdk.destroy?.();
      await initPlugin();
      expect(sdk.pageVisits.getSessionCount()).toBe(1); // Back to 1
    });

    it('should not persist session count across tabs', async () => {
      await initPlugin();
      expect(sdk.pageVisits.getSessionCount()).toBe(1);

      // Session storage is tab-specific, so count shouldn't persist
      // (This is a characteristic test, not a functional test)
      expect(sessionStorage.length).toBeGreaterThan(0);
    });
  });

  describe('Lifetime Counter (localStorage)', () => {
    it('should increment total count on each page load', async () => {
      await initPlugin();
      expect(sdk.pageVisits.getTotalCount()).toBe(1);

      // Simulate second page load (reinitialize)
      sdk.destroy?.();
      await initPlugin();
      expect(sdk.pageVisits.getTotalCount()).toBe(2);

      // Third page load
      sdk.destroy?.();
      await initPlugin();
      expect(sdk.pageVisits.getTotalCount()).toBe(3);
    });

    it('should persist total count in localStorage', async () => {
      await initPlugin();
      expect(sdk.pageVisits.getTotalCount()).toBe(1);

      // Check localStorage directly
      const stored = localStorage.getItem('pageVisits:total');
      expect(stored).toBeDefined();
      expect(stored).not.toBeNull();
    });

    it('should store timestamps for first and last visit', async () => {
      await initPlugin();

      const firstVisitTime = sdk.pageVisits.getFirstVisitTime();
      const lastVisitTime = sdk.pageVisits.getLastVisitTime();

      expect(firstVisitTime).toBeDefined();
      expect(lastVisitTime).toBeDefined();
      expect(typeof firstVisitTime).toBe('number');
      expect(typeof lastVisitTime).toBe('number');
    });

    it('should keep first visit time constant across visits', async () => {
      await initPlugin();
      const firstVisitTime1 = sdk.pageVisits.getFirstVisitTime();

      // Second visit
      sdk.destroy?.();
      await initPlugin();
      const firstVisitTime2 = sdk.pageVisits.getFirstVisitTime();

      expect(firstVisitTime1).toBe(firstVisitTime2);
    });

    it('should update last visit time on each visit', async () => {
      await initPlugin();
      const lastVisitTime1 = sdk.pageVisits.getLastVisitTime();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second visit
      sdk.destroy?.();
      await initPlugin();
      const lastVisitTime2 = sdk.pageVisits.getLastVisitTime();

      expect(lastVisitTime2).toBeGreaterThan(lastVisitTime1 ?? 0);
    });
  });

  describe('First Visit Detection', () => {
    it('should detect first visit when no data exists', async () => {
      const events: PageVisitsEvent[] = [];
      sdk = new SDK({
        pageVisits: { enabled: true },
        storage: { backend: 'memory' },
      }) as SDKWithPageVisits;
      sdk.use(storagePlugin);
      sdk.use(pageVisitsPlugin);

      sdk.on('pageVisits:incremented', (event: PageVisitsEvent) => {
        events.push(event);
      });

      await sdk.init();

      expect(events.length).toBe(1);
      expect(events[0].isFirstVisit).toBe(true);
      expect(events[0].totalVisits).toBe(1);
      expect(events[0].sessionVisits).toBe(1);
    });

    it('should not be first visit on subsequent loads', async () => {
      // First visit
      await initPlugin();

      // Second visit - set up event listener BEFORE init
      sdk.destroy?.();

      const events: PageVisitsEvent[] = [];
      sdk = new SDK({
        pageVisits: { enabled: true },
        storage: { backend: 'memory' },
      }) as SDKWithPageVisits;
      sdk.use(storagePlugin);
      sdk.use(pageVisitsPlugin);

      sdk.on('pageVisits:incremented', (event: PageVisitsEvent) => {
        events.push(event);
      });

      await sdk.init();

      expect(events.length).toBe(1);
      expect(events[0].isFirstVisit).toBe(false);
      expect(events[0].totalVisits).toBe(2);
    });
  });

  describe('DNT (Do Not Track)', () => {
    it('should respect DNT when enabled', async () => {
      // Mock DNT
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        configurable: true,
      });

      const events: any[] = [];
      sdk = new SDK({
        pageVisits: { enabled: true, respectDNT: true },
        storage: { backend: 'memory' },
      }) as SDKWithPageVisits;
      sdk.use(storagePlugin);
      sdk.use(pageVisitsPlugin);

      sdk.on('pageVisits:disabled', (event: any) => {
        events.push(event);
      });

      await sdk.init();

      expect(events.length).toBe(1);
      expect(events[0].reason).toBe('dnt');
    });

    it('should not track when DNT is enabled', async () => {
      // Mock DNT
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        configurable: true,
      });

      await initPlugin({ enabled: true, respectDNT: true });

      // No tracking should occur
      expect(sdk.pageVisits.getTotalCount()).toBe(0);
      expect(sdk.pageVisits.getSessionCount()).toBe(0);
    });

    it('should ignore DNT when respectDNT is false', async () => {
      // Mock DNT
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        configurable: true,
      });

      await initPlugin({ enabled: true, respectDNT: false });

      // Should still track
      expect(sdk.pageVisits.getTotalCount()).toBe(1);
      expect(sdk.pageVisits.getSessionCount()).toBe(1);
    });
  });

  describe('API Methods', () => {
    describe('getTotalCount', () => {
      it('should return total visit count', async () => {
        await initPlugin();
        expect(sdk.pageVisits.getTotalCount()).toBe(1);
      });
    });

    describe('getSessionCount', () => {
      it('should return session visit count', async () => {
        await initPlugin();
        expect(sdk.pageVisits.getSessionCount()).toBe(1);
      });
    });

    describe('isFirstVisit', () => {
      it('should return false after first increment', async () => {
        await initPlugin();
        expect(sdk.pageVisits.isFirstVisit()).toBe(false);
      });
    });

    describe('getFirstVisitTime', () => {
      it('should return first visit timestamp', async () => {
        await initPlugin();
        const time = sdk.pageVisits.getFirstVisitTime();
        expect(time).toBeDefined();
        expect(typeof time).toBe('number');
      });
    });

    describe('getLastVisitTime', () => {
      it('should return last visit timestamp', async () => {
        await initPlugin();
        const time = sdk.pageVisits.getLastVisitTime();
        expect(time).toBeDefined();
        expect(typeof time).toBe('number');
      });
    });

    describe('increment', () => {
      it('should manually increment counters', async () => {
        await initPlugin({ autoIncrement: false });
        expect(sdk.pageVisits.getTotalCount()).toBe(0);

        sdk.pageVisits.increment();
        expect(sdk.pageVisits.getTotalCount()).toBe(1);
        expect(sdk.pageVisits.getSessionCount()).toBe(1);
      });

      it('should emit pageVisits:incremented event', async () => {
        await initPlugin({ autoIncrement: false });

        const events: PageVisitsEvent[] = [];
        sdk.on('pageVisits:incremented', (event: PageVisitsEvent) => {
          events.push(event);
        });

        sdk.pageVisits.increment();

        expect(events.length).toBe(1);
        expect(events[0].totalVisits).toBe(1);
        expect(events[0].sessionVisits).toBe(1);
      });
    });

    describe('reset', () => {
      it('should reset all counters', async () => {
        await initPlugin();
        expect(sdk.pageVisits.getTotalCount()).toBe(1);

        sdk.pageVisits.reset();

        expect(sdk.pageVisits.getTotalCount()).toBe(0);
        expect(sdk.pageVisits.getSessionCount()).toBe(0);
        expect(sdk.pageVisits.isFirstVisit()).toBe(false);
        expect(sdk.pageVisits.getFirstVisitTime()).toBeUndefined();
        expect(sdk.pageVisits.getLastVisitTime()).toBeUndefined();
      });

      it('should clear storage', async () => {
        await initPlugin();
        sdk.pageVisits.reset();

        const sessionData = sessionStorage.getItem('pageVisits:session');
        const totalData = localStorage.getItem('pageVisits:total');

        expect(sessionData).toBeNull();
        expect(totalData).toBeNull();
      });

      it('should emit pageVisits:reset event', async () => {
        await initPlugin();

        const events: any[] = [];
        sdk.on('pageVisits:reset', () => {
          events.push(true);
        });

        sdk.pageVisits.reset();

        expect(events.length).toBe(1);
      });
    });

    describe('getState', () => {
      it('should return full page visits state', async () => {
        await initPlugin();

        const state = sdk.pageVisits.getState();

        expect(state).toHaveProperty('isFirstVisit');
        expect(state).toHaveProperty('totalVisits');
        expect(state).toHaveProperty('sessionVisits');
        expect(state).toHaveProperty('firstVisitTime');
        expect(state).toHaveProperty('lastVisitTime');
        expect(state).toHaveProperty('timestamp');
      });
    });
  });

  describe('Configuration', () => {
    it('should support custom storage keys', async () => {
      await initPlugin({
        sessionKey: 'custom:session',
        totalKey: 'custom:total',
      });

      expect(sdk.pageVisits.getTotalCount()).toBe(1);

      // Check custom keys in storage
      const sessionData = sessionStorage.getItem('custom:session');
      const totalData = localStorage.getItem('custom:total');

      expect(sessionData).toBeDefined();
      expect(totalData).toBeDefined();
    });

    it('should support disabling via config', async () => {
      const events: any[] = [];
      sdk = new SDK({
        pageVisits: { enabled: false },
        storage: { backend: 'memory' },
      }) as SDKWithPageVisits;
      sdk.use(storagePlugin);
      sdk.use(pageVisitsPlugin);

      sdk.on('pageVisits:disabled', (event: any) => {
        events.push(event);
      });

      await sdk.init();

      expect(events.length).toBe(1);
      expect(events[0].reason).toBe('config');
    });

    it('should support disabling auto-increment', async () => {
      await initPlugin({ autoIncrement: false });

      expect(sdk.pageVisits.getTotalCount()).toBe(0);
      expect(sdk.pageVisits.getSessionCount()).toBe(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit pageVisits:incremented with full payload', async () => {
      const events: PageVisitsEvent[] = [];
      sdk = new SDK({
        pageVisits: { enabled: true },
        storage: { backend: 'memory' },
      }) as SDKWithPageVisits;
      sdk.use(storagePlugin);
      sdk.use(pageVisitsPlugin);

      sdk.on('pageVisits:incremented', (event: PageVisitsEvent) => {
        events.push(event);
      });

      await sdk.init();

      expect(events.length).toBe(1);
      expect(events[0]).toMatchObject({
        isFirstVisit: true,
        totalVisits: 1,
        sessionVisits: 1,
      });
      expect(events[0].firstVisitTime).toBeDefined();
      expect(events[0].lastVisitTime).toBeDefined();
      expect(events[0].timestamp).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should track session-scoped visits correctly', async () => {
      // First page load
      await initPlugin();
      const session1 = sdk.pageVisits.getSessionCount();
      expect(session1).toBe(1);

      // Second page load (same session)
      sdk.destroy?.();
      await initPlugin();
      const session2 = sdk.pageVisits.getSessionCount();
      expect(session2).toBe(2);

      // Clear sessionStorage (simulate new session)
      sessionStorage.clear();
      sdk.destroy?.();
      await initPlugin();
      const session3 = sdk.pageVisits.getSessionCount();
      expect(session3).toBe(1); // Reset
    });

    it('should track lifetime visits across sessions', async () => {
      // First visit
      await initPlugin();
      const total1 = sdk.pageVisits.getTotalCount();
      expect(total1).toBe(1);

      // Second visit
      sdk.destroy?.();
      await initPlugin();
      const total2 = sdk.pageVisits.getTotalCount();
      expect(total2).toBe(2);

      // Clear sessionStorage (new session) but keep localStorage
      sessionStorage.clear();
      sdk.destroy?.();
      await initPlugin();
      const total3 = sdk.pageVisits.getTotalCount();
      expect(total3).toBe(3); // Continues incrementing
    });

    it('should support first-visit detection', async () => {
      const events: PageVisitsEvent[] = [];
      sdk = new SDK({
        pageVisits: { enabled: true },
        storage: { backend: 'memory' },
      }) as SDKWithPageVisits;
      sdk.use(storagePlugin);
      sdk.use(pageVisitsPlugin);

      sdk.on('pageVisits:incremented', (event: PageVisitsEvent) => {
        events.push(event);
      });

      await sdk.init();

      expect(events[0].isFirstVisit).toBe(true);
    });

    it('should support all comparison operators in targeting', async () => {
      await initPlugin();

      // Simulate 5 visits
      for (let i = 0; i < 4; i++) {
        sdk.destroy?.();
        await initPlugin();
      }

      const count = sdk.pageVisits.getTotalCount();
      expect(count).toBe(5);

      // Support all operators for flexible targeting
      expect(count >= 5).toBe(true);
      expect(count === 5).toBe(true);
      expect(count < 10).toBe(true);
    });
  });

  describe('Storage Backend Integration', () => {
    it('should auto-load storage plugin if missing', async () => {
      // Don't manually load storagePlugin
      sdk = new SDK({
        pageVisits: { enabled: true },
      }) as SDKWithPageVisits;
      sdk.use(pageVisitsPlugin);

      await sdk.init();

      // Should still work (auto-loaded)
      expect(sdk.pageVisits.getTotalCount()).toBe(1);
    });
  });
});
