import { SDK } from '@lytics/sdk-kit';
import { storagePlugin } from '@lytics/sdk-kit-plugins';
import {
  bannerPlugin,
  debugPlugin,
  exitIntentPlugin,
  frequencyPlugin,
  inlinePlugin,
  modalPlugin,
  pageVisitsPlugin,
  scrollDepthPlugin,
  timeDelayPlugin,
} from '@prosdevlab/experience-sdk-plugins';
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
  public sdk: SDK; // Public for plugin API access via Proxy (readonly would prevent reinit)
  private experiences: Map<string, Experience> = new Map();
  private decisions: Decision[] = [];
  private initialized = false;
  private destroyed = false;
  private triggerContext: Context = { triggers: {} };

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
    this.sdk.use(exitIntentPlugin);
    this.sdk.use(scrollDepthPlugin);
    this.sdk.use(pageVisitsPlugin);
    this.sdk.use(timeDelayPlugin);
    this.sdk.use(modalPlugin);
    this.sdk.use(inlinePlugin);
    this.sdk.use(bannerPlugin);

    // Listen for trigger events from display condition plugins
    this.setupTriggerListeners();
  }

  /**
   * Setup listeners for trigger:* events
   * This enables event-driven display conditions
   */
  /**
   * Setup listeners for trigger:* events
   * This enables event-driven display conditions
   *
   * Note: sdk-kit's emitter passes only the event payload to wildcard listeners,
   * not the event name. Display condition plugins must include trigger metadata
   * in their payload (e.g., { trigger: 'exitIntent', ...data })
   */
  private setupTriggerListeners(): void {
    // Listen for specific trigger events
    // We can't use 'trigger:*' wildcard because sdk-kit doesn't pass event name
    // So we listen to each known trigger type individually

    const triggerTypes = [
      'exitIntent',
      'scrollDepth',
      'timeDelay',
      'pageVisits',
      'modal',
      'inline',
    ];

    for (const triggerType of triggerTypes) {
      this.sdk.on(`trigger:${triggerType}`, (data: any) => {
        // Update trigger context
        this.triggerContext.triggers = this.triggerContext.triggers || {};
        this.triggerContext.triggers[triggerType] = {
          triggered: true,
          timestamp: Date.now(),
          ...data, // Merge trigger-specific data
        };

        // Re-evaluate ALL experiences with updated trigger context
        // Using evaluateAll() to show multiple matching experiences
        // buildContext() will automatically add the current URL
        this.evaluateAll(this.triggerContext);
      });
    }
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
      this.sdk.use(exitIntentPlugin);
      this.sdk.use(scrollDepthPlugin);
      this.sdk.use(pageVisitsPlugin);
      this.sdk.use(timeDelayPlugin);
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

    // Emit one event per matched experience
    // This allows plugins to react individually to each experience
    const matchedDecisions = decisions.filter((d) => d.show);
    for (const decision of matchedDecisions) {
      const experience = decision.experienceId
        ? this.experiences.get(decision.experienceId)
        : undefined;
      if (experience) {
        this.sdk.emit('experiences:evaluated', {
          decision,
          experience,
        });
      }
    }

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
    triggers: partial?.triggers ?? {}, // Include triggers
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
  if (experience.targeting?.url) {
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

  // Evaluate display trigger conditions
  if (experience.display?.trigger && context.triggers) {
    const triggerType = experience.display.trigger;
    const triggerData = context.triggers[triggerType];

    // Check if this trigger has fired
    if (!triggerData?.triggered) {
      reasons.push(`Waiting for ${triggerType} trigger`);
      matched = false;
    } else {
      // For scrollDepth, check if threshold matches
      if (triggerType === 'scrollDepth' && experience.display.triggerData?.threshold) {
        const expectedThreshold = experience.display.triggerData.threshold;
        const actualThreshold = triggerData.threshold;

        if (actualThreshold === expectedThreshold) {
          reasons.push(`Scroll depth threshold (${expectedThreshold}%) reached`);
        } else {
          reasons.push(
            `Scroll depth threshold mismatch (expected ${expectedThreshold}%, got ${actualThreshold}%)`
          );
          matched = false;
        }
      } else {
        // Other triggers just need to be triggered
        reasons.push(`${triggerType} trigger fired`);
      }
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
