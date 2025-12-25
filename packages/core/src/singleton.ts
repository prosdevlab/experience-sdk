/**
 * Singleton Pattern Implementation
 *
 * Provides a default singleton instance with convenient wrapper functions
 * for simple use cases, plus createInstance() for advanced scenarios.
 */

import { ExperienceRuntime } from './runtime';
import type { Context, Decision, Experience, ExperienceConfig, RuntimeState } from './types';

/**
 * Create a new Experience SDK instance
 *
 * Use this for advanced scenarios where you need multiple isolated runtimes.
 *
 * @example
 * ```typescript
 * import { createInstance } from '@prosdevlab/experience-sdk';
 *
 * const exp = createInstance({ debug: true });
 * await exp.init();
 * exp.register('welcome', { ... });
 * ```
 */
export function createInstance(config?: ExperienceConfig): ExperienceRuntime {
  return new ExperienceRuntime(config);
}

/**
 * Default singleton instance
 *
 * Provides a convenient global instance for simple use cases.
 * For script tag users, this is exposed as the global `experiences` object.
 */
const defaultInstance = createInstance();

/**
 * Initialize the Experience SDK
 *
 * @example
 * ```typescript
 * import { init } from '@prosdevlab/experience-sdk';
 * await init({ debug: true });
 * ```
 */
export async function init(config?: ExperienceConfig): Promise<void> {
  return defaultInstance.init(config);
}

/**
 * Register an experience
 *
 * @example
 * ```typescript
 * import { register } from '@prosdevlab/experience-sdk';
 *
 * register('welcome-banner', {
 *   type: 'banner',
 *   targeting: { url: { contains: '/' } },
 *   content: { title: 'Welcome!', message: 'Thanks for visiting' }
 * });
 * ```
 */
export function register(id: string, experience: Omit<Experience, 'id'>): void {
  defaultInstance.register(id, experience);
}

/**
 * Evaluate experiences against current context
 *
 * @example
 * ```typescript
 * import { evaluate } from '@prosdevlab/experience-sdk';
 *
 * const decision = evaluate({ url: window.location.href });
 * if (decision.show) {
 *   console.log('Show experience:', decision.experienceId);
 *   console.log('Reasons:', decision.reasons);
 * }
 * ```
 */
export function evaluate(context?: Partial<Context>): Decision {
  return defaultInstance.evaluate(context);
}

/**
 * Explain why a specific experience would/wouldn't show
 *
 * @example
 * ```typescript
 * import { explain } from '@prosdevlab/experience-sdk';
 *
 * const explanation = explain('welcome-banner');
 * console.log('Would show?', explanation?.show);
 * console.log('Reasons:', explanation?.reasons);
 * ```
 */
export function explain(experienceId: string): Decision | null {
  return defaultInstance.explain(experienceId);
}

/**
 * Get current runtime state
 *
 * @example
 * ```typescript
 * import { getState } from '@prosdevlab/experience-sdk';
 *
 * const state = getState();
 * console.log('Initialized?', state.initialized);
 * console.log('Experiences:', Array.from(state.experiences.keys()));
 * ```
 */
export function getState(): RuntimeState {
  return defaultInstance.getState();
}

/**
 * Subscribe to SDK events
 *
 * @example
 * ```typescript
 * import { on } from '@prosdevlab/experience-sdk';
 *
 * const unsubscribe = on('experiences:evaluated', (decision) => {
 *   console.log('Evaluation:', decision);
 * });
 *
 * // Later: unsubscribe()
 * ```
 */
export function on(event: string, handler: (...args: unknown[]) => void): () => void {
  return defaultInstance.on(event, handler);
}

/**
 * Destroy the SDK instance
 *
 * @example
 * ```typescript
 * import { destroy } from '@prosdevlab/experience-sdk';
 * await destroy();
 * ```
 */
export async function destroy(): Promise<void> {
  return defaultInstance.destroy();
}

/**
 * Default export for convenient importing
 *
 * @example
 * ```typescript
 * import experiences from '@prosdevlab/experience-sdk';
 * await experiences.init();
 * ```
 */
export const experiences = {
  createInstance,
  init,
  register,
  evaluate,
  explain,
  getState,
  on,
  destroy,
};

/**
 * Global singleton instance for IIFE builds
 *
 * When loaded via script tag, this object is available as `window.experiences`
 */
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).experiences = experiences;
}
