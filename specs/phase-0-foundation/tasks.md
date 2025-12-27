# Tasks - Phase 0: Foundation

**Generated:** December 24, 2025  
**Status:** ✅ **COMPLETE** (December 27, 2025)

This document tracks the Phase 0 foundation implementation tasks.

---

## Completion Summary

**Bundle Size:** 8.4 KB gzipped (target: <15 KB) ✅  
**Test Coverage:** 222 tests passing ✅  
**Playground:** Deployed at https://xp-examples.vercel.app/ ✅  
**Documentation:** Complete ✅

All 13 tasks completed successfully.

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
- [x] `Experience` interface defined
- [x] `TargetingRules` interfaces defined  
- [x] `Decision` interface defined (with reasons & trace)
- [x] `Context` interface defined
- [x] `ExperienceConfig` interface defined
- [x] All types exported
- [x] `pnpm typecheck` passes

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
- [x] Class created with SDK instance
- [x] `init()` method implemented
- [x] `register()` method implemented  
- [x] `evaluate()` method implemented
- [x] `explain()` method implemented
- [x] URL rule evaluation works (contains, equals, matches)
- [x] Decision includes reasons array
- [x] Decision includes trace array
- [x] Events emitted for lifecycle hooks

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
- [x] `createInstance()` function exported
- [x] Default singleton instance created
- [x] Named exports from singleton (init, register, evaluate, etc.)
- [x] Default export available
- [x] `experiences` object exported for IIFE
- [x] All types re-exported
- [x] ESM build works
- [x] IIFE build works with global `experiences`

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
- [x] Initialization tests
- [x] Registration tests
- [x] Evaluation tests (all URL rule types)
- [x] Explainability tests (reasons & trace)
- [x] State inspection tests
- [x] Event emission tests
- [x] Export pattern tests
- [x] Coverage > 90%

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
- [x] Plugin follows sdk-kit pattern
- [x] **Uses `@lytics/sdk-kit-plugins/storage`** for persistence
- [x] Auto-loads storage plugin if not already loaded
- [x] Tracks impression counts per experience
- [x] Enforces frequency caps (max per session/day/week)
- [x] Listens to `experiences:evaluated` event
- [x] Updates decision reasons
- [x] Exposes `getImpressionCount()`, `hasReachedCap()`, `recordImpression()` methods
- [x] Emits `experiences:impression-recorded` events

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
- [x] Plugin follows sdk-kit pattern
- [x] Emits window events (`experience-sdk:debug`)
- [x] Optionally logs to console
- [x] Respects `debug.enabled` config
- [x] Listens to `experiences:*` wildcard
- [x] Structured event format
- [x] Exposes `debug.log()` method

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
- [x] Plugin follows sdk-kit pattern
- [x] Creates banner DOM element
- [x] Supports top/bottom position
- [x] Supports dismissable option
- [x] Styles banner with inline CSS
- [x] Auto-shows on `experiences:evaluated` event
- [x] Exposes `show()`, `remove()` methods
- [x] Cleans up on destroy
- [x] Emits `experiences:shown` event

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
- [x] Frequency plugin tests (impressions, caps, storage integration)
- [x] Debug plugin tests (window events, console)
- [x] Banner plugin tests (rendering, dismissal, cleanup)
- [x] Coverage > 80%

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
- [x] Import all three plugins
- [x] Register plugins in constructor
- [x] Plugins work in sequence
- [x] Storage plugin affects decisions
- [x] Debug plugin emits events
- [x] Banner plugin auto-renders

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
- [x] Clean, modern design
- [x] Initialize SDK section
- [x] Register experience section
- [x] Evaluate section with output
- [x] Shows decision with reasons
- [x] Shows trace steps
- [x] Demonstrates frequency capping
- [x] Shows debug events in console
- [x] Banner actually renders
- [x] Uses IIFE bundle

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
- [x] Root README has getting started guide
- [x] Core package README documents API
- [x] Plugins package README documents each plugin
- [x] Examples show script tag usage
- [x] Examples show npm usage
- [x] API reference complete

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
- [x] IIFE bundle < 15KB gzipped
- [x] Verify with `gzip -c dist/index.global.js | wc -c`
- [x] Tree-shaking works for ESM
- [x] No unnecessary dependencies bundled
- [x] Source maps generated

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
- [x] Script tag in browser works
- [x] npm import works
- [x] Frequency capping works across page reloads
- [x] Debug events appear in window
- [x] Banner renders correctly
- [x] Multiple experiences work
- [x] Private mode doesn't crash (memory fallback)

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
- [x] All linter errors resolved
- [x] All tests passing
- [x] All type errors resolved
- [x] Code comments added
- [x] README updated with actual bundle size
- [x] CHANGELOG.md created
- [x] Spec updated with completion status

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

