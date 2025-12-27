# Phase 1: Display Condition Plugins - Tasks

This file breaks down Phase 2 into GitHub-ready issues.

## Labels
- `phase-1` - Phase 1: Display Conditions
- `plugin` - Plugin implementation
- `testing` - Test-related work
- `documentation` - Documentation updates
- `enhancement` - New feature

## Milestone
**Phase 1: Display Condition Plugins**

---

## Task 1: Core Infrastructure for Triggers
**Status:** ✅ Complete  
**PR:** #TBD (Already merged to `feat/display-condition-plugins`)

### Description
Add core infrastructure to support trigger-based display conditions:
- `triggers` field in Context type
- `trigger:*` event listener in ExperienceRuntime
- Event-driven pattern for plugin composition

### Acceptance Criteria
- [x] Context type includes `triggers?: TriggerState`
- [x] TriggerState interface supports all 4 plugins
- [x] Runtime listens for `trigger:*` events
- [x] Runtime updates context on trigger events
- [x] Runtime re-evaluates experiences after trigger
- [x] All existing tests still pass

---

## Task 2: Exit Intent Plugin
**Status:** ✅ Complete  
**PR:** #TBD (Already merged to `feat/display-condition-plugins`)  
**Labels:** `phase-1`, `plugin`, `enhancement`

### Description
Implement exit intent detection plugin matching Pathfora's `showOnExitIntent`.

### Acceptance Criteria
- [x] Plugin detects upward mouse movement near top
- [x] Configurable sensitivity, minTimeOnPage, delay
- [x] Emits `trigger:exitIntent` event
- [x] Session-based suppression (one trigger per session)
- [x] Mobile detection and disabling
- [x] API: `isTriggered()`, `reset()`, `getPositions()`
- [x] 21+ tests covering all Pathfora behaviors
- [x] TypeScript types exported
- [x] Integrated into core runtime

---

## Task 3: Research Scroll Depth Plugin
**Status:** TODO  
**Labels:** `phase-1`, `research`

### Description
Research Pathfora's `scrollPercentageToDisplay` implementation and design our API.

### Tasks
- [ ] Review Pathfora source code for scroll tracking
- [ ] Document scroll percentage calculation algorithm
- [ ] Identify edge cases (dynamic content, resize, etc.)
- [ ] Research throttling strategies
- [ ] Document multiple threshold support
- [ ] Create `notes/scroll-depth-research.md`

### Acceptance Criteria
- [ ] Research notes document Pathfora behavior
- [ ] Edge cases identified and documented
- [ ] API design proposed
- [ ] Test cases outlined

---

## Task 4: Implement Scroll Depth Plugin
**Status:** TODO  
**Depends on:** Task 3  
**Labels:** `phase-1`, `plugin`, `enhancement`

### Description
Implement scroll depth tracking plugin.

### Tasks
- [ ] Create `packages/plugins/src/scroll-depth/index.ts`
- [ ] Create `packages/plugins/src/scroll-depth/types.ts`
- [ ] Implement scroll percentage calculation
- [ ] Add throttled scroll listener
- [ ] Support multiple thresholds
- [ ] Handle viewport height inclusion
- [ ] Emit `trigger:scrollDepth` events
- [ ] Add cleanup on destroy
- [ ] Export from `packages/plugins/src/index.ts`
- [ ] Auto-register in core runtime

### Acceptance Criteria
- [ ] Plugin tracks scroll percentage accurately
- [ ] Throttling works (100ms default)
- [ ] Multiple thresholds supported
- [ ] Events emitted with correct data
- [ ] API: `getMaxPercent()`, `getCurrentPercent()`, `reset()`
- [ ] Handles dynamic content height changes
- [ ] No memory leaks

---

## Task 5: Test Scroll Depth Plugin
**Status:** TODO  
**Depends on:** Task 4  
**Labels:** `phase-1`, `plugin`, `testing`

### Description
Write comprehensive tests for scroll depth plugin.

### Tasks
- [ ] Create `packages/plugins/src/scroll-depth/scroll-depth.test.ts`
- [ ] Test scroll percentage calculation
- [ ] Test threshold triggering
- [ ] Test throttling behavior
- [ ] Test dynamic content handling
- [ ] Test resize handling
- [ ] Test reset functionality
- [ ] Test API methods
- [ ] Achieve >80% coverage

### Acceptance Criteria
- [ ] All Pathfora test cases covered
- [ ] >80% test coverage
- [ ] All tests pass
- [ ] No flaky tests

---

## Task 6: Research Page Visits Plugin
**Status:** TODO  
**Labels:** `phase-1`, `research`

### Description
Research Pathfora's `pageVisits` implementation and design our API.

### Tasks
- [ ] Review Pathfora source code for visit tracking
- [ ] Document session vs total visit counting
- [ ] Identify storage strategy (sessionStorage vs localStorage)
- [ ] Research first-time visitor detection
- [ ] Document privacy considerations
- [ ] Create `notes/page-visits-research.md`

### Acceptance Criteria
- [ ] Research notes document Pathfora behavior
- [ ] Storage strategy decided
- [ ] API design proposed
- [ ] Test cases outlined

---

## Task 7: Implement Page Visits Plugin
**Status:** TODO  
**Depends on:** Task 6  
**Labels:** `phase-1`, `plugin`, `enhancement`

### Description
Implement page visit tracking plugin.

### Tasks
- [ ] Create `packages/plugins/src/page-visits/index.ts`
- [ ] Create `packages/plugins/src/page-visits/types.ts`
- [ ] Implement session visit counter
- [ ] Implement total visit counter
- [ ] Add first-visit detection
- [ ] Emit `trigger:pageVisits` on load
- [ ] Handle storage errors gracefully
- [ ] Add cleanup on destroy
- [ ] Export from `packages/plugins/src/index.ts`
- [ ] Auto-register in core runtime

### Acceptance Criteria
- [ ] Plugin counts session visits correctly
- [ ] Plugin counts total visits correctly
- [ ] First visit detection works
- [ ] Storage errors handled gracefully
- [ ] API: `getSessionCount()`, `getTotalCount()`, `isFirstVisit()`, `reset()`
- [ ] Namespace prevents collisions

---

## Task 8: Test Page Visits Plugin
**Status:** TODO  
**Depends on:** Task 7  
**Labels:** `phase-1`, `plugin`, `testing`

### Description
Write comprehensive tests for page visits plugin.

### Tasks
- [ ] Create `packages/plugins/src/page-visits/page-visits.test.ts`
- [ ] Test session counter increment
- [ ] Test total counter increment
- [ ] Test first visit detection
- [ ] Test storage error handling
- [ ] Test reset functionality
- [ ] Test API methods
- [ ] Test namespace isolation
- [ ] Achieve >80% coverage

### Acceptance Criteria
- [ ] All Pathfora test cases covered
- [ ] >80% test coverage
- [ ] All tests pass
- [ ] No flaky tests

---

## Task 9: Research Time Delay Plugin
**Status:** TODO  
**Labels:** `phase-1`, `research`

### Description
Research Pathfora's `showDelay` and `hideAfter` implementation and design our API.

### Tasks
- [ ] Review Pathfora source code for delay handling
- [ ] Document timer management strategy
- [ ] Research Page Visibility API integration
- [ ] Identify edge cases (rapid navigation, dismissals)
- [ ] Document cleanup requirements
- [ ] Create `notes/time-delay-research.md`

### Acceptance Criteria
- [ ] Research notes document Pathfora behavior
- [ ] Timer management strategy decided
- [ ] API design proposed
- [ ] Test cases outlined

---

## Task 10: Implement Time Delay Plugin
**Status:** TODO  
**Depends on:** Task 9  
**Labels:** `phase-1`, `plugin`, `enhancement`

### Description
Implement time-based delay plugin.

### Tasks
- [ ] Create `packages/plugins/src/time-delay/index.ts`
- [ ] Create `packages/plugins/src/time-delay/types.ts`
- [ ] Implement show delay timer
- [ ] Implement hide after timer
- [ ] Add Page Visibility API support
- [ ] Emit `trigger:timeDelay` events
- [ ] Handle timer cleanup
- [ ] Add pause/resume on visibility change
- [ ] Export from `packages/plugins/src/index.ts`
- [ ] Auto-register in core runtime

### Acceptance Criteria
- [ ] Plugin delays showing correctly
- [ ] Plugin auto-hides after duration
- [ ] Visibility changes handled correctly
- [ ] Timers cleaned up on destroy
- [ ] API: `getElapsed()`, `isPaused()`, `reset()`
- [ ] Multiple timers can coexist

---

## Task 11: Test Time Delay Plugin
**Status:** TODO  
**Depends on:** Task 10  
**Labels:** `phase-1`, `plugin`, `testing`

### Description
Write comprehensive tests for time delay plugin.

### Tasks
- [ ] Create `packages/plugins/src/time-delay/time-delay.test.ts`
- [ ] Test show delay triggering
- [ ] Test hide after duration
- [ ] Test visibility pause/resume
- [ ] Test rapid visibility changes
- [ ] Test cleanup on destroy
- [ ] Test reset functionality
- [ ] Test API methods
- [ ] Achieve >80% coverage

### Acceptance Criteria
- [ ] All Pathfora test cases covered
- [ ] >80% test coverage
- [ ] All tests pass
- [ ] No flaky tests

---

## Task 12: Integration Testing
**Status:** TODO  
**Depends on:** Tasks 2, 5, 8, 11  
**Labels:** `phase-1`, `testing`

### Description
Test all plugins working together in combination.

### Tasks
- [ ] Create integration test suite
- [ ] Test multiple triggers firing independently
- [ ] Test complex targeting logic
- [ ] Test context updates across plugins
- [ ] Test memory usage with all plugins
- [ ] Test performance overhead
- [ ] Run in multiple browsers

### Acceptance Criteria
- [ ] All plugins work independently
- [ ] Plugins compose correctly
- [ ] No context conflicts
- [ ] No memory leaks
- [ ] Performance <10ms total overhead
- [ ] Works in Chrome, Firefox, Safari

---

## Task 13: Documentation
**Status:** TODO  
**Depends on:** Task 12  
**Labels:** `phase-1`, `documentation`

### Description
Document all display condition plugins.

### Tasks
- [ ] Update `docs/reference/plugins.mdx`
- [ ] Add exit intent section
- [ ] Add scroll depth section
- [ ] Add page visits section
- [ ] Add time delay section
- [ ] Create Pathfora migration guide
- [ ] Add configuration examples
- [ ] Add targeting examples
- [ ] Add composition examples
- [ ] Update README

### Acceptance Criteria
- [ ] All plugins documented
- [ ] Migration guide complete
- [ ] Examples for each plugin
- [ ] Composition patterns shown
- [ ] API reference complete

---

## Task 14: Playground Examples
**Status:** TODO  
**Depends on:** Task 12  
**Labels:** `phase-1`, `playground`, `documentation`

### Description
Add working examples to the playground.

### Tasks
- [ ] Create exit intent demo page
- [ ] Create scroll depth demo page
- [ ] Create page visits demo page
- [ ] Create time delay demo page
- [ ] Create combined triggers demo page
- [ ] Add explainability views
- [ ] Add reset buttons for testing
- [ ] Update homepage with new examples

### Acceptance Criteria
- [ ] One demo per plugin
- [ ] Combined demo showing composition
- [ ] Explainability visible (decision, trace, context)
- [ ] Easy to test and debug
- [ ] Mobile-friendly

---

## Summary

### Completed (2)
- [x] Task 1: Core Infrastructure
- [x] Task 2: Exit Intent Plugin

### In Progress (0)

### TODO (12)
- [ ] Task 3: Research Scroll Depth
- [ ] Task 4: Implement Scroll Depth
- [ ] Task 5: Test Scroll Depth
- [ ] Task 6: Research Page Visits
- [ ] Task 7: Implement Page Visits
- [ ] Task 8: Test Page Visits
- [ ] Task 9: Research Time Delay
- [ ] Task 10: Implement Time Delay
- [ ] Task 11: Test Time Delay
- [ ] Task 12: Integration Testing
- [ ] Task 13: Documentation
- [ ] Task 14: Playground Examples

### Estimated Timeline
- **Week 1:** ✅ Tasks 1-2 (Complete)
- **Week 2:** Tasks 3-5 (Scroll Depth)
- **Week 3:** Tasks 6-8 (Page Visits)
- **Week 4:** Tasks 9-11 (Time Delay)
- **Week 5:** Tasks 12-14 (Integration, Docs, Playground)

