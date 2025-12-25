import { SDK } from '@lytics/sdk-kit';
import { storagePlugin } from '@lytics/sdk-kit-plugins';
import { bannerPlugin, debugPlugin, frequencyPlugin } from '@prosdevlab/experience-sdk-plugins';
import type {
  Context,
  Decision,
  Experience,
  ExperienceConfig,
  RuntimeState,
  TraceStep,
  UrlRule,
} from './types';

/**
 * Experience Runtime
 *
 * Core class that manages experience registration and evaluation.
 * Built on @lytics/sdk-kit for plugin system and lifecycle management.
 *
 * Design principles:
 * - Pure functions for evaluation logic (easy to test)
 * - Event-driven architecture (extensible via plugins)
 * - Explainability-first (every decision has reasons)
 */
export class ExperienceRuntime {
  private sdk: SDK;
  private experiences: Map<string, Experience> = new Map();
  private decisions: Decision[] = [];
  private initialized = false;
  private destroyed = false;

  constructor(config: ExperienceConfig = {}) {
    // Create SDK instance
    this.sdk = new SDK({
      name: 'experience-sdk',
      ...config,
    });

    // Auto-register plugins
    this.sdk.use(storagePlugin);
    this.sdk.use(debugPlugin);
    this.sdk.use(frequencyPlugin);
    this.sdk.use(bannerPlugin);
  }

  /**
   * Initialize the runtime
   */
  async init(config?: ExperienceConfig): Promise<void> {
    if (this.initialized) {
      console.warn('[experiences] Already initialized');
      return;
    }

    // Recreate SDK if it was destroyed
    if (this.destroyed) {
      this.sdk = new SDK({
        name: 'experience-sdk',
        ...config,
      });

      // Re-register core plugins
      this.sdk.use(storagePlugin);
      this.sdk.use(debugPlugin);
      this.sdk.use(frequencyPlugin);
      this.sdk.use(bannerPlugin);

      this.destroyed = false;
    }

    if (config) {
      // Merge config if provided
      Object.entries(config).forEach(([key, value]) => {
        this.sdk.set(key, value);
      });
    }

    // Initialize SDK (will init all plugins)
    await this.sdk.init();

    this.initialized = true;

    // Emit ready event
    this.sdk.emit('experiences:ready');
  }

  /**
   * Register an experience
   */
  register(id: string, experience: Omit<Experience, 'id'>): void {
    const exp: Experience = { id, ...experience };
    this.experiences.set(id, exp);

    // Register frequency config with frequency plugin if it exists
    if (exp.frequency && (this.sdk as any).frequency?._registerExperience) {
      (this.sdk as any).frequency._registerExperience(id, exp.frequency.per);
    }

    this.sdk.emit('experiences:registered', { id, experience: exp });
  }

  /**
   * Evaluate experiences against context
   * Returns decision with explainability
   * First match wins (use evaluateAll() for multiple experiences)
   */
  evaluate(context?: Partial<Context>): Decision {
    const startTime = Date.now();
    const evalContext = buildContext(context);

    // Find matching experience
    let matchedExperience: Experience | undefined;
    const allReasons: string[] = [];
    const allTrace: TraceStep[] = [];

    for (const [, experience] of this.experiences) {
      const result = evaluateExperience(experience, evalContext);

      allReasons.push(...result.reasons);
      allTrace.push(...result.trace);

      if (result.matched) {
        // Check frequency cap if experience has frequency rules
        if (experience.frequency && (this.sdk as any).frequency) {
          const freqStart = Date.now();
          const hasReached = (this.sdk as any).frequency.hasReachedCap(
            experience.id,
            experience.frequency.max,
            experience.frequency.per
          );

          allTrace.push({
            step: 'check-frequency-cap',
            timestamp: freqStart,
            duration: Date.now() - freqStart,
            input: experience.frequency,
            output: hasReached,
            passed: !hasReached,
          });

          if (hasReached) {
            const count = (this.sdk as any).frequency.getImpressionCount(
              experience.id,
              experience.frequency.per
            );
            allReasons.push(
              `Frequency cap reached (${count}/${experience.frequency.max} this ${experience.frequency.per})`
            );
            continue; // Skip this experience, check next
          }

          const count = (this.sdk as any).frequency.getImpressionCount(
            experience.id,
            experience.frequency.per
          );
          allReasons.push(
            `Frequency cap not reached (${count}/${experience.frequency.max} this ${experience.frequency.per})`
          );
        }

        matchedExperience = experience;
        break; // First match wins
      }
    }

    const decision: Decision = {
      show: !!matchedExperience,
      experienceId: matchedExperience?.id,
      reasons: allReasons,
      trace: allTrace,
      context: evalContext,
      metadata: {
        evaluatedAt: Date.now(),
        totalDuration: Date.now() - startTime,
        experiencesEvaluated: this.experiences.size,
      },
    };

    // Store decision for inspection
    this.decisions.push(decision);

    // Emit for plugins to react (include matched experience for rendering)
    this.sdk.emit('experiences:evaluated', {
      decision,
      experience: matchedExperience,
    });

    return decision;
  }

  /**
   * Evaluate all experiences against context
   * Returns multiple decisions (sorted by priority)
   * All matching experiences will be shown
   */
  evaluateAll(context?: Partial<Context>): Decision[] {
    const evalContext = buildContext(context);

    // Sort experiences by priority (higher = more important)
    // Ties maintain registration order (Map preserves insertion order)
    const sortedExperiences = Array.from(this.experiences.values()).sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      return priorityB - priorityA; // Descending order
    });

    const decisions: Decision[] = [];

    // Evaluate each experience
    for (const experience of sortedExperiences) {
      const expStartTime = Date.now();
      const result = evaluateExperience(experience, evalContext);

      let show = result.matched;
      const reasons = [...result.reasons];
      const trace = [...result.trace];

      // Check frequency cap if experience has frequency rules
      if (show && experience.frequency && (this.sdk as any).frequency) {
        const freqStart = Date.now();
        const hasReached = (this.sdk as any).frequency.hasReachedCap(
          experience.id,
          experience.frequency.max,
          experience.frequency.per
        );

        trace.push({
          step: 'check-frequency-cap',
          timestamp: freqStart,
          duration: Date.now() - freqStart,
          input: experience.frequency,
          output: hasReached,
          passed: !hasReached,
        });

        if (hasReached) {
          const count = (this.sdk as any).frequency.getImpressionCount(
            experience.id,
            experience.frequency.per
          );
          reasons.push(
            `Frequency cap reached (${count}/${experience.frequency.max} this ${experience.frequency.per})`
          );
          show = false;
        } else {
          const count = (this.sdk as any).frequency.getImpressionCount(
            experience.id,
            experience.frequency.per
          );
          reasons.push(
            `Frequency cap not reached (${count}/${experience.frequency.max} this ${experience.frequency.per})`
          );
        }
      }

      const decision: Decision = {
        show,
        experienceId: experience.id,
        reasons,
        trace,
        context: evalContext,
        metadata: {
          evaluatedAt: Date.now(),
          totalDuration: Date.now() - expStartTime,
          experiencesEvaluated: 1,
        },
      };

      decisions.push(decision);
      this.decisions.push(decision);
    }

    // Emit single event with all decisions (array)
    // Plugins can filter to their relevant experiences
    const matchedDecisions = decisions.filter((d) => d.show);
    const matchedExperiences = matchedDecisions
      .map((d) => d.experienceId && this.experiences.get(d.experienceId))
      .filter((exp): exp is Experience => exp !== undefined);

    this.sdk.emit(
      'experiences:evaluated',
      matchedDecisions.map((decision, index) => ({
        decision,
        experience: matchedExperiences[index],
      }))
    );

    return decisions;
  }

  /**
   * Explain a specific experience
   */
  explain(experienceId: string): Decision | null {
    const experience = this.experiences.get(experienceId);
    if (!experience) {
      return null;
    }

    const context = buildContext();
    const result = evaluateExperience(experience, context);

    return {
      show: result.matched,
      experienceId,
      reasons: result.reasons,
      trace: result.trace,
      context,
      metadata: {
        evaluatedAt: Date.now(),
        totalDuration: 0,
        experiencesEvaluated: 1,
      },
    };
  }

  /**
   * Get runtime state (for inspection)
   */
  getState(): RuntimeState {
    return {
      initialized: this.initialized,
      experiences: new Map(this.experiences),
      decisions: [...this.decisions],
      config: this.sdk ? this.sdk.getAll() : {},
    };
  }

  /**
   * Event subscription (proxy to SDK)
   */
  on(event: string, handler: (...args: any[]) => void): () => void {
    return this.sdk.on(event, handler);
  }

  /**
   * Destroy runtime
   */
  async destroy(): Promise<void> {
    if (this.sdk) {
      await this.sdk.destroy();
    }
    this.destroyed = true;
    this.experiences.clear();
    this.decisions = [];
    this.initialized = false;
  }
}

// Pure functions for evaluation logic (easy to test, no dependencies)

/**
 * Build evaluation context from partial input
 * Pure function - no side effects
 */
export function buildContext(partial?: Partial<Context>): Context {
  return {
    url: partial?.url ?? (typeof window !== 'undefined' ? window.location.href : ''),
    timestamp: Date.now(),
    user: partial?.user,
    custom: partial?.custom,
  };
}

/**
 * Evaluate an experience against context
 * Pure function - returns reasons and trace
 */
export function evaluateExperience(
  experience: Experience,
  context: Context
): { matched: boolean; reasons: string[]; trace: TraceStep[] } {
  const reasons: string[] = [];
  const trace: TraceStep[] = [];
  let matched = true;

  // Evaluate URL rule
  if (experience.targeting.url) {
    const urlStart = Date.now();
    const urlMatch = evaluateUrlRule(experience.targeting.url, context.url);

    trace.push({
      step: 'evaluate-url-rule',
      timestamp: urlStart,
      duration: Date.now() - urlStart,
      input: { rule: experience.targeting.url, url: context.url },
      output: urlMatch,
      passed: urlMatch,
    });

    if (urlMatch) {
      reasons.push('URL matches targeting rule');
    } else {
      reasons.push('URL does not match targeting rule');
      matched = false;
    }
  }

  return { matched, reasons, trace };
}

/**
 * Evaluate URL targeting rule
 * Pure function - deterministic output
 */
export function evaluateUrlRule(rule: UrlRule, url: string = ''): boolean {
  // Check equals (exact match)
  if (rule.equals !== undefined) {
    return url === rule.equals;
  }

  // Check contains (substring match)
  if (rule.contains !== undefined) {
    return url.includes(rule.contains);
  }

  // Check matches (regex match)
  if (rule.matches !== undefined) {
    return rule.matches.test(url);
  }

  // No rules specified = match all
  return true;
}
