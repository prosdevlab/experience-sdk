/**
 * Pure form rendering functions
 *
 * These functions are intentionally pure (return DOM elements, no side effects) to make them:
 * - Easy to test
 * - Easy to extract into a separate form plugin later
 * - Reusable across different contexts
 */

import type { ExperienceButton } from '../types';
import {
  getErrorMessageStyles,
  getErrorStateStyles,
  getFieldStyles,
  getFormStateStyles,
  getFormStyles,
  getInputStyles,
  getLabelStyles,
  getRequiredStyles,
  getStateButtonsStyles,
  getStateMessageStyles,
  getStateTitleStyles,
  getSubmitButtonHoverColor,
  getSubmitButtonStyles,
  getSuccessStateStyles,
} from './form-styles';
import type { FormConfig, FormField } from './types';

/**
 * Render complete form element
 *
 * @param experienceId - Experience ID for namespacing field IDs
 * @param config - Form configuration
 * @returns Form HTML element
 */
export function renderForm(experienceId: string, config: FormConfig): HTMLFormElement {
  const form = document.createElement('form');
  form.className = 'xp-modal__form';
  form.style.cssText = getFormStyles();
  form.dataset.xpExperienceId = experienceId;
  form.setAttribute('novalidate', ''); // Use custom validation instead of browser default

  // Render each field
  config.fields.forEach((field) => {
    const fieldElement = renderFormField(experienceId, field);
    form.appendChild(fieldElement);
  });

  // Render submit button
  const submitButton = renderSubmitButton(config.submitButton);
  form.appendChild(submitButton);

  return form;
}

/**
 * Render a single form field with label and error container
 *
 * @param experienceId - Experience ID for namespacing field ID
 * @param field - Field configuration
 * @returns Field wrapper HTML element
 */
export function renderFormField(experienceId: string, field: FormField): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'xp-form__field';
  wrapper.style.cssText = getFieldStyles();

  // Label (optional)
  if (field.label) {
    const label = document.createElement('label');
    label.className = 'xp-form__label';
    label.style.cssText = getLabelStyles();
    label.htmlFor = `${experienceId}-${field.name}`;
    label.textContent = field.label;

    // Required indicator
    if (field.required) {
      const required = document.createElement('span');
      required.className = 'xp-form__required';
      required.style.cssText = getRequiredStyles();
      required.textContent = ' *';
      required.setAttribute('aria-label', 'required');
      label.appendChild(required);
    }

    wrapper.appendChild(label);
  }

  // Input element (input or textarea)
  const input =
    field.type === 'textarea'
      ? document.createElement('textarea')
      : document.createElement('input');

  input.className = 'xp-form__input';
  input.style.cssText = getInputStyles();
  input.id = `${experienceId}-${field.name}`;
  input.name = field.name;

  // Set type for input elements
  if (input instanceof HTMLInputElement) {
    input.type = field.type;
  }

  // Placeholder
  if (field.placeholder) {
    input.placeholder = field.placeholder;
  }

  // Required attribute (for screen readers)
  if (field.required) {
    input.required = true;
  }

  // Pattern attribute (for HTML5 validation as fallback)
  if (field.pattern && input instanceof HTMLInputElement) {
    input.setAttribute('pattern', field.pattern);
  }

  // Accessibility attributes
  input.setAttribute('aria-invalid', 'false');
  input.setAttribute('aria-describedby', `${experienceId}-${field.name}-error`);

  // Custom styling
  if (field.className) {
    input.className += ` ${field.className}`;
  }
  if (field.style) {
    Object.assign(input.style, field.style);
  }

  wrapper.appendChild(input);

  // Error message container
  const error = document.createElement('div');
  error.className = 'xp-form__error';
  error.style.cssText = getErrorMessageStyles();
  error.id = `${experienceId}-${field.name}-error`;
  error.setAttribute('role', 'alert');
  error.setAttribute('aria-live', 'polite');
  wrapper.appendChild(error);

  return wrapper;
}

/**
 * Render submit button
 *
 * @param buttonConfig - Button configuration
 * @returns Button HTML element
 */
export function renderSubmitButton(buttonConfig: ExperienceButton): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'xp-form__submit xp-modal__button';
  button.style.cssText = getSubmitButtonStyles();

  // Variant styling
  if (buttonConfig.variant) {
    button.className += ` xp-modal__button--${buttonConfig.variant}`;
  }

  // Custom class
  if (buttonConfig.className) {
    button.className += ` ${buttonConfig.className}`;
  }

  // Button text
  button.textContent = buttonConfig.text;

  // Hover effect
  const hoverColor = getSubmitButtonHoverColor();
  button.onmouseover = () => {
    button.style.backgroundColor = hoverColor;
  };
  button.onmouseout = () => {
    button.style.backgroundColor = '#2563eb';
  };

  // Custom styling
  if (buttonConfig.style) {
    Object.assign(button.style, buttonConfig.style);
  }

  return button;
}

/**
 * Render form state (success or error)
 *
 * @param state - State configuration ('success' or 'error')
 * @param stateConfig - State content configuration
 * @returns State HTML element
 */
export function renderFormState(
  state: 'success' | 'error',
  stateConfig: { title?: string; message: string; buttons?: ExperienceButton[] }
): HTMLElement {
  const stateEl = document.createElement('div');
  stateEl.className = `xp-form__state xp-form__state--${state}`;

  // Base styles + state-specific styles
  const baseStyles = getFormStateStyles();
  const stateStyles = state === 'success' ? getSuccessStateStyles() : getErrorStateStyles();
  stateEl.style.cssText = `${baseStyles}; ${stateStyles}`;

  // Title (optional)
  if (stateConfig.title) {
    const title = document.createElement('h3');
    title.className = 'xp-form__state-title';
    title.style.cssText = getStateTitleStyles();
    title.textContent = stateConfig.title;
    stateEl.appendChild(title);
  }

  // Message
  const message = document.createElement('div');
  message.className = 'xp-form__state-message';
  message.style.cssText = getStateMessageStyles();
  message.textContent = stateConfig.message;
  stateEl.appendChild(message);

  // Buttons (optional)
  if (stateConfig.buttons && stateConfig.buttons.length > 0) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'xp-form__state-buttons';
    buttonContainer.style.cssText = getStateButtonsStyles();

    stateConfig.buttons.forEach((btnConfig) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'xp-modal__button';

      if (btnConfig.variant) {
        btn.className += ` xp-modal__button--${btnConfig.variant}`;
      }
      if (btnConfig.className) {
        btn.className += ` ${btnConfig.className}`;
      }

      btn.textContent = btnConfig.text;

      if (btnConfig.style) {
        Object.assign(btn.style, btnConfig.style);
      }

      // Store action/dismiss metadata for event handlers
      if (btnConfig.action) {
        btn.dataset.action = btnConfig.action;
      }
      if (btnConfig.dismiss) {
        btn.dataset.dismiss = 'true';
      }

      buttonContainer.appendChild(btn);
    });

    stateEl.appendChild(buttonContainer);
  }

  return stateEl;
}
