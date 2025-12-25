// biome-ignore lint/suspicious/noExplicitAny: intentional use of any in public API
/**
 * Type Contracts for Experience SDK
 *
 * These types define the public API surface and should remain stable.
 * Breaking changes to these types require a major version bump.
 */

/**
 * Experience Definition
 */
export interface Experience {
  id: string;
  type: 'banner' | 'modal' | 'tooltip';
  targeting: TargetingRules;
  content: ExperienceContent;
  frequency?: FrequencyConfig;
}

/**
 * Targeting Rules
 */
export interface TargetingRules {
  url?: UrlRule;
  frequency?: FrequencyRule;
}

export interface UrlRule {
  contains?: string;
  equals?: string;
  matches?: RegExp;
}

export interface FrequencyRule {
  max: number;
  per: 'session' | 'day' | 'week';
}

/**
 * Experience Content (type-specific)
 */
export type ExperienceContent = BannerContent | ModalContent | TooltipContent;

export interface BannerContent {
  title: string;
  message: string;
  dismissable?: boolean;
}

export interface ModalContent {
  title: string;
  body: string;
  actions?: ModalAction[];
}

export interface TooltipContent {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface ModalAction {
  label: string;
  action: 'close' | 'confirm' | 'dismiss';
}

/**
 * Evaluation Context
 */
export interface Context {
  url?: string;
  user?: UserContext;
  timestamp?: number;
  custom?: Record<string, any>;
}

export interface UserContext {
  id?: string;
  returning?: boolean;
  [key: string]: any;
}

/**
 * Decision Output - Core of Explainability
 */
export interface Decision {
  show: boolean;
  experienceId?: string;
  reasons: string[]; // Human-readable: ["✅ URL matches", ...]
  trace: TraceStep[]; // Machine-readable trace
  context: Context; // Input context used
  metadata: DecisionMetadata;
}

export interface TraceStep {
  step: string; // e.g., "evaluate-url-rule"
  timestamp: number;
  duration: number; // milliseconds
  input?: any;
  output?: any;
  passed: boolean;
}

export interface DecisionMetadata {
  evaluatedAt: number;
  totalDuration: number;
  experiencesEvaluated: number;
}

/**
 * Configuration
 */
export interface ExperienceConfig {
  debug?: boolean;
  storage?: 'session' | 'local' | 'memory';
  [key: string]: any;
}

/**
 * Runtime State (for inspection)
 */
export interface RuntimeState {
  initialized: boolean;
  experiences: Map<string, Experience>;
  decisions: Decision[];
  config: ExperienceConfig;
}
