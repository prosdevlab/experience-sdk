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
  /** Optional form configuration */
  form?: FormConfig;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
}

export interface FormConfig {
  /** Array of form fields */
  fields: FormField[];
  /** Submit button configuration */
  submitButton: ExperienceButton;
  /** Success state after submission */
  successState?: FormState;
  /** Error state on submission failure */
  errorState?: FormState;
  /** Custom validation function (optional) */
  validate?: (data: Record<string, string>) => ValidationResult;
}

export interface FormField {
  /** Field name (used in form data) */
  name: string;
  /** Field type */
  type: 'email' | 'text' | 'textarea' | 'tel' | 'url' | 'number';
  /** Label text (optional) */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Required field (default: false) */
  required?: boolean;
  /** Custom validation pattern (regex) */
  pattern?: string;
  /** Error message for validation failure */
  errorMessage?: string;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
}

export interface FormState {
  /** Title to show in success/error state */
  title?: string;
  /** Message to show */
  message: string;
  /** Optional buttons (e.g., "Close", "Try Again") */
  buttons?: ExperienceButton[];
}

export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors by field name */
  errors?: Record<string, string>;
}

export interface ModalPlugin {
  /** Show a modal experience */
  show(experience: any): void;
  /** Remove a specific modal */
  remove(experienceId: string): void;
  /** Check if a modal is showing */
  isShowing(experienceId?: string): boolean;
  /** Show form success or error state */
  showFormState(experienceId: string, state: 'success' | 'error'): void;
  /** Reset form to initial state */
  resetForm(experienceId: string): void;
  /** Get current form data */
  getFormData(experienceId: string): Record<string, string> | null;
}

export type { PluginFunction };
