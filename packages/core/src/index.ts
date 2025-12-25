/**
 * Experience SDK - Core Package
 *
 * A lightweight, explainable, plugin-based client-side experience runtime
 * built on @lytics/sdk-kit.
 */

// Re-export plugins for convenience
export { bannerPlugin, debugPlugin, frequencyPlugin } from '@prosdevlab/experience-sdk-plugins';

// Export runtime class and functions
export {
  buildContext,
  ExperienceRuntime,
  evaluateExperience,
  evaluateUrlRule,
} from './runtime';

// Export singleton API
export {
  createInstance,
  destroy,
  evaluate,
  explain,
  getState,
  init,
  on,
  register,
} from './singleton';
// Export all types
export type {
  BannerContent,
  Context,
  Decision,
  DecisionMetadata,
  Experience,
  ExperienceConfig,
  ExperienceContent,
  FrequencyConfig,
  FrequencyRule,
  ModalAction,
  ModalContent,
  RuntimeState,
  TargetingRules,
  TooltipContent,
  TraceStep,
  UrlRule,
  UserContext,
} from './types';
