/** @module timeDelayPlugin */

/**
 * Time Delay Plugin Configuration
 *
 * Tracks time elapsed since SDK initialization and emits trigger:timeDelay events.
 */
export interface TimeDelayPluginConfig {
  timeDelay?: {
    /**
     * Delay before emitting trigger event (milliseconds).
     * Set to 0 to disable (immediate trigger on init).
     * @default 0
     * @example 5000  // 5 seconds
     */
    delay?: number;

    /**
     * Pause timer when tab is hidden (Page Visibility API).
     * When true, only counts "active viewing time".
     * When false, timer runs even when tab is hidden.
     * @default true
     */
    pauseWhenHidden?: boolean;
  };
}

/**
 * Time Delay Event Payload
 *
 * Emitted via 'trigger:timeDelay' when the configured delay is reached.
 */
export interface TimeDelayEvent {
  /** Timestamp when the trigger event was emitted */
  timestamp: number;

  /** Total elapsed time since init (milliseconds, includes paused time) */
  elapsed: number;

  /** Active elapsed time (milliseconds, excludes time when tab was hidden) */
  activeElapsed: number;

  /** Whether the timer was paused at any point */
  wasPaused: boolean;

  /** Number of times visibility changed (hidden/visible) */
  visibilityChanges: number;
}

/**
 * Time Delay Plugin API
 */
export interface TimeDelayPlugin {
  /**
   * Get total elapsed time since init (includes paused time)
   * @returns Time in milliseconds
   */
  getElapsed(): number;

  /**
   * Get active elapsed time (excludes paused time)
   * @returns Time in milliseconds
   */
  getActiveElapsed(): number;

  /**
   * Get remaining time until trigger
   * @returns Time in milliseconds, or 0 if already triggered
   */
  getRemaining(): number;

  /**
   * Check if timer is currently paused (tab hidden)
   * @returns True if paused
   */
  isPaused(): boolean;

  /**
   * Check if trigger has fired
   * @returns True if triggered
   */
  isTriggered(): boolean;

  /**
   * Reset timer to initial state
   * Clears trigger flag and restarts timing
   */
  reset(): void;
}
