---
'@prosdevlab/experience-sdk': patch
'@prosdevlab/experience-sdk-plugins': patch
---

Fix BannerContent type definition and add CSS customization support:

- Add `buttons` array property with variant and metadata support
- Add `position` property (top/bottom)
- Make `title` optional (message is the only required field)
- Add `className` and `style` props for banner and buttons
- Update banner plugin to use `.xp-*` CSS classes
- Provide minimal, functional default styles
- Aligns core types with banner plugin implementation

This enables users to customize banners with Tailwind, design systems, or CSS frameworks while maintaining SDK's focus on targeting logic.

