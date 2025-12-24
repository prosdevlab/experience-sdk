# Tasks - Phase 0: Foundation

**Generated:** December 24, 2025  
**Status:** Ready for Implementation

This document breaks down the implementation plan into discrete, actionable tasks suitable for GitHub issues.

---

## Task Breakdown

### 🎯 Phase 1: Foundation

#### Task 1.1: Define Core TypeScript Types
**Priority:** P0 (Blocking)  
**Estimate:** 2-3 hours  
**Assignee:** TBD

**Description:**
Define all TypeScript types and interfaces for the Experience SDK

**Files:**
- `packages/core/src/types.ts`

**Acceptance Criteria:**
- [ ] `Experience` interface defined
- [ ] `TargetingRules` interfaces defined  
- [ ] `Decision` interface defined (with reasons & trace)
- [ ] `Context` interface defined
- [ ] `ExperienceConfig` interface defined
- [ ] All types exported
- [ ] `pnpm typecheck` passes

**Dependencies:** None

**Labels:** `type:foundation`, `priority:critical`

---

### 🏗️ Phase 2: Core Runtime

#### Task 2.1: Implement ExperienceRuntime Class
**Priority:** P0 (Blocking)  
**Estimate:** 4-6 hours  
**Assignee:** TBD

**Description:**
Build the core `ExperienceRuntime` class with sdk-kit integration

**Files:**
- `packages/core/src/runtime.ts`

**Acceptance Criteria:**
- [ ] Class created with SDK instance
- [ ] `init()` method implemented
- [ ] `register()` method implemented  
- [ ] `evaluate()` method implemented
- [ ] `explain()` method implemented
- [ ] URL rule evaluation works (contains, equals, matches)
- [ ] Decision includes reasons array
- [ ] Decision includes trace array
- [ ] Events emitted for lifecycle hooks

**Dependencies:** Task 1.1

**Labels:** `type:core`, `priority:critical`

---

#### Task 2.2: Implement Export Pattern
**Priority:** P0 (Blocking)  
**Estimate:** 1-2 hours  
**Assignee:** TBD

**Description:**
Set up singleton + createInstance export pattern

**Files:**
- `packages/core/src/index.ts`

**Acceptance Criteria:**
- [ ] `createInstance()` function exported
- [ ] Default singleton instance created
- [ ] Named exports from singleton (init, register, evaluate, etc.)
- [ ] Default export available
- [ ] `experiences` object exported for IIFE
- [ ] All types re-exported
- [ ] ESM build works
- [ ] IIFE build works with global `experiences`

**Dependencies:** Task 2.1

**Labels:** `type:core`, `priority:critical`

---

#### Task 2.3: Write Core Runtime Tests
**Priority:** P1  
**Estimate:** 4-5 hours  
**Assignee:** TBD

**Description:**
Write comprehensive unit tests for ExperienceRuntime

**Files:**
- `packages/core/src/runtime.test.ts`
- `packages/core/src/index.test.ts`

**Test Coverage:**
- [ ] Initialization tests
- [ ] Registration tests
- [ ] Evaluation tests (all URL rule types)
- [ ] Explainability tests (reasons & trace)
- [ ] State inspection tests
- [ ] Event emission tests
- [ ] Export pattern tests
- [ ] Coverage > 90%

**Dependencies:** Task 2.1, Task 2.2

**Labels:** `type:testing`, `priority:high`

---

### 🔌 Phase 3: Essential Plugins

#### Task 3.1: Build Frequency Capping Plugin
**Priority:** P0 (Blocking)  
**Estimate:** 2-3 hours  
**Assignee:** TBD

**Description:**
Implement frequency capping plugin that leverages sdk-kit's storage plugin

**Files:**
- `packages/plugins/src/frequency/index.ts`

**Acceptance Criteria:**
- [ ] Plugin follows sdk-kit pattern
- [ ] **Uses `@lytics/sdk-kit-plugins/storage`** for persistence
- [ ] Auto-loads storage plugin if not already loaded
- [ ] Tracks impression counts per experience
- [ ] Enforces frequency caps (max per session/day/week)
- [ ] Listens to `experiences:evaluated` event
- [ ] Updates decision reasons
- [ ] Exposes `getImpressionCount()`, `hasReachedCap()`, `recordImpression()` methods
- [ ] Emits `experiences:impression-recorded` events

**Dependencies:** Task 2.1

**Labels:** `type:plugin`, `priority:critical`

---

#### Task 3.2: Build Debug Plugin
**Priority:** P1  
**Estimate:** 2-3 hours  
**Assignee:** TBD

**Description:**
Implement debug plugin for event emission

**Files:**
- `packages/plugins/src/debug/index.ts`

**Acceptance Criteria:**
- [ ] Plugin follows sdk-kit pattern
- [ ] Emits window events (`experience-sdk:debug`)
- [ ] Optionally logs to console
- [ ] Respects `debug.enabled` config
- [ ] Listens to `experiences:*` wildcard
- [ ] Structured event format
- [ ] Exposes `debug.log()` method

**Dependencies:** Task 2.1

**Labels:** `type:plugin`, `priority:high`

---

#### Task 3.3: Build Banner Plugin
**Priority:** P0 (Blocking)  
**Estimate:** 4-5 hours  
**Assignee:** TBD

**Description:**
Implement banner plugin for experience delivery

**Files:**
- `packages/plugins/src/banner/index.ts`

**Acceptance Criteria:**
- [ ] Plugin follows sdk-kit pattern
- [ ] Creates banner DOM element
- [ ] Supports top/bottom position
- [ ] Supports dismissable option
- [ ] Styles banner with inline CSS
- [ ] Auto-shows on `experiences:evaluated` event
- [ ] Exposes `show()`, `remove()` methods
- [ ] Cleans up on destroy
- [ ] Emits `experiences:shown` event

**Dependencies:** Task 2.1

**Labels:** `type:plugin`, `priority:critical`

---

#### Task 3.4: Write Plugin Tests
**Priority:** P1  
**Estimate:** 4-5 hours  
**Assignee:** TBD

**Description:**
Write unit tests for all three plugins

**Files:**
- `packages/plugins/src/frequency/frequency.test.ts`
- `packages/plugins/src/debug/debug.test.ts`
- `packages/plugins/src/banner/banner.test.ts`

**Test Coverage:**
- [ ] Frequency plugin tests (impressions, caps, storage integration)
- [ ] Debug plugin tests (window events, console)
- [ ] Banner plugin tests (rendering, dismissal, cleanup)
- [ ] Coverage > 80%

**Dependencies:** Task 3.1, Task 3.2, Task 3.3

**Labels:** `type:testing`, `priority:high`

---

### 🔗 Phase 4: Integration

#### Task 4.1: Integrate Plugins into Core
**Priority:** P0 (Blocking)  
**Estimate:** 1 hour  
**Assignee:** TBD

**Description:**
Update ExperienceRuntime to automatically register plugins

**Files:**
- `packages/core/src/runtime.ts`

**Acceptance Criteria:**
- [ ] Import all three plugins
- [ ] Register plugins in constructor
- [ ] Plugins work in sequence
- [ ] Storage plugin affects decisions
- [ ] Debug plugin emits events
- [ ] Banner plugin auto-renders

**Dependencies:** Task 2.1, Task 3.1, Task 3.2, Task 3.3

**Labels:** `type:integration`, `priority:critical`

---

### 🎨 Phase 5: Demo & Documentation

#### Task 5.1: Create Demo Site
**Priority:** P1  
**Estimate:** 3-4 hours  
**Assignee:** TBD

**Description:**
Build interactive demo HTML page

**Files:**
- `demo/index.html`

**Acceptance Criteria:**
- [ ] Clean, modern design
- [ ] Initialize SDK section
- [ ] Register experience section
- [ ] Evaluate section with output
- [ ] Shows decision with reasons
- [ ] Shows trace steps
- [ ] Demonstrates frequency capping
- [ ] Shows debug events in console
- [ ] Banner actually renders
- [ ] Uses IIFE bundle

**Dependencies:** Task 4.1

**Labels:** `type:demo`, `priority:high`

---

#### Task 5.2: Update Documentation
**Priority:** P2  
**Estimate:** 2-3 hours  
**Assignee:** TBD

**Description:**
Update README and add examples

**Files:**
- `README.md`
- `packages/core/README.md`
- `packages/plugins/README.md`

**Acceptance Criteria:**
- [ ] Root README has getting started guide
- [ ] Core package README documents API
- [ ] Plugins package README documents each plugin
- [ ] Examples show script tag usage
- [ ] Examples show npm usage
- [ ] API reference complete

**Dependencies:** Task 4.1

**Labels:** `type:documentation`, `priority:medium`

---

### ✅ Phase 6: Validation & Polish

#### Task 6.1: Bundle Size Optimization
**Priority:** P1  
**Estimate:** 2-3 hours  
**Assignee:** TBD

**Description:**
Ensure bundle size is under 15KB gzipped

**Acceptance Criteria:**
- [ ] IIFE bundle < 15KB gzipped
- [ ] Verify with `gzip -c dist/index.global.js | wc -c`
- [ ] Tree-shaking works for ESM
- [ ] No unnecessary dependencies bundled
- [ ] Source maps generated

**Dependencies:** Task 4.1

**Labels:** `type:optimization`, `priority:high`

---

#### Task 6.2: End-to-End Testing
**Priority:** P1  
**Estimate:** 3-4 hours  
**Assignee:** TBD

**Description:**
Test complete flow from registration to rendering

**Test Scenarios:**
- [ ] Script tag in browser works
- [ ] npm import works
- [ ] Frequency capping works across page reloads
- [ ] Debug events appear in window
- [ ] Banner renders correctly
- [ ] Multiple experiences work
- [ ] Private mode doesn't crash (memory fallback)

**Dependencies:** Task 5.1

**Labels:** `type:testing`, `priority:high`

---

#### Task 6.3: Final Polish
**Priority:** P2  
**Estimate:** 2-3 hours  
**Assignee:** TBD

**Description:**
Final cleanup and polish

**Checklist:**
- [ ] All linter errors resolved
- [ ] All tests passing
- [ ] All type errors resolved
- [ ] Code comments added
- [ ] README updated with actual bundle size
- [ ] CHANGELOG.md created
- [ ] Spec updated with completion status

**Dependencies:** All previous tasks

**Labels:** `type:polish`, `priority:medium`

---

## Summary

**Total Tasks:** 13  
**Estimated Time:** 33-43 hours  
**Critical Path:** Tasks 1.1 → 2.1 → 2.2 → 3.1/3.2/3.3 → 4.1 → 5.1

**Parallel Work Opportunities:**
- Tasks 3.1, 3.2, 3.3 can be done in parallel (after 2.1)
- Tasks 2.3, 3.4 can be done in parallel (after core/plugins complete)
- Tasks 5.1, 5.2 can be done in parallel (after 4.1)

---

## Task Labels

- `priority:critical` - Blocking, must be done first
- `priority:high` - Important, should be done soon
- `priority:medium` - Nice to have, can wait
- `type:foundation` - Types and interfaces
- `type:core` - Core runtime
- `type:plugin` - Plugin development
- `type:integration` - Integration work
- `type:testing` - Test implementation
- `type:demo` - Demo and examples
- `type:documentation` - Docs
- `type:optimization` - Performance
- `type:polish` - Final cleanup

---

## Ready to Create Issues?

Each task above can be converted directly into a GitHub issue with:
- Title from task name
- Description from task details
- Acceptance criteria as checklist
- Labels applied
- Dependencies noted

Example issue title:
```
[Phase 0] Task 2.1: Implement ExperienceRuntime Class
```

