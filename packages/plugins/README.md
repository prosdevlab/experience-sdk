# @prosdevlab/experience-sdk-plugins

Official plugins for [Experience SDK](https://github.com/prosdevlab/experience-sdk).

**Size:** 12.7 KB gzipped (all plugins)

## Included Plugins

### Layout Plugins

**Banner Plugin** - Top/bottom notification bars with push-down support

**Features:**
- Multiple buttons with variants (primary, secondary, link)
- Responsive layout (desktop inline, mobile stack)
- Top/bottom positioning with optional push-down
- HTML sanitization for XSS protection
- CSS variables for full theming

**Modal Plugin** - Overlay dialogs with forms and rich content

**Features:**
- Multiple sizes (sm, md, lg, fullscreen, auto)
- Mobile fullscreen for large modals
- Hero images with max height
- Animations (fade, slide-up, none)
- Built-in form support with validation
- Focus trap and keyboard support (Escape)
- CSS variables for full theming

**Inline Plugin** - In-content experiences using CSS selectors

**Features:**
- 5 insertion methods (replace, append, prepend, before, after)
- Dismissal with persistence
- Multi-instance support
- HTML sanitization
- Custom styling (className, style props)
- CSS variables for theming

### Display Condition Plugins

**Exit Intent Plugin** - Detect when users are leaving

**Features:**
- Mouse movement tracking
- Configurable sensitivity
- Min time on page
- Delay before triggering
- Session persistence

**Scroll Depth Plugin** - Track scroll engagement

**Features:**
- Multiple thresholds (25%, 50%, 75%, 100%)
- Max scroll tracking
- Velocity and direction tracking
- Time-to-threshold metrics
- Throttling and resize handling

**Page Visits Plugin** - Session and lifetime counters

**Features:**
- Session-scoped visits (sessionStorage)
- Lifetime visits (localStorage)
- First-visit detection
- DNT (Do Not Track) support
- Expiration and cross-tab safety

**Time Delay Plugin** - Show after time elapsed

**Features:**
- Configurable show delay
- Auto-hide after duration
- Pause when page hidden (Page Visibility API)
- Timer management

### Utility Plugins

**Frequency Plugin** - Impression tracking and capping

**Features:**
- Session/day/week impression tracking
- Automatic storage management
- Manual impression recording
- Reset capabilities

**Debug Plugin** - Logging and window events

**Features:**
- Console logging with prefix
- Window event emission
- Automatic decision logging
- Configurable logging levels

## Quick Examples

### Banner

```typescript
import { createInstance, bannerPlugin } from '@prosdevlab/experience-sdk-plugins';

const sdk = createInstance();
sdk.use(bannerPlugin);

sdk.banner.show({
  id: 'welcome',
  type: 'banner',
  content: {
    message: 'Welcome! Get 20% off today.',
    buttons: [
      { text: 'Shop Now', url: '/shop', variant: 'primary' }
    ],
    position: 'top'
  }
});
```

### Modal with Form

```typescript
sdk.modal.show({
  id: 'newsletter',
  type: 'modal',
  content: {
    title: 'Stay Updated',
    message: 'Subscribe for exclusive offers.',
    size: 'sm',
    form: {
      fields: [
        { name: 'email', type: 'email', required: true }
      ],
      submitButton: { text: 'Subscribe', variant: 'primary' },
      successState: { 
        title: '✓ Subscribed!',
        message: 'Check your inbox.'
      }
    }
  }
});
```

### Inline Experience

```typescript
sdk.inline.show({
  id: 'promo',
  type: 'inline',
  content: {
    selector: '#sidebar',
    position: 'prepend',
    message: '<p><strong>Special Offer!</strong> Get 20% off with SAVE20.</p>',
    buttons: [
      { text: 'Shop Now', url: '/shop', variant: 'primary' }
    ],
    dismissable: true,
    persist: true
  }
});
```

### Exit Intent

```typescript
// Trigger modal on exit intent
sdk.on('trigger:exitIntent', () => {
  sdk.modal.show({
    id: 'exit-offer',
    content: {
      title: 'Wait! Before You Go...',
      message: 'Get 15% off your first order.',
      buttons: [
        { text: 'Claim Discount', variant: 'primary', url: '/checkout?code=EXIT15' }
      ]
    }
  });
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
- [Banner Plugin](https://prosdevlab.github.io/experience-sdk/reference/plugins/banner)
- [Modal Plugin](https://prosdevlab.github.io/experience-sdk/reference/plugins/modal)
- [Inline Plugin](https://prosdevlab.github.io/experience-sdk/reference/plugins/inline)
- [Display Conditions](https://prosdevlab.github.io/experience-sdk/reference/plugins/exit-intent)
- [All Plugins](https://prosdevlab.github.io/experience-sdk/reference/plugins)

## License

MIT

