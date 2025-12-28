# Phase 2: Presentation Layer

## Overview

Add modal and inline layout plugins to provide proper presentation options for display condition triggers, completing the experience delivery system.

## Status

**Phase:** Phase 2 - Presentation Layer  
**Start Date:** TBD  
**Target Completion:** 4 days  
**Dependencies:** Phase 1 (Display Conditions)

## Goals

1. **Modal Plugin** - Primary presentation layer for high-attention experiences
2. **Inline Plugin** - Secondary presentation layer for embedded experiences
3. **Integration Validation** - Ensure display conditions + layouts work seamlessly
4. **Playground Examples** - Interactive demos showcasing real-world use cases

## Problem Statement

Phase 1 delivered powerful display condition plugins (exit intent, scroll depth, page visits, time delay), but we only have banner as a presentation option. This limits the SDK's utility:

- **Exit intent** is best shown with modals, not banners
- **Inline content** needs embedded presentation, not overlays
- **Playground examples** can't demonstrate best practices without proper layouts

## Scope

### In Scope
✅ Modal plugin with accessibility (focus trap, ARIA, keyboard handling)  
✅ Inline plugin for embedded content  
✅ Integration tests (display conditions + layouts)  
✅ Playground examples (4 display conditions + composition)  
✅ Documentation for both plugins  

### Out of Scope
❌ Additional layouts (slideout, toast, button) - Future phases  
❌ Animations and transitions - Phase 3  
❌ Multiple modal sizes - Phase 3  
❌ Form elements - Out of scope  
❌ jstag/CDP integration - Phase 3  

## Success Criteria

1. **Modal Plugin**
   - ✅ Renders overlay with backdrop
   - ✅ Implements focus trap (tab cycles within modal)
   - ✅ Keyboard accessible (Escape closes, Enter activates)
   - ✅ ARIA compliant (role, aria-modal, labels)
   - ✅ Mobile responsive
   - ✅ Emits standard events (shown, action, dismissed)
   - ✅ 20+ tests covering all features

2. **Inline Plugin**
   - ✅ Renders content in specified DOM element
   - ✅ Supports selector-based positioning
   - ✅ Dismissable with persistence
   - ✅ Mobile responsive
   - ✅ Emits standard events
   - ✅ 15+ tests covering all features

3. **Integration**
   - ✅ Display conditions trigger modal/inline experiences
   - ✅ Multiple layouts work together (banner + modal)
   - ✅ 10+ integration tests
   - ✅ No memory leaks or performance issues

4. **Playground**
   - ✅ Exit intent example (modal)
   - ✅ Scroll depth example (banner or inline)
   - ✅ Page visits example (modal for returning visitors)
   - ✅ Time delay example (banner)
   - ✅ Composition example (combined triggers)
   - ✅ Each example shows explainability (decision, trace, context)

5. **Documentation**
   - ✅ API reference for modal plugin
   - ✅ API reference for inline plugin
   - ✅ Configuration examples
   - ✅ Accessibility guidelines
   - ✅ Best practices

## User Stories

### As a Marketer
- I want to show exit intent modals so I can recover abandoning visitors
- I want to display scroll-triggered CTAs inline so they feel native
- I want returning visitor messages in modals so they're prominent

### As a Developer
- I want accessible modals so my site meets WCAG standards
- I want to embed experiences inline so they blend with content
- I want working examples so I can implement quickly

### As a Product Manager
- I want playground demos so I can evaluate the SDK
- I want to see display conditions + layouts working together
- I want proof that targeting works with different presentations

## Technical Architecture

### Modal Plugin

**File Structure:**
```
packages/plugins/src/modal/
├── index.ts          # Barrel export
├── modal.ts          # Plugin implementation
├── modal.test.ts     # Tests
└── types.ts          # TypeScript types
```

**Key Components:**
- Overlay/backdrop renderer
- Dialog content renderer
- Focus trap implementation
- Keyboard event handlers
- ARIA attribute management

### Inline Plugin

**File Structure:**
```
packages/plugins/src/inline/
├── index.ts          # Barrel export
├── inline.ts         # Plugin implementation
├── inline.test.ts    # Tests
└── types.ts          # TypeScript types
```

**Key Components:**
- DOM selector resolution
- Content insertion
- Dismissal with persistence
- Event emission

### Playground Examples

**File Structure:**
```
experience-sdk-playground/app/
├── display-conditions/
│   ├── page.tsx              # Overview
│   ├── exit-intent/
│   │   └── page.tsx          # Modal example
│   ├── scroll-depth/
│   │   └── page.tsx          # Inline example
│   ├── page-visits/
│   │   └── page.tsx          # Modal example
│   ├── time-delay/
│   │   └── page.tsx          # Banner example
│   └── composition/
│       └── page.tsx          # Combined example
```

## Dependencies

**Phase 1 Completion:**
- ✅ Exit intent plugin
- ✅ Scroll depth plugin
- ✅ Page visits plugin
- ✅ Time delay plugin
- ✅ Event-driven trigger architecture

**External Dependencies:**
- @lytics/sdk-kit (existing)
- React (playground only)
- Next.js (playground only)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Focus trap complexity | High | Use proven patterns from ARIA guidelines |
| Browser compatibility | Medium | Test in Chrome, Firefox, Safari |
| Mobile modal UX | Medium | Responsive design, viewport considerations |
| Playground deployment | Low | Already deployed to Vercel |

## Timeline

**Total: 4 days**

- **Day 1-2:** Modal plugin (implementation + tests)
- **Day 3:** Inline plugin (implementation + tests)
- **Day 4:** Playground examples + documentation

## Metrics

**Code:**
- +1,500 lines (plugins)
- +500 lines (tests)
- +300 lines (playground)
- 45+ new tests

**Documentation:**
- 2 new plugin pages
- 5 playground examples
- Best practices guide

## Next Steps

1. Create GitHub issues from tasks.md
2. Create `feat/presentation-layer` branch
3. Implement modal plugin
4. Implement inline plugin
5. Build playground examples
6. Write documentation
7. Create PR

## References

- [Modal Research Notes](../../notes/modal-research.md)
- [WAI-ARIA Modal Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Phase 1 Spec](../phase-1-display-conditions/spec.md)

