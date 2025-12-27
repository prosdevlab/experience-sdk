# Phase 1: Display Condition Plugins - Implementation Plan

This document provides step-by-step implementation guidance for all four display condition plugins.

## Architecture Overview

### Event-Driven Pattern
All display condition plugins follow the same pattern:

1. **Detection**: Plugin detects condition (exit intent, scroll threshold, etc.)
2. **Emission**: Plugin emits `trigger:<name>` event with metadata
3. **Context Update**: Core runtime listens, updates `context.triggers`
4. **Re-evaluation**: Core re-evaluates all experiences with updated context
5. **Targeting**: Experiences check `context.triggers` in `targeting.custom`

### Core Infrastructure (✅ Implemented)

#### 1. Context Type with Triggers
```typescript
// packages/core/src/types.ts
export interface Context {
  url?: string;
  user?: UserContext;
  timestamp?: number;
  custom?: Record<string, any>;
  triggers?: TriggerState; // NEW
}

export interface TriggerState {
  exitIntent?: {
    triggered: boolean;
    timestamp?: number;
    lastY?: number;
    previousY?: number;
    velocity?: number;
    timeOnPage?: number;
  };
  scrollDepth?: {
    triggered: boolean;
    timestamp?: number;
    percent?: number;
  };
  pageVisits?: {
    triggered: boolean;
    timestamp?: number;
    count?: number;
    firstVisit?: boolean;
  };
  timeDelay?: {
    triggered: boolean;
    timestamp?: number;
    elapsed?: number;
  };
  [key: string]: any; // Extensible
}
```

#### 2. Trigger Event Listener
```typescript
// packages/core/src/runtime.ts
private setupTriggerListeners(): void {
  this.sdk.on('trigger:*', (eventName: string, data: any) => {
    const triggerName = eventName.replace('trigger:', '');
    
    // Update trigger context
    this.triggerContext.triggers = this.triggerContext.triggers || {};
    this.triggerContext.triggers[triggerName] = {
      triggered: true,
      timestamp: Date.now(),
      ...data,
    };

    // Re-evaluate with updated context
    this.evaluate(this.triggerContext);
  });
}
```

---

## Plugin 1: Exit Intent (✅ Implemented)

### Implementation Summary
- **File**: `packages/plugins/src/exit-intent/index.ts`
- **Tests**: `packages/plugins/src/exit-intent/exit-intent.test.ts` (21 tests)
- **Status**: ✅ Complete

### Configuration
```typescript
export interface ExitIntentPluginConfig {
  exitIntent?: {
    sensitivity?: number;        // Pixels from top (default: 50)
    minTimeOnPage?: number;      // Milliseconds (default: 2000)
    delay?: number;              // Delay before emit (default: 0)
    positionHistorySize?: number; // Track last N positions (default: 30)
    disableOnMobile?: boolean;   // Disable on mobile (default: true)
  };
}
```

### Algorithm (Pathfora-Compatible)
```typescript
// Track mouse positions
document.addEventListener('mousemove', (e) => {
  positions.push({ x: e.clientX, y: e.clientY });
  if (positions.length > maxSize) positions.shift();
});

// Check exit intent on mouseout
document.addEventListener('mouseout', (e) => {
  // Must leave document (not just an element)
  const from = e.relatedTarget || e.toElement;
  if (from && from.nodeName !== 'HTML') return;
  
  // Must have movement history
  if (positions.length < 2) return;
  
  // Get velocity
  const lastY = positions[positions.length - 1].y;
  const prevY = positions[positions.length - 2].y;
  const velocity = Math.abs(lastY - prevY);
  
  // Check: moving up + near top
  const isMovingUp = lastY < prevY;
  const isNearTop = lastY - velocity <= sensitivity;
  
  if (isMovingUp && isNearTop) {
    instance.emit('trigger:exitIntent', {
      lastY, previousY: prevY, velocity, timeOnPage
    });
  }
});
```

### Usage
```typescript
// In init config
init({
  exitIntent: {
    sensitivity: 20,
    minTimeOnPage: 2000
  }
});

// In experience targeting
register('exit-offer', {
  type: 'banner',
  content: { message: 'Wait! Get 15% off' },
  targeting: {
    custom: (ctx) => ctx.triggers?.exitIntent?.triggered === true
  },
  frequency: { max: 1, per: 'session' }
});
```

---

## Plugin 2: Scroll Depth (TODO)

### Research Phase
Review Pathfora's `scrollPercentageToDisplay`:
- How is scroll percentage calculated?
- Does it use `scrollTop` vs `scrollHeight`?
- How is it throttled?
- Does it support multiple thresholds?
- Edge cases: dynamic content, infinite scroll

### Configuration
```typescript
export interface ScrollDepthPluginConfig {
  scrollDepth?: {
    thresholds?: number[];      // Percentages to track [25, 50, 75, 100]
    throttle?: number;          // Throttle interval (default: 100ms)
    includeViewportHeight?: boolean; // Count viewport in calc (default: true)
  };
}
```

### Implementation
```typescript
export const scrollDepthPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.scrollDepth');
  
  plugin.defaults({
    scrollDepth: {
      thresholds: [25, 50, 75, 100],
      throttle: 100,
      includeViewportHeight: true,
    },
  });

  const scrollConfig = config.get('scrollDepth');
  if (!scrollConfig) return;

  let maxScrollPercent = 0;
  let triggeredThresholds = new Set<number>();

  function calculateScrollPercent(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    
    if (scrollConfig.includeViewportHeight) {
      return ((scrollTop + winHeight) / docHeight) * 100;
    }
    return (scrollTop / (docHeight - winHeight)) * 100;
  }

  const throttledHandler = throttle(() => {
    const currentPercent = calculateScrollPercent();
    maxScrollPercent = Math.max(maxScrollPercent, currentPercent);

    // Check thresholds
    for (const threshold of scrollConfig.thresholds) {
      if (currentPercent >= threshold && !triggeredThresholds.has(threshold)) {
        triggeredThresholds.add(threshold);
        instance.emit('trigger:scrollDepth', {
          percent: currentPercent,
          threshold,
          maxPercent: maxScrollPercent,
        });
      }
    }
  }, scrollConfig.throttle);

  window.addEventListener('scroll', throttledHandler, { passive: true });

  // Cleanup
  const destroyHandler = () => {
    window.removeEventListener('scroll', throttledHandler);
  };
  instance.on('destroy', destroyHandler);

  // Expose API
  plugin.expose({
    scrollDepth: {
      getMaxPercent: () => maxScrollPercent,
      getCurrentPercent: () => calculateScrollPercent(),
      reset: () => {
        maxScrollPercent = 0;
        triggeredThresholds.clear();
      },
    },
  });
};
```

### Usage
```typescript
// Show CTA after 50% scroll
register('mid-article-cta', {
  type: 'banner',
  content: { message: 'Enjoying the article? Subscribe!' },
  targeting: {
    custom: (ctx) => (ctx.triggers?.scrollDepth?.percent || 0) >= 50
  }
});
```

### Test Cases
- [ ] Calculate scroll percentage correctly
- [ ] Trigger at configured thresholds
- [ ] Throttle scroll events
- [ ] Handle dynamic content (height changes)
- [ ] Handle resize events
- [ ] Multiple thresholds don't re-trigger
- [ ] Reset clears all state

---

## Plugin 3: Page Visits (TODO)

### Research Phase
Review Pathfora's `pageVisits`:
- Session visits vs total visits?
- How is it stored (sessionStorage vs localStorage)?
- Does it reset on logout?
- How does it detect "first visit"?
- Privacy considerations

### Configuration
```typescript
export interface PageVisitsPluginConfig {
  pageVisits?: {
    storage?: 'session' | 'local'; // Storage type (default: 'local')
    namespace?: string;             // Storage key prefix
    trackFirstVisit?: boolean;      // Track first-time visitors (default: true)
  };
}
```

### Implementation
```typescript
export const pageVisitsPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.pageVisits');
  
  plugin.defaults({
    pageVisits: {
      storage: 'local',
      namespace: 'xp:visits',
      trackFirstVisit: true,
    },
  });

  const visitConfig = config.get('pageVisits');
  if (!visitConfig) return;

  // Determine storage
  const storage = visitConfig.storage === 'session' ? sessionStorage : localStorage;
  const key = `${visitConfig.namespace}:${window.location.pathname}`;
  const sessionKey = `${key}:session`;

  // Get counts
  function getSessionCount(): number {
    try {
      return parseInt(sessionStorage.getItem(sessionKey) || '0', 10);
    } catch {
      return 0;
    }
  }

  function getTotalCount(): number {
    try {
      return parseInt(storage.getItem(key) || '0', 10);
    } catch {
      return 0;
    }
  }

  // Increment on page load
  const sessionCount = getSessionCount() + 1;
  const totalCount = getTotalCount() + 1;
  const isFirstVisit = totalCount === 1;

  try {
    sessionStorage.setItem(sessionKey, sessionCount.toString());
    storage.setItem(key, totalCount.toString());
  } catch {
    // Ignore storage errors
  }

  // Emit immediately
  instance.emit('trigger:pageVisits', {
    count: totalCount,
    sessionCount,
    firstVisit: isFirstVisit,
  });

  // Expose API
  plugin.expose({
    pageVisits: {
      getSessionCount: () => getSessionCount(),
      getTotalCount: () => getTotalCount(),
      isFirstVisit: () => isFirstVisit,
      reset: () => {
        try {
          sessionStorage.removeItem(sessionKey);
          storage.removeItem(key);
        } catch {
          // Ignore
        }
      },
    },
  });
};
```

### Usage
```typescript
// First-time visitor welcome
register('welcome', {
  type: 'banner',
  content: { message: 'Welcome! Get 10% off your first order' },
  targeting: {
    custom: (ctx) => ctx.triggers?.pageVisits?.firstVisit === true
  }
});

// Show after 3 visits
register('loyalty-offer', {
  type: 'modal',
  content: { message: 'Thanks for coming back! Here\'s a gift' },
  targeting: {
    custom: (ctx) => (ctx.triggers?.pageVisits?.count || 0) >= 3
  }
});
```

### Test Cases
- [ ] Increment session count on each load
- [ ] Increment total count across sessions
- [ ] Detect first visit correctly
- [ ] Handle storage errors gracefully
- [ ] Reset clears all counts
- [ ] Works with localStorage and sessionStorage
- [ ] Namespace prevents collisions

---

## Plugin 4: Time Delay (TODO)

### Research Phase
Review Pathfora's `showDelay` and `hideAfter`:
- How are timers managed?
- What happens on page visibility change?
- How is cleanup handled?
- Can multiple delays coexist?
- Edge cases: rapid navigation, dismissals

### Configuration
```typescript
export interface TimeDelayPluginConfig {
  timeDelay?: {
    showDelay?: number;         // Delay before showing (ms)
    hideAfter?: number;         // Auto-hide duration (ms)
    pauseWhenHidden?: boolean;  // Pause on visibility change (default: true)
  };
}
```

### Implementation
```typescript
export const timeDelayPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.timeDelay');
  
  plugin.defaults({
    timeDelay: {
      showDelay: 0,
      hideAfter: 0,
      pauseWhenHidden: true,
    },
  });

  const delayConfig = config.get('timeDelay');
  if (!delayConfig) return;

  let startTime = Date.now();
  let elapsed = 0;
  let paused = false;
  let showTimer: number | null = null;
  let hideTimer: number | null = null;

  // Show delay
  if (delayConfig.showDelay > 0) {
    showTimer = window.setTimeout(() => {
      elapsed = Date.now() - startTime;
      instance.emit('trigger:timeDelay', {
        elapsed,
        type: 'show',
      });
    }, delayConfig.showDelay);
  }

  // Handle visibility changes
  if (delayConfig.pauseWhenHidden) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pause timers
        paused = true;
        elapsed = Date.now() - startTime;
        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }
      } else {
        // Resume timers
        paused = false;
        startTime = Date.now() - elapsed;
        
        if (delayConfig.showDelay > 0 && elapsed < delayConfig.showDelay) {
          showTimer = window.setTimeout(() => {
            instance.emit('trigger:timeDelay', {
              elapsed: delayConfig.showDelay,
              type: 'show',
            });
          }, delayConfig.showDelay - elapsed);
        }
      }
    });
  }

  // Cleanup
  const destroyHandler = () => {
    if (showTimer) clearTimeout(showTimer);
    if (hideTimer) clearTimeout(hideTimer);
  };
  instance.on('destroy', destroyHandler);

  // Expose API
  plugin.expose({
    timeDelay: {
      getElapsed: () => paused ? elapsed : Date.now() - startTime,
      isPaused: () => paused,
      reset: () => {
        startTime = Date.now();
        elapsed = 0;
        paused = false;
        if (showTimer) clearTimeout(showTimer);
        if (hideTimer) clearTimeout(hideTimer);
      },
    },
  });
};
```

### Usage
```typescript
// Show after 3 seconds
register('delayed-popup', {
  type: 'modal',
  content: { message: 'Special offer just for you!' },
  targeting: {
    custom: (ctx) => (ctx.triggers?.timeDelay?.elapsed || 0) >= 3000
  }
});
```

### Test Cases
- [ ] Trigger after configured delay
- [ ] Pause on visibility change
- [ ] Resume on visibility restore
- [ ] Handle rapid visibility changes
- [ ] Cleanup timers on destroy
- [ ] Reset clears all state
- [ ] Multiple timers can coexist

---

## Integration Testing

### Composition Tests
Test all plugins working together:

```typescript
// Exit intent + scroll depth + time delay
register('engaged-user-offer', {
  type: 'banner',
  content: { message: 'You seem interested! Here\'s a deal' },
  targeting: {
    custom: (ctx) => {
      const scrolled = (ctx.triggers?.scrollDepth?.percent || 0) >= 50;
      const timeElapsed = (ctx.triggers?.timeDelay?.elapsed || 0) >= 5000;
      const exitIntent = ctx.triggers?.exitIntent?.triggered;
      
      // Show if: scrolled 50% AND (time > 5s OR exit intent)
      return scrolled && (timeElapsed || exitIntent);
    }
  }
});
```

### Test Cases
- [ ] Multiple triggers fire independently
- [ ] Complex logic in targeting.custom works
- [ ] Context is updated correctly for each trigger
- [ ] No memory leaks with multiple plugins
- [ ] Performance: <10ms total overhead

---

## Documentation & Playground

### Documentation
Create migration guide in `docs/`:
- API reference for each plugin
- Configuration options
- Event payloads
- Pathfora comparison table
- Common patterns

### Playground Examples
Add to `experience-sdk-playground/`:
- Exit intent demo
- Scroll depth demo
- Page visits demo
- Time delay demo
- Combined triggers demo

---

## Implementation Order

1. ✅ **Exit Intent** (Complete)
2. **Scroll Depth** (Next)
   - Simplest remaining plugin
   - No storage dependencies
   - Good test of throttling
3. **Page Visits**
   - Requires storage
   - Good test of persistence
4. **Time Delay**
   - Most complex (timers, visibility API)
   - Build on lessons from others
5. **Integration**
   - Test composition
   - Performance benchmarks
   - Documentation
   - Playground

---

## Success Criteria

- [ ] All 4 plugins implemented
- [ ] All plugins match Pathfora behavior
- [ ] >80% test coverage per plugin
- [ ] Integration tests pass
- [ ] Bundle size <8KB total (gzipped)
- [ ] Performance <10ms overhead
- [ ] Docs complete with examples
- [ ] Playground has working demos

