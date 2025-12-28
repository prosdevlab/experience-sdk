import { describe, expect, it } from 'vitest';
import { validateField, validateForm } from './form-validation';
import type { FormConfig, FormField } from './types';

describe('validateField', () => {
  describe('required validation', () => {
    it('should pass when required field has value', () => {
      const field: FormField = {
        name: 'email',
        type: 'email',
        required: true,
      };

      const result = validateField(field, 'user@example.com');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should fail when required field is empty', () => {
      const field: FormField = {
        name: 'email',
        type: 'email',
        required: true,
      };

      const result = validateField(field, '');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({ email: 'email is required' });
    });

    it('should fail when required field is whitespace', () => {
      const field: FormField = {
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
      };

      const result = validateField(field, '   ');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({ name: 'Name is required' });
    });

    it('should use custom error message for required field', () => {
      const field: FormField = {
        name: 'email',
        type: 'email',
        required: true,
        errorMessage: 'Email address is required',
      };

      const result = validateField(field, '');

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({ email: 'Email address is required' });
    });

    it('should pass when optional field is empty', () => {
      const field: FormField = {
        name: 'phone',
        type: 'tel',
        required: false,
      };

      const result = validateField(field, '');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });

  describe('email validation', () => {
    const field: FormField = {
      name: 'email',
      type: 'email',
      required: false,
    };

    it('should pass with valid email', () => {
      const result = validateField(field, 'user@example.com');
      expect(result.valid).toBe(true);
    });

    it('should pass with subdomain email', () => {
      const result = validateField(field, 'user@mail.example.com');
      expect(result.valid).toBe(true);
    });

    it('should fail with invalid email (no @)', () => {
      const result = validateField(field, 'userexample.com');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({ email: 'Please enter a valid email address' });
    });

    it('should fail with invalid email (no domain)', () => {
      const result = validateField(field, 'user@');
      expect(result.valid).toBe(false);
    });

    it('should fail with invalid email (no TLD)', () => {
      const result = validateField(field, 'user@example');
      expect(result.valid).toBe(false);
    });

    it('should use custom error message for invalid email', () => {
      const customField: FormField = {
        ...field,
        errorMessage: 'Invalid email format',
      };

      const result = validateField(customField, 'invalid');
      expect(result.errors).toEqual({ email: 'Invalid email format' });
    });
  });

  describe('url validation', () => {
    const field: FormField = {
      name: 'website',
      type: 'url',
      required: false,
    };

    it('should pass with valid HTTP URL', () => {
      const result = validateField(field, 'http://example.com');
      expect(result.valid).toBe(true);
    });

    it('should pass with valid HTTPS URL', () => {
      const result = validateField(field, 'https://example.com/path?query=1');
      expect(result.valid).toBe(true);
    });

    it('should fail with invalid URL (no protocol)', () => {
      const result = validateField(field, 'example.com');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({ website: 'Please enter a valid URL' });
    });

    it('should fail with invalid URL format', () => {
      const result = validateField(field, 'not a url');
      expect(result.valid).toBe(false);
    });
  });

  describe('tel validation', () => {
    const field: FormField = {
      name: 'phone',
      type: 'tel',
      required: false,
    };

    it('should pass with digits only', () => {
      const result = validateField(field, '5551234567');
      expect(result.valid).toBe(true);
    });

    it('should pass with dashes', () => {
      const result = validateField(field, '555-123-4567');
      expect(result.valid).toBe(true);
    });

    it('should pass with parentheses and spaces', () => {
      const result = validateField(field, '(555) 123-4567');
      expect(result.valid).toBe(true);
    });

    it('should pass with plus and country code', () => {
      const result = validateField(field, '+1 555-123-4567');
      expect(result.valid).toBe(true);
    });

    it('should fail with letters', () => {
      const result = validateField(field, '555-CALL-NOW');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({ phone: 'Please enter a valid phone number' });
    });
  });

  describe('number validation', () => {
    const field: FormField = {
      name: 'age',
      type: 'number',
      required: false,
    };

    it('should pass with integer', () => {
      const result = validateField(field, '25');
      expect(result.valid).toBe(true);
    });

    it('should pass with decimal', () => {
      const result = validateField(field, '25.5');
      expect(result.valid).toBe(true);
    });

    it('should pass with negative number', () => {
      const result = validateField(field, '-10');
      expect(result.valid).toBe(true);
    });

    it('should fail with non-numeric value', () => {
      const result = validateField(field, 'twenty');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({ age: 'Please enter a valid number' });
    });
  });

  describe('pattern validation', () => {
    it('should pass when value matches pattern', () => {
      const field: FormField = {
        name: 'zipcode',
        type: 'text',
        pattern: '^\\d{5}$',
        required: false,
      };

      const result = validateField(field, '12345');
      expect(result.valid).toBe(true);
    });

    it('should fail when value does not match pattern', () => {
      const field: FormField = {
        name: 'zipcode',
        type: 'text',
        label: 'ZIP Code',
        pattern: '^\\d{5}$',
        required: false,
      };

      const result = validateField(field, '1234');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({ zipcode: 'Invalid format for ZIP Code' });
    });

    it('should use custom error message for pattern mismatch', () => {
      const field: FormField = {
        name: 'zipcode',
        type: 'text',
        pattern: '^\\d{5}$',
        errorMessage: 'ZIP code must be 5 digits',
        required: false,
      };

      const result = validateField(field, 'ABCDE');
      expect(result.errors).toEqual({ zipcode: 'ZIP code must be 5 digits' });
    });

    it('should handle invalid regex pattern gracefully', () => {
      const field: FormField = {
        name: 'test',
        type: 'text',
        pattern: '[invalid(regex',
        required: false,
      };

      // Should not throw, just pass validation
      const result = validateField(field, 'anything');
      expect(result.valid).toBe(true);
    });
  });
});

describe('validateForm', () => {
  it('should pass when all fields are valid', () => {
    const config: FormConfig = {
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'name', type: 'text', required: true },
      ],
      submitButton: { text: 'Submit', action: 'submit' },
    };

    const data = {
      email: 'user@example.com',
      name: 'John Doe',
    };

    const result = validateForm(config, data);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should fail when any field is invalid', () => {
    const config: FormConfig = {
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'name', type: 'text', required: true },
      ],
      submitButton: { text: 'Submit', action: 'submit' },
    };

    const data = {
      email: 'invalid-email',
      name: 'John Doe',
    };

    const result = validateForm(config, data);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('email');
  });

  it('should collect errors from multiple fields', () => {
    const config: FormConfig = {
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'tel', required: true },
      ],
      submitButton: { text: 'Submit', action: 'submit' },
    };

    const data = {
      email: '',
      name: '',
      phone: '',
    };

    const result = validateForm(config, data);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors || {})).toHaveLength(3);
    expect(result.errors).toHaveProperty('email');
    expect(result.errors).toHaveProperty('name');
    expect(result.errors).toHaveProperty('phone');
  });

  it('should run custom validation function', () => {
    const config: FormConfig = {
      fields: [{ name: 'email', type: 'email', required: true }],
      submitButton: { text: 'Submit', action: 'submit' },
      validate: (data) => {
        if (data.email.endsWith('@competitor.com')) {
          return {
            valid: false,
            errors: { email: 'Competitor emails not allowed' },
          };
        }
        return { valid: true };
      },
    };

    const data = { email: 'user@competitor.com' };

    const result = validateForm(config, data);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({ email: 'Competitor emails not allowed' });
  });

  it('should merge custom validation errors with field errors', () => {
    const config: FormConfig = {
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'password', type: 'text', required: true },
      ],
      submitButton: { text: 'Submit', action: 'submit' },
      validate: (data) => {
        if (data.password.length < 8) {
          return {
            valid: false,
            errors: { password: 'Password must be at least 8 characters' },
          };
        }
        return { valid: true };
      },
    };

    const data = {
      email: 'invalid',
      password: '123',
    };

    const result = validateForm(config, data);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('email'); // Field validation error
    expect(result.errors).toHaveProperty('password'); // Custom validation error
  });

  it('should handle custom validation function errors gracefully', () => {
    const config: FormConfig = {
      fields: [{ name: 'email', type: 'email', required: true }],
      submitButton: { text: 'Submit', action: 'submit' },
      validate: () => {
        throw new Error('Custom validation broke!');
      },
    };

    const data = { email: 'user@example.com' };

    // Should not throw, should pass validation
    const result = validateForm(config, data);
    expect(result.valid).toBe(true);
  });

  it('should pass when optional fields are empty', () => {
    const config: FormConfig = {
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'tel', required: false },
      ],
      submitButton: { text: 'Submit', action: 'submit' },
    };

    const data = {
      email: 'user@example.com',
      phone: '',
    };

    const result = validateForm(config, data);
    expect(result.valid).toBe(true);
  });
});
