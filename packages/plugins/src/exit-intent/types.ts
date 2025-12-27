// packages/plugins/src/exit-intent/types.ts

/**
 * Exit Intent Plugin Configuration
 */
export interface ExitIntentPluginConfig {
  exitIntent?: {
    /**
     * Maximum Y position (px) where exit intent can trigger
     * @default 50
     */
    sensitivity?: number;

    /**
     * Minimum time on page (ms) before exit intent is active
     * Prevents immediate triggers on page load
     * @default 2000
     */
    minTimeOnPage?: number;

    /**
     * Delay (ms) between detection and trigger
     * @default 0
     */
    delay?: number;

    /**
     * Number of mouse positions to track for velocity calculation
     * @default 30
     */
    positionHistorySize?: number;

    /**
     * Disable exit intent on mobile devices
     * @default true
     */
    disableOnMobile?: boolean;
  };
}

/**
 * Exit Intent Event Payload
 */
export interface ExitIntentEvent {
  timestamp: number;
  lastY: number; // Last Y position before exit
  previousY: number; // Previous Y position
  velocity: number; // Calculated Y velocity
  timeOnPage: number; // Ms user was on page
}
