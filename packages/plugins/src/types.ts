/**
 * Shared types for Experience SDK plugins
 * These types are re-exported by core for user convenience
 */

/**
 * Experience content - varies by type
 */
export type ExperienceContent = BannerContent | ModalContent | TooltipContent;

/**
 * Banner content configuration
 */
export interface BannerContent {
  title?: string;
  message: string;
  button?: {
    text: string;
    url?: string;
    action?: string;
  };
  dismissable?: boolean;
}

/**
 * Modal content configuration
 */
export interface ModalContent {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Tooltip content configuration
 */
export interface TooltipContent {
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Experience definition
 */
export interface Experience {
  id: string;
  type: 'banner' | 'modal' | 'tooltip';
  targeting: Record<string, any>;
  content: ExperienceContent;
  frequency?: {
    max: number;
    per: 'session' | 'day' | 'week';
  };
  priority?: number;
}

/**
 * Decision output from evaluation
 */
export interface Decision {
  show: boolean;
  experienceId?: string;
  reasons: string[];
  trace: TraceStep[];
  context: Record<string, any>;
  metadata: DecisionMetadata;
}

/**
 * Trace step for decision path
 */
export interface TraceStep {
  step: string;
  timestamp: number;
  duration: number;
  input?: any;
  output?: any;
  passed: boolean;
}

/**
 * Decision metadata
 */
export interface DecisionMetadata {
  evaluatedAt: number;
  experienceCount: number;
  evaluationTimeMs: number;
}
