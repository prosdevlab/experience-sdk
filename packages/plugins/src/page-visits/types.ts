/**
 * Page Visits Plugin Types
 *
 * Generic page visit tracking for any SDK built on sdk-kit.
 * Tracks session and lifetime visit counts with first-visit detection.
 */

/**
 * Page visits plugin configuration
 */
export interface PageVisitsPluginConfig {
  pageVisits?: {
    /**
     * Enable/disable page visit tracking
     * @default true
     */
    enabled?: boolean;

    /**
     * Honor Do Not Track browser setting
     * @default true
     */
    respectDNT?: boolean;

    /**
     * Storage key for session count
     * @default 'pageVisits:session'
     */
    sessionKey?: string;

    /**
     * Storage key for lifetime data
     * @default 'pageVisits:total'
     */
    totalKey?: string;

    /**
     * TTL for lifetime data in seconds (GDPR compliance)
     * @default undefined (no expiration)
     */
    ttl?: number;

    /**
     * Automatically increment on plugin load
     * @default true
     */
    autoIncrement?: boolean;
  };
}

/**
 * Page visits event payload
 */
export interface PageVisitsEvent {
  /** Whether this is the user's first visit ever */
  isFirstVisit: boolean;

  /** Total visits across all sessions (lifetime) */
  totalVisits: number;

  /** Visits in current session */
  sessionVisits: number;

  /** Timestamp of first visit (unix ms) */
  firstVisitTime?: number;

  /** Timestamp of last visit (unix ms) */
  lastVisitTime?: number;

  /** Timestamp of current visit (unix ms) */
  timestamp: number;
}

/**
 * Page visits plugin API
 */
export interface PageVisitsPlugin {
  /**
   * Get total visit count (lifetime)
   */
  getTotalCount(): number;

  /**
   * Get session visit count
   */
  getSessionCount(): number;

  /**
   * Check if this is the first visit
   */
  isFirstVisit(): boolean;

  /**
   * Get timestamp of first visit
   */
  getFirstVisitTime(): number | undefined;

  /**
   * Get timestamp of last visit
   */
  getLastVisitTime(): number | undefined;

  /**
   * Manually increment page visit
   * (useful if autoIncrement is disabled)
   */
  increment(): void;

  /**
   * Reset all counters and data
   * (useful for testing or user opt-out)
   */
  reset(): void;

  /**
   * Get full page visits state
   */
  getState(): PageVisitsEvent;
}
