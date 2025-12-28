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
    /** Modal size (default: 'md') */
    size?: 'sm' | 'md' | 'lg' | 'fullscreen' | 'auto';
    /** Auto-fullscreen on mobile screens <640px (default: true for 'lg', false for others) */
    mobileFullscreen?: boolean;
    /** Modal position (default: 'center') */
    position?: 'center' | 'bottom';
    /** Animation type (default: 'fade') */
    animation?: 'fade' | 'slide-up' | 'none';
    /** Animation duration in ms (default: 200) */
    animationDuration?: number;
  };
}

export interface ModalContent {
  /** Optional hero image at top of modal */
  image?: {
    /** Image source URL */
    src: string;
    /** Alt text for accessibility */
    alt: string;
    /** Max height in pixels (default: 300, 200 on mobile) */
    maxHeight?: number;
  };
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
