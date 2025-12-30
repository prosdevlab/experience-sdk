/**
 * Integration Tests
 *
 * Tests the interaction between plugins to ensure they work together correctly.
 *
 * @vitest-environment happy-dom
 */
import { SDK } from '@lytics/sdk-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inlinePlugin } from './inline';
import { modalPlugin } from './modal';

function initSDK() {
  const sdk = new SDK({ name: 'integration-test' });
  sdk.use(modalPlugin);
  sdk.use(inlinePlugin);

  if (!document.body) {
    document.body = document.createElement('body');
  }

  return sdk;
}

describe('Plugin Integration Tests', () => {
  let sdk: SDK & { modal?: any; inline?: any };

  beforeEach(async () => {
    sdk = initSDK();
    await sdk.init();
  });

  afterEach(async () => {
    for (const el of document.querySelectorAll('.xp-modal, .xp-inline')) {
      el.remove();
    }
    document.body.innerHTML = '';
    if (sdk) {
      await sdk.destroy();
    }
  });

  describe('Modal + Inline Interaction', () => {
    it('should show modal and inline simultaneously', async () => {
      const shownHandler = vi.fn();
      sdk.on('experiences:shown', shownHandler);

      const target = document.createElement('div');
      target.id = 'content';
      document.body.appendChild(target);

      const modalExp = {
        id: 'popup',
        type: 'modal',
        content: {
          title: 'Special Offer',
          message: 'Limited time only!',
          buttons: [{ text: 'Learn More', variant: 'primary' }],
        },
      };

      const inlineExp = {
        id: 'inline-banner',
        type: 'inline',
        content: {
          selector: '#content',
          message: '<p>Related: Check out our guide.</p>',
        },
      };

      sdk.modal.show(modalExp);
      sdk.inline.show(inlineExp);

      await vi.waitFor(() => {
        expect(shownHandler).toHaveBeenCalledTimes(2);
      });

      expect(document.querySelector('.xp-modal')).toBeTruthy();
      expect(document.querySelector('.xp-inline')).toBeTruthy();
    });

    it('should dismiss modal without affecting inline', async () => {
      const dismissedHandler = vi.fn();
      sdk.on('experiences:dismissed', dismissedHandler);

      const target = document.createElement('div');
      target.id = 'content';
      document.body.appendChild(target);

      const modalExp = {
        id: 'dismissable-modal',
        type: 'modal',
        content: {
          title: 'Notification',
          message: 'This is a modal.',
          dismissable: true,
        },
      };

      const inlineExp = {
        id: 'persistent-inline',
        type: 'inline',
        content: {
          selector: '#content',
          message: '<p>This stays.</p>',
        },
      };

      sdk.modal.show(modalExp);
      sdk.inline.show(inlineExp);

      await vi.waitFor(() => {
        expect(document.querySelector('.xp-modal')).toBeTruthy();
        expect(document.querySelector('.xp-inline')).toBeTruthy();
      });

      // Dismiss modal
      const closeBtn = document.querySelector('.xp-modal__close') as HTMLElement;
      closeBtn.click();

      await vi.waitFor(() => {
        expect(dismissedHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'dismissable-modal',
          })
        );
      });

      // Modal gone, inline remains
      expect(document.querySelector('.xp-modal')).toBeFalsy();
      expect(document.querySelector('.xp-inline')).toBeTruthy();
    });

    it('should dismiss inline without affecting modal', async () => {
      const target = document.createElement('div');
      target.id = 'content';
      document.body.appendChild(target);

      const modalExp = {
        id: 'persistent-modal',
        type: 'modal',
        content: {
          title: 'Stay Open',
          message: 'This modal stays.',
        },
      };

      const inlineExp = {
        id: 'dismissable-inline',
        type: 'inline',
        content: {
          selector: '#content',
          message: '<p>Can dismiss</p>',
          dismissable: true,
        },
      };

      sdk.modal.show(modalExp);
      sdk.inline.show(inlineExp);

      await vi.waitFor(() => {
        expect(document.querySelector('.xp-modal')).toBeTruthy();
        expect(document.querySelector('.xp-inline')).toBeTruthy();
      });

      // Dismiss inline
      const closeBtn = document.querySelector('.xp-inline__close') as HTMLElement;
      closeBtn.click();

      await vi.waitFor(() => {
        expect(document.querySelector('.xp-inline')).toBeFalsy();
      });

      // Inline gone, modal remains
      expect(document.querySelector('.xp-modal')).toBeTruthy();
    });
  });

  describe('Modal Forms', () => {
    it('should render and submit form in modal', async () => {
      const formSubmitHandler = vi.fn();
      sdk.on('experiences:modal:form:submit', formSubmitHandler);

      const experience = {
        id: 'newsletter',
        type: 'modal',
        content: {
          title: 'Subscribe',
          message: 'Get updates.',
          size: 'sm',
          form: {
            fields: [
              { name: 'email', type: 'email', required: true, placeholder: 'you@example.com' },
            ],
            submitButton: { text: 'Subscribe', variant: 'primary' },
          },
        },
      };

      sdk.modal.show(experience);

      await vi.waitFor(() => {
        expect(document.querySelector('.xp-modal__form')).toBeTruthy();
      });

      // Fill and submit form
      const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      const form = document.querySelector('.xp-modal__form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        expect(formSubmitHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'newsletter',
            formData: { email: 'test@example.com' },
          })
        );
      });
    });

    it('should validate form fields', async () => {
      const validationHandler = vi.fn();
      sdk.on('experiences:modal:form:validation', validationHandler);

      const experience = {
        id: 'form-validation',
        type: 'modal',
        content: {
          form: {
            fields: [{ name: 'email', type: 'email', required: true }],
            submitButton: { text: 'Submit', variant: 'primary' },
          },
        },
      };

      sdk.modal.show(experience);

      await vi.waitFor(() => {
        expect(document.querySelector('.xp-modal__form')).toBeTruthy();
      });

      // Submit empty form (should fail validation)
      const form = document.querySelector('.xp-modal__form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        expect(validationHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            valid: false,
            errors: expect.any(Object),
          })
        );
      });
    });
  });

  describe('Multiple Instances', () => {
    it('should handle multiple inline experiences in different locations', async () => {
      const target1 = document.createElement('div');
      target1.id = 'sidebar';
      document.body.appendChild(target1);

      const target2 = document.createElement('div');
      target2.id = 'footer';
      document.body.appendChild(target2);

      sdk.inline.show({
        id: 'sidebar-promo',
        type: 'inline',
        content: {
          selector: '#sidebar',
          message: '<p>Sidebar content</p>',
        },
      });

      sdk.inline.show({
        id: 'footer-cta',
        type: 'inline',
        content: {
          selector: '#footer',
          message: '<p>Footer content</p>',
        },
      });

      await vi.waitFor(() => {
        expect(document.querySelectorAll('.xp-inline').length).toBe(2);
      });

      expect(target1.querySelector('.xp-inline')).toBeTruthy();
      expect(target2.querySelector('.xp-inline')).toBeTruthy();
    });

    it('should replace existing modal when showing a new one', async () => {
      const dismissedHandler = vi.fn();
      sdk.on('experiences:dismissed', dismissedHandler);

      // Show first modal
      sdk.modal.show({
        id: 'modal1',
        type: 'modal',
        content: { title: 'First', message: 'Modal 1' },
      });

      await vi.waitFor(() => {
        expect(sdk.modal.isShowing('modal1')).toBe(true);
      });

      // Show second modal (should replace first)
      sdk.modal.show({
        id: 'modal2',
        type: 'modal',
        content: { title: 'Second', message: 'Modal 2' },
      });

      await vi.waitFor(() => {
        expect(sdk.modal.isShowing('modal2')).toBe(true);
      });

      // Only second modal should be showing
      expect(sdk.modal.isShowing('modal1')).toBe(false);
      expect(sdk.modal.isShowing('modal2')).toBe(true);
      expect(document.querySelectorAll('.xp-modal').length).toBe(1);
    });

    it('should prevent showing the same modal twice', async () => {
      const shownHandler = vi.fn();
      sdk.on('experiences:shown', shownHandler);

      const experience = {
        id: 'duplicate-test',
        type: 'modal',
        content: { title: 'Test', message: 'Cannot show twice' },
      };

      sdk.modal.show(experience);
      sdk.modal.show(experience); // Try to show again

      await vi.waitFor(() => {
        expect(shownHandler).toHaveBeenCalledTimes(1);
      });

      // Only one modal in DOM
      expect(document.querySelectorAll('[data-xp-id="duplicate-test"]').length).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should clean up all experiences on destroy', async () => {
      const target = document.createElement('div');
      target.id = 'content';
      document.body.appendChild(target);

      sdk.modal.show({
        id: 'modal',
        type: 'modal',
        content: { title: 'Modal', message: 'Content' },
      });

      sdk.inline.show({
        id: 'inline',
        type: 'inline',
        content: { selector: '#content', message: '<p>Inline</p>' },
      });

      await vi.waitFor(() => {
        expect(document.querySelector('.xp-modal')).toBeTruthy();
        expect(document.querySelector('.xp-inline')).toBeTruthy();
      });

      await sdk.destroy();

      expect(document.querySelector('.xp-modal')).toBeFalsy();
      expect(document.querySelector('.xp-inline')).toBeFalsy();
    });
  });

  describe('Event Flow', () => {
    it('should emit events in correct order for modal', async () => {
      const events: string[] = [];

      sdk.on('experiences:shown', () => events.push('shown'));
      sdk.on('experiences:action', () => events.push('action'));
      sdk.on('experiences:dismissed', () => events.push('dismissed'));

      sdk.modal.show({
        id: 'event-test',
        type: 'modal',
        content: {
          title: 'Test',
          message: 'Testing events',
          buttons: [{ text: 'Click Me', variant: 'primary', action: 'test' }],
          dismissable: true,
        },
      });

      await vi.waitFor(() => {
        expect(document.querySelector('.xp-modal')).toBeTruthy();
      });

      // Click button
      const button = document.querySelector('.xp-modal__button') as HTMLElement;
      button.click();

      await vi.waitFor(() => {
        expect(events).toContain('action');
      });

      // Dismiss modal
      sdk.modal.remove('event-test');

      await vi.waitFor(() => {
        expect(events).toContain('dismissed');
      });

      expect(events).toEqual(['shown', 'action', 'dismissed']);
    });
  });
});
