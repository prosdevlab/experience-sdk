# @prosdevlab/experience-sdk

A lightweight, explainable client-side experience runtime built on [@lytics/sdk-kit](https://github.com/lytics/sdk-kit).

**Size:** 6.9 KB gzipped (includes core + 3 plugins)

## Features

- **Explainability-First** - Every decision includes structured reasons
- **Plugin-Based** - Built on sdk-kit's powerful plugin system
- **Multiple Buttons** - Primary, secondary, and link variants
- **Frequency Capping** - Control impression limits per session/day/week
- **Responsive Layout** - Automatically adapts to mobile/desktop
- **Script Tag Ready** - Works without build tools
- **Type-Safe** - Full TypeScript support

## Installation

### npm

```bash
npm install @prosdevlab/experience-sdk
```

### Script Tag

```html
<script src="https://unpkg.com/@prosdevlab/experience-sdk/dist/experience-sdk.global.js"></script>
```

## Quick Start

### For Bundlers (ESM)

```typescript
import { createInstance } from '@prosdevlab/experience-sdk';

// Create instance
const experiences = createInstance({ debug: true });

// Initialize
await experiences.init();

// Register a banner
experiences.register('welcome', {
  type: 'banner',
  targeting: {
    url: { contains: '/' }
  },
  content: {
    title: 'Welcome!',
    message: 'Thanks for visiting.',
    buttons: [
      { text: 'Get Started', url: '/start', variant: 'primary' }
    ]
  },
  frequency: {
    max: 3,
    per: 'session'
  }
});

// Evaluate and show
const decision = experiences.evaluate();
console.log(decision.reasons);
```

### For Script Tag

```html
<script src="https://unpkg.com/@prosdevlab/experience-sdk/dist/experience-sdk.global.js"></script>
<script>
  // Global 'experiences' available
  experiences.init({ debug: true });
  
  experiences.register('cookie-consent', {
    type: 'banner',
    content: {
      message: 'We use cookies to improve your experience',
      buttons: [
        { text: 'Accept', action: 'accept', variant: 'primary' },
        { text: 'Reject', action: 'reject', variant: 'secondary' }
      ],
      position: 'bottom'
    }
  });
  
  experiences.evaluate();
</script>
```

## Multiple Buttons

Banners support multiple buttons with visual variants:

```typescript
buttons: [
  { text: 'Accept all', variant: 'primary', action: 'accept' },
  { text: 'Reject', variant: 'secondary', action: 'reject' },
  { text: 'Preferences', variant: 'link', url: '/preferences' }
]
```

- **primary** - Blue button for main actions
- **secondary** - Gray outlined button for secondary actions
- **link** - Text link style for tertiary actions

## Events

Listen to experience interactions:

```typescript
// Banner shown
experiences.on('experiences:shown', ({ experienceId }) => {
  console.log('Shown:', experienceId);
});

// Button clicked
experiences.on('experiences:action', ({ experienceId, action, variant, metadata }) => {
  analytics.track('Experience Action', { experienceId, action });
});

// Banner dismissed
experiences.on('experiences:dismissed', ({ experienceId }) => {
  console.log('Dismissed:', experienceId);
});
```

## Included Plugins

This package includes three official plugins:

- **Banner Plugin** - DOM rendering with responsive layout
- **Frequency Plugin** - Impression tracking and capping
- **Debug Plugin** - Logging and window events

## Documentation

- [Full Documentation](https://prosdevlab.github.io/experience-sdk)
- [API Reference](https://prosdevlab.github.io/experience-sdk/reference)
- [Plugins Guide](https://prosdevlab.github.io/experience-sdk/reference/plugins)
- [Examples](https://prosdevlab.github.io/experience-sdk/demo)

## License

MIT

