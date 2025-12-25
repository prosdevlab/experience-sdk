# Phase 0: Foundation - Core Runtime

**Status:** 🚧 In Progress  
**Start Date:** December 24, 2025  
**Target Completion:** December 31, 2025  
**Duration:** ~1 week

---

## Overview

Build the foundational Experience SDK with explainability-first architecture. This phase establishes the core runtime, decision evaluation system, and essential plugins that demonstrate the sdk-kit integration patterns.

## Goals

### Primary Goals
1. **Explainability-First** - Every decision returns structured reasons
2. **Plugin-Based Runtime** - Built on @lytics/sdk-kit patterns
3. **Script Tag Ready** - Works without build tools (IIFE bundle)
4. **Type-Safe** - Full TypeScript support
5. **Developer-Focused** - Built for debugging and inspection

### Success Criteria
- [x] Runtime can register and evaluate experiences
- [x] Unit test coverage > 80% (achieved 100%)
- [ ] Every decision includes human-readable reasons
- [ ] Works via script tag with global `experiences` object
- [ ] 3 working plugins (storage, debug, banner)
- [ ] Bundle size < 15KB gzipped (with sdk-kit)
- [ ] Demo site showing explainability

---

## Architecture

### Core Components

```
@prosdevlab/experience-sdk
├── ExperienceRuntime      # Main runtime class
├── DecisionLogger         # Explainability engine
├── Types                  # TypeScript definitions
└── Exports               # Singleton + createInstance pattern

@prosdevlab/experience-sdk-plugins
├── Frequency Plugin       # Frequency capping (uses sdk-kit storage)
├── Debug Plugin          # Event emission
└── Banner Plugin         # Experience delivery
```

### API Surface

```typescript
// Singleton API (script tag / default export)
experiences.init({ debug: true });
experiences.register('welcome', {
  type: 'banner',
  targeting: { url: { contains: '/' } },
  content: { title: 'Welcome!' }
});
const decision = experiences.evaluate();
console.log(decision.reasons); // ['✅ URL matches', ...]

// Instance API (advanced / testing)
import { createInstance } from '@prosdevlab/experience-sdk';
const exp = createInstance();
exp.init({ debug: true });
```

### SDK-Kit Integration

```typescript
// Built on sdk-kit
class ExperienceRuntime {
  private sdk: SDK; // From @lytics/sdk-kit
  
  constructor() {
    this.sdk = new SDK();
    // Register plugins
    this.sdk.use(storagePlugin);
    this.sdk.use(debugPlugin);
  }
}
```

---

## Scope

### In Scope (Phase 0)
- ✅ Core runtime with sdk-kit integration
- ✅ Experience registration and evaluation
- ✅ Decision logger with structured reasons
- ✅ Singleton + createInstance export pattern
- ✅ Storage plugin (frequency capping)
- ✅ Debug plugin (window events)
- ✅ Banner plugin (top/bottom injection)
- ✅ TypeScript types for all public APIs
- ✅ Unit tests (80%+ coverage)
- ✅ Demo site with explainability showcase
- ✅ ESM + IIFE builds

### Out of Scope (Future Phases)
- ❌ Chrome DevTools extension
- ❌ Advanced experience types (modal, tooltip)
- ❌ Complex targeting (AND/OR logic)
- ❌ A/B testing variant selection
- ❌ Remote config loading
- ❌ Framework adapters (React, Vue)

---

## Technical Requirements

### Runtime Environment
- **Node.js:** >= 22 LTS (development)
- **Browsers:** Modern browsers (ES2022+)
- **Script Tag:** IIFE bundle with `experiences` global

### Dependencies
- **Runtime:** `@lytics/sdk-kit@^0.1.1`
- **Dev:** TypeScript, Vitest, tsup, Biome

### Build Outputs
```
dist/
├── index.mjs              # ESM (for npm/bundlers)
├── index.global.js        # IIFE (for script tag)
└── index.d.ts             # TypeScript types
```

---

## Data Model

### Core Types

```typescript
// Experience definition
interface Experience {
  id: string;
  type: 'banner' | 'modal' | 'tooltip';
  targeting: TargetingRules;
  content: ExperienceContent;
  frequency?: FrequencyConfig;
}

// Targeting rules
interface TargetingRules {
  url?: UrlRule;
  frequency?: FrequencyRule;
  // Extensible for future rules
}

interface UrlRule {
  contains?: string;
  equals?: string;
  matches?: RegExp;
}

interface FrequencyRule {
  max: number;
  per: 'session' | 'day' | 'week';
}

// Decision output
interface Decision {
  show: boolean;
  experienceId?: string;
  reasons: string[];           // Human-readable
  trace: TraceStep[];          // Machine-readable
  context: Context;            // Input context
  metadata: DecisionMetadata;
}

// Reason explanation
interface Reason {
  rule: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message: string; // "✅ URL contains '/products'"
}

// Evaluation context
interface Context {
  url?: string;
  user?: UserContext;
  custom?: Record<string, any>;
}
```

---

## User Stories

### US-1: Register and Evaluate Experience
**As a** developer  
**I want to** register an experience and evaluate it  
**So that** I can show targeted content to users

**Acceptance Criteria:**
- Can call `experiences.register(id, experience)`
- Can call `experiences.evaluate(context?)`
- Returns decision with `show` boolean

### US-2: Understand Why Decision Was Made
**As a** developer  
**I want to** see why an experience was shown or hidden  
**So that** I can debug targeting rules

**Acceptance Criteria:**
- Decision includes `reasons` array
- Each reason is human-readable (e.g., "✅ URL matches")
- Decision includes machine-readable `trace`

### US-3: Cap Experience Frequency
**As a** developer  
**I want to** limit how often experiences show  
**So that** users aren't annoyed

**Acceptance Criteria:**
- Can set `frequency: { max: 1, per: 'session' }`
- Storage plugin tracks impressions
- Decision respects frequency caps

### US-4: Use via Script Tag
**As a** developer  
**I want to** use the SDK via script tag  
**So that** I don't need a build step

**Acceptance Criteria:**
- Can include via `<script src="...">`
- Global `experiences` object available
- Works without npm/bundler

### US-5: Debug in Browser
**As a** developer  
**I want to** see debug events in the browser  
**So that** I can inspect decisions in real-time

**Acceptance Criteria:**
- Debug plugin emits window events
- Can listen with `window.addEventListener('experience-sdk:debug', ...)`
- Events include full decision data

---

## Non-Functional Requirements

### Performance
- **Bundle Size:** < 15KB gzipped (includes sdk-kit)
- **Evaluation Time:** < 10ms per experience
- **Initialization:** < 50ms

### Reliability
- **No Crashes:** Graceful error handling
- **Fallback:** Memory storage if sessionStorage fails

### Maintainability
- **Test Coverage:** > 80% line coverage
- **Type Safety:** Strict TypeScript mode
- **Code Quality:** Biome linting passes

---

## Risks & Mitigations

### Risk 1: Bundle Size Exceeds Target
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:** 
- Use tree-shaking effectively
- Keep sdk-kit minimal
- Monitor bundle size in CI

### Risk 2: Explainability Adds Performance Overhead
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Keep trace generation optional
- Use efficient data structures
- Benchmark critical paths

### Risk 3: Storage Failures in Private Mode
**Likelihood:** High  
**Impact:** Low  
**Mitigation:**
- Implement memory fallback
- Test in various browser modes
- Document limitations

---

## Dependencies

### Upstream
- `@lytics/sdk-kit@^0.1.1` - Plugin system foundation

### Downstream
- None (this is phase 0)

---

## Timeline

### Week 1 (Dec 24-26)
- Core types and interfaces
- ExperienceRuntime class
- DecisionLogger implementation
- Storage plugin

### Week 2 (Dec 27-29)
- Debug plugin
- Banner plugin
- Unit tests
- Demo site

### Week 3 (Dec 30-31)
- Polish and bug fixes
- Documentation
- Final testing

---

## Out of Scope Clarifications

**Why no Chrome extension in Phase 0?**
- Foundation must be solid first
- Extension depends on stable API
- Will be Phase 1

**Why no complex targeting?**
- Start simple to validate patterns
- Complex rules add scope creep
- Can extend later without breaking changes

**Why no A/B testing?**
- Phase 0 focuses on core evaluation
- A/B testing is a specialized plugin
- Will be Phase 2

---

## Success Metrics

- [ ] Demo site deployed to Cloudflare Pages
- [ ] All user stories implemented
- [ ] 80%+ test coverage achieved
- [ ] Bundle size under 15KB gzipped
- [ ] Zero linter errors
- [ ] Documentation complete
- [ ] Ready for Phase 1 (Chrome extension)

