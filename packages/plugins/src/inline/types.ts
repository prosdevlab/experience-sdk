import type { PluginFunction } from '@lytics/sdk-kit';

/**
 * Inline plugin configuration
 */
export interface InlinePluginConfig {
  inline?: {
    /** Retry selector lookup if not found (default: false) */
    retry?: boolean;
    /** Retry timeout in ms (default: 5000) */
    retryTimeout?: number;
  };
}

/**
 * Inline content configuration
 */
export interface InlineContent {
  /** CSS selector for target element */
  selector: string;
  /** Where to insert content (default: 'replace') */
  position?: 'replace' | 'append' | 'prepend' | 'before' | 'after';
  /** HTML content to insert */
  message: string;
  /** Show close button (default: false) */
  dismissable?: boolean;
  /** Remember dismissal in localStorage (default: false) */
  persist?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
}

/**
 * Inline plugin API
 */
export interface InlinePlugin {
  /** Show an inline experience */
  show(experience: any): void;
  /** Remove a specific inline experience */
  remove(experienceId: string): void;
  /** Check if an inline experience is showing */
  isShowing(experienceId?: string): boolean;
}

/**
 * Insertion position for inline content
 */
export type InsertionPosition = 'replace' | 'append' | 'prepend' | 'before' | 'after';

export type { PluginFunction };
