// packages/plugins/src/exit-intent/exit-intent.ts

import type { PluginFunction } from '@lytics/sdk-kit';
import type { ExitIntentEvent, ExitIntentPlugin, ExitIntentPluginConfig } from './types';

/**
 * Position in history
 */
interface Position {
  x: number;
  y: number;
}

/**
 * Pure function: Check if device is mobile
 */
export function isMobileDevice(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Pure function: Check if minimum time has elapsed
 */
export function hasMinTimeElapsed(
  pageLoadTime: number,
  minTime: number,
  currentTime: number
): boolean {
  return currentTime - pageLoadTime >= minTime;
}

/**
 * Pure function: Add position to history (immutable)
 */
export function addPositionToHistory(
  positions: Position[],
  newPosition: Position,
  maxSize: number
): Position[] {
  const updated = [...positions, newPosition];
  if (updated.length > maxSize) {
    return updated.slice(1); // Remove oldest
  }
  return updated;
}

/**
 * Pure function: Calculate velocity from two Y positions
 */
export function calculateVelocity(lastY: number, previousY: number): number {
  return Math.abs(lastY - previousY);
}

/**
 * Pure function: Check if exit intent should trigger based on Pathfora algorithm
 */
export function shouldTriggerExitIntent(
  positions: Position[],
  sensitivity: number,
  relatedTarget: EventTarget | null
): { shouldTrigger: boolean; lastY: number; previousY: number; velocity: number } {
  // Must have movement history
  if (positions.length < 2) {
    return { shouldTrigger: false, lastY: 0, previousY: 0, velocity: 0 };
  }

  // Check if leaving the document (mouse entering browser chrome)
  // relatedTarget is null when leaving to browser UI
  if (relatedTarget && (relatedTarget as any).nodeName !== 'HTML') {
    return { shouldTrigger: false, lastY: 0, previousY: 0, velocity: 0 };
  }

  // Get last two positions
  const lastY = positions[positions.length - 1].y;
  const previousY = positions[positions.length - 2].y;

  // Calculate velocity (speed of upward movement)
  const velocity = calculateVelocity(lastY, previousY);

  // Check if moving up and near top (Pathfora algorithm)
  const isMovingUp = lastY < previousY;
  const isNearTop = lastY - velocity <= sensitivity;

  return {
    shouldTrigger: isMovingUp && isNearTop,
    lastY,
    previousY,
    velocity,
  };
}

/**
 * Pure function: Create exit intent event payload
 */
export function createExitIntentEvent(
  lastY: number,
  previousY: number,
  velocity: number,
  pageLoadTime: number,
  timestamp: number
): ExitIntentEvent {
  return {
    timestamp,
    lastY,
    previousY,
    velocity,
    timeOnPage: timestamp - pageLoadTime,
  };
}

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
  let positions: Position[] = [];
  let triggered = false;
  const pageLoadTime = Date.now();
  let mouseMoveListener: ((e: MouseEvent) => void) | null = null;
  let mouseOutListener: ((e: MouseEvent) => void) | null = null;

  /**
   * Check if exit intent should be disabled (uses pure function)
   */
  function shouldDisable(): boolean {
    if (!exitIntentConfig?.disableOnMobile) {
      return false;
    }
    return isMobileDevice(navigator.userAgent);
  }

  /**
   * Track mouse position (updates state immutably using pure function)
   */
  function trackPosition(e: MouseEvent): void {
    const newPosition = { x: e.clientX, y: e.clientY };
    const maxSize = exitIntentConfig?.positionHistorySize ?? 30;
    positions = addPositionToHistory(positions, newPosition, maxSize);
  }

  /**
   * Handle exit intent trigger
   */
  function handleExitIntent(e: MouseEvent): void {
    // Check if already triggered
    if (triggered) {
      return;
    }

    // Check minimum time on page using pure function
    const minTime = exitIntentConfig?.minTimeOnPage ?? 2000;
    if (!hasMinTimeElapsed(pageLoadTime, minTime, Date.now())) {
      return;
    }

    // Check if should trigger using pure function
    const sensitivity = exitIntentConfig?.sensitivity ?? 50;
    const relatedTarget = (e as any).relatedTarget || (e as any).toElement;
    const result = shouldTriggerExitIntent(positions, sensitivity, relatedTarget);

    if (result.shouldTrigger) {
      triggered = true;

      // Create event payload using pure function
      const eventPayload = createExitIntentEvent(
        result.lastY,
        result.previousY,
        result.velocity,
        pageLoadTime,
        Date.now()
      );

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
    } satisfies ExitIntentPlugin,
  });

  // Initialize on plugin load
  initialize();

  // Cleanup on instance destroy
  instance.on('sdk:destroy', () => {
    cleanup();
  });
};
