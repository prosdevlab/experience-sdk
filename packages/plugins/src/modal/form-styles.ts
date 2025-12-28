/**
 * Form styling helpers inspired by Tailwind CSS
 *
 * Clean, modern form styles matching Tailwind's design patterns:
 * - Subtle borders with focus states
 * - Blue focus rings
 * - Proper spacing and typography
 * - Clear error states
 */

/**
 * Get CSS for form container
 */
export function getFormStyles(): string {
  return `
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `.trim();
}

/**
 * Get CSS for form field wrapper
 */
export function getFieldStyles(): string {
  return `
    display: flex;
    flex-direction: column;
    gap: 6px;
  `.trim();
}

/**
 * Get CSS for form label
 */
export function getLabelStyles(): string {
  return `
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    line-height: 1.5;
  `.trim();
}

/**
 * Get CSS for required indicator
 */
export function getRequiredStyles(): string {
  return `
    color: #ef4444;
  `.trim();
}

/**
 * Get CSS for form input/textarea
 */
export function getInputStyles(): string {
  return `
    padding: 8px 12px;
    font-size: 14px;
    line-height: 1.5;
    color: #111827;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
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
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  `.trim();
}

/**
 * Get CSS for input error state
 */
export function getInputErrorStyles(): string {
  return `
    border-color: #ef4444;
  `.trim();
}

/**
 * Get CSS for error message
 */
export function getErrorMessageStyles(): string {
  return `
    font-size: 13px;
    color: #ef4444;
    line-height: 1.4;
    min-height: 18px;
  `.trim();
}

/**
 * Get CSS for submit button
 */
export function getSubmitButtonStyles(): string {
  return `
    margin-top: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    background-color: #2563eb;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  `.trim();
}

/**
 * Get CSS for submit button hover state
 */
export function getSubmitButtonHoverColor(): string {
  return '#1d4ed8';
}

/**
 * Get CSS for submit button disabled state
 */
export function getSubmitButtonDisabledStyles(): string {
  return `
    opacity: 0.6;
    cursor: not-allowed;
  `.trim();
}

/**
 * Get CSS for form state container (success/error)
 */
export function getFormStateStyles(): string {
  return `
    padding: 16px;
    border-radius: 8px;
    text-align: center;
  `.trim();
}

/**
 * Get CSS for success state
 */
export function getSuccessStateStyles(): string {
  return `
    background-color: #f0fdf4;
    border: 1px solid #86efac;
  `.trim();
}

/**
 * Get CSS for error state
 */
export function getErrorStateStyles(): string {
  return `
    background-color: #fef2f2;
    border: 1px solid #fca5a5;
  `.trim();
}

/**
 * Get CSS for state title
 */
export function getStateTitleStyles(): string {
  return `
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #111827;
  `.trim();
}

/**
 * Get CSS for state message
 */
export function getStateMessageStyles(): string {
  return `
    font-size: 14px;
    line-height: 1.5;
    color: #374151;
    margin: 0;
  `.trim();
}

/**
 * Get CSS for state buttons container
 */
export function getStateButtonsStyles(): string {
  return `
    margin-top: 16px;
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  `.trim();
}
