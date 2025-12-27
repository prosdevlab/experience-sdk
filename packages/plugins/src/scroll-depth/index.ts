/** @module scrollDepthPlugin */

import type { PluginFunction } from '@lytics/sdk-kit';
import type { ScrollDepthEvent, ScrollDepthPluginConfig } from './types';

/**
 * Detect device type based on user agent and screen size
 */
function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);

  // Also check screen size as fallback
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';

  return 'desktop';
}

/**
 * Throttle helper function
 * @param func Function to throttle
 * @param wait Wait time in milliseconds
 * @returns Throttled function
 */
// biome-ignore lint/suspicious/noExplicitAny: Browser API compatibility requires flexible typing
function throttle<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Scroll Depth Plugin
 *
 * Tracks scroll depth and emits `trigger:scrollDepth` events when thresholds are crossed.
 *
 * ## How It Works
 *
 * 1. **Detection**: Listens to `scroll` events (throttled)
 * 2. **Calculation**: Calculates current scroll percentage
 * 3. **Tracking**: Tracks maximum scroll depth and threshold crossings
 * 4. **Emission**: Emits `trigger:scrollDepth` events when thresholds are crossed
 *
 * ## Configuration
 *
 * ```typescript
 * init({
 *   scrollDepth: {
 *     thresholds: [25, 50, 75, 100],  // Percentages to track
 *     throttle: 100,                   // Throttle interval (ms)
 *     includeViewportHeight: true,     // Calculation method
 *     recalculateOnResize: true        // Recalculate on resize
 *   }
 * });
 * ```
 *
 * ## Experience Targeting
 *
 * ```typescript
 * register('mid-article-cta', {
 *   type: 'banner',
 *   content: { message: 'Enjoying the article?' },
 *   targeting: {
 *     custom: (ctx) => (ctx.triggers?.scrollDepth?.percent || 0) >= 50
 *   }
 * });
 * ```
 *
 * ## API Methods
 *
 * ```typescript
 * // Get maximum scroll percentage reached
 * instance.scrollDepth.getMaxPercent(); // 73
 *
 * // Get current scroll percentage
 * instance.scrollDepth.getCurrentPercent(); // 50
 *
 * // Get all crossed thresholds
 * instance.scrollDepth.getThresholdsCrossed(); // [25, 50]
 *
 * // Reset tracking (useful for testing)
 * instance.scrollDepth.reset();
 * ```
 *
 * @param plugin Plugin interface from sdk-kit
 * @param instance SDK instance
 * @param config SDK configuration
 */
export const scrollDepthPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.scrollDepth');

  // Set defaults
  plugin.defaults({
    scrollDepth: {
      thresholds: [25, 50, 75, 100],
      throttle: 100,
      includeViewportHeight: true,
      recalculateOnResize: true,
      trackAdvancedMetrics: false,
      fastScrollVelocityThreshold: 3,
      disableOnMobile: false,
    },
  });

  // Get config
  const scrollConfig = config.get('scrollDepth') as ScrollDepthPluginConfig['scrollDepth'];
  if (!scrollConfig) return;

  // TypeScript guard: scrollConfig is now guaranteed to be defined
  const cfg = scrollConfig;

  // Check device and disable if needed
  const device = detectDevice();
  if (cfg.disableOnMobile && device === 'mobile') {
    return; // Skip initialization on mobile
  }

  // State
  let maxScrollPercent = 0;
  const triggeredThresholds = new Set<number>();

  // Advanced metrics state
  const pageLoadTime = Date.now();
  let lastScrollPosition = 0;
  let lastScrollTime = Date.now();
  let lastScrollDirection: 'up' | 'down' | null = null;
  let directionChangesSinceLastThreshold = 0;
  let timeScrollingUp = 0;
  const thresholdTimes = new Map<number, number>(); // threshold -> time reached

  /**
   * Calculate current scroll percentage
   */
  function calculateScrollPercent(): number {
    // Browser compatibility: Use scrollingElement or fallback
    const scrollingElement = document.scrollingElement || document.documentElement;

    const scrollTop = scrollingElement.scrollTop;
    const scrollHeight = scrollingElement.scrollHeight;
    const clientHeight = scrollingElement.clientHeight;

    // Handle edge case: content shorter than viewport
    if (scrollHeight <= clientHeight) {
      return 100; // Treat as fully scrolled
    }

    if (cfg.includeViewportHeight) {
      // Include viewport: more intuitive for users
      // 100% when bottom of viewport reaches end of content
      return Math.min(((scrollTop + clientHeight) / scrollHeight) * 100, 100);
    }

    // Exclude viewport: Pathfora's method
    // 100% when top of viewport reaches scrollable end
    return Math.min((scrollTop / (scrollHeight - clientHeight)) * 100, 100);
  }

  /**
   * Handle scroll event
   */
  function handleScroll() {
    const currentPercent = calculateScrollPercent();
    const now = Date.now();
    const scrollingElement = document.scrollingElement || document.documentElement;
    const currentPosition = scrollingElement.scrollTop;

    // Track advanced metrics if enabled
    let velocity = 0;
    let _directionChange = false;

    if (cfg.trackAdvancedMetrics) {
      // Calculate velocity (pixels per millisecond)
      const timeDelta = now - lastScrollTime;
      const positionDelta = currentPosition - lastScrollPosition;
      velocity = timeDelta > 0 ? Math.abs(positionDelta) / timeDelta : 0;

      // Detect direction changes
      const currentDirection =
        positionDelta > 0 ? 'down' : positionDelta < 0 ? 'up' : lastScrollDirection;
      if (currentDirection && lastScrollDirection && currentDirection !== lastScrollDirection) {
        directionChangesSinceLastThreshold++;
        _directionChange = true;
      }

      // Track time spent scrolling up (seeking behavior)
      if (currentDirection === 'up' && timeDelta > 0) {
        timeScrollingUp += timeDelta;
      }

      lastScrollDirection = currentDirection;
      lastScrollPosition = currentPosition;
      lastScrollTime = now;
    }

    // Update max scroll
    maxScrollPercent = Math.max(maxScrollPercent, currentPercent);

    // Check thresholds
    for (const threshold of cfg.thresholds || []) {
      if (currentPercent >= threshold && !triggeredThresholds.has(threshold)) {
        triggeredThresholds.add(threshold);

        // Record time to threshold
        if (cfg.trackAdvancedMetrics) {
          thresholdTimes.set(threshold, now - pageLoadTime);
        }

        // Build event payload
        const eventPayload: ScrollDepthEvent = {
          triggered: true,
          timestamp: now,
          percent: Math.round(currentPercent * 100) / 100,
          maxPercent: Math.round(maxScrollPercent * 100) / 100,
          threshold,
          thresholdsCrossed: Array.from(triggeredThresholds).sort((a, b) => a - b),
          device,
        };

        // Add advanced metrics if enabled
        if (cfg.trackAdvancedMetrics) {
          const fastScrollThreshold = cfg.fastScrollVelocityThreshold || 3;
          const isFastScrolling = velocity > fastScrollThreshold;

          // Calculate engagement score (0-100)
          // Lower score = more engaged (slower scrolling, fewer direction changes)
          // Higher score = skimming (fast scrolling, lots of seeking)
          const velocityScore = Math.min((velocity / fastScrollThreshold) * 50, 50);
          const directionScore = Math.min((directionChangesSinceLastThreshold / 5) * 30, 30);
          const seekingScore = Math.min((timeScrollingUp / (now - pageLoadTime)) * 20, 20);
          const engagementScore = Math.max(
            0,
            100 - (velocityScore + directionScore + seekingScore)
          );

          eventPayload.advanced = {
            timeToThreshold: now - pageLoadTime,
            velocity: Math.round(velocity * 1000) / 1000, // Round to 3 decimals
            isFastScrolling,
            directionChanges: directionChangesSinceLastThreshold,
            timeScrollingUp,
            engagementScore: Math.round(engagementScore),
          };

          // Reset direction changes counter after threshold
          directionChangesSinceLastThreshold = 0;
        }

        instance.emit('trigger:scrollDepth', eventPayload);
      }
    }
  }

  // Throttle scroll handler
  const throttledScrollHandler = throttle(handleScroll, cfg.throttle || 100);

  // Throttle resize handler
  const throttledResizeHandler = throttle(handleScroll, cfg.throttle || 100);

  // Initialize
  function initialize() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return; // Not in browser environment
    }

    // Add scroll listener
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });

    // Add resize listener (optional)
    if (cfg.recalculateOnResize) {
      window.addEventListener('resize', throttledResizeHandler, { passive: true });
    }

    // Don't check initial scroll position - wait for first user interaction
    // This avoids triggering all thresholds immediately on pages that start scrolled
  }

  // Cleanup function
  function cleanup() {
    window.removeEventListener('scroll', throttledScrollHandler);
    window.removeEventListener('resize', throttledResizeHandler);
  }

  // Setup destroy handler
  const destroyHandler = () => {
    cleanup();
  };
  instance.on('destroy', destroyHandler);

  // Expose API
  plugin.expose({
    scrollDepth: {
      /**
       * Get the maximum scroll percentage reached during the session
       */
      getMaxPercent: () => maxScrollPercent,

      /**
       * Get the current scroll percentage
       */
      getCurrentPercent: () => calculateScrollPercent(),

      /**
       * Get all thresholds that have been crossed
       */
      getThresholdsCrossed: () => Array.from(triggeredThresholds).sort((a, b) => a - b),

      /**
       * Get the detected device type
       */
      getDevice: () => device,

      /**
       * Get advanced metrics (only available when trackAdvancedMetrics is enabled)
       */
      getAdvancedMetrics: () => {
        if (!cfg.trackAdvancedMetrics) return null;

        const now = Date.now();
        return {
          timeOnPage: now - pageLoadTime,
          directionChanges: directionChangesSinceLastThreshold,
          timeScrollingUp,
          thresholdTimes: Object.fromEntries(thresholdTimes),
        };
      },

      /**
       * Reset scroll depth tracking
       * Clears all triggered thresholds, max scroll, and advanced metrics
       */
      reset: () => {
        maxScrollPercent = 0;
        triggeredThresholds.clear();
        directionChangesSinceLastThreshold = 0;
        timeScrollingUp = 0;
        thresholdTimes.clear();
        lastScrollDirection = null;
      },
    },
  });

  // Initialize on next tick to ensure DOM is ready
  if (typeof window !== 'undefined') {
    setTimeout(initialize, 0);
  }

  // Return cleanup function
  return () => {
    cleanup();
    instance.off('destroy', destroyHandler);
  };
};
