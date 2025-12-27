# @prosdevlab/experience-sdk-plugins

## 0.1.4

### Patch Changes

- df2c286: feat(banner): add pushDown option to push content down instead of overlay

  Add optional `pushDown` config to banner plugin that allows top banners to smoothly push page content down (add margin-top) instead of overlaying it.

  **Usage:**

  ```typescript
  init({
    banner: {
      position: "top",
      pushDown: "header", // CSS selector of element to push down
    },
  });
  ```

  **Benefits:**

  - Opt-in feature (default behavior unchanged)
  - Smooth transition with CSS animations
  - Improves UX for sticky navigation
  - Automatically removes margin when banner is dismissed

## 0.1.3

### Patch Changes

- 41c0aa5: Fix npm publishing error by adding repository field to package.json

  - Add repository field required for npm provenance verification

## 0.1.2

### Patch Changes

- a6842e2: Fix npm publishing error by adding repository field to package.json

  - Add repository field required for npm provenance verification

## 0.1.1

### Patch Changes

- c5e46c0: Fix BannerContent type definition, add CSS customization support, and implement HTML sanitization:

  - Add `buttons` array property with variant and metadata support
  - Add `position` property (top/bottom)
  - Make `title` optional (message is the only required field)
  - Add `className` and `style` props for banner and buttons
  - Update banner plugin to use `.xp-*` CSS classes
  - Provide minimal, functional default styles
  - Add HTML sanitizer for XSS prevention in title and message fields
  - Support safe HTML tags (strong, em, a, br, span, b, i, p)
  - Block dangerous tags and event handlers
  - Sanitize URLs to prevent javascript: and data: attacks
  - Aligns core types with banner plugin implementation

  This enables users to customize banners with Tailwind, design systems, or CSS frameworks while maintaining SDK's focus on targeting logic. HTML sanitization ensures safe rendering of user-provided content.
