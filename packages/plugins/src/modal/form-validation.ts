/**
 * Pure validation functions for form fields
 *
 * These functions are intentionally pure (no side effects) to make them:
 * - Easy to test
 * - Easy to extract into a separate form plugin later
 * - Reusable across different contexts
 */

import type { FormConfig, FormField, ValidationResult } from './types';

/**
 * Validate a single form field
 *
 * @param field - Field configuration
 * @param value - Current field value
 * @returns Validation result with errors if invalid
 */
export function validateField(field: FormField, value: string): ValidationResult {
  const errors: Record<string, string> = {};

  // Required field validation
  if (field.required && (!value || value.trim() === '')) {
    errors[field.name] = field.errorMessage || `${field.label || field.name} is required`;
    return { valid: false, errors };
  }

  // Skip further validation if field is empty and not required
  if (!value || value.trim() === '') {
    return { valid: true };
  }

  // Type-specific validation
  switch (field.type) {
    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field.name] = field.errorMessage || 'Please enter a valid email address';
      }
      break;
    }

    case 'url': {
      try {
        new URL(value);
      } catch {
        errors[field.name] = field.errorMessage || 'Please enter a valid URL';
      }
      break;
    }

    case 'tel': {
      // Basic phone validation (allows digits, spaces, dashes, parentheses, plus)
      const phoneRegex = /^[\d\s\-()+]+$/;
      if (!phoneRegex.test(value)) {
        errors[field.name] = field.errorMessage || 'Please enter a valid phone number';
      }
      break;
    }

    case 'number': {
      if (Number.isNaN(Number(value))) {
        errors[field.name] = field.errorMessage || 'Please enter a valid number';
      }
      break;
    }
  }

  // Custom pattern validation (regex)
  if (field.pattern && value) {
    try {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        errors[field.name] =
          field.errorMessage || `Invalid format for ${field.label || field.name}`;
      }
    } catch (_error) {
      // Invalid regex pattern - log warning but don't break validation
      console.warn(`Invalid regex pattern for field ${field.name}:`, field.pattern);
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Validate entire form
 *
 * @param config - Form configuration
 * @param data - Current form data
 * @returns Validation result with all field errors if invalid
 */
export function validateForm(config: FormConfig, data: Record<string, string>): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate each field
  config.fields.forEach((field) => {
    const value = data[field.name] || '';
    const result = validateField(field, value);

    if (!result.valid && result.errors) {
      Object.assign(errors, result.errors);
    }
  });

  // Custom validation function
  if (config.validate) {
    try {
      const customResult = config.validate(data);
      if (!customResult.valid && customResult.errors) {
        Object.assign(errors, customResult.errors);
      }
    } catch (error) {
      console.error('Custom validation function threw an error:', error);
      // Don't prevent submission if custom validation has a bug
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}
