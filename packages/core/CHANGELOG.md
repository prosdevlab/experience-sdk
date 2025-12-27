# @prosdevlab/experience-sdk

## 0.2.0

### Minor Changes

- 02de640: feat: add display condition plugins with event-driven architecture

  Add 4 new display condition plugins with comprehensive testing and documentation:

  **New Plugins:**

  - Exit Intent: Velocity-based mouse tracking with session awareness
  - Scroll Depth: Multiple thresholds with advanced engagement metrics
  - Page Visits: Session and lifetime counters with first-visit detection
  - Time Delay: Millisecond-precision delays with visibility API integration

  **Core Enhancements:**

  - Event-driven trigger architecture (`trigger:*` events)
  - Composable display conditions (AND/OR/NOT logic)
  - TriggerState interface for type-safe context updates

  **Developer Experience:**

  - 101 new tests across 4 plugins (314 total)
  - 12 integration tests for plugin composition
  - Complete API documentation with examples
  - Pure functions for easier testing

  All plugins are backward compatible and work independently or together.

### Patch Changes

- Updated dependencies [02de640]
  - @prosdevlab/experience-sdk-plugins@0.2.0

## 0.1.5

### Patch Changes

- Updated dependencies [df2c286]
  - @prosdevlab/experience-sdk-plugins@0.1.4

## 0.1.4

### Patch Changes

- Updated dependencies [41c0aa5]
  - @prosdevlab/experience-sdk-plugins@0.1.3

## 0.1.3

### Patch Changes

- Updated dependencies [a6842e2]
  - @prosdevlab/experience-sdk-plugins@0.1.2

## 0.1.2

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

- Updated dependencies [c5e46c0]
  - @prosdevlab/experience-sdk-plugins@0.1.1

## 0.1.1

### Patch Changes

- fdad132: Fix npm install error from v0.1.0. Add README and improve workflows.

  v0.1.0 was published with `workspace:*` dependency which doesn't work outside the monorepo. This release fixes that by letting changesets automatically convert it to the proper version range during publish.

  - Add: README with installation instructions and examples
  - Add: READMEs for plugins package
  - Fix: pnpm version conflicts in GitHub workflows
  - Add: Release banner to docs homepage
