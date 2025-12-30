---
"@prosdevlab/experience-sdk": minor
"@prosdevlab/experience-sdk-plugins": minor
---

**Phase 2: Presentation Layer - Modal & Inline Plugins**

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
- **427 tests passing** (unit, integration, browser tests)
- **Modal Plugin**: 50+ tests for core functionality, forms, keyboard nav, accessibility
- **Inline Plugin**: 24+ tests for DOM insertion, dismissal, persistence
- **Form Validation**: 35+ tests for all field types and edge cases
- **Integration Tests**: 10+ tests for plugin interactions
- **Browser Tests**: 5+ tests with Playwright for real browser behavior

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

---

**Migration Guide**: No migration needed. Simply upgrade and start using the new plugins!

**Full Changelog**: See [Phase 2 Spec](https://github.com/prosdevlab/experience-sdk/blob/main/specs/phase-2-presentation-layer/spec.md)

