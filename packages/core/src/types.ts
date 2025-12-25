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
  type: 'banner' | 'modal' | 'tooltip';
  /** Rules that determine when/where to show this experience */
  targeting: TargetingRules;
  /** Content to display (type-specific) */
  content: ExperienceContent;
  /** Optional frequency capping configuration */
  frequency?: FrequencyConfig;
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
 * Experience Content (type-specific)
 *
 * Union type for all possible experience content types.
 */
export type ExperienceContent = BannerContent | ModalContent | TooltipContent;

/**
 * Banner Content
 *
 * Content for banner-type experiences.
 */
export interface BannerContent {
  /** Banner title/heading */
  title: string;
  /** Banner message/body text */
  message: string;
  /** Whether the banner can be dismissed */
  dismissable?: boolean;
}

/**
 * Modal Content
 *
 * Content for modal-type experiences.
 */
export interface ModalContent {
  /** Modal title */
  title: string;
  /** Modal body content */
  body: string;
  /** Optional action buttons */
  actions?: ModalAction[];
}

/**
 * Tooltip Content
 *
 * Content for tooltip-type experiences.
 */
export interface TooltipContent {
  /** Tooltip text */
  text: string;
  /** Position relative to target element */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

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
