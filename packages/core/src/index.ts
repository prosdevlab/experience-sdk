/**
 * Experience SDK - Core Package
 *
 * A lightweight, explainable, plugin-based client-side experience runtime
 * built on @lytics/sdk-kit.
 */

// Export all types
export type {
  Experience,
  TargetingRules,
  UrlRule,
  FrequencyRule,
  FrequencyConfig,
  ExperienceContent,
  BannerContent,
  ModalContent,
  TooltipContent,
  ModalAction,
  Context,
  UserContext,
  Decision,
  TraceStep,
  DecisionMetadata,
  ExperienceConfig,
  RuntimeState,
} from './types';

// Export runtime class and functions
export {
  ExperienceRuntime,
  buildContext,
  evaluateExperience,
  evaluateUrlRule,
} from './runtime';

// Export singleton API
export {
  createInstance,
  init,
  register,
  evaluate,
  explain,
  getState,
  on,
  destroy,
  experiences as default,
} from './singleton';


