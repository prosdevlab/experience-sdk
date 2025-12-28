/**
 * Modal styling with CSS variables for theming
 *
 * Design tokens for modal dialogs, fully customizable via CSS variables.
 * Users can override by setting CSS variables in their stylesheet.
 *
 * @example
 * ```css
 * :root {
 *   --xp-modal-backdrop-bg: rgba(0, 0, 0, 0.7);
 *   --xp-modal-dialog-bg: #ffffff;
 *   --xp-modal-dialog-radius: 12px;
 * }
 * ```
 */

/**
 * Get CSS for modal backdrop
 */
export function getBackdropStyles(): string {
  return `
    position: absolute;
    inset: 0;
    background-color: var(--xp-modal-backdrop-bg, rgba(0, 0, 0, 0.5));
  `.trim();
}

/**
 * Get CSS for modal dialog
 */
export function getDialogStyles(params: {
  width: string;
  maxWidth: string;
  height: string;
  maxHeight: string;
  borderRadius: string;
  padding: string;
}): string {
  return `
    position: relative;
    background: var(--xp-modal-dialog-bg, white);
    border-radius: var(--xp-modal-dialog-radius, ${params.borderRadius});
    box-shadow: var(--xp-modal-dialog-shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
    max-width: ${params.width};
    width: ${params.maxWidth};
    height: ${params.height};
    max-height: ${params.maxHeight};
    overflow-y: auto;
    padding: ${params.padding};
  `.trim();
}

/**
 * Get CSS for hero image
 */
export function getHeroImageStyles(params: { maxHeight: number; borderRadius: string }): string {
  return `
    width: 100%;
    height: auto;
    max-height: ${params.maxHeight}px;
    object-fit: cover;
    border-radius: ${params.borderRadius};
    display: block;
    margin: 0;
  `.trim();
}

/**
 * Get CSS for close button
 */
export function getCloseButtonStyles(): string {
  return `
    position: absolute;
    top: var(--xp-modal-close-top, 16px);
    right: var(--xp-modal-close-right, 16px);
    background: none;
    border: none;
    font-size: var(--xp-modal-close-size, 24px);
    line-height: 1;
    cursor: pointer;
    padding: var(--xp-modal-close-padding, 4px 8px);
    color: var(--xp-modal-close-color, #666);
    opacity: var(--xp-modal-close-opacity, 0.7);
    transition: opacity 0.2s;
  `.trim();
}

/**
 * Get close button hover opacity
 */
export function getCloseButtonHoverOpacity(): string {
  return 'var(--xp-modal-close-hover-opacity, 1)';
}

/**
 * Get close button default opacity
 */
export function getCloseButtonDefaultOpacity(): string {
  return 'var(--xp-modal-close-opacity, 0.7)';
}

/**
 * Get CSS for content wrapper
 */
export function getContentWrapperStyles(padding: string): string {
  return `padding: ${padding};`;
}

/**
 * Get CSS for modal title
 */
export function getTitleStyles(): string {
  return `
    margin: 0 0 var(--xp-modal-title-margin-bottom, 16px) 0;
    font-size: var(--xp-modal-title-size, 20px);
    font-weight: var(--xp-modal-title-weight, 600);
    color: var(--xp-modal-title-color, #111);
  `.trim();
}

/**
 * Get CSS for modal message
 */
export function getMessageStyles(): string {
  return `
    margin: 0 0 var(--xp-modal-message-margin-bottom, 20px) 0;
    font-size: var(--xp-modal-message-size, 14px);
    line-height: var(--xp-modal-message-line-height, 1.5);
    color: var(--xp-modal-message-color, #444);
  `.trim();
}

/**
 * Get CSS for button container
 */
export function getButtonContainerStyles(): string {
  return `
    display: flex;
    gap: var(--xp-modal-buttons-gap, 8px);
    flex-wrap: wrap;
  `.trim();
}

/**
 * Get CSS for primary button
 */
export function getPrimaryButtonStyles(): string {
  return `
    padding: var(--xp-button-padding, 10px 20px);
    font-size: var(--xp-button-font-size, 14px);
    font-weight: var(--xp-button-font-weight, 500);
    border-radius: var(--xp-button-radius, 6px);
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: var(--xp-button-primary-bg, #2563eb);
    color: var(--xp-button-primary-color, white);
  `.trim();
}

/**
 * Get primary button hover background
 */
export function getPrimaryButtonHoverBg(): string {
  return 'var(--xp-button-primary-bg-hover, #1d4ed8)';
}

/**
 * Get primary button default background
 */
export function getPrimaryButtonDefaultBg(): string {
  return 'var(--xp-button-primary-bg, #2563eb)';
}

/**
 * Get CSS for secondary button
 */
export function getSecondaryButtonStyles(): string {
  return `
    padding: var(--xp-button-padding, 10px 20px);
    font-size: var(--xp-button-font-size, 14px);
    font-weight: var(--xp-button-font-weight, 500);
    border-radius: var(--xp-button-radius, 6px);
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: var(--xp-button-secondary-bg, #f3f4f6);
    color: var(--xp-button-secondary-color, #374151);
  `.trim();
}

/**
 * Get secondary button hover background
 */
export function getSecondaryButtonHoverBg(): string {
  return 'var(--xp-button-secondary-bg-hover, #e5e7eb)';
}

/**
 * Get secondary button default background
 */
export function getSecondaryButtonDefaultBg(): string {
  return 'var(--xp-button-secondary-bg, #f3f4f6)';
}
