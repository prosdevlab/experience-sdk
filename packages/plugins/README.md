# @prosdevlab/experience-sdk-plugins

Official plugins for [Experience SDK](https://github.com/prosdevlab/experience-sdk).

**Size:** 13.4 KB (ESM)

## Included Plugins

### Banner Plugin

Renders banner experiences in the DOM with automatic positioning, theming, and responsive layout.

**Features:**
- Multiple buttons with variants (primary, secondary, link)
- Responsive layout (desktop inline, mobile stack)
- Automatic theme detection (light/dark mode)
- Top/bottom positioning
- Dismissable with close button

```typescript
import { createInstance, bannerPlugin } from '@prosdevlab/experience-sdk-plugins';

const sdk = createInstance();
sdk.use(bannerPlugin);

sdk.banner.show({
  id: 'welcome',
  type: 'banner',
  content: {
    title: 'Welcome!',
    message: 'Thanks for visiting.',
    buttons: [
      { text: 'Get Started', url: '/start', variant: 'primary' }
    ],
    position: 'top',
    dismissable: true
  }
});
```

### Frequency Plugin

Manages impression tracking and frequency capping with persistent storage.

**Features:**
- Session/day/week impression tracking
- Automatic storage management
- Manual impression recording
- Reset capabilities

```typescript
import { createInstance, frequencyPlugin } from '@prosdevlab/experience-sdk-plugins';

const sdk = createInstance();
sdk.use(frequencyPlugin);

// Check impression count
const count = sdk.frequency.getImpressionCount('welcome', 'session');

// Record impression
sdk.frequency.recordImpression('welcome');

// Reset counts
sdk.frequency.reset('welcome');
```

### Debug Plugin

Provides console logging and window event emission for debugging and Chrome extension integration.

**Features:**
- Console logging with prefix
- Window event emission
- Automatic decision logging
- Configurable logging levels

```typescript
import { createInstance, debugPlugin } from '@prosdevlab/experience-sdk-plugins';

const sdk = createInstance({ debug: true });
sdk.use(debugPlugin);

// Manual logging
sdk.debug.log('Custom message', { foo: 'bar' });

// Listen to debug events
window.addEventListener('experiences:debug', (event) => {
  console.log(event.detail);
});
```

## Installation

```bash
npm install @prosdevlab/experience-sdk-plugins
```

Or use the main package which includes these plugins:

```bash
npm install @prosdevlab/experience-sdk
```

## Usage

These plugins are automatically included when using `@prosdevlab/experience-sdk`. You only need this package if you want to use the plugins separately with a custom sdk-kit setup.

```typescript
import { createInstance } from '@prosdevlab/experience-sdk';

// Plugins are already included and available
const experiences = createInstance({ debug: true });
experiences.register('banner', { ... });
```

## Documentation

- [Full Documentation](https://prosdevlab.github.io/experience-sdk)
- [Plugins Guide](https://prosdevlab.github.io/experience-sdk/reference/plugins)
- [Banner Examples](https://prosdevlab.github.io/experience-sdk/demo/banner)

## License

MIT

