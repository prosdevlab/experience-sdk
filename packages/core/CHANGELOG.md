# @prosdevlab/experience-sdk

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
