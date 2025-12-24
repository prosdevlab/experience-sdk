# Implementation Plan - Phase 0: Foundation

**Version:** 1.0  
**Last Updated:** December 24, 2025

---

## Implementation Strategy

### Approach

**Bottom-Up Implementation** - Build from types → runtime → plugins → demo

**Rationale:**
- Types define contracts (compile-time safety)
- Runtime is the foundation for plugins
- Plugins demonstrate extensibility
- Demo validates the complete system

### Phases

```
1. Foundation (Types) → 2. Core Runtime → 3. Plugins → 4. Demo & Testing
```

---

## Detailed Implementation

### Phase 1: Foundation - TypeScript Types

**Goal:** Define all type contracts before implementation

**Files to Create:**
```
packages/core/src/
├── types.ts              # All type definitions
└── index.ts              # Main exports
```

**Key Types to Define:**

```typescript
// types.ts

/**
 * Experience definition
 */
export interface Experience {
  id: string;
  type: 'banner' | 'modal' | 'tooltip';
  targeting: TargetingRules;
  content: ExperienceContent;
  frequency?: FrequencyConfig;
}

/**
 * Targeting rules for experience evaluation
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
 * Experience content (type-specific)
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
 * Evaluation context
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
 * Decision output - THE CORE OF EXPLAINABILITY
 */
export interface Decision {
  show: boolean;
  experienceId?: string;
  reasons: string[];           // Human-readable explanations
  trace: TraceStep[];          // Machine-readable trace
  context: Context;            // Input context used
  metadata: DecisionMetadata;
}

export interface TraceStep {
  step: string;                // e.g., "evaluate-url-rule"
  timestamp: number;
  duration: number;            // milliseconds
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
 * Configuration options
 */
export interface ExperienceConfig {
  debug?: boolean;
  storage?: 'session' | 'local' | 'memory';
  [key: string]: any;
}

/**
 * Runtime state (for inspection)
 */
export interface RuntimeState {
  initialized: boolean;
  experiences: Map<string, Experience>;
  decisions: Decision[];
  config: ExperienceConfig;
}
```

**Dependencies:** None  
**Estimate:** 2-3 hours  
**Tests:** Type exports validate, no runtime tests needed yet

**Validation:**
```bash
pnpm typecheck  # Should pass with zero errors
```

---

### Phase 2: Core Runtime

**Goal:** Build the ExperienceRuntime class with sdk-kit integration

#### 2.1 Runtime Class Structure

**File:** `packages/core/src/runtime.ts`

**Implementation:**

```typescript
import { SDK } from '@lytics/sdk-kit';
import type {
  Experience,
  Context,
  Decision,
  ExperienceConfig,
  RuntimeState,
} from './types';

/**
 * Experience Runtime
 * 
 * Core class that manages experience registration and evaluation.
 * Built on @lytics/sdk-kit for plugin system and lifecycle management.
 */
export class ExperienceRuntime {
  private sdk: SDK;
  private experiences: Map<string, Experience> = new Map();
  private decisions: Decision[] = [];
  private initialized = false;

  constructor(config: ExperienceConfig = {}) {
    // Create SDK instance
    this.sdk = new SDK({
      name: 'experience-sdk',
      ...config,
    });
  }

  /**
   * Initialize the runtime
   */
  async init(config?: ExperienceConfig): Promise<void> {
    if (this.initialized) {
      console.warn('[experiences] Already initialized');
      return;
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
    
    this.sdk.emit('experiences:registered', { id, experience: exp });
  }

  /**
   * Evaluate experiences against context
   * Returns decision with explainability
   */
  evaluate(context?: Partial<Context>): Decision {
    const startTime = Date.now();
    const evalContext = this.buildContext(context);

    // Find matching experience
    let matchedExperience: Experience | undefined;
    let reasons: string[] = [];
    let trace: TraceStep[] = [];

    for (const [id, experience] of this.experiences) {
      const result = this.evaluateExperience(experience, evalContext);
      
      reasons.push(...result.reasons);
      trace.push(...result.trace);

      if (result.matched) {
        matchedExperience = experience;
        break; // First match wins
      }
    }

    const decision: Decision = {
      show: !!matchedExperience,
      experienceId: matchedExperience?.id,
      reasons,
      trace,
      context: evalContext,
      metadata: {
        evaluatedAt: Date.now(),
        totalDuration: Date.now() - startTime,
        experiencesEvaluated: this.experiences.size,
      },
    };

    // Store decision for inspection
    this.decisions.push(decision);

    // Emit for plugins to react
    this.sdk.emit('experiences:evaluated', decision);

    return decision;
  }

  /**
   * Explain a specific experience
   */
  explain(experienceId: string): Decision | null {
    const experience = this.experiences.get(experienceId);
    if (!experience) {
      return null;
    }

    const context = this.buildContext();
    const result = this.evaluateExperience(experience, context);

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
      config: this.sdk.getAll(),
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
    await this.sdk.destroy();
    this.experiences.clear();
    this.decisions = [];
    this.initialized = false;
  }

  // Private methods

  private buildContext(partial?: Partial<Context>): Context {
    return {
      url: partial?.url ?? (typeof window !== 'undefined' ? window.location.href : ''),
      timestamp: Date.now(),
      user: partial?.user,
      custom: partial?.custom,
    };
  }

  private evaluateExperience(
    experience: Experience,
    context: Context
  ): { matched: boolean; reasons: string[]; trace: TraceStep[] } {
    const reasons: string[] = [];
    const trace: TraceStep[] = [];
    let matched = true;

    // Evaluate URL rule
    if (experience.targeting.url) {
      const urlStart = Date.now();
      const urlMatch = this.evaluateUrlRule(experience.targeting.url, context.url);
      
      trace.push({
        step: 'evaluate-url-rule',
        timestamp: urlStart,
        duration: Date.now() - urlStart,
        input: { rule: experience.targeting.url, url: context.url },
        output: urlMatch,
        passed: urlMatch,
      });

      if (urlMatch) {
        reasons.push(`✅ URL matches targeting rule`);
      } else {
        reasons.push(`❌ URL does not match targeting rule`);
        matched = false;
      }
    }

    // Evaluate frequency rule (will be checked by storage plugin)
    if (experience.frequency) {
      const freqStart = Date.now();
      // For now, just track - storage plugin will do actual checking
      trace.push({
        step: 'evaluate-frequency-rule',
        timestamp: freqStart,
        duration: Date.now() - freqStart,
        input: experience.frequency,
        output: true,
        passed: true,
      });
      reasons.push(`⏸️ Frequency rule delegated to storage plugin`);
    }

    return { matched, reasons, trace };
  }

  private evaluateUrlRule(rule: UrlRule, url: string = ''): boolean {
    if (rule.equals) {
      return url === rule.equals;
    }
    if (rule.contains) {
      return url.includes(rule.contains);
    }
    if (rule.matches) {
      return rule.matches.test(url);
    }
    return true;
  }
}
```

**Dependencies:**
- `@lytics/sdk-kit`
- `types.ts`

**Estimate:** 4-6 hours  

**Tests to Write:**
```typescript
// runtime.test.ts
describe('ExperienceRuntime', () => {
  describe('initialization', () => {
    it('should initialize successfully');
    it('should warn on double init');
  });

  describe('registration', () => {
    it('should register an experience');
    it('should emit registration event');
  });

  describe('evaluation', () => {
    it('should evaluate and return decision');
    it('should match URL contains rule');
    it('should match URL equals rule');
    it('should include reasons in decision');
    it('should include trace in decision');
  });

  describe('explainability', () => {
    it('should explain specific experience');
    it('should include all trace steps');
  });

  describe('state inspection', () => {
    it('should return current state');
  });
});
```

---

#### 2.2 Export Pattern (Singleton + Instance)

**File:** `packages/core/src/index.ts`

**Implementation:**

```typescript
import { ExperienceRuntime } from './runtime';
import type {
  Experience,
  Context,
  Decision,
  ExperienceConfig,
  RuntimeState,
  // ... all other types
} from './types';

// Factory function
export function createInstance(config?: ExperienceConfig): ExperienceRuntime {
  return new ExperienceRuntime(config);
}

// Default singleton instance
const defaultInstance = createInstance();

// Default export (for `import experiences from ...`)
export default defaultInstance;

// Named exports from singleton (for tree-shaking)
export const init = defaultInstance.init.bind(defaultInstance);
export const register = defaultInstance.register.bind(defaultInstance);
export const evaluate = defaultInstance.evaluate.bind(defaultInstance);
export const explain = defaultInstance.explain.bind(defaultInstance);
export const on = defaultInstance.on.bind(defaultInstance);
export const getState = defaultInstance.getState.bind(defaultInstance);

// For script tag (IIFE will use this)
export const experiences = defaultInstance;

// Export all types
export type {
  Experience,
  Context,
  Decision,
  ExperienceConfig,
  RuntimeState,
  // ... all other types
};

// Export runtime class for advanced use
export { ExperienceRuntime };
```

**Dependencies:**
- `runtime.ts`
- `types.ts`

**Estimate:** 1-2 hours

**Tests:**
```typescript
// index.test.ts
describe('Exports', () => {
  it('should export default singleton');
  it('should export named functions');
  it('should export createInstance');
  it('should export types');
});
```

---

### Phase 3: Plugins

**Goal:** Build three essential plugins following sdk-kit patterns

#### 3.1 Storage Plugin (Frequency Capping)

**File:** `packages/plugins/src/storage/index.ts`

**Implementation:**

```typescript
import type { PluginFunction } from '@lytics/sdk-kit';

/**
 * Storage Plugin
 * 
 * Handles frequency capping by tracking experience impressions
 * in sessionStorage (with memory fallback)
 */
export const storagePlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.storage');

  plugin.defaults({
    storage: {
      backend: 'session',
      prefix: 'exp_',
    },
  });

  // Storage backend (with fallback)
  const storage = getStorage(config.get('storage.backend'));
  const prefix = config.get('storage.prefix');

  /**
   * Check if experience has been shown
   */
  function hasShown(experienceId: string, frequency: any): boolean {
    const key = `${prefix}${experienceId}`;
    const count = parseInt(storage.getItem(key) || '0', 10);
    return count >= frequency.max;
  }

  /**
   * Record impression
   */
  function recordImpression(experienceId: string): void {
    const key = `${prefix}${experienceId}`;
    const count = parseInt(storage.getItem(key) || '0', 10);
    storage.setItem(key, String(count + 1));
  }

  // Expose API
  plugin.expose({
    storage: {
      hasShown,
      recordImpression,
      clear: () => {
        // Clear all experience impressions
        if (storage.clear) {
          storage.clear();
        }
      },
    },
  });

  // Listen to evaluation events to enforce frequency caps
  instance.on('experiences:evaluated', (decision: any) => {
    if (decision.show && decision.experienceId) {
      const experience = instance.getState?.().experiences.get(decision.experienceId);
      if (experience?.frequency) {
        if (hasShown(decision.experienceId, experience.frequency)) {
          // Block showing
          decision.show = false;
          decision.reasons.push(`❌ Frequency cap reached`);
        } else {
          // Record impression
          recordImpression(decision.experienceId);
          decision.reasons.push(`✅ Impression recorded (${storage.getItem(`${prefix}${decision.experienceId}`)}/${experience.frequency.max})`);
        }
      }
    }
  });
};

// Storage backend helper
function getStorage(type: string): Storage {
  try {
    const storage = type === 'local' ? localStorage : sessionStorage;
    // Test if accessible
    const test = '__test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return storage;
  } catch {
    // Fallback to memory
    return createMemoryStorage();
  }
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    length: store.size,
  } as Storage;
}
```

**Dependencies:**
- `@lytics/sdk-kit`

**Estimate:** 3-4 hours

**Tests:**
```typescript
describe('Storage Plugin', () => {
  it('should track impressions');
  it('should enforce frequency caps');
  it('should fallback to memory storage');
  it('should clear impressions');
});
```

---

#### 3.2 Debug Plugin (Event Emission)

**File:** `packages/plugins/src/debug/index.ts`

**Implementation:**

```typescript
import type { PluginFunction } from '@lytics/sdk-kit';

/**
 * Debug Plugin
 * 
 * Emits structured events to window for Chrome extension
 * and developer debugging
 */
export const debugPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.debug');

  plugin.defaults({
    debug: {
      enabled: false,
      console: false,
      window: true,
    },
  });

  const enabled = config.get('debug.enabled');
  const useConsole = config.get('debug.console');
  const useWindow = config.get('debug.window');

  if (!enabled) return;

  // Listen to all experience events
  instance.on('experiences:*', (eventName: string, ...args: any[]) => {
    const debugEvent = {
      type: eventName,
      timestamp: Date.now(),
      data: args,
    };

    // Emit to window (for Chrome extension)
    if (useWindow && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('experience-sdk:debug', {
          detail: debugEvent,
        })
      );
    }

    // Log to console
    if (useConsole) {
      console.group(`🎯 ${eventName}`);
      console.log('Timestamp:', new Date(debugEvent.timestamp).toISOString());
      console.log('Data:', debugEvent.data);
      console.groupEnd();
    }
  });

  plugin.expose({
    debug: {
      log: (message: string, data?: any) => {
        instance.emit('experiences:debug', { message, data });
      },
    },
  });
};
```

**Dependencies:**
- `@lytics/sdk-kit`

**Estimate:** 2-3 hours

**Tests:**
```typescript
describe('Debug Plugin', () => {
  it('should emit window events when enabled');
  it('should log to console when enabled');
  it('should not emit when disabled');
});
```

---

#### 3.3 Banner Plugin (Experience Delivery)

**File:** `packages/plugins/src/banner/index.ts`

**Implementation:**

```typescript
import type { PluginFunction } from '@lytics/sdk-kit';

/**
 * Banner Plugin
 * 
 * Renders banner experiences at top or bottom of page
 */
export const bannerPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.banner');

  plugin.defaults({
    banner: {
      position: 'top',
      dismissable: true,
    },
  });

  let activeBanner: HTMLElement | null = null;

  /**
   * Show banner experience
   */
  function show(experience: any): void {
    if (activeBanner) {
      remove();
    }

    const banner = createBanner(experience);
    document.body.appendChild(banner);
    activeBanner = banner;

    instance.emit('experiences:shown', {
      id: experience.id,
      type: 'banner',
    });
  }

  /**
   * Remove active banner
   */
  function remove(): void {
    if (activeBanner) {
      activeBanner.remove();
      activeBanner = null;
      instance.emit('experiences:dismissed', { type: 'banner' });
    }
  }

  /**
   * Create banner DOM element
   */
  function createBanner(experience: any): HTMLElement {
    const banner = document.createElement('div');
    banner.className = 'experience-sdk-banner';
    banner.style.cssText = `
      position: fixed;
      ${config.get('banner.position') === 'top' ? 'top: 0' : 'bottom: 0'};
      left: 0;
      right: 0;
      background: #2563eb;
      color: white;
      padding: 1rem;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;

    const textContent = document.createElement('div');
    textContent.innerHTML = `
      <strong style="display: block; margin-bottom: 0.25rem;">${experience.content.title}</strong>
      <span>${experience.content.message}</span>
    `;

    content.appendChild(textContent);

    if (config.get('banner.dismissable')) {
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        margin-left: 1rem;
      `;
      closeBtn.onclick = () => remove();
      content.appendChild(closeBtn);
    }

    banner.appendChild(content);
    return banner;
  }

  // Auto-show on evaluation if decision.show is true
  instance.on('experiences:evaluated', (decision: any) => {
    if (decision.show && decision.experienceId) {
      const state = instance.getState?.();
      const experience = state?.experiences.get(decision.experienceId);
      if (experience && experience.type === 'banner') {
        show(experience);
      }
    }
  });

  plugin.expose({
    banner: {
      show,
      remove,
    },
  });

  // Cleanup on destroy
  instance.on('sdk:destroy', () => {
    remove();
  });
};
```

**Dependencies:**
- `@lytics/sdk-kit`

**Estimate:** 4-5 hours

**Tests:**
```typescript
describe('Banner Plugin', () => {
  it('should create banner element');
  it('should show banner on evaluation');
  it('should dismiss banner on click');
  it('should cleanup on destroy');
});
```

---

### Phase 4: Integration & Demo

#### 4.1 Update Core to Use Plugins

**File:** `packages/core/src/runtime.ts`

**Update constructor:**

```typescript
import { storagePlugin } from '@prosdevlab/experience-sdk-plugins/storage';
import { debugPlugin } from '@prosdevlab/experience-sdk-plugins/debug';
import { bannerPlugin } from '@prosdevlab/experience-sdk-plugins/banner';

constructor(config: ExperienceConfig = {}) {
  this.sdk = new SDK({
    name: 'experience-sdk',
    ...config,
  });

  // Register plugins
  this.sdk.use(storagePlugin);
  this.sdk.use(debugPlugin);
  this.sdk.use(bannerPlugin);
}
```

**Estimate:** 1 hour

---

#### 4.2 Demo Site

**File:** `demo/index.html`

**Implementation:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Experience SDK Demo</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .demo-section {
      margin: 2rem 0;
      padding: 2rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }
    .decision-output {
      background: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      font-family: monospace;
      white-space: pre-wrap;
    }
    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    button:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <h1>🎯 Experience SDK Demo</h1>
  <p>A demonstration of explainable, plugin-based client-side experiences.</p>

  <div class="demo-section">
    <h2>1. Initialize SDK</h2>
    <button onclick="initSDK()">Initialize</button>
    <div id="init-output" class="decision-output"></div>
  </div>

  <div class="demo-section">
    <h2>2. Register Experience</h2>
    <button onclick="registerExperience()">Register Welcome Banner</button>
    <div id="register-output" class="decision-output"></div>
  </div>

  <div class="demo-section">
    <h2>3. Evaluate</h2>
    <button onclick="evaluateExperiences()">Evaluate</button>
    <div id="evaluate-output" class="decision-output"></div>
  </div>

  <script src="../packages/core/dist/index.global.js"></script>
  <script>
    function initSDK() {
      experiences.init({ debug: true });
      document.getElementById('init-output').textContent = '✅ SDK initialized';
    }

    function registerExperience() {
      experiences.register('welcome', {
        type: 'banner',
        targeting: {
          url: { contains: 'demo' },
          frequency: { max: 1, per: 'session' }
        },
        content: {
          title: 'Welcome!',
          message: 'This is an explainable experience.',
        }
      });
      document.getElementById('register-output').textContent = 
        '✅ Experience registered: welcome';
    }

    function evaluateExperiences() {
      const decision = experiences.evaluate();
      document.getElementById('evaluate-output').textContent = 
        JSON.stringify(decision, null, 2);
    }

    // Listen for debug events
    window.addEventListener('experience-sdk:debug', (e) => {
      console.log('Debug event:', e.detail);
    });
  </script>
</body>
</html>
```

**Estimate:** 3-4 hours

---

## Build & Test Strategy

### Build Pipeline

```bash
# 1. Type check
pnpm typecheck

# 2. Build packages
pnpm build

# 3. Run tests
pnpm test

# 4. Check bundle size
ls -lh packages/core/dist/*.js
```

### Test Coverage Goals

- **Core Runtime:** > 90%
- **Plugins:** > 80%
- **Overall:** > 85%

### CI/CD

Already configured in `.github/workflows/ci.yml`:
- Runs on every PR
- Lint → Typecheck → Build → Test

---

## Timeline Estimates

| Phase | Task | Estimate |
|-------|------|----------|
| 1 | Types | 2-3h |
| 2.1 | Core Runtime | 4-6h |
| 2.2 | Export Pattern | 1-2h |
| 3.1 | Storage Plugin | 3-4h |
| 3.2 | Debug Plugin | 2-3h |
| 3.3 | Banner Plugin | 4-5h |
| 4.1 | Integration | 1h |
| 4.2 | Demo Site | 3-4h |
| Testing | Unit Tests | 6-8h |
| **Total** | | **26-36h** |

Estimated: **3-5 days of focused work**

---

## Validation Checklist

- [ ] TypeScript compiles with zero errors
- [ ] All tests pass
- [ ] Lint check passes
- [ ] Bundle size < 15KB gzipped
- [ ] Demo site works
- [ ] All user stories implemented
- [ ] Documentation complete

---

## Next Steps After Phase 0

1. Create `tasks.md` breaking down each phase into GitHub issues
2. Begin implementation following this plan
3. Update spec.md with actual completion dates
4. Document any deviations from plan
5. Prepare for Phase 1: Chrome Extension

