// packages/plugins/src/exit-intent/index.ts

import type { PluginFunction } from '@lytics/sdk-kit';
import type { ExitIntentEvent, ExitIntentPluginConfig } from './types';

export type { ExitIntentPluginConfig, ExitIntentEvent };

/**
 * Exit Intent Plugin
 *
 * Detects when users are about to leave the page by tracking upward mouse movement
 * near the top of the viewport. Inspired by Pathfora's showOnExitIntent.
 *
 * **Event-Driven Architecture:**
 * This plugin emits `trigger:exitIntent` events when exit intent is detected.
 * The core runtime listens for these events and automatically re-evaluates experiences.
 *
 * **Usage Pattern:**
 * Use `targeting.custom` to check if exit intent has triggered:
 *
 * @example Basic usage
 * ```typescript
 * import { init, register } from '@prosdevlab/experience-sdk';
 * import { exitIntentPlugin } from '@prosdevlab/experience-sdk-plugins';
 *
 * init({
 *   plugins: [exitIntentPlugin],
 *   exitIntent: {
 *     sensitivity: 20,      // Trigger within 20px of top (default: 50)
 *     minTimeOnPage: 2000,  // Wait 2s before enabling (default: 2000)
 *     delay: 0,             // Delay after trigger (default: 0)
 *     disableOnMobile: true // Disable on mobile (default: true)
 *   }
 * });
 *
 * // Show banner only when exit intent is detected
 * register('exit-offer', {
 *   type: 'banner',
 *   content: {
 *     title: 'Wait! Don't leave yet!',
 *     message: 'Get 15% off your first order',
 *     buttons: [{ text: 'Claim Offer', variant: 'primary' }]
 *   },
 *   targeting: {
 *     custom: (context) => context.triggers?.exitIntent?.triggered === true
 *   },
 *   frequency: { max: 1, per: 'session' } // Only show once per session
 * });
 * ```
 *
 * @example Combining with other conditions
 * ```typescript
 * // Show exit offer only on shop pages with items in cart
 * register('cart-recovery', {
 *   type: 'banner',
 *   content: { message: 'Complete your purchase and save!' },
 *   targeting: {
 *     url: { contains: '/shop' },
 *     custom: (context) => {
 *       return (
 *         context.triggers?.exitIntent?.triggered === true &&
 *         getCart().items.length > 0
 *       );
 *     }
 *   }
 * });
 * ```
 *
 * @example Combining multiple triggers (exit intent + scroll depth)
 * ```typescript
 * // Show offer on exit intent OR after 70% scroll
 * register('engaged-exit', {
 *   type: 'banner',
 *   content: { message: 'You're almost there!' },
 *   targeting: {
 *     custom: (context) => {
 *       const exitIntent = context.triggers?.exitIntent?.triggered;
 *       const scrolled = (context.triggers?.scrollDepth?.percent || 0) >= 70;
 *       return exitIntent || scrolled;
 *     }
 *   }
 * });
 * ```
 */
export const exitIntentPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.exitIntent');

  // Default configuration
  plugin.defaults({
    exitIntent: {
      sensitivity: 50,
      minTimeOnPage: 2000,
      delay: 0,
      positionHistorySize: 30,
      disableOnMobile: true,
    },
  });

  const exitIntentConfig = config.get<ExitIntentPluginConfig['exitIntent']>('exitIntent');

  if (!exitIntentConfig) {
    return;
  }

  // State
  let positions: Array<{ x: number; y: number }> = [];
  let triggered = false;
  let pageLoadTime = Date.now();
  let mouseMoveListener: ((e: MouseEvent) => void) | null = null;
  let mouseOutListener: ((e: MouseEvent) => void) | null = null;

  /**
   * Check if exit intent should be disabled (e.g., on mobile)
   */
  function shouldDisable(): boolean {
    if (!exitIntentConfig?.disableOnMobile) {
      return false;
    }

    // Simple mobile detection
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Check if minimum time on page has passed
   */
  function hasMinTimeOnPage(): boolean {
    const minTime = exitIntentConfig?.minTimeOnPage ?? 2000;
    return Date.now() - pageLoadTime >= minTime;
  }

  /**
   * Track mouse position
   */
  function trackPosition(e: MouseEvent): void {
    positions.push({
      x: e.clientX,
      y: e.clientY,
    });

    const maxSize = exitIntentConfig?.positionHistorySize ?? 30;
    if (positions.length > maxSize) {
      positions.shift();
    }
  }

  /**
   * Check if exit intent should trigger
   * Algorithm from Pathfora: upward movement + near top + leaving document
   */
  function checkExitIntent(e: MouseEvent): boolean {
    // Must have movement history
    if (positions.length < 2) {
      return false;
    }

    // Check if leaving the document (mouse entering browser chrome)
    const from = (e as any).relatedTarget || (e as any).toElement;
    if (from && from.nodeName !== 'HTML') {
      return false;
    }

    // Get last two positions
    const lastY = positions[positions.length - 1].y;
    const previousY = positions[positions.length - 2].y;

    // Calculate velocity (speed of upward movement)
    const velocity = Math.abs(lastY - previousY);

    // Check if moving up and near top (Pathfora algorithm)
    const sensitivity = exitIntentConfig?.sensitivity ?? 50;
    const isMovingUp = lastY < previousY;
    const isNearTop = lastY - velocity <= sensitivity;

    // DON'T clear positions here - that happens after trigger
    return isMovingUp && isNearTop;
  }

  /**
   * Handle exit intent trigger
   */
  function handleExitIntent(e: MouseEvent): void {
    if (triggered || !hasMinTimeOnPage()) {
      return;
    }

    if (checkExitIntent(e)) {
      triggered = true;

      const eventPayload: ExitIntentEvent = {
        timestamp: Date.now(),
        lastY: positions.length > 0 ? positions[positions.length - 1].y : 0,
        previousY: positions.length > 1 ? positions[positions.length - 2].y : 0,
        velocity:
          positions.length > 1
            ? Math.abs(positions[positions.length - 1].y - positions[positions.length - 2].y)
            : 0,
        timeOnPage: Date.now() - pageLoadTime,
      };

      // Apply delay if configured
      const delay = exitIntentConfig?.delay ?? 0;

      if (delay > 0) {
        setTimeout(() => {
          // Emit trigger event (Core will handle evaluation)
          instance.emit('trigger:exitIntent', eventPayload);
        }, delay);
      } else {
        // Emit trigger event (Core will handle evaluation)
        instance.emit('trigger:exitIntent', eventPayload);
      }

      // Store in sessionStorage to prevent re-triggering
      try {
        sessionStorage.setItem('xp:exitIntent:triggered', Date.now().toString());
      } catch (_e) {
        // Ignore sessionStorage errors (e.g., in incognito mode)
      }

      // Cleanup listeners after trigger (one-time event)
      cleanup();
    }
  }

  /**
   * Cleanup event listeners
   */
  function cleanup(): void {
    if (mouseMoveListener) {
      document.removeEventListener('mousemove', mouseMoveListener);
      mouseMoveListener = null;
    }
    if (mouseOutListener) {
      document.removeEventListener('mouseout', mouseOutListener);
      mouseOutListener = null;
    }
  }

  /**
   * Initialize exit intent detection
   */
  function initialize(): void {
    if (shouldDisable()) {
      return;
    }

    // Check if exit intent was already triggered this session
    try {
      const storedTrigger = sessionStorage.getItem('xp:exitIntent:triggered');
      if (storedTrigger) {
        triggered = true;
        return; // Don't set up listeners if already triggered
      }
    } catch (_e) {
      // Ignore sessionStorage errors (e.g., in incognito mode)
    }

    mouseMoveListener = trackPosition;
    mouseOutListener = handleExitIntent;

    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mouseout', mouseOutListener);
  }

  // Expose API
  plugin.expose({
    exitIntent: {
      /**
       * Check if exit intent has been triggered
       */
      isTriggered: () => triggered,

      /**
       * Reset exit intent state (useful for testing)
       */
      reset: () => {
        triggered = false;
        positions = [];
        pageLoadTime = Date.now();

        // Clear sessionStorage
        try {
          sessionStorage.removeItem('xp:exitIntent:triggered');
        } catch (_e) {
          // Ignore sessionStorage errors
        }

        cleanup();
        initialize();
      },

      /**
       * Get current position history
       */
      getPositions: () => [...positions],
    },
  });

  // Initialize on plugin load
  initialize();

  // Cleanup on instance destroy
  const destroyHandler = () => {
    cleanup();
  };
  instance.on('destroy', destroyHandler);
};
