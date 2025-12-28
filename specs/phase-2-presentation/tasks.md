# Phase 2: Presentation Layer - Tasks

This file breaks down Phase 2 into GitHub-ready issues.

## Labels
- `phase-2` - Phase 2: Presentation Layer
- `plugin` - Plugin implementation
- `testing` - Test-related work
- `documentation` - Documentation updates
- `demo` - Playground/demo work
- `enhancement` - New feature

## Milestone
**Phase 2: Presentation Layer**

---

## Issue 1: Modal Plugin
**Labels:** `phase-2`, `plugin`, `enhancement`  
**Estimate:** 2 days

### Description
Implement modal plugin with full accessibility support (focus trap, ARIA, keyboard handling) for high-attention experiences like exit intent.

### Tasks
- [ ] Create `packages/plugins/src/modal/` directory structure
- [ ] Define TypeScript types (`types.ts`)
- [ ] Implement core modal plugin (`modal.ts`)
  - [ ] Overlay/backdrop rendering
  - [ ] Dialog content rendering
  - [ ] Focus trap implementation
  - [ ] Keyboard event handlers (Escape, Tab)
  - [ ] ARIA attribute management
- [ ] Add default CSS styles
- [ ] Export from `packages/plugins/src/index.ts`
- [ ] Auto-register in `packages/core/src/runtime.ts`

### Acceptance Criteria
- [ ] Modal renders with overlay backdrop
- [ ] Focus trap works (Tab cycles within modal)
- [ ] Escape key closes modal
- [ ] Backdrop click closes modal (configurable)
- [ ] ARIA attributes present (role="dialog", aria-modal="true")
- [ ] First focusable element receives focus on open
- [ ] Focus returns to trigger element on close
- [ ] Mobile responsive
- [ ] Body scroll prevented when modal open
- [ ] Multiple modals supported
- [ ] Emits standard events (shown, action, dismissed)

---

## Issue 2: Inline Plugin
**Labels:** `phase-2`, `plugin`, `enhancement`  
**Estimate:** 1 day

### Description
Implement inline plugin for embedding experiences directly within page content using DOM selectors.

### Tasks
- [ ] Create `packages/plugins/src/inline/` directory structure
- [ ] Define TypeScript types (`types.ts`)
- [ ] Implement core inline plugin (`inline.ts`)
  - [ ] DOM selector resolution
  - [ ] Content insertion
  - [ ] Dismissal with localStorage persistence
  - [ ] Event emission
- [ ] Add default CSS styles
- [ ] Export from `packages/plugins/src/index.ts`
- [ ] Auto-register in `packages/core/src/runtime.ts`

### Acceptance Criteria
- [ ] Inline content renders in specified selector
- [ ] Dismissable with persistence
- [ ] Gracefully handles missing selectors
- [ ] Mobile responsive
- [ ] Emits standard events (shown, action, dismissed)
- [ ] Multiple inline experiences supported
- [ ] Custom styles and className work

---

## Issue 3: Testing - Modal, Inline, and Integration
**Labels:** `phase-2`, `testing`  
**Estimate:** 1 day  
**Depends on:** Issues 1, 2

### Description
Comprehensive testing for modal and inline plugins, plus integration tests with display conditions.

### Tasks

**Modal Plugin Tests:**
- [ ] Create `packages/plugins/src/modal/modal.test.ts`
- [ ] Test modal rendering
- [ ] Test focus trap (Tab, Shift+Tab)
- [ ] Test keyboard handling (Escape)
- [ ] Test backdrop click
- [ ] Test ARIA attributes
- [ ] Test multiple modals
- [ ] Test cleanup on destroy
- [ ] Test event emissions
- [ ] Test mobile behavior
- [ ] Test custom styles and className

**Inline Plugin Tests:**
- [ ] Create `packages/plugins/src/inline/inline.test.ts`
- [ ] Test content insertion
- [ ] Test dismissal with persistence
- [ ] Test selector not found handling
- [ ] Test multiple inline experiences
- [ ] Test cleanup on destroy
- [ ] Test event emissions
- [ ] Test custom styles

**Integration Tests:**
- [ ] Add tests to `packages/plugins/src/integration.test.ts`
- [ ] Test exit intent → modal
- [ ] Test scroll depth → inline
- [ ] Test page visits → modal
- [ ] Test multiple layouts active simultaneously
- [ ] Test modal + banner together
- [ ] Test cleanup and memory

### Acceptance Criteria
- [ ] 20+ modal tests (100% coverage)
- [ ] 15+ inline tests (100% coverage)
- [ ] 10+ integration tests
- [ ] All display conditions work with modal/inline
- [ ] No memory leaks
- [ ] No conflicts between layouts
- [ ] All 350+ tests passing

---

## Issue 4: Documentation
**Labels:** `phase-2`, `documentation`  
**Estimate:** 0.5 days  
**Depends on:** Issues 1, 2

### Description
Add complete documentation for modal and inline plugins.

### Tasks
- [ ] Create `docs/pages/reference/plugins/modal.mdx`
- [ ] Create `docs/pages/reference/plugins/inline.mdx`
- [ ] Update `docs/pages/reference/plugins/_meta.json`
- [ ] Document modal configuration options
- [ ] Document inline configuration options
- [ ] Add code examples for each
- [ ] Document accessibility features (modal)
- [ ] Add best practices guides
- [ ] Update plugins overview page

### Acceptance Criteria
- [ ] Complete API reference for modal
- [ ] Complete API reference for inline
- [ ] Configuration examples with defaults
- [ ] Accessibility guidelines for modal
- [ ] Best practices for each layout
- [ ] Docs build successfully

---

## Issue 5: Playground Examples
**Labels:** `phase-2`, `demo`, `documentation`  
**Estimate:** 1 day  
**Depends on:** Issues 1, 2  
**Closes:** #33

### Description
Create interactive playground examples showcasing display condition plugins with appropriate layouts (modal, inline, banner).

### Tasks
- [ ] Create `/display-conditions` section in playground
- [ ] Build exit intent example (modal)
  - [ ] Modal triggered on exit intent
  - [ ] Show trigger state and metrics
  - [ ] Reset button for testing
  - [ ] Explainability display
- [ ] Build scroll depth example (inline or banner)
  - [ ] Triggered at 75% scroll
  - [ ] Show scroll percentage metrics
  - [ ] Real-time scroll tracking display
- [ ] Build page visits example (modal)
  - [ ] Different modal for returning visitors
  - [ ] Show visit counts (session + total)
  - [ ] First-time vs returning logic
- [ ] Build time delay example (banner)
  - [ ] Banner after 5 seconds
  - [ ] Show elapsed time
  - [ ] Pause when tab hidden demo
- [ ] Build composition example (modal or banner)
  - [ ] Combine scroll + time + visits
  - [ ] Show AND/OR/NOT logic
  - [ ] Complex targeting display
- [ ] Add overview page explaining display conditions
- [ ] Update homepage navigation

### Acceptance Criteria
- [ ] 5 interactive examples (1 per plugin + composition)
- [ ] Each example shows:
  - [ ] Live demo with working triggers
  - [ ] Configuration code
  - [ ] Explainability (decision, trace, context)
  - [ ] Reset/test controls
  - [ ] Best practices tips
- [ ] Mobile responsive
- [ ] Deployed to Vercel
- [ ] Issue #33 closed

---

## Summary

### Total Issues: 5 (consolidated from 7)

**By Type:**
- Plugin Implementation: 2
- Testing: 1 (consolidated)
- Documentation: 1
- Playground: 1

**Estimated Timeline:** 4-5 days
- Day 1-2: Modal (Issue 1)
- Day 3: Inline (Issue 2)
- Day 4: Testing (Issue 3)
- Day 5: Docs + Playground (Issues 4, 5)

### Dependencies
```
Issue 1 (Modal) ─┐
                 ├─→ Issue 3 (Testing)
Issue 2 (Inline) ┘

Issues 1 & 2 ─┬─→ Issue 4 (Documentation)
              └─→ Issue 5 (Playground)
```

### Deliverables
- 2 new plugins (modal, inline)
- 45+ new tests
- Complete documentation
- 5 interactive playground examples
- Issue #33 resolved
