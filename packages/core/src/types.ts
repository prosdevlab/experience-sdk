/**
 * Type Definitions for Experience SDK
 *
 * These types define the public API surface and should remain stable.
 * Breaking changes to these types require a major version bump.
 */

/**
 * Experience Definition
 *
 * An experience represents a targeted piece of content (banner, modal, tooltip)
 * that should be shown to users based on targeting rules.
 */
export interface Experience {
  /** Unique identifier for the experience */
  id: string;
  /** Type of experience to render */
  type: 'banner' | 'modal' | 'tooltip' | 'inline';
  /** Rules that determine when/where to show this experience */
  targeting: TargetingRules;
  /** Content to display (type-specific) */
  content: ExperienceContent;
  /** Optional frequency capping configuration */
  frequency?: FrequencyConfig;
  /** Priority for ordering (higher = more important, default: 0) */
  priority?: number;
  /** Display conditions (triggers, timing) */
  display?: DisplayConditions;
}

/**
 * Targeting Rules
 *
 * Rules that determine when an experience should be shown.
 * All rules must pass for the experience to be shown.
 */
export interface TargetingRules {
  /** URL-based targeting */
  url?: UrlRule;
  /** Frequency-based targeting */
  frequency?: FrequencyRule;
}

/**
 * URL Targeting Rule
 *
 * Determines if current URL matches the target.
 * Multiple patterns can be specified; first match wins.
 */
export interface UrlRule {
  /** URL must contain this string */
  contains?: string;
  /** URL must exactly match this string */
  equals?: string;
  /** URL must match this regular expression */
  matches?: RegExp;
}

/**
 * Frequency Targeting Rule
 *
 * Limits how often an experience can be shown.
 */
export interface FrequencyRule {
  /** Maximum number of times to show */
  max: number;
  /** Time period for the cap */
  per: 'session' | 'day' | 'week';
}

/**
 * Frequency Configuration
 *
 * Configuration for frequency capping at the experience level.
 */
export interface FrequencyConfig {
  /** Maximum number of impressions */
  max: number;
  /** Time period for the cap */
  per: 'session' | 'day' | 'week';
}

/**
 * Display Conditions
 *
 * Conditions that determine when an experience should be displayed.
 */
export interface DisplayConditions {
  /** Trigger type (e.g., scrollDepth, exitIntent, timeDelay) */
  trigger?: string;
  /** Trigger-specific configuration data */
  triggerData?: any;
  /** Frequency capping for this experience */
  frequency?: FrequencyConfig;
}

// Import plugin-specific content types from plugins package
// (Core depends on plugins, so plugins owns these definitions)
import type {
  BannerContent,
  ModalContent,
  TooltipContent,
} from '@prosdevlab/experience-sdk-plugins';

/**
 * Experience Content (type-specific)
 *
 * Union type for all possible experience content types.
 * Content types are defined in the plugins package.
 */
export type ExperienceContent = BannerContent | ModalContent | TooltipContent;

// Re-export plugin content types for convenience
export type { BannerContent, ModalContent, TooltipContent };

/**
 * Modal Action Button
 *
 * Defines an action button in a modal.
 */
export interface ModalAction {
  /** Button label text */
  label: string;
  /** Action to perform when clicked */
  action: 'close' | 'confirm' | 'dismiss';
}

/**
 * Evaluation Context
 *
 * Context information used to evaluate targeting rules.
 * This is the input to the decision-making process.
 */
export interface Context {
  /** Current page URL */
  url?: string;
  /** User-specific context */
  user?: UserContext;
  /** Evaluation timestamp */
  timestamp?: number;
  /** Custom context properties */
  custom?: Record<string, any>;
  /** Trigger state (for display condition plugins) */
  triggers?: TriggerState;
}

/**
 * Trigger State
 *
 * Tracks which trigger-based display conditions have fired.
 * Used by plugins like exitIntent, scrollDepth, pageVisits, timeDelay.
 */
export interface TriggerState {
  /** Exit intent trigger state */
  exitIntent?: {
    /** Whether the trigger has fired */
    triggered: boolean;
    /** When the trigger fired (unix timestamp) */
    timestamp?: number;
    /** Additional trigger-specific data */
    lastY?: number;
    previousY?: number;
    velocity?: number;
    timeOnPage?: number;
  };
  /** Scroll depth trigger state */
  scrollDepth?: {
    triggered: boolean;
    timestamp?: number;
    /** Current scroll percentage (0-100) */
    percent?: number;
  };
  /** Page visits trigger state */
  pageVisits?: {
    triggered: boolean;
    timestamp?: number;
    /** Total visit count */
    count?: number;
    /** Whether this is the first visit */
    firstVisit?: boolean;
  };
  /** Time delay trigger state */
  timeDelay?: {
    triggered: boolean;
    timestamp?: number;
    /** Total elapsed time (ms, includes paused time) */
    elapsed?: number;
    /** Active elapsed time (ms, excludes paused time) */
    activeElapsed?: number;
    /** Whether timer was paused */
    wasPaused?: boolean;
    /** Number of visibility changes */
    visibilityChanges?: number;
  };
  /** Modal trigger state (when modal is shown) */
  modal?: {
    triggered: boolean;
    timestamp?: number;
    /** Experience ID of the shown modal */
    experienceId?: string;
    /** Whether the modal is currently showing */
    shown?: boolean;
  };
  /** Extensible for future triggers */
  [key: string]: any;
}

/**
 * User Context
 *
 * User-specific information for targeting.
 */
export interface UserContext {
  /** User identifier */
  id?: string;
  /** Whether user is a returning visitor */
  returning?: boolean;
  /** Additional custom user properties */
  [key: string]: any;
}

/**
 * Decision Output - Core of Explainability
 *
 * The result of evaluating experiences against a context.
 * Includes human-readable reasons and machine-readable trace.
 */
export interface Decision {
  /** Whether to show an experience */
  show: boolean;
  /** ID of the experience to show (if show=true) */
  experienceId?: string;
  /** Human-readable reasons for the decision */
  reasons: string[];
  /** Machine-readable trace of evaluation steps */
  trace: TraceStep[];
  /** Context used for evaluation */
  context: Context;
  /** Metadata about the evaluation */
  metadata: DecisionMetadata;
}

/**
 * Trace Step
 *
 * A single step in the evaluation trace.
 * Provides detailed information about each evaluation step.
 */
export interface TraceStep {
  /** Name of the evaluation step */
  step: string;
  /** When this step started (unix timestamp) */
  timestamp: number;
  /** How long this step took (milliseconds) */
  duration: number;
  /** Input to this step */
  input?: any;
  /** Output from this step */
  output?: any;
  /** Whether this step passed */
  passed: boolean;
}

/**
 * Decision Metadata
 *
 * Metadata about the evaluation process.
 */
export interface DecisionMetadata {
  /** When evaluation completed (unix timestamp) */
  evaluatedAt: number;
  /** Total time taken (milliseconds) */
  totalDuration: number;
  /** Number of experiences evaluated */
  experiencesEvaluated: number;
}

/**
 * Experience SDK Configuration
 *
 * Configuration options for the Experience SDK.
 */
export interface ExperienceConfig {
  /** Enable debug mode (verbose logging) */
  debug?: boolean;
  /** Storage backend to use */
  storage?: 'session' | 'local' | 'memory';
  /** Additional custom configuration */
  [key: string]: any;
}

/**
 * Runtime State
 *
 * Internal runtime state (exposed for inspection/debugging).
 */
export interface RuntimeState {
  /** Whether the runtime has been initialized */
  initialized: boolean;
  /** Registered experiences */
  experiences: Map<string, Experience>;
  /** History of decisions made */
  decisions: Decision[];
  /** Current configuration */
  config: ExperienceConfig;
}
