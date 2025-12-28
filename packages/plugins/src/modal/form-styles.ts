/**
 * Form styling with CSS variables for theming
 *
 * Design tokens inspired by Tailwind CSS, fully customizable via CSS variables.
 * Users can override by setting CSS variables in their stylesheet.
 *
 * @example
 * ```css
 * :root {
 *   --xp-form-input-border: #3b82f6;
 *   --xp-form-input-focus-ring: rgba(59, 130, 246, 0.2);
 * }
 * ```
 */

/**
 * Get CSS for form container
 */
export function getFormStyles(): string {
  return `
    margin-top: var(--xp-form-spacing, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--xp-form-gap, 16px);
  `.trim();
}

/**
 * Get CSS for form field wrapper
 */
export function getFieldStyles(): string {
  return `
    display: flex;
    flex-direction: column;
    gap: var(--xp-field-gap, 6px);
  `.trim();
}

/**
 * Get CSS for form label
 */
export function getLabelStyles(): string {
  return `
    font-size: var(--xp-label-font-size, 14px);
    font-weight: var(--xp-label-font-weight, 500);
    color: var(--xp-label-color, #374151);
    line-height: 1.5;
  `.trim();
}

/**
 * Get CSS for required indicator
 */
export function getRequiredStyles(): string {
  return `
    color: var(--xp-required-color, #ef4444);
  `.trim();
}

/**
 * Get CSS for form input/textarea
 */
export function getInputStyles(): string {
  return `
    padding: var(--xp-input-padding, 8px 12px);
    font-size: var(--xp-input-font-size, 14px);
    line-height: 1.5;
    color: var(--xp-input-color, #111827);
    background-color: var(--xp-input-bg, white);
    border: var(--xp-input-border-width, 1px) solid var(--xp-input-border-color, #d1d5db);
    border-radius: var(--xp-input-radius, 6px);
    transition: all 0.15s ease-in-out;
    outline: none;
    width: 100%;
    box-sizing: border-box;
  `.trim();
}

/**
 * Get CSS for input focus state (applies via :focus)
 */
export function getInputFocusStyles(): string {
  return `
    border-color: var(--xp-input-focus-border, #3b82f6);
    box-shadow: 0 0 0 var(--xp-input-focus-ring-width, 3px) var(--xp-input-focus-ring, rgba(59, 130, 246, 0.1));
  `.trim();
}

/**
 * Get CSS for input error state
 */
export function getInputErrorStyles(): string {
  return `
    border-color: var(--xp-input-error-border, #ef4444);
  `.trim();
}

/**
 * Get CSS for error message
 */
export function getErrorMessageStyles(): string {
  return `
    font-size: var(--xp-error-font-size, 13px);
    color: var(--xp-error-color, #ef4444);
    line-height: 1.4;
    min-height: 18px;
  `.trim();
}

/**
 * Get CSS for submit button
 */
export function getSubmitButtonStyles(): string {
  return `
    margin-top: var(--xp-submit-margin-top, 8px);
    padding: var(--xp-submit-padding, 10px 20px);
    font-size: var(--xp-submit-font-size, 14px);
    font-weight: var(--xp-submit-font-weight, 500);
    color: var(--xp-submit-color, white);
    background-color: var(--xp-submit-bg, #2563eb);
    border: none;
    border-radius: var(--xp-submit-radius, 6px);
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  `.trim();
}

/**
 * Get CSS for submit button hover background
 */
export function getSubmitButtonHoverBg(): string {
  return 'var(--xp-submit-bg-hover, #1d4ed8)';
}

/**
 * Get CSS for submit button disabled state
 */
export function getSubmitButtonDisabledStyles(): string {
  return `
    opacity: var(--xp-submit-disabled-opacity, 0.6);
    cursor: not-allowed;
  `.trim();
}

/**
 * Get CSS for form state container (success/error)
 */
export function getFormStateStyles(): string {
  return `
    padding: var(--xp-state-padding, 16px);
    border-radius: var(--xp-state-radius, 8px);
    text-align: center;
  `.trim();
}

/**
 * Get CSS for success state
 */
export function getSuccessStateStyles(): string {
  return `
    background-color: var(--xp-success-bg, #f0fdf4);
    border: var(--xp-state-border-width, 1px) solid var(--xp-success-border, #86efac);
  `.trim();
}

/**
 * Get CSS for error state
 */
export function getErrorStateStyles(): string {
  return `
    background-color: var(--xp-error-bg, #fef2f2);
    border: var(--xp-state-border-width, 1px) solid var(--xp-error-border, #fca5a5);
  `.trim();
}

/**
 * Get CSS for state title
 */
export function getStateTitleStyles(): string {
  return `
    font-size: var(--xp-state-title-font-size, 16px);
    font-weight: var(--xp-state-title-font-weight, 600);
    margin: 0 0 var(--xp-state-title-margin-bottom, 8px) 0;
    color: var(--xp-state-title-color, #111827);
  `.trim();
}

/**
 * Get CSS for state message
 */
export function getStateMessageStyles(): string {
  return `
    font-size: var(--xp-state-message-font-size, 14px);
    line-height: 1.5;
    color: var(--xp-state-message-color, #374151);
    margin: 0;
  `.trim();
}

/**
 * Get CSS for state buttons container
 */
export function getStateButtonsStyles(): string {
  return `
    margin-top: var(--xp-state-buttons-margin-top, 16px);
    display: flex;
    gap: var(--xp-state-buttons-gap, 8px);
    justify-content: center;
    flex-wrap: wrap;
  `.trim();
}
