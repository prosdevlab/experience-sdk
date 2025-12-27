# Phase 2: Display Condition Plugins

**Status:** In Progress  
**Started:** December 2024  
**Goal:** Implement trigger-based display condition plugins matching industry standards (informed by Pathfora, OptinMonster, Wisepops, and others)

## Overview

Add four display condition plugins to enable experiences triggered by user behavior:
- **Exit Intent** - Detect when users are about to leave the page
- **Scroll Depth** - Trigger at specific scroll thresholds
- **Page Visits** - Show experiences based on visit count
- **Time Delay** - Trigger after configurable delays

## Goals

### Primary Goals
1. **Event-Driven Architecture** - Clean separation between detection and evaluation (ahead of most commercial tools)
2. **Industry-Leading Capabilities** - Match or exceed capabilities from Pathfora, OptinMonster, Wisepops, and other leading tools
3. **Composability** - Plugins work independently and can be combined (unique advantage)
4. **Explainability** - All trigger states visible in context for debugging (competitive differentiator)

### Secondary Goals
1. **Performance** - Minimal overhead for unused plugins
2. **Testability** - Comprehensive test coverage for all behaviors
3. **Developer Experience** - Simple, intuitive API

## Scope

### In Scope
- Exit intent detection (mouse leave from top)
- Scroll depth percentage tracking
- Page visit counting (session and total)
- Time-based delays (show after X seconds)
- Event-driven trigger system
- Context-based targeting rules
- Session persistence for triggers

### Out of Scope (Future)
- Device-specific conditions (already handled by exit intent config)
- Geo-targeting (requires backend)
- A/B testing framework
- Complex DSL for display conditions

## User Stories

### Exit Intent
**As a** marketer  
**I want** to show an offer when users are about to leave  
**So that** I can reduce bounce rate and capture leads

**Acceptance Criteria:**
- Detects upward mouse movement toward browser chrome
- Configurable sensitivity threshold
- Respects minimum time on page
- Only triggers once per session
- Can be combined with other targeting rules

### Scroll Depth
**As a** content publisher  
**I want** to show CTAs after users scroll 50% of the page  
**So that** I engage users who are actually reading

**Acceptance Criteria:**
- Tracks scroll percentage accurately
- Supports multiple thresholds
- Throttled for performance
- Works with dynamic content
- Emits events for analytics

### Page Visits
**As a** product manager  
**I want** to show onboarding only to first-time visitors  
**So that** I don't annoy returning users

**Acceptance Criteria:**
- Counts session visits
- Counts total visits across sessions
- Detects first-time vs returning
- Supports min/max ranges
- Respects user privacy (localStorage)

### Time Delay
**As a** UX designer  
**I want** to delay popups by 3 seconds  
**So that** users have time to orient themselves

**Acceptance Criteria:**
- Configurable delay before showing
- Configurable auto-hide duration
- Cleanup on experience dismiss
- Multiple timers can coexist
- Respects page visibility (pause when hidden)

## Architecture

### Event-Driven Pattern
```typescript
// Plugin detects condition
instance.emit('trigger:exitIntent', { timestamp, velocity, ... });

// Core listens and updates context
context.triggers.exitIntent = { triggered: true, timestamp, ... };

// Core re-evaluates all experiences
runtime.evaluate(context);

// Experience checks trigger in targeting
targeting: {
  custom: (ctx) => ctx.triggers.exitIntent?.triggered === true
}
```

### Benefits
1. **Decoupling** - Plugins don't know about experiences
2. **Composability** - Multiple triggers can fire independently
3. **Debuggability** - Full trigger state visible in context
4. **Testability** - Pure functions, easy to mock

## Dependencies

### Required
- Core SDK with trigger support (✅ Implemented)
- Context type with triggers field (✅ Implemented)
- Event listener for `trigger:*` events (✅ Implemented)

### Optional
- Storage plugin (for page visits persistence)
- Debug plugin (for trigger visibility)

## Success Metrics

### Implementation
- [ ] All 4 plugins implemented
- [ ] >80% test coverage per plugin
- [ ] Integration tests with multiple triggers
- [ ] Zero linter errors

### Quality
- [ ] Matches or exceeds industry standards (validated against Pathfora, OptinMonster, Wisepops)
- [ ] Performance: <5ms overhead per plugin (competitive with or better than alternatives)
- [ ] Bundle size: <2KB per plugin (gzipped, lighter than most solutions)
- [ ] Documentation with migration guides from multiple tools

### Developer Experience
- [ ] Clear API documentation
- [ ] Working examples in playground
- [ ] TypeScript types for all configs
- [ ] Helpful error messages

## Migration from Pathfora

### Exit Intent
```javascript
// Pathfora
displayConditions: {
  showOnExitIntent: true
}

// Experience SDK
targeting: {
  custom: (ctx) => ctx.triggers?.exitIntent?.triggered === true
}
```

### Scroll Depth
```javascript
// Pathfora
displayConditions: {
  scrollPercentageToDisplay: 50
}

// Experience SDK
targeting: {
  custom: (ctx) => (ctx.triggers?.scrollDepth?.percent || 0) >= 50
}
```

### Page Visits
```javascript
// Pathfora
displayConditions: {
  pageVisits: 3
}

// Experience SDK
targeting: {
  custom: (ctx) => (ctx.triggers?.pageVisits?.count || 0) >= 3
}
```

### Time Delay
```javascript
// Pathfora
displayConditions: {
  showDelay: 3000,
  hideAfter: 10000
}

// Experience SDK
targeting: {
  custom: (ctx) => ctx.triggers?.timeDelay?.elapsed >= 3000
}
// Auto-hide handled by plugin config
```

## Risks & Mitigations

### Risk: Performance Impact
**Mitigation:** 
- Throttle scroll listeners (100ms)
- Only track when plugin is enabled
- Cleanup listeners on trigger

### Risk: Browser Compatibility
**Mitigation:**
- Polyfill for older browsers if needed
- Graceful degradation
- Comprehensive browser testing

### Risk: Privacy Concerns
**Mitigation:**
- Only use sessionStorage/localStorage
- No external tracking
- Respect Do Not Track
- Clear data on opt-out

## Timeline

- ✅ **Week 1:** Exit Intent plugin (Complete)
- [ ] **Week 2:** Scroll Depth plugin
- [ ] **Week 3:** Page Visits plugin
- [ ] **Week 4:** Time Delay plugin
- [ ] **Week 5:** Integration tests, docs, playground examples

## References

### Competitive Analysis
- [Exit Intent Competitive Analysis](../../notes/exit-intent-competitive-analysis.md) - Analysis of 8+ tools
- [Exit Intent Architecture Analysis](../../notes/exit-intent-architecture.md) - Event-driven design

### Industry Tools Analyzed
- [Pathfora Display Conditions](https://lytics.github.io/pathforadocs/display_conditions/) - Primary reference
- OptinMonster - Exit intent leader, 200+ customers
- Wisepops - Modern popup platform
- Picreel - Exit intent specialist
- Privy - E-commerce focused
- Sumo - Popular exit intent tool

### Our Research
- [Exit Intent Research](../../notes/exit-intent-research.md) - Library implementation details

### Key Competitive Advantages
1. **Event-driven architecture** - Most tools use tight coupling
2. **Composability** - Most tools don't allow combining triggers
3. **Explainability** - Most tools are black boxes
4. **Developer-friendly** - TypeScript, testable, open-source

