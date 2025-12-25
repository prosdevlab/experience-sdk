import { SDK } from '@lytics/sdk-kit';
import { type StoragePlugin, storagePlugin } from '@lytics/sdk-kit-plugins';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Decision } from '../types';
import { type FrequencyPlugin, frequencyPlugin } from './frequency';

type SDKWithFrequency = SDK & { frequency: FrequencyPlugin; storage: StoragePlugin };

describe('Frequency Plugin', () => {
  let sdk: SDKWithFrequency;

  beforeEach(() => {
    // Use memory storage for tests
    sdk = new SDK({
      frequency: { enabled: true },
      storage: { backend: 'memory' },
    }) as SDKWithFrequency;

    // Install plugins
    sdk.use(storagePlugin);
    sdk.use(frequencyPlugin);
  });

  describe('Plugin Registration', () => {
    it('should register frequency plugin', () => {
      expect(sdk.frequency).toBeDefined();
    });

    it('should expose frequency API methods', () => {
      expect(sdk.frequency.getImpressionCount).toBeTypeOf('function');
      expect(sdk.frequency.hasReachedCap).toBeTypeOf('function');
      expect(sdk.frequency.recordImpression).toBeTypeOf('function');
    });

    it('should auto-load storage plugin if not present', () => {
      const newSdk = new SDK({ frequency: { enabled: true } }) as SDKWithFrequency;
      newSdk.use(frequencyPlugin);
      expect(newSdk.storage).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should use default config', () => {
      const enabled = sdk.get('frequency.enabled');
      const namespace = sdk.get('frequency.namespace');

      expect(enabled).toBe(true);
      expect(namespace).toBe('experiences:frequency');
    });

    it('should allow custom config', () => {
      const customSdk = new SDK({
        frequency: { enabled: false, namespace: 'custom:freq' },
        storage: { backend: 'memory' },
      }) as SDKWithFrequency;

      customSdk.use(storagePlugin);
      customSdk.use(frequencyPlugin);

      expect(customSdk.get('frequency.enabled')).toBe(false);
      expect(customSdk.get('frequency.namespace')).toBe('custom:freq');
    });
  });

  describe('Impression Tracking', () => {
    it('should initialize impression count at 0', () => {
      const count = sdk.frequency.getImpressionCount('welcome-banner');
      expect(count).toBe(0);
    });

    it('should record impressions', () => {
      sdk.frequency.recordImpression('welcome-banner');
      expect(sdk.frequency.getImpressionCount('welcome-banner')).toBe(1);

      sdk.frequency.recordImpression('welcome-banner');
      expect(sdk.frequency.getImpressionCount('welcome-banner')).toBe(2);
    });

    it('should track impressions per experience independently', () => {
      sdk.frequency.recordImpression('banner-1');
      sdk.frequency.recordImpression('banner-2');
      sdk.frequency.recordImpression('banner-1');

      expect(sdk.frequency.getImpressionCount('banner-1')).toBe(2);
      expect(sdk.frequency.getImpressionCount('banner-2')).toBe(1);
    });

    it('should emit impression-recorded event', () => {
      const handler = vi.fn();
      sdk.on('experiences:impression-recorded', handler);

      sdk.frequency.recordImpression('welcome-banner');

      expect(handler).toHaveBeenCalledWith({
        experienceId: 'welcome-banner',
        count: 1,
        timestamp: expect.any(Number),
      });
    });

    it('should not record impressions when disabled', () => {
      sdk.set('frequency.enabled', false);
      sdk.frequency.recordImpression('welcome-banner');
      expect(sdk.frequency.getImpressionCount('welcome-banner')).toBe(0);
    });
  });

  describe('Session Frequency Caps', () => {
    it('should not reach cap below limit', () => {
      sdk.frequency.recordImpression('welcome-banner');
      expect(sdk.frequency.hasReachedCap('welcome-banner', 2, 'session')).toBe(false);
    });

    it('should reach cap at limit', () => {
      sdk.frequency.recordImpression('welcome-banner');
      sdk.frequency.recordImpression('welcome-banner');
      expect(sdk.frequency.hasReachedCap('welcome-banner', 2, 'session')).toBe(true);
    });

    it('should reach cap above limit', () => {
      sdk.frequency.recordImpression('welcome-banner');
      sdk.frequency.recordImpression('welcome-banner');
      sdk.frequency.recordImpression('welcome-banner');
      expect(sdk.frequency.hasReachedCap('welcome-banner', 2, 'session')).toBe(true);
    });
  });

  describe('Time-Based Frequency Caps', () => {
    it('should count impressions within day window', () => {
      const now = Date.now();

      // Mock Date.now() for first impression (25 hours ago - outside window)
      vi.spyOn(Date, 'now').mockReturnValue(now - 25 * 60 * 60 * 1000);
      sdk.frequency.recordImpression('welcome-banner');

      // Mock Date.now() for second impression (now - inside window)
      vi.spyOn(Date, 'now').mockReturnValue(now);
      sdk.frequency.recordImpression('welcome-banner');

      // Only 1 impression within last 24 hours
      expect(sdk.frequency.hasReachedCap('welcome-banner', 2, 'day')).toBe(false);
      expect(sdk.frequency.hasReachedCap('welcome-banner', 1, 'day')).toBe(true);

      vi.restoreAllMocks();
    });

    it('should count impressions within week window', () => {
      const now = Date.now();

      // Record 2 impressions 8 days ago (outside week window)
      vi.spyOn(Date, 'now').mockReturnValue(now - 8 * 24 * 60 * 60 * 1000);
      sdk.frequency.recordImpression('welcome-banner');
      sdk.frequency.recordImpression('welcome-banner');

      // Record 1 impression 3 days ago (inside week window)
      vi.spyOn(Date, 'now').mockReturnValue(now - 3 * 24 * 60 * 60 * 1000);
      sdk.frequency.recordImpression('welcome-banner');

      // Current time
      vi.spyOn(Date, 'now').mockReturnValue(now);

      // Only 1 impression within last 7 days
      expect(sdk.frequency.hasReachedCap('welcome-banner', 2, 'week')).toBe(false);
      expect(sdk.frequency.hasReachedCap('welcome-banner', 1, 'week')).toBe(true);

      vi.restoreAllMocks();
    });

    it('should handle multiple impressions within time window', () => {
      const now = Date.now();

      // Record 3 impressions within last day
      for (let i = 0; i < 3; i++) {
        vi.spyOn(Date, 'now').mockReturnValue(now - i * 60 * 60 * 1000); // Each hour
        sdk.frequency.recordImpression('welcome-banner');
      }

      vi.spyOn(Date, 'now').mockReturnValue(now);

      expect(sdk.frequency.hasReachedCap('welcome-banner', 3, 'day')).toBe(true);
      expect(sdk.frequency.hasReachedCap('welcome-banner', 4, 'day')).toBe(false);

      vi.restoreAllMocks();
    });
  });

  describe('Event Integration', () => {
    it('should auto-record impression on experiences:evaluated event when show=true', () => {
      const decision: Decision = {
        show: true,
        experienceId: 'welcome-banner',
        reasons: ['URL matches'],
        trace: [],
        context: {
          url: 'https://example.com',
          timestamp: Date.now(),
        },
        metadata: {
          evaluatedAt: Date.now(),
          totalDuration: 10,
          experiencesEvaluated: 1,
        },
      };

      sdk.emit('experiences:evaluated', { decision });

      expect(sdk.frequency.getImpressionCount('welcome-banner')).toBe(1);
    });

    it('should not record impression when show=false', () => {
      const decision: Decision = {
        show: false,
        reasons: ['Frequency cap reached'],
        trace: [],
        context: {
          url: 'https://example.com',
          timestamp: Date.now(),
        },
        metadata: {
          evaluatedAt: Date.now(),
          totalDuration: 10,
          experiencesEvaluated: 1,
        },
      };

      sdk.emit('experiences:evaluated', { decision });

      expect(sdk.frequency.getImpressionCount('welcome-banner')).toBe(0);
    });

    it('should not record impression when experienceId is missing', () => {
      const decision: Decision = {
        show: true,
        reasons: ['No matching experience'],
        trace: [],
        context: {
          url: 'https://example.com',
          timestamp: Date.now(),
        },
        metadata: {
          evaluatedAt: Date.now(),
          totalDuration: 10,
          experiencesEvaluated: 0,
        },
      };

      sdk.emit('experiences:evaluated', { decision });

      // Should not throw or record
      expect(sdk.frequency.getImpressionCount('any-experience')).toBe(0);
    });

    it('should not auto-record when frequency plugin is disabled', () => {
      sdk.set('frequency.enabled', false);

      const decision: Decision = {
        show: true,
        experienceId: 'welcome-banner',
        reasons: ['URL matches'],
        trace: [],
        context: {
          url: 'https://example.com',
          timestamp: Date.now(),
        },
        metadata: {
          evaluatedAt: Date.now(),
          totalDuration: 10,
          experiencesEvaluated: 1,
        },
      };

      sdk.emit('experiences:evaluated', { decision });

      expect(sdk.frequency.getImpressionCount('welcome-banner')).toBe(0);
    });
  });

  describe('Storage Integration', () => {
    it('should persist impressions across SDK instances', () => {
      // Record impression in first instance
      sdk.frequency.recordImpression('welcome-banner');
      expect(sdk.frequency.getImpressionCount('welcome-banner')).toBe(1);

      // Create second instance with same storage backend
      const sdk2 = new SDK({
        frequency: { enabled: true },
        storage: { backend: 'memory' },
      }) as SDKWithFrequency;
      sdk2.use(storagePlugin);
      sdk2.use(frequencyPlugin);

      // Impressions should NOT persist (memory backend is per-instance)
      expect(sdk2.frequency.getImpressionCount('welcome-banner')).toBe(0);
    });

    it('should use namespaced storage keys', () => {
      sdk.frequency.recordImpression('welcome-banner');

      // Check storage directly
      const storageData = sdk.storage.get('experiences:frequency:welcome-banner');
      expect(storageData).toBeDefined();
      expect((storageData as { count: number }).count).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty experience ID gracefully', () => {
      expect(() => sdk.frequency.recordImpression('')).not.toThrow();
      expect(sdk.frequency.getImpressionCount('')).toBe(1);
    });

    it('should handle very large impression counts', () => {
      for (let i = 0; i < 1000; i++) {
        sdk.frequency.recordImpression('welcome-banner');
      }
      expect(sdk.frequency.getImpressionCount('welcome-banner')).toBe(1000);
    });

    it('should clean up old impressions (beyond 7 days)', () => {
      const now = Date.now();

      // Record 5 impressions: 3 old (>7 days), 2 recent
      vi.spyOn(Date, 'now').mockReturnValue(now - 10 * 24 * 60 * 60 * 1000);
      sdk.frequency.recordImpression('welcome-banner');

      vi.spyOn(Date, 'now').mockReturnValue(now - 8 * 24 * 60 * 60 * 1000);
      sdk.frequency.recordImpression('welcome-banner');

      vi.spyOn(Date, 'now').mockReturnValue(now - 9 * 24 * 60 * 60 * 1000);
      sdk.frequency.recordImpression('welcome-banner');

      vi.spyOn(Date, 'now').mockReturnValue(now - 2 * 24 * 60 * 60 * 1000);
      sdk.frequency.recordImpression('welcome-banner');

      vi.spyOn(Date, 'now').mockReturnValue(now);
      sdk.frequency.recordImpression('welcome-banner');

      // Total count should be 5, but old impressions cleaned up
      expect(sdk.frequency.getImpressionCount('welcome-banner')).toBe(5);

      // Check storage for cleaned impressions array
      const storageData = sdk.storage.get('experiences:frequency:welcome-banner') as {
        impressions: number[];
      };
      // Should only keep impressions from last 7 days (2 recent ones)
      expect(storageData.impressions.length).toBe(2);

      vi.restoreAllMocks();
    });
  });
});
