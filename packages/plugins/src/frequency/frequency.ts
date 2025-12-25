/**
 * Frequency Capping Plugin
 *
 * Tracks experience impressions and enforces frequency caps.
 * Uses sdk-kit's storage plugin for persistence.
 */

import type { PluginFunction, SDK } from '@lytics/sdk-kit';
import { type StoragePlugin, storagePlugin } from '@lytics/sdk-kit-plugins';
import type { TraceStep } from '../types';

export interface FrequencyPluginConfig {
  frequency?: {
    enabled?: boolean;
    namespace?: string;
  };
}

export interface FrequencyPlugin {
  getImpressionCount(experienceId: string): number;
  hasReachedCap(experienceId: string, max: number, per: 'session' | 'day' | 'week'): boolean;
  recordImpression(experienceId: string): void;
}

interface ImpressionData {
  count: number;
  lastImpression: number;
  impressions: number[];
  per?: 'session' | 'day' | 'week'; // Track which storage type this uses
}

/**
 * Frequency Capping Plugin
 *
 * Automatically tracks impressions and enforces frequency caps.
 * Requires storage plugin for persistence.
 *
 * @example
 * ```typescript
 * import { createInstance } from '@prosdevlab/experience-sdk';
 * import { frequencyPlugin } from '@prosdevlab/experience-sdk-plugins';
 *
 * const sdk = createInstance({ frequency: { enabled: true } });
 * sdk.use(frequencyPlugin);
 * ```
 */
export const frequencyPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('frequency');

  // Set defaults
  plugin.defaults({
    frequency: {
      enabled: true,
      namespace: 'experiences:frequency',
    },
  });

  // Track experience frequency configs
  const experienceFrequencyMap = new Map<string, 'session' | 'day' | 'week'>();

  // Auto-load storage plugin if not already loaded
  if (!(instance as SDK & { storage?: StoragePlugin }).storage) {
    instance.use(storagePlugin);
  }

  const isEnabled = (): boolean => config.get('frequency.enabled') ?? true;
  const getNamespace = (): string => config.get('frequency.namespace') ?? 'experiences:frequency';

  // Helper to get the right storage backend based on frequency type
  const getStorageBackend = (per: 'session' | 'day' | 'week'): Storage => {
    return per === 'session' ? sessionStorage : localStorage;
  };

  // Helper to get storage key
  const getStorageKey = (experienceId: string): string => {
    return `${getNamespace()}:${experienceId}`;
  };

  // Helper to get impression data
  const getImpressionData = (
    experienceId: string,
    per: 'session' | 'day' | 'week'
  ): ImpressionData => {
    const storage = getStorageBackend(per);
    const key = getStorageKey(experienceId);
    const raw = storage.getItem(key);

    if (!raw) {
      return {
        count: 0,
        lastImpression: 0,
        impressions: [],
        per,
      };
    }

    try {
      return JSON.parse(raw) as ImpressionData;
    } catch {
      return {
        count: 0,
        lastImpression: 0,
        impressions: [],
        per,
      };
    }
  };

  // Helper to save impression data
  const saveImpressionData = (experienceId: string, data: ImpressionData): void => {
    const per = data.per || 'session'; // Default to session if not specified
    const storage = getStorageBackend(per);
    const key = getStorageKey(experienceId);
    storage.setItem(key, JSON.stringify(data));
  };

  // Get time window in milliseconds
  const getTimeWindow = (per: 'session' | 'day' | 'week'): number => {
    switch (per) {
      case 'session':
        return Number.POSITIVE_INFINITY; // Session storage handles this
      case 'day':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'week':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
    }
  };

  /**
   * Get impression count for an experience
   */
  const getImpressionCount = (
    experienceId: string,
    per: 'session' | 'day' | 'week' = 'session'
  ): number => {
    if (!isEnabled()) return 0;
    const data = getImpressionData(experienceId, per);
    return data.count;
  };

  /**
   * Check if an experience has reached its frequency cap
   */
  const hasReachedCap = (
    experienceId: string,
    max: number,
    per: 'session' | 'day' | 'week'
  ): boolean => {
    if (!isEnabled()) return false;

    const data = getImpressionData(experienceId, per);
    const timeWindow = getTimeWindow(per);
    const now = Date.now();

    // For session caps, just check total count
    if (per === 'session') {
      return data.count >= max;
    }

    // For time-based caps, count impressions within the window
    const recentImpressions = data.impressions.filter((timestamp) => now - timestamp < timeWindow);

    return recentImpressions.length >= max;
  };

  /**
   * Record an impression for an experience
   */
  const recordImpression = (
    experienceId: string,
    per: 'session' | 'day' | 'week' = 'session'
  ): void => {
    if (!isEnabled()) return;

    const data = getImpressionData(experienceId, per);
    const now = Date.now();

    // Update count and add timestamp
    data.count += 1;
    data.lastImpression = now;
    data.impressions.push(now);
    data.per = per; // Store the frequency type

    // Keep only recent impressions (last 7 days)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    data.impressions = data.impressions.filter((ts) => ts > sevenDaysAgo);

    // Save updated data
    saveImpressionData(experienceId, data);

    // Emit event
    instance.emit('experiences:impression-recorded', {
      experienceId,
      count: data.count,
      timestamp: now,
    });
  };

  // Expose frequency API
  plugin.expose({
    frequency: {
      getImpressionCount,
      hasReachedCap,
      recordImpression,
      // Internal method to register experience frequency config
      _registerExperience: (experienceId: string, per: 'session' | 'day' | 'week') => {
        experienceFrequencyMap.set(experienceId, per);
      },
    },
  });

  // Listen to evaluation events and record impressions
  if (isEnabled()) {
    instance.on('experiences:evaluated', ({ decision }) => {
      // Only record if experience was shown
      if (decision.show && decision.experienceId) {
        // Try to get the 'per' value from our map, fall back to checking the input in trace
        let per: 'session' | 'day' | 'week' =
          experienceFrequencyMap.get(decision.experienceId) || 'session';

        // If not in map, try to infer from the decision trace
        if (!experienceFrequencyMap.has(decision.experienceId)) {
          const freqStep = decision.trace.find((t: TraceStep) => t.step === 'check-frequency-cap');
          if (freqStep?.input && typeof freqStep.input === 'object' && 'per' in freqStep.input) {
            per = (freqStep.input as { per: 'session' | 'day' | 'week' }).per;
            // Cache it for next time
            experienceFrequencyMap.set(decision.experienceId, per);
          }
        }

        recordImpression(decision.experienceId, per);
      }
    });
  }
};
