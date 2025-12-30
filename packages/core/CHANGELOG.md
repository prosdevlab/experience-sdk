# @prosdevlab/experience-sdk

## 0.3.0

### Minor Changes

- 2fc279c: **Phase 2: Presentation Layer - Modal & Inline Plugins**

  This release introduces two powerful new rendering plugins with built-in form support, completing the presentation layer for the Experience SDK.

  ## 🎉 New Features

  ### Modal Plugin

  - **Rich Content Modals**: Display announcements, promotions, and interactive content
  - **Built-in Forms**: Email capture, surveys, and feedback forms with validation
  - **Size Variants**: Small, medium, large, and extra-large sizes
  - **Hero Images**: Full-width images for visual impact
  - **Responsive Design**: Mobile fullscreen mode for optimal UX
  - **Keyboard Navigation**: Focus trap, Escape key, Tab navigation
  - **Animations**: Smooth fade-in/fade-out transitions
  - **Form States**: Success, error, and loading states
  - **API Methods**: `show()`, `remove()`, `isShowing()`, `showFormState()`, `resetForm()`, `getFormData()`

  ### Inline Plugin

  - **DOM Insertion**: Embed content anywhere in your page
  - **5 Insertion Methods**: `replace`, `append`, `prepend`, `before`, `after`
  - **CSS Selector Targeting**: Use any valid selector to target elements
  - **Dismissal with Persistence**: Users can dismiss and it persists in localStorage
  - **No Layout Disruption**: Seamlessly integrates with existing page structure
  - **API Methods**: `show()`, `remove()`, `isShowing()`

  ### Forms (Built into Modal)

  - **Field Types**: text, email, url, tel, number, textarea, select, checkbox, radio
  - **Validation**: Required, email, URL, pattern, custom validation, min/max length
  - **Real-time Feedback**: Validates on blur, shows errors inline
  - **Submission Handling**: Emits `experiences:modal:form:submit` event
  - **Success/Error States**: Built-in UI for post-submission states
  - **Pure Functions**: Validation and rendering logic easily extractable

  ## 🎨 Theming & Customization

  ### CSS Variables

  All plugins now support CSS variable theming:

  - **Modal**: `--xp-modal-*` variables for backdrop, dialog, title, content, buttons
  - **Forms**: `--xp-form-*` variables for inputs, labels, errors, submit button
  - **Banner**: `--xp-banner-*` variables (refactored from inline styles)
  - **Inline**: `--xp-inline-*` variables for custom styling

  See the [Theming Guide](https://prosdevlab.github.io/experience-sdk/guides/theming) for full reference.

  ## 🔧 API Improvements

  ### Runtime

  - **Auto-registration**: Modal and inline plugins are automatically registered
  - **Plugin API Access**: Expose plugin APIs via singleton (`experiences.modal.show()`)
  - **Trigger Event Handling**: Explicit listeners for each trigger type (exit intent, scroll depth, time delay)

  ### Display Conditions

  Seamless integration with existing display condition plugins:

  - **Exit Intent + Modal**: Capture emails before users leave
  - **Scroll Depth + Inline**: Progressive feature discovery
  - **Time Delay + Modal**: Time-sensitive promotions
  - **Page Visits + Banner**: Returning user messages

  ## 📦 Bundle Size

  - **Core SDK**: 13.4 KB gzipped (under 15 KB target ✅)
  - **All Plugins**: ~26 KB gzipped total (smaller than competitors like Pathfora at ~47 KB)
  - **Excellent Compression**: CSS-in-JS with CSS variables maintains small footprint

  ## 🧪 Testing

  - **432 tests passing** (unit, integration, browser tests)
  - **Modal Plugin**: 56 tests for core functionality, forms, keyboard nav, accessibility
  - **Inline Plugin**: 24 tests for DOM insertion, dismissal, persistence
  - **Form Validation**: 35 tests for all field types and edge cases
  - **Integration Tests**: 10 tests for plugin interactions
  - **Exit Intent**: 21 tests with timing and sensitivity validation

  ## 📚 Documentation

  - **Modal Plugin Reference**: Complete API docs with examples
  - **Inline Plugin Reference**: Full insertion method documentation
  - **Theming Guide**: CSS variable reference with examples
  - **Use Case Examples**: 4 complete implementation guides in playground

  ## 🚀 Playground Enhancements

  - **Layout Gallery Hub**: Visual directory for banner, modal, and inline layouts
  - **Navigation System**: Breadcrumbs and sub-navigation tabs
  - **Use Case Examples**:
    - Exit Intent Email Capture (exit intent + modal forms)
    - Feature Discovery Journey (scroll depth + inline + modal)
    - Time-Delayed Promotions (time delay + hero image modal)
    - Promotions & Announcements (banner examples)
  - **Interactive Demos**: Live examples with SDK integration

  ## ⚠️ Breaking Changes

  None. This is a **minor** release with backward compatibility.

  ## 🔜 Next Steps (Phase 3+)

  - Browser tests for form focus management
  - Composable form plugin (separate from modal)
  - Additional layout plugins (tooltip, slideout, sticky bar)
  - Multi-instance support with `instanceId` tracking

  ***

  **Migration Guide**: No migration needed. Simply upgrade and start using the new plugins!

  **Full Changelog**: See [Phase 2 Spec](https://github.com/prosdevlab/experience-sdk/blob/main/specs/phase-2-presentation-layer/spec.md)

### Patch Changes

- Updated dependencies [2fc279c]
  - @prosdevlab/experience-sdk-plugins@0.3.0

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
