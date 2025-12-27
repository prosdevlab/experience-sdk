/** @module timeDelayPlugin */

import type { PluginFunction } from '@lytics/sdk-kit';
import type { TimeDelayEvent, TimeDelayPlugin, TimeDelayPluginConfig } from './types';

/**
 * Pure function: Calculate elapsed time from start
 */
export function calculateElapsed(startTime: number, pausedDuration: number): number {
  return Date.now() - startTime - pausedDuration;
}

/**
 * Pure function: Check if document is hidden (Page Visibility API)
 */
export function isDocumentHidden(): boolean {
  if (typeof document === 'undefined') return false;
  return document.hidden || false;
}

/**
 * Pure function: Create time delay event payload
 */
export function createTimeDelayEvent(
  startTime: number,
  pausedDuration: number,
  wasPaused: boolean,
  visibilityChanges: number
): TimeDelayEvent {
  const timestamp = Date.now();
  const elapsed = timestamp - startTime;
  const activeElapsed = elapsed - pausedDuration;

  return {
    timestamp,
    elapsed,
    activeElapsed,
    wasPaused,
    visibilityChanges,
  };
}

/**
 * Time Delay Plugin
 *
 * Tracks time elapsed since SDK initialization and emits trigger:timeDelay events
 * when the configured delay is reached.
 *
 * **Features:**
 * - Millisecond precision timing
 * - Pause/resume on tab visibility change (optional)
 * - Tracks active vs total elapsed time
 * - Full timer lifecycle management
 *
 * **Event-Driven Architecture:**
 * This plugin emits `trigger:timeDelay` events when the delay threshold is reached.
 * The core runtime listens for these events and automatically re-evaluates experiences.
 *
 * **Usage Pattern:**
 * Use `targeting.custom` to check if time delay has triggered:
 *
 * @example Basic usage
 * ```typescript
 * import { init, register } from '@prosdevlab/experience-sdk';
 *
 * init({
 *   timeDelay: {
 *     delay: 5000,          // 5 seconds
 *     pauseWhenHidden: true  // Pause when tab hidden (default)
 *   }
 * });
 *
 * // Show banner after 5 seconds of active viewing time
 * register('timed-offer', {
 *   type: 'banner',
 *   content: {
 *     message: 'Limited time offer!',
 *     buttons: [{ text: 'Claim Now', variant: 'primary' }]
 *   },
 *   targeting: {
 *     custom: (context) => {
 *       const active = context.triggers?.timeDelay?.activeElapsed || 0;
 *       return active >= 5000;
 *     }
 *   }
 * });
 * ```
 *
 * @example Combining with other triggers
 * ```typescript
 * // Show after 10s OR on exit intent (whichever comes first)
 * register('engaged-offer', {
 *   type: 'banner',
 *   content: { message: 'Special offer for engaged users!' },
 *   targeting: {
 *     custom: (context) => {
 *       const timeElapsed = (context.triggers?.timeDelay?.activeElapsed || 0) >= 10000;
 *       const exitIntent = context.triggers?.exitIntent?.triggered;
 *       return timeElapsed || exitIntent;
 *     }
 *   }
 * });
 * ```
 *
 * @param plugin Plugin interface from sdk-kit
 * @param instance SDK instance
 * @param config SDK configuration
 */
export const timeDelayPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.timeDelay');

  // Set defaults
  plugin.defaults({
    timeDelay: {
      delay: 0,
      pauseWhenHidden: true,
    },
  });

  // Get config
  const timeDelayConfig = config.get('timeDelay') as TimeDelayPluginConfig['timeDelay'];
  if (!timeDelayConfig) return;

  const delay = timeDelayConfig.delay ?? 0;
  const pauseWhenHidden = timeDelayConfig.pauseWhenHidden ?? true;

  // Skip if delay is 0 (disabled)
  if (delay <= 0) return;

  // State
  const startTime = Date.now();
  let triggered = false;
  let paused = false;
  let pausedDuration = 0;
  let lastPauseTime = 0;
  let visibilityChanges = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let visibilityListener: (() => void) | null = null;

  /**
   * Trigger the time delay event
   */
  function trigger(): void {
    if (triggered) return;

    triggered = true;

    // Create event payload using pure function
    const eventPayload = createTimeDelayEvent(
      startTime,
      pausedDuration,
      visibilityChanges > 0,
      visibilityChanges
    );

    // Emit trigger event
    instance.emit('trigger:timeDelay', eventPayload);

    // Cleanup
    cleanup();
  }

  /**
   * Schedule timer with remaining delay
   */
  function scheduleTimer(remainingDelay: number): void {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      trigger();
    }, remainingDelay);
  }

  /**
   * Handle visibility change
   */
  function handleVisibilityChange(): void {
    const hidden = isDocumentHidden();

    if (hidden && !paused) {
      // Tab just became hidden - pause timer
      paused = true;
      lastPauseTime = Date.now();
      visibilityChanges++;

      // Clear existing timer
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    } else if (!hidden && paused) {
      // Tab just became visible - resume timer
      paused = false;
      const pauseDuration = Date.now() - lastPauseTime;
      pausedDuration += pauseDuration;
      visibilityChanges++;

      // Calculate remaining delay
      const elapsed = calculateElapsed(startTime, pausedDuration);
      const remaining = delay - elapsed;

      if (remaining > 0) {
        scheduleTimer(remaining);
      } else {
        // Delay already elapsed during pause
        trigger();
      }
    }
  }

  /**
   * Cleanup listeners and timers
   */
  function cleanup(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityListener);
      visibilityListener = null;
    }
  }

  /**
   * Initialize timer and visibility listener
   */
  function initialize(): void {
    // Check if already hidden on init
    if (pauseWhenHidden && isDocumentHidden()) {
      paused = true;
      lastPauseTime = Date.now();
      visibilityChanges++;
    } else {
      // Start timer
      scheduleTimer(delay);
    }

    // Setup visibility listener if pause is enabled
    if (pauseWhenHidden && typeof document !== 'undefined') {
      visibilityListener = handleVisibilityChange;
      document.addEventListener('visibilitychange', visibilityListener);
    }
  }

  // Expose API
  plugin.expose({
    timeDelay: {
      getElapsed: () => {
        return Date.now() - startTime;
      },

      getActiveElapsed: () => {
        let currentPausedDuration = pausedDuration;
        if (paused) {
          // Add current pause duration
          currentPausedDuration += Date.now() - lastPauseTime;
        }
        return calculateElapsed(startTime, currentPausedDuration);
      },

      getRemaining: () => {
        if (triggered) return 0;

        const elapsed = calculateElapsed(startTime, pausedDuration);
        const remaining = delay - elapsed;
        return Math.max(0, remaining);
      },

      isPaused: () => paused,

      isTriggered: () => triggered,

      reset: () => {
        triggered = false;
        paused = false;
        pausedDuration = 0;
        lastPauseTime = 0;
        visibilityChanges = 0;

        cleanup();
        initialize();
      },
    } satisfies TimeDelayPlugin,
  });

  // Initialize on plugin load
  initialize();

  // Cleanup on instance destroy
  const destroyHandler = () => {
    cleanup();
  };
  instance.on('destroy', destroyHandler);
};
