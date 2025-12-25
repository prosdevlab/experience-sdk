# Claude Assistant Guide

This document provides context for AI assistants (like Claude) working on the Experience SDK project.

## Project Overview

**Experience SDK** is a lightweight, explainable, plugin-based client-side experience runtime built on [@lytics/sdk-kit](https://github.com/Lytics/sdk-kit). 

**Core Differentiator:** Explainability-first - every decision returns structured reasons for why an experience was shown or hidden.

**Key Goals:**
- Showcase sdk-kit as a foundation for building SDKs
- Enable developers to understand "why" decisions are made
- Support both script tag (IIFE) and npm/bundler (ESM) usage
- Serve as foundation for future projects (Chrome extension, etc.)

## Project Philosophy

### 1. Spec-Driven Development

We follow a **deliberate, specification-first approach** inspired by [github/spec-kit](https://github.com/github/spec-kit):

**Research → Plan → Implement → Validate**

- **Research** (`notes/` - gitignored): Personal exploration, API research, brainstorming
- **Planning** (`specs/` - committed): Formal specifications, implementation plans, task breakdowns
- **Implementation**: Follow the plan systematically
- **Validation**: Tests pass, linter clean, acceptance criteria met

**Key Files:**
- `specs/phase-X-name/spec.md` - What we're building
- `specs/phase-X-name/plan.md` - How we're building it (with code examples)
- `specs/phase-X-name/tasks.md` - GitHub-ready issues
- `specs/phase-X-name/contracts/` - Type definitions

### 2. Leverage What Exists

Before building anything, check if it already exists in **sdk-kit**:

**✅ Available in sdk-kit (USE THESE):**
- Core: `SDK`, `Emitter`, `Config`, `Namespace`, `Expose`
- Plugins: `storagePlugin`, `contextPlugin`, `queuePlugin`, `transportPlugin`, `consentPlugin`, `pollPlugin`

**🔨 Build Only What's Missing:**
- `frequencyPlugin` - Experience frequency capping (uses sdk-kit storage underneath)
- `debugPlugin` - Window event emission for Chrome extension integration
- `bannerPlugin` - DOM rendering for banner experiences

**💡 Design for Contribution:**
If we build something generic, design it to potentially contribute back to sdk-kit.

### 3. Testability-First

**Prefer pure functions over complex stateful objects:**

```typescript
// ✅ Good - Pure function, easy to test
function evaluateUrlRule(rule: UrlRule, url: string): boolean {
  if (rule.equals) return url === rule.equals;
  if (rule.contains) return url.includes(rule.contains);
  if (rule.matches) return rule.matches.test(url);
  return true;
}

// ❌ Avoid - Hard to test, tightly coupled
class RuleEvaluator {
  constructor(private context: Context) {}
  evaluate() {
    // Complex stateful logic
  }
}
```

**Benefits:**
- Easy to unit test
- No mocking required
- Composable and reusable
- Clear inputs and outputs

### 4. Explainability-First

Every decision must include human-readable reasons:

```typescript
interface Decision {
  show: boolean;
  experienceId?: string;
  reasons: string[];           // ["✅ URL matches", "❌ Frequency cap reached"]
  trace: TraceStep[];          // Machine-readable trace
  context: Context;            // Full input context
  metadata: DecisionMetadata;
}
```

## How to Help

### When Starting a Task

1. **Check the spec first:**
   - Read `specs/phase-0-foundation/spec.md` for goals
   - Read `specs/phase-0-foundation/plan.md` for implementation details
   - Check `specs/phase-0-foundation/tasks.md` for task breakdown

2. **Check what exists:**
   - Review `/Users/prosseng/workspace/sdk-kit` for available capabilities
   - Don't reinvent - use sdk-kit where possible

3. **Follow the plan:**
   - Implementation order matters (dependencies!)
   - Use code examples in `plan.md` as starting point
   - Extract logic into pure functions

4. **Write tests alongside:**
   - Unit tests for all functions
   - Aim for >80% coverage
   - Test happy path + edge cases

### When Creating New Features

1. **Start with types** (`types.ts`):
   - Define interfaces first
   - Use strict TypeScript
   - Export all public types

2. **Extract pure functions:**
   - Business logic = pure functions
   - Side effects = minimal, isolated
   - Makes testing trivial

3. **Follow sdk-kit patterns** for plugins:
   ```typescript
   export const myPlugin: PluginFunction = (plugin, instance, config) => {
     plugin.ns('my.plugin');
     plugin.defaults({ my: { setting: 'value' } });
     plugin.expose({ myMethod() {} });
     instance.on('event', () => {});
   };
   ```

4. **Document decisions:**
   - Update spec if deviating from plan
   - Add code comments for complex logic
   - Update README for new features

### When Making Changes

**DO:**
- ✅ Follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- ✅ Run `pnpm build && pnpm test && pnpm lint` before committing
- ✅ Update specs if implementation differs from plan
- ✅ Extract testable pure functions
- ✅ Include acceptance criteria in commits
- ✅ Use sdk-kit capabilities where available
- ✅ Use `any` intentionally in public APIs (like sdk-kit does)

**DON'T:**
- ❌ Commit without running tests and linter
- ❌ Skip type definitions for public APIs
- ❌ Build what already exists in sdk-kit
- ❌ Create complex stateful classes when pure functions suffice
- ❌ Use `any` in internal implementation (only in public APIs)
- ❌ Commit changes without updating relevant specs

**About `any` Types:**
Following sdk-kit's pattern, `any` is intentionally used in public API files (types.ts) for:
- Config values, event payloads, custom user data
- Better developer experience and API flexibility
- Biome configured to allow `any` in specific files only
- Internal implementation should use specific types

## Project Structure

```
experience-sdk/
├── notes/                  # Personal research (gitignored)
│   ├── project-scope.md
│   ├── vision-and-roadmap.md
│   └── IMPLEMENTATION_PLAN.md (consolidated)
├── specs/                  # Formal specifications (committed)
│   └── phase-0-foundation/
│       ├── spec.md        # Goals, scope, user stories
│       ├── plan.md        # Step-by-step implementation
│       ├── tasks.md       # 14 GitHub-ready issues
│       └── contracts/     # Type contracts
├── packages/
│   ├── core/              # @prosdevlab/experience-sdk
│   │   └── src/
│   │       ├── types.ts   # All TypeScript types
│   │       ├── runtime.ts # ExperienceRuntime class
│   │       └── index.ts   # Exports (singleton + instance)
│   └── plugins/           # @prosdevlab/experience-sdk-plugins
│       └── src/
│           ├── frequency/  # Frequency capping (uses sdk-kit storage)
│           ├── debug/      # Debug/logging
│           └── banner/     # Banner rendering
├── demo/                   # Interactive demo site
├── .cursorrules           # Cursor IDE rules
├── DEVELOPMENT.md         # Workflow documentation
└── CLAUDE.md             # This file
```

## Current State

**Phase 0: Foundation** (In Progress)
- ✅ Project setup (monorepo, packages, CI/CD)
- ✅ Specs written (spec.md, plan.md, tasks.md)
- ✅ GitHub labels and milestone created
- 🚧 Implementation (14 tasks)

**Next Steps:**
1. Create 14 GitHub issues from `tasks.md`
2. Implement Task 1.1: Define TypeScript types
3. Follow plan.md order for remaining tasks

## Key Files to Reference

### For Implementation:
- `specs/phase-0-foundation/plan.md` - Detailed code examples
- `specs/phase-0-foundation/contracts/types.ts` - Type contracts
- `/Users/prosseng/workspace/sdk-kit` - Available sdk-kit capabilities

### For Context:
- `specs/phase-0-foundation/spec.md` - Goals and scope
- `notes/IMPLEMENTATION_PLAN.md` - Consolidated decisions
- `.cursorrules` - Code standards and guidelines

### For Workflow:
- `DEVELOPMENT.md` - Spec-driven workflow guide
- `specs/phase-0-foundation/tasks.md` - Task breakdown

## Common Patterns

### Hybrid API Pattern
```typescript
// Singleton (script tag)
experiences.init({ debug: true });
experiences.register('welcome', { ... });

// Instance (npm/bundler)
import { createInstance } from '@prosdevlab/experience-sdk';
const exp = createInstance({ debug: true });
```

### Pure Function Evaluation
```typescript
// Extract evaluation logic into pure functions
function evaluateTargeting(
  experience: Experience, 
  context: Context
): { matched: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let matched = true;
  
  if (experience.targeting.url) {
    const urlMatch = evaluateUrlRule(experience.targeting.url, context.url);
    matched = matched && urlMatch;
    reasons.push(urlMatch ? '✅ URL matches' : '❌ URL does not match');
  }
  
  return { matched, reasons };
}
```

### Plugin Pattern
```typescript
export const frequencyPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.frequency');
  plugin.defaults({ frequency: { enabled: true } });
  
  // Use sdk-kit's storage plugin
  if (!instance.storage) {
    instance.use(storagePlugin);
  }
  
  // Expose API
  plugin.expose({
    frequency: {
      getImpressionCount: () => {},
      recordImpression: () => {},
    },
  });
  
  // React to events
  instance.on('experiences:evaluated', (decision) => {
    // Frequency logic
  });
};
```

## Testing Philosophy

**Goal:** >80% coverage with meaningful tests

```typescript
// Unit test pure functions
describe('evaluateUrlRule', () => {
  it('should match URL with contains rule', () => {
    const rule = { contains: '/products' };
    const url = 'https://example.com/products/123';
    expect(evaluateUrlRule(rule, url)).toBe(true);
  });
  
  it('should not match URL without contains rule', () => {
    const rule = { contains: '/products' };
    const url = 'https://example.com/about';
    expect(evaluateUrlRule(rule, url)).toBe(false);
  });
});
```

## Git Workflow

**Author:**
- Name: `prosdevlab`
- Email: `prosdevlab@gmail.com`

**Commit Format:**
```bash
git commit -m "feat: add URL rule evaluation

- Implement evaluateUrlRule function
- Support contains, equals, matches patterns
- Add unit tests with 100% coverage

Closes #5"
```

## Questions to Ask

When implementing, consider:

1. **Does sdk-kit already provide this?** → Check `/Users/prosseng/workspace/sdk-kit`
2. **Is this logic testable?** → Extract into pure function if not
3. **Does this match the plan?** → Review `plan.md` code examples
4. **Is this explainable?** → Add human-readable reasons
5. **Are types defined?** → Add to `types.ts` first
6. **Will this work with both singleton and instance API?** → Test both patterns

## References

- **SDK Kit:** https://github.com/Lytics/sdk-kit
- **Spec Kit:** https://github.com/github/spec-kit
- **Our Specs:** `specs/phase-0-foundation/`
- **Implementation Plan:** `specs/phase-0-foundation/plan.md`

## Tips for Success

1. **Read the spec before coding** - It has all the answers
2. **Extract logic into pure functions** - Makes everything testable
3. **Use sdk-kit capabilities** - Don't reinvent the wheel
4. **Write tests alongside code** - Not after
5. **Update specs when deviating** - Keep documentation current
6. **Ask questions early** - Don't guess, clarify

---

**Remember:** This project values **deliberate design** over speed. Take time to understand the spec, leverage existing tools, and write testable code. The spec-driven workflow ensures we build the right thing, the right way.

