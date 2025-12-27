---
'@prosdevlab/experience-sdk-plugins': patch
---

feat(banner): add pushDown option to push content down instead of overlay

Add optional `pushDown` config to banner plugin that allows top banners to smoothly push page content down (add margin-top) instead of overlaying it.

**Usage:**
```typescript
init({
  banner: {
    position: 'top',
    pushDown: 'header' // CSS selector of element to push down
  }
});
```

**Benefits:**
- Opt-in feature (default behavior unchanged)
- Smooth transition with CSS animations
- Improves UX for sticky navigation
- Automatically removes margin when banner is dismissed

