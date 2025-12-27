/**
 * Page Visits Plugin
 *
 * Generic page visit tracking for any SDK built on sdk-kit.
 *
 * Features:
 * - Session-scoped counter (sessionStorage)
 * - Lifetime counter with timestamps (localStorage)
 * - First-visit detection
 * - DNT (Do Not Track) support
 * - GDPR-compliant expiration
 * - Auto-loads storage plugin if missing
 *
 * Events emitted:
 * - 'pageVisits:incremented' with PageVisitsEvent
 * - 'pageVisits:reset'
 * - 'pageVisits:disabled' with { reason: 'dnt' | 'config' }
 *
 * @example
 * ```typescript
 * import { SDK } from '@lytics/sdk-kit';
 * import { storagePlugin, pageVisitsPlugin } from '@lytics/sdk-kit-plugins';
 *
 * const sdk = new SDK({
 *   pageVisits: {
 *     enabled: true,
 *     respectDNT: true,
 *     ttl: 31536000  // 1 year
 *   }
 * });
 *
 * sdk.use(storagePlugin);
 * sdk.use(pageVisitsPlugin);
 *
 * // Listen to visit events
 * sdk.on('pageVisits:incremented', (event) => {
 *   console.log('Visit count:', event.totalVisits);
 *   if (event.isFirstVisit) {
 *     console.log('Welcome, first-time visitor!');
 *   }
 * });
 *
 * // API methods
 * console.log(sdk.pageVisits.getTotalCount());      // 5
 * console.log(sdk.pageVisits.getSessionCount());    // 2
 * console.log(sdk.pageVisits.isFirstVisit());       // false
 * ```
 */

import type { PluginFunction, SDK } from '@lytics/sdk-kit';
import { type StoragePlugin, storagePlugin } from '@lytics/sdk-kit-plugins';
import type { PageVisitsEvent, PageVisitsPlugin } from './types';

/**
 * Storage data format for lifetime visits
 */
interface TotalData {
  count: number;
  first: number; // Timestamp
  last: number; // Timestamp
}

/**
 * Pure function: Check if Do Not Track is enabled
 */
export function respectsDNT(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    navigator.doNotTrack === '1' ||
    (navigator as any).msDoNotTrack === '1' ||
    (window as any).doNotTrack === '1'
  );
}

/**
 * Pure function: Build storage key with optional prefix
 */
export function buildStorageKey(key: string, prefix?: string): string {
  return prefix ? `${prefix}${key}` : key;
}

/**
 * Pure function: Create PageVisitsEvent payload
 */
export function createVisitsEvent(
  isFirstVisit: boolean,
  totalVisits: number,
  sessionVisits: number,
  firstVisitTime: number | undefined,
  lastVisitTime: number | undefined,
  timestamp: number
): PageVisitsEvent {
  return {
    isFirstVisit,
    totalVisits,
    sessionVisits,
    firstVisitTime,
    lastVisitTime,
    timestamp,
  };
}

export const pageVisitsPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('pageVisits');

  // Set defaults
  plugin.defaults({
    pageVisits: {
      enabled: true,
      respectDNT: true,
      sessionKey: 'pageVisits:session',
      totalKey: 'pageVisits:total',
      ttl: undefined,
      autoIncrement: true,
    },
  });

  // Auto-load storage plugin if not present
  if (!(instance as SDK & { storage?: StoragePlugin }).storage) {
    console.warn('[PageVisits] Storage plugin not found, auto-loading...');
    instance.use(storagePlugin);
  }

  // Cast instance to include storage
  const sdkInstance = instance as SDK & { storage: StoragePlugin };

  // Internal state
  let sessionCount = 0;
  let totalCount = 0;
  let firstVisitTime: number | undefined;
  let lastVisitTime: number | undefined;
  let isFirstVisitFlag = false;
  let initialized = false;

  /**
   * Load existing visit data from storage
   */
  function loadData(): void {
    const sessionKey = config.get('pageVisits.sessionKey') ?? 'pageVisits:session';
    const totalKey = config.get('pageVisits.totalKey') ?? 'pageVisits:total';

    // Load session count
    const storedSession = sdkInstance.storage.get<number>(sessionKey, {
      backend: 'sessionStorage',
    });
    sessionCount = storedSession ?? 0;

    // Load total data
    const storedTotal = sdkInstance.storage.get<TotalData>(totalKey, {
      backend: 'localStorage',
    });

    if (storedTotal) {
      totalCount = storedTotal.count ?? 0;
      firstVisitTime = storedTotal.first;
      lastVisitTime = storedTotal.last;
      isFirstVisitFlag = false;
    } else {
      totalCount = 0;
      firstVisitTime = undefined;
      lastVisitTime = undefined;
      isFirstVisitFlag = true;
    }
  }

  /**
   * Save visit data to storage
   */
  function saveData(): void {
    const sessionKey = config.get('pageVisits.sessionKey') ?? 'pageVisits:session';
    const totalKey = config.get('pageVisits.totalKey') ?? 'pageVisits:total';
    const ttl = config.get('pageVisits.ttl');

    // Save session count
    sdkInstance.storage.set(sessionKey, sessionCount, {
      backend: 'sessionStorage',
    });

    // Save total data
    const totalData: TotalData = {
      count: totalCount,
      first: firstVisitTime ?? Date.now(),
      last: lastVisitTime ?? Date.now(),
    };

    sdkInstance.storage.set(totalKey, totalData, {
      backend: 'localStorage',
      ...(ttl && { ttl }),
    });
  }

  /**
   * Increment visit counters
   */
  function increment(): void {
    if (!initialized) {
      loadData();
      initialized = true;
    }

    // Increment counters
    sessionCount += 1;
    totalCount += 1;
    const now = Date.now();

    // Set first visit time if needed
    if (isFirstVisitFlag) {
      firstVisitTime = now;
    }

    // Update last visit time
    lastVisitTime = now;

    // Save to storage
    saveData();

    // Emit event using pure function
    const event = createVisitsEvent(
      isFirstVisitFlag,
      totalCount,
      sessionCount,
      firstVisitTime,
      lastVisitTime,
      now
    );

    plugin.emit('pageVisits:incremented', event);

    // After first increment, no longer first visit
    if (isFirstVisitFlag) {
      isFirstVisitFlag = false;
    }
  }

  /**
   * Reset all data
   */
  function reset(): void {
    const sessionKey = config.get('pageVisits.sessionKey') ?? 'pageVisits:session';
    const totalKey = config.get('pageVisits.totalKey') ?? 'pageVisits:total';

    // Clear storage
    sdkInstance.storage.remove(sessionKey, { backend: 'sessionStorage' });
    sdkInstance.storage.remove(totalKey, { backend: 'localStorage' });

    // Reset state
    sessionCount = 0;
    totalCount = 0;
    firstVisitTime = undefined;
    lastVisitTime = undefined;
    isFirstVisitFlag = false;
    initialized = false;

    // Emit event
    plugin.emit('pageVisits:reset');
  }

  /**
   * Get current state
   */
  function getState(): PageVisitsEvent {
    return createVisitsEvent(
      isFirstVisitFlag,
      totalCount,
      sessionCount,
      firstVisitTime,
      lastVisitTime,
      Date.now()
    );
  }

  /**
   * Initialize plugin
   */
  function initialize(): void {
    const enabled = config.get('pageVisits.enabled') ?? true;
    const respectDNTConfig = config.get('pageVisits.respectDNT') ?? true;
    const autoIncrement = config.get('pageVisits.autoIncrement') ?? true;

    // Check DNT using pure function
    if (respectDNTConfig && respectsDNT()) {
      plugin.emit('pageVisits:disabled', { reason: 'dnt' });
      return;
    }

    // Check enabled
    if (!enabled) {
      plugin.emit('pageVisits:disabled', { reason: 'config' });
      return;
    }

    // Auto-increment on load
    if (autoIncrement) {
      increment();
    }
  }

  // Initialize on SDK ready
  instance.on('sdk:ready', initialize);

  // Expose public API
  plugin.expose({
    pageVisits: {
      getTotalCount: () => totalCount,
      getSessionCount: () => sessionCount,
      isFirstVisit: () => isFirstVisitFlag,
      getFirstVisitTime: () => firstVisitTime,
      getLastVisitTime: () => lastVisitTime,
      increment,
      reset,
      getState,
    } satisfies PageVisitsPlugin,
  });
};
