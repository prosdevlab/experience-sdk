/** @module scrollDepthPlugin */

/**
 * Scroll Depth Plugin Configuration
 *
 * Tracks scroll depth and emits trigger:scrollDepth events when thresholds are crossed.
 */
export interface ScrollDepthPluginConfig {
  scrollDepth?: {
    /**
     * Array of scroll percentage thresholds to track (0-100).
     * When user scrolls past a threshold, a trigger:scrollDepth event is emitted.
     * @default [25, 50, 75, 100]
     * @example [50, 100]
     */
    thresholds?: number[];

    /**
     * Throttle interval in milliseconds for scroll event handler.
     * Lower values are more responsive but impact performance.
     * @default 100
     * @example 200
     */
    throttle?: number;

    /**
     * Include viewport height in scroll percentage calculation.
     *
     * - true: (scrollTop + viewportHeight) / totalHeight
     *   More intuitive: 100% when bottom of viewport reaches end
     * - false: scrollTop / (totalHeight - viewportHeight)
     *   Pathfora's method: 100% when top of viewport reaches end
     *
     * @default true
     */
    includeViewportHeight?: boolean;

    /**
     * Recalculate scroll on window resize.
     * Useful for responsive layouts where content height changes.
     * @default true
     */
    recalculateOnResize?: boolean;

    /**
     * Track advanced metrics (velocity, direction, time-to-threshold).
     * Enables advanced engagement quality analysis.
     * Slight performance overhead but provides rich insights.
     * @default false
     */
    trackAdvancedMetrics?: boolean;

    /**
     * Velocity threshold (px/ms) to consider "fast scrolling".
     * Fast scrolling often indicates skimming rather than reading.
     * Only used when trackAdvancedMetrics is true.
     * @default 3
     */
    fastScrollVelocityThreshold?: number;

    /**
     * Disable scroll tracking on mobile devices.
     * Useful since mobile scroll behavior differs significantly from desktop.
     * @default false
     */
    disableOnMobile?: boolean;
  };
}

/**
 * Scroll Depth Event Payload
 *
 * Emitted as `trigger:scrollDepth` when a threshold is crossed.
 */
export interface ScrollDepthEvent {
  /** Whether the trigger has fired */
  triggered: boolean;
  /** Timestamp when the event was emitted */
  timestamp: number;
  /** Current scroll percentage (0-100) */
  percent: number;
  /** Maximum scroll percentage reached during session */
  maxPercent: number;
  /** The threshold that was just crossed */
  threshold: number;
  /** All thresholds that have been triggered */
  thresholdsCrossed: number[];
  /** Device type (mobile, tablet, desktop) */
  device: 'mobile' | 'tablet' | 'desktop';
  /** Advanced metrics (only present when trackAdvancedMetrics is enabled) */
  advanced?: {
    /** Time in milliseconds to reach this threshold from page load */
    timeToThreshold: number;
    /** Current scroll velocity in pixels per millisecond */
    velocity: number;
    /** Whether user is scrolling fast (indicates skimming) */
    isFastScrolling: boolean;
    /** Number of direction changes (up/down) since last threshold */
    directionChanges: number;
    /** Total time spent scrolling up (indicates seeking behavior) */
    timeScrollingUp: number;
    /** Scroll quality score (0-100, higher = more engaged) */
    engagementScore: number;
  };
}
