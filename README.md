# Experience SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**A lightweight, explainable client-side experience runtime built on [@lytics/sdk-kit](https://github.com/lytics/sdk-kit)**

Experience SDK enables marketers and developers to create personalized experiences (modals, banners, inline content) with powerful targeting and explainability. Every decision comes with structured reasons, making debugging and testing effortless.

## Features

- 🔍 **Explainability-First** - Every decision includes structured reasons
- 🧩 **Plugin-Based** - Built on @lytics/sdk-kit's powerful plugin system
- 🎨 **Presentation Plugins** - Modal, banner, and inline content rendering
- 📝 **Built-in Forms** - Email capture, surveys, feedback with validation
- 🎯 **Smart Triggers** - Exit intent, scroll depth, time delay, page visits
- 📦 **Script Tag Ready** - Works without build tools (marketers love it!)
- 💅 **CSS Variables** - Easy theming with CSS custom properties
- 🎯 **Type-Safe** - Full TypeScript support
- 🪶 **Lightweight** - ~26KB gzipped with all plugins (13.4KB core)
- 🔧 **Developer-Friendly** - Built for inspection and debugging

## Quick Start

### Script Tag (For Marketers)

```html
<script src="https://cdn.jsdelivr.net/npm/@prosdevlab/experience-sdk@latest/dist/experience-sdk.global.js"></script>
<script>
  // Initialize
  experiences.init({ debug: true });
  
  // Exit intent modal with email capture
  experiences.register('exit-intent-modal', {
    type: 'modal',
    content: {
      title: '🚀 Wait! Before You Go...',
      message: 'Join 10,000+ subscribers for exclusive content',
      form: {
        fields: [
          { name: 'email', type: 'email', label: 'Email', required: true }
        ],
        submitButton: { text: 'Subscribe', variant: 'primary' }
      }
    },
    targeting: {
      url: { contains: '/pricing' }
    },
    display: {
      trigger: 'exitIntent',
      frequency: { max: 1, per: 'session' }
    }
  });
  
  // Listen for form submissions
  experiences.on('experiences:modal:form:submit', (event) => {
    console.log('Email submitted:', event.formData.email);
    // Send to your API, analytics, etc.
  });
</script>
```

### npm (For Developers)

```bash
npm install @prosdevlab/experience-sdk @prosdevlab/experience-sdk-plugins
```

```typescript
import { createInstance } from '@prosdevlab/experience-sdk';
import { modalPlugin, inlinePlugin, bannerPlugin } from '@prosdevlab/experience-sdk-plugins';

const sdk = createInstance({ debug: true });

// Use plugins
sdk.use(modalPlugin);
sdk.use(inlinePlugin);
sdk.use(bannerPlugin);

// Register experiences
sdk.register('feature-tip', {
  type: 'inline',
  content: {
    selector: '#feature-section',
    position: 'after',
    message: '<div>💡 New: Check out our analytics dashboard!</div>'
  },
  display: {
    trigger: 'scrollDepth',
    triggerData: { threshold: 50 }
  }
});

// Listen to events
sdk.on('experiences:shown', (event) => {
  analytics.track('Experience Shown', { id: event.experienceId });
});
```

### Event-Driven Architecture

Listen to events to integrate with analytics, tracking, and custom business logic:

```typescript
// Track impressions
experiences.on('experiences:evaluated', ({ decision, experience }) => {
  if (decision.show && experience) {
    analytics.track('Experience Shown', { id: experience.id });
  }
});

// Track button clicks
experiences.on('experiences:action', ({ experienceId, action, url }) => {
  analytics.track('Experience Action', { experienceId, action });
});

// Track dismissals
experiences.on('experiences:dismissed', ({ experienceId }) => {
  analytics.track('Experience Dismissed', { experienceId });
});
```

**Multiple listeners can react to the same event** (jstag3, GA, Segment, custom code).

See the [Events Reference](https://your-docs-url/api/events) for comprehensive documentation.

## Documentation

- **[Plugin Reference](https://prosdevlab.github.io/experience-sdk/reference/plugins)** - Modal, Banner, Inline plugins
- **[Theming Guide](https://prosdevlab.github.io/experience-sdk/guides/theming)** - CSS variables customization
- **[Playground](https://experience-sdk-playground.vercel.app)** - Live demos and use cases

## Project Status

✅ **v0.2.0** - Presentation Layer Complete

**Core Runtime:**
- ✅ Explainability-first evaluation engine
- ✅ Plugin system (sdk-kit)
- ✅ Event-driven architecture
- ✅ Hybrid API (singleton + instance)

**Display Condition Plugins:**
- ✅ Exit Intent - Detect users about to leave
- ✅ Scroll Depth - Trigger at scroll thresholds
- ✅ Time Delay - Time-based triggers
- ✅ Page Visits - Session/total visit tracking
- ✅ Frequency Capping - Impression limits

**Presentation Plugins:**
- ✅ Modal - Announcements, promotions, forms
- ✅ Banner - Top/bottom dismissible messages
- ✅ Inline - Embed content in page DOM

**Features:**
- ✅ Built-in form support (validation, submission)
- ✅ CSS variable theming
- ✅ TypeScript support
- ✅ 432 tests passing
- ✅ ~26KB gzipped (all plugins)

## Development

### Prerequisites

- Node.js 24+ LTS
- pnpm 10+

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Watch mode
pnpm dev
```

### Project Structure

```
experience-sdk/
├── packages/
│   ├── core/          # Main runtime (@prosdevlab/experience-sdk)
│   └── plugins/       # Official plugins
├── demo/              # Demo site
└── notes/             # Documentation & planning
```

## Architecture

Built on [@lytics/sdk-kit](https://github.com/lytics/sdk-kit), Experience SDK showcases modern patterns for building explainable, plugin-based client-side runtimes.

**Core Concepts:**
- **Explainability** - Every decision returns structured reasons
- **Plugin System** - Extensible via sdk-kit plugins
- **Hybrid API** - Singleton for simplicity, instances for advanced use
- **Event-Driven** - Observable evaluation pipeline

## Roadmap

- ✅ **Phase 0 (v0.1.0)**: Foundation - Core runtime, display condition plugins, banner plugin
- ✅ **Phase 1 (v0.2.0)**: Presentation Layer - Modal & inline plugins with forms
- 🚧 **Phase 2 (v0.3.0)**: Developer Experience - Chrome DevTools extension
- 🚧 **Phase 3 (v0.4.0)**: Advanced Features - Tooltip plugin, multi-instance support
- 🚧 **Phase 4 (v1.0.0)**: Production Ready - Performance optimizations, advanced targeting

See the [full roadmap](notes/vision-and-roadmap.md) for details.

## License

[MIT](LICENSE)

---

**Built by [@prosdevlab](https://github.com/prosdevlab)** | Powered by [@lytics/sdk-kit](https://github.com/lytics/sdk-kit)

