import type { PluginFunction } from '@lytics/sdk-kit';
import type { ExperienceButton } from '../types';

export interface ModalConfig {
  modal?: {
    /** Allow dismissal via close button (default: true) */
    dismissable?: boolean;
    /** Allow dismissal via backdrop click (default: true) */
    backdropDismiss?: boolean;
    /** Z-index for modal (default: 10001) */
    zIndex?: number;
  };
}

export interface ModalContent {
  /** Modal title */
  title?: string;
  /** Modal message (supports HTML via sanitizer) */
  message: string;
  /** Array of action buttons */
  buttons?: ExperienceButton[];
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
}

export interface ModalPlugin {
  /** Show a modal experience */
  show(experience: any): void;
  /** Remove a specific modal */
  remove(experienceId: string): void;
  /** Check if a modal is showing */
  isShowing(experienceId?: string): boolean;
}

export type { PluginFunction };
