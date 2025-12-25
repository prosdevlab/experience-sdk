# Experience SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**A lightweight, explainable client-side experience runtime built on [@lytics/sdk-kit](https://github.com/lytics/sdk-kit)**

Experience SDK decides if/when/why experiences (banners, modals, tooltips) should render. Every decision comes with structured reasons, making debugging and testing effortless.

## Features

- 🔍 **Explainability-First** - Every decision includes structured reasons
- 🧩 **Plugin-Based** - Built on @lytics/sdk-kit's powerful plugin system
- 📦 **Script Tag Ready** - Works without build tools
- 🎯 **Type-Safe** - Full TypeScript support
- 🪶 **Lightweight** - < 15KB gzipped
- 🔧 **Developer-Friendly** - Built for inspection and debugging

## Quick Start

### Script Tag

```html
<script src="https://sdk.prosdevlab.com/experience-sdk.min.js"></script>
<script>
  // Initialize
  experiences.init({ debug: true });
  
  // Register an experience
  experiences.register('welcome-banner', {
    type: 'banner',
    targeting: {
      url: { contains: '/' },
      frequency: { max: 1, per: 'session' }
    },
    content: {
      title: 'Welcome!',
      message: 'Thanks for visiting.'
    }
  });
  
  // Evaluate (shows if rules match)
  const decision = experiences.evaluate();
  
  // See why
  console.log(decision.reasons);
  // ['✅ URL contains "/"', '✅ Not shown this session (0/1)']
</script>
```

### npm

```bash
npm install @prosdevlab/experience-sdk
```

```typescript
import experiences from '@prosdevlab/experience-sdk';

experiences.init({ debug: true });
experiences.register('welcome', { ... });
const decision = experiences.evaluate();
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

See [notes/IMPLEMENTATION_PLAN.md](notes/IMPLEMENTATION_PLAN.md) for detailed implementation guide.

## Project Status

🚧 **v0.1.0 in development** - Foundation phase

- [ ] Core runtime with explainability
- [ ] Storage plugin (frequency capping)
- [ ] Debug plugin (event emission)
- [ ] Banner plugin (delivery)
- [ ] Demo site
- [ ] UMD bundle

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

- **Phase 0 (v0.1.0)**: Foundation - Runtime + 3 plugins + demo
- **Phase 1 (v0.2.0)**: Chrome Extension - DevTools integration
- **Phase 2 (v0.3.0)**: Advanced plugins - More experience types
- **Phase 3 (v0.4.0)**: Developer tools - Playground & testing
- **Phase 4 (v1.0.0)**: Production-ready

See [notes/vision-and-roadmap.md](notes/vision-and-roadmap.md) for full roadmap.

## License

[MIT](LICENSE)

---

**Built by [@prosdevlab](https://github.com/prosdevlab)** | Powered by [@lytics/sdk-kit](https://github.com/lytics/sdk-kit)

