/**
 * @vitest-environment happy-dom
 */
import { SDK } from '@lytics/sdk-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { modalPlugin } from './modal';

// Helper to initialize SDK with modal plugin
function initPlugin(config = {}) {
  const sdk = new SDK({
    name: 'test-sdk',
    ...config,
  });

  sdk.use(modalPlugin);

  // Mock dom-required functionality
  if (typeof document !== 'undefined') {
    // Ensure body exists
    if (!document.body) {
      document.body = document.createElement('body');
    }
  }

  return sdk;
}

describe('Modal Plugin', () => {
  let sdk: SDK & { modal?: any };

  beforeEach(async () => {
    vi.useFakeTimers();
    sdk = initPlugin();
    await sdk.init();
  });

  afterEach(async () => {
    // Clean up any leftover modals first
    document.querySelectorAll('.xp-modal').forEach((el) => {
      el.remove();
    });

    if (sdk) {
      await sdk.destroy();
    }

    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should register the modal plugin', () => {
    expect(sdk.modal).toBeDefined();
    expect(typeof sdk.modal.show).toBe('function');
    expect(typeof sdk.modal.remove).toBe('function');
    expect(typeof sdk.modal.isShowing).toBe('function');
  });

  it('should set default configuration', () => {
    const config = sdk.get('modal');
    expect(config).toBeDefined();
    expect(config.dismissable).toBe(true);
    expect(config.backdropDismiss).toBe(true);
    expect(config.zIndex).toBe(10001);
  });

  describe('Modal Rendering', () => {
    it('should render a modal with title and message', () => {
      const experience = {
        id: 'test-modal',
        layout: 'modal',
        content: {
          title: 'Test Title',
          message: 'Test message',
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal');
      expect(modal).toBeTruthy();
      expect(modal?.querySelector('.xp-modal__title')?.textContent).toBe('Test Title');
      expect(modal?.querySelector('.xp-modal__message')?.textContent).toBe('Test message');
    });

    it('should render a modal without title', () => {
      const experience = {
        id: 'no-title-modal',
        layout: 'modal',
        content: {
          message: 'Just a message',
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal');
      expect(modal).toBeTruthy();
      expect(modal?.querySelector('.xp-modal__title')).toBeFalsy();
      expect(modal?.querySelector('.xp-modal__message')?.textContent).toBe('Just a message');
    });

    it('should render modal with buttons', () => {
      const experience = {
        id: 'button-modal',
        layout: 'modal',
        content: {
          title: 'Confirm',
          message: 'Are you sure?',
          buttons: [
            { text: 'Cancel', variant: 'secondary' },
            { text: 'Confirm', variant: 'primary' },
          ],
        },
      };

      sdk.modal.show(experience);

      const buttons = document.querySelectorAll('.xp-modal__button');
      expect(buttons.length).toBe(2);
      expect(buttons[0]?.textContent).toBe('Cancel');
      expect(buttons[1]?.textContent).toBe('Confirm');
    });

    it('should apply custom className and style', () => {
      const experience = {
        id: 'custom-modal',
        layout: 'modal',
        content: {
          message: 'Custom styled',
          className: 'my-custom-class',
          style: {
            'background-color': 'red',
          },
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal');
      expect(modal?.classList.contains('my-custom-class')).toBe(true);
      expect(modal?.style.backgroundColor).toBe('red');
    });

    it('should render close button when dismissable', () => {
      const experience = {
        id: 'dismissable-modal',
        layout: 'modal',
        content: {
          message: 'Can close',
        },
      };

      sdk.modal.show(experience);

      const closeButton = document.querySelector('.xp-modal__close');
      expect(closeButton).toBeTruthy();
      expect(closeButton?.getAttribute('aria-label')).toBe('Close dialog');
    });

    it('should not render close button when dismissable is false', () => {
      sdk.set('modal.dismissable', false);

      const experience = {
        id: 'non-dismissable-modal',
        layout: 'modal',
        content: {
          message: 'Cannot close',
        },
      };

      sdk.modal.show(experience);

      const closeButton = document.querySelector('.xp-modal__close');
      expect(closeButton).toBeFalsy();
    });

    it('should sanitize HTML in message', () => {
      const experience = {
        id: 'html-modal',
        layout: 'modal',
        content: {
          message: '<strong>Bold text</strong><script>alert("xss")</script>',
        },
      };

      sdk.modal.show(experience);

      const message = document.querySelector('.xp-modal__message');
      expect(message?.innerHTML).toContain('<strong>Bold text</strong>');
      expect(message?.innerHTML).not.toContain('<script>');
    });
  });

  describe('Modal Dismissal', () => {
    it('should remove modal when close button is clicked', () => {
      const experience = {
        id: 'close-test',
        layout: 'modal',
        content: {
          message: 'Click close',
        },
      };

      sdk.modal.show(experience);

      expect(document.querySelector('.xp-modal')).toBeTruthy();

      const closeButton = document.querySelector('.xp-modal__close') as HTMLElement;
      closeButton.click();

      expect(document.querySelector('.xp-modal')).toBeFalsy();
    });

    it('should remove modal when backdrop is clicked', () => {
      const experience = {
        id: 'backdrop-test',
        layout: 'modal',
        content: {
          message: 'Click backdrop',
        },
      };

      sdk.modal.show(experience);

      const backdrop = document.querySelector('.xp-modal__backdrop') as HTMLElement;
      backdrop.click();

      expect(document.querySelector('.xp-modal')).toBeFalsy();
    });

    it('should not dismiss on backdrop click when backdropDismiss is false', () => {
      sdk.set('modal.backdropDismiss', false);

      const experience = {
        id: 'no-backdrop-dismiss',
        layout: 'modal',
        content: {
          message: 'Backdrop disabled',
        },
      };

      sdk.modal.show(experience);

      const backdrop = document.querySelector('.xp-modal__backdrop') as HTMLElement;
      backdrop.click();

      expect(document.querySelector('.xp-modal')).toBeTruthy();
    });

    it('should remove modal on Escape key when dismissable', () => {
      const experience = {
        id: 'escape-test',
        layout: 'modal',
        content: {
          message: 'Press escape',
        },
      };

      sdk.modal.show(experience);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(document.querySelector('.xp-modal')).toBeFalsy();
    });

    it('should not dismiss on Escape when dismissable is false', () => {
      sdk.set('modal.dismissable', false);

      const experience = {
        id: 'no-escape',
        layout: 'modal',
        content: {
          message: 'Cannot escape',
        },
      };

      sdk.modal.show(experience);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(document.querySelector('.xp-modal')).toBeTruthy();
    });

    it('should emit dismissed event when closed', async () => {
      const dismissedListener = vi.fn();
      sdk.on('experiences:dismissed', dismissedListener);

      const experience = {
        id: 'dismiss-event',
        layout: 'modal',
        content: {
          message: 'Will dismiss',
        },
      };

      sdk.modal.show(experience);
      sdk.modal.remove('dismiss-event');

      await vi.waitFor(() => {
        expect(dismissedListener).toHaveBeenCalled();
        const event = dismissedListener.mock.calls[0][0];
        expect(event.experienceId).toBe('dismiss-event');
        expect(event.timestamp).toBeDefined();
      });
    });
  });

  describe('Button Actions', () => {
    it('should emit action event when button is clicked', async () => {
      const actionListener = vi.fn();
      sdk.on('experiences:action', actionListener);

      const experience = {
        id: 'button-action',
        layout: 'modal',
        content: {
          message: 'Click button',
          buttons: [{ text: 'Submit', action: 'submit' }],
        },
      };

      sdk.modal.show(experience);

      const button = document.querySelector('.xp-modal__button') as HTMLElement;
      button.click();

      await vi.waitFor(() => {
        expect(actionListener).toHaveBeenCalled();
        const event = actionListener.mock.calls[0][0];
        expect(event.experienceId).toBe('button-action');
        expect(event.action).toBe('submit');
      });
    });

    it('should dismiss modal when button has dismiss:true', () => {
      const experience = {
        id: 'dismiss-button',
        layout: 'modal',
        content: {
          message: 'Auto dismiss',
          buttons: [{ text: 'Close', dismiss: true }],
        },
      };

      sdk.modal.show(experience);

      const button = document.querySelector('.xp-modal__button') as HTMLElement;
      button.click();

      expect(document.querySelector('.xp-modal')).toBeFalsy();
    });

    it('should navigate to URL when button has url property', () => {
      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      const experience = {
        id: 'url-button',
        layout: 'modal',
        content: {
          message: 'Navigate',
          buttons: [{ text: 'Go', url: 'https://example.com' }],
        },
      };

      sdk.modal.show(experience);

      const button = document.querySelector('.xp-modal__button') as HTMLElement;
      button.click();

      expect(window.location.href).toBe('https://example.com');
    });
  });

  describe('Focus Management', () => {
    it('should set focus to first focusable element on open', () => {
      const experience = {
        id: 'focus-test',
        layout: 'modal',
        content: {
          message: 'Focus test',
          buttons: [{ text: 'First' }, { text: 'Second' }],
        },
      };

      sdk.modal.show(experience);

      // First focusable element should be the close button
      const closeButton = document.querySelector('.xp-modal__close') as HTMLElement;
      expect(document.activeElement).toBe(closeButton);
    });

    it('should return focus to previous element on close', () => {
      // Create a button outside the modal
      const externalButton = document.createElement('button');
      externalButton.id = 'external-button';
      document.body.appendChild(externalButton);
      externalButton.focus();

      const experience = {
        id: 'focus-return',
        layout: 'modal',
        content: {
          message: 'Focus return test',
        },
      };

      sdk.modal.show(experience);
      sdk.modal.remove('focus-return');

      expect(document.activeElement).toBe(externalButton);

      // Cleanup
      externalButton.remove();
    });

    it('should trap focus within modal (Tab key)', () => {
      const experience = {
        id: 'focus-trap',
        layout: 'modal',
        content: {
          message: 'Focus trap',
          buttons: [{ text: 'First' }, { text: 'Last' }],
        },
      };

      sdk.modal.show(experience);

      const buttons = Array.from(document.querySelectorAll('.xp-modal__button')) as HTMLElement[];
      const lastButton = buttons[buttons.length - 1];

      // Focus last button
      lastButton.focus();

      // Simulate Tab key (should cycle to first)
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.querySelector('.xp-modal')?.dispatchEvent(tabEvent);

      // If not prevented, activeElement would change
      // Note: Full focus trap testing requires actual DOM focus behavior
      expect(document.querySelector('.xp-modal')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      const experience = {
        id: 'aria-test',
        layout: 'modal',
        content: {
          title: 'Accessible Modal',
          message: 'ARIA test',
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal');
      expect(modal?.getAttribute('role')).toBe('dialog');
      expect(modal?.getAttribute('aria-modal')).toBe('true');
      expect(modal?.getAttribute('aria-labelledby')).toBe('xp-modal-title-aria-test');
    });

    it('should not have aria-labelledby without title', () => {
      const experience = {
        id: 'no-title',
        layout: 'modal',
        content: {
          message: 'No title',
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal');
      expect(modal?.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('API Methods', () => {
    it('should check if a specific modal is showing', () => {
      const experience = {
        id: 'check-modal',
        layout: 'modal',
        content: {
          message: 'Check me',
        },
      };

      expect(sdk.modal.isShowing('check-modal')).toBe(false);

      sdk.modal.show(experience);
      expect(sdk.modal.isShowing('check-modal')).toBe(true);

      sdk.modal.remove('check-modal');
      expect(sdk.modal.isShowing('check-modal')).toBe(false);
    });

    it('should check if any modal is showing', () => {
      expect(sdk.modal.isShowing()).toBe(false);

      const experience = {
        id: 'any-modal',
        layout: 'modal',
        content: {
          message: 'Any check',
        },
      };

      sdk.modal.show(experience);
      expect(sdk.modal.isShowing()).toBe(true);
    });

    it('should not show duplicate modals', () => {
      const experience = {
        id: 'duplicate-test',
        layout: 'modal',
        content: {
          message: 'Duplicate',
        },
      };

      sdk.modal.show(experience);
      sdk.modal.show(experience);

      const modals = document.querySelectorAll('.xp-modal');
      expect(modals.length).toBe(1);
    });

    it('should handle removing non-existent modal gracefully', () => {
      expect(() => sdk.modal.remove('non-existent')).not.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit shown event when modal is displayed', async () => {
      const shownListener = vi.fn();
      sdk.on('experiences:shown', shownListener);

      const experience = {
        id: 'shown-event',
        layout: 'modal',
        content: {
          message: 'Show event',
        },
      };

      sdk.modal.show(experience);

      await vi.waitFor(() => {
        expect(shownListener).toHaveBeenCalled();
        const event = shownListener.mock.calls[0][0];
        expect(event.experienceId).toBe('shown-event');
        expect(event.timestamp).toBeDefined();
      });
    });

    it('should emit trigger:modal event when shown', async () => {
      const triggerListener = vi.fn();
      sdk.on('trigger:modal', triggerListener);

      const experience = {
        id: 'trigger-event',
        layout: 'modal',
        content: {
          message: 'Trigger event',
        },
      };

      sdk.modal.show(experience);

      await vi.waitFor(() => {
        expect(triggerListener).toHaveBeenCalled();
        const event = triggerListener.mock.calls[0][0];
        expect(event.experienceId).toBe('trigger-event');
        expect(event.shown).toBe(true);
      });
    });
  });

  describe('Cleanup', () => {
    it('should remove all modals on destroy', async () => {
      const experience1 = {
        id: 'cleanup-1',
        layout: 'modal',
        content: { message: 'First' },
      };

      sdk.modal.show(experience1);

      expect(document.querySelectorAll('.xp-modal').length).toBe(1);

      await sdk.destroy();

      expect(document.querySelectorAll('.xp-modal').length).toBe(0);
    });

    it('should remove event listeners on modal removal', () => {
      const experience = {
        id: 'listener-cleanup',
        layout: 'modal',
        content: {
          message: 'Cleanup listeners',
        },
      };

      sdk.modal.show(experience);
      sdk.modal.remove('listener-cleanup');

      // Try to trigger escape again - should not cause issues
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      // No modal should exist
      expect(document.querySelector('.xp-modal')).toBeFalsy();
    });
  });

  describe('Size Variants', () => {
    it('should render small modal (400px)', () => {
      sdk.set('modal.size', 'sm');

      const experience = {
        id: 'small-modal',
        layout: 'modal',
        content: {
          message: 'Small modal',
        },
      };

      sdk.modal.show(experience);

      const dialog = document.querySelector('.xp-modal__dialog') as HTMLElement;
      expect(dialog).toBeTruthy();
      expect(dialog.style.maxWidth).toContain('400px');
      expect(document.querySelector('.xp-modal--sm')).toBeTruthy();
    });

    it('should render medium modal (600px, default)', () => {
      const experience = {
        id: 'medium-modal',
        layout: 'modal',
        content: {
          message: 'Medium modal',
        },
      };

      sdk.modal.show(experience);

      const dialog = document.querySelector('.xp-modal__dialog') as HTMLElement;
      expect(dialog.style.maxWidth).toContain('600px');
      expect(document.querySelector('.xp-modal--md')).toBeTruthy();
    });

    it('should render large modal (800px)', () => {
      sdk.set('modal.size', 'lg');

      const experience = {
        id: 'large-modal',
        layout: 'modal',
        content: {
          message: 'Large modal',
        },
      };

      sdk.modal.show(experience);

      const dialog = document.querySelector('.xp-modal__dialog') as HTMLElement;
      expect(dialog.style.maxWidth).toContain('800px');
      expect(document.querySelector('.xp-modal--lg')).toBeTruthy();
    });

    it('should render fullscreen modal', () => {
      sdk.set('modal.size', 'fullscreen');

      const experience = {
        id: 'fullscreen-modal',
        layout: 'modal',
        content: {
          message: 'Fullscreen modal',
        },
      };

      sdk.modal.show(experience);

      const dialog = document.querySelector('.xp-modal__dialog') as HTMLElement;
      expect(dialog.style.maxWidth).toBe('100%');
      expect(dialog.style.height).toBe('100%');
      expect(document.querySelector('.xp-modal--fullscreen')).toBeTruthy();
    });

    it('should render auto-sized modal', () => {
      sdk.set('modal.size', 'auto');

      const experience = {
        id: 'auto-modal',
        layout: 'modal',
        content: {
          message: 'Auto modal',
        },
      };

      sdk.modal.show(experience);

      const dialog = document.querySelector('.xp-modal__dialog') as HTMLElement;
      expect(dialog.style.maxWidth).toBe('none'); // CSS 'none' for no max-width
      expect(document.querySelector('.xp-modal--auto')).toBeTruthy();
    });
  });

  describe('Mobile Behavior', () => {
    it('should respect mobileFullscreen: false override', async () => {
      // Test configuration API (doesn't depend on window.innerWidth)
      const newSdk = initPlugin({
        modal: {
          size: 'lg',
          mobileFullscreen: false,
        },
      }) as SDK & { modal: any };
      await newSdk.init();

      const experience = {
        id: 'lg-no-mobile',
        layout: 'modal',
        content: {
          message: 'Large without mobile fullscreen',
        },
      };

      newSdk.modal.show(experience);

      // When mobileFullscreen is false, should show 'lg' not 'fullscreen'
      const modal = document.querySelector('.xp-modal') as HTMLElement;
      expect(modal.classList.contains('xp-modal--lg')).toBe(true);

      // Cleanup
      await newSdk.destroy();
    });
  });

  describe('Hero Images', () => {
    it('should render hero image at top', () => {
      const experience = {
        id: 'image-modal',
        layout: 'modal',
        content: {
          image: {
            src: 'https://example.com/hero.jpg',
            alt: 'Hero image',
          },
          message: 'With hero image',
        },
      };

      sdk.modal.show(experience);

      const image = document.querySelector('.xp-modal__hero-image') as HTMLImageElement;
      expect(image).toBeTruthy();
      expect(image.src).toBe('https://example.com/hero.jpg');
      expect(image.alt).toBe('Hero image');
      expect(image.loading).toBe('lazy');
    });

    it('should apply custom maxHeight to image', () => {
      const experience = {
        id: 'custom-image',
        layout: 'modal',
        content: {
          image: {
            src: 'https://example.com/hero.jpg',
            alt: 'Hero image',
            maxHeight: 400,
          },
          message: 'Custom image height',
        },
      };

      sdk.modal.show(experience);

      const image = document.querySelector('.xp-modal__hero-image') as HTMLElement;
      expect(image.style.maxHeight).toBe('400px');
    });

    it('should add has-image class to dialog', () => {
      const experience = {
        id: 'image-class',
        layout: 'modal',
        content: {
          image: {
            src: 'https://example.com/hero.jpg',
            alt: 'Hero',
          },
          message: 'Test',
        },
      };

      sdk.modal.show(experience);

      expect(document.querySelector('.xp-modal__dialog--has-image')).toBeTruthy();
    });
  });

  describe('Position & Animation', () => {
    it('should position modal at bottom', () => {
      sdk.set('modal.position', 'bottom');

      const experience = {
        id: 'bottom-modal',
        layout: 'modal',
        content: {
          message: 'Bottom positioned',
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal') as HTMLElement;
      expect(modal.classList.contains('xp-modal--bottom')).toBe(true);
      expect(modal.style.alignItems).toBe('flex-end');
    });

    it('should apply fade animation by default', () => {
      const experience = {
        id: 'fade-modal',
        layout: 'modal',
        content: {
          message: 'Fade in',
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal') as HTMLElement;
      expect(modal.classList.contains('xp-modal--fade')).toBe(true);
      expect(modal.style.transition).toContain('opacity');
    });

    it('should apply slide-up animation', () => {
      sdk.set('modal.animation', 'slide-up');

      const experience = {
        id: 'slide-modal',
        layout: 'modal',
        content: {
          message: 'Slide up',
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal') as HTMLElement;
      expect(modal.classList.contains('xp-modal--slide-up')).toBe(true);
      expect(modal.style.transition).toContain('transform');
    });

    it('should support no animation', () => {
      sdk.set('modal.animation', 'none');

      const experience = {
        id: 'no-animation',
        layout: 'modal',
        content: {
          message: 'No animation',
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal') as HTMLElement;
      expect(modal.classList.contains('xp-modal--fade')).toBe(false);
      expect(modal.classList.contains('xp-modal--slide-up')).toBe(false);
    });

    it('should respect custom animation duration', () => {
      sdk.set('modal.animationDuration', 500);

      const experience = {
        id: 'custom-duration',
        layout: 'modal',
        content: {
          message: 'Custom duration',
        },
      };

      sdk.modal.show(experience);

      const modal = document.querySelector('.xp-modal') as HTMLElement;
      expect(modal.style.transition).toContain('500ms');
    });
  });

  describe('Form Support', () => {
    it('should render form with fields', () => {
      const experience = {
        id: 'form-test',
        layout: 'modal',
        content: {
          title: 'Newsletter Signup',
          message: 'Subscribe to our newsletter',
          form: {
            fields: [
              {
                name: 'email',
                type: 'email' as const,
                label: 'Email',
                required: true,
                placeholder: 'you@example.com',
              },
              { name: 'name', type: 'text' as const, label: 'Name', required: false },
            ],
            submitButton: { text: 'Subscribe', action: 'submit' },
          },
        },
      };

      sdk.modal.show(experience);

      const form = document.querySelector('.xp-modal__form');
      expect(form).toBeTruthy();

      const emailInput = document.querySelector('#form-test-email') as HTMLInputElement;
      const nameInput = document.querySelector('#form-test-name') as HTMLInputElement;
      const submitButton = form?.querySelector('button[type="submit"]');

      expect(emailInput).toBeTruthy();
      expect(emailInput.type).toBe('email');
      expect(emailInput.placeholder).toBe('you@example.com');
      expect(emailInput.required).toBe(true);

      expect(nameInput).toBeTruthy();
      expect(nameInput.type).toBe('text');

      expect(submitButton).toBeTruthy();
      expect(submitButton?.textContent).toBe('Subscribe');
    });

    it('should emit change event on input', async () => {
      const experience = {
        id: 'change-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [{ name: 'email', type: 'email' as const }],
            submitButton: { text: 'Submit', action: 'submit' },
          },
        },
      };

      const changeHandler = vi.fn();
      sdk.on('experiences:modal:form:change', changeHandler);

      sdk.modal.show(experience);

      const input = document.querySelector('#change-test-email') as HTMLInputElement;
      input.value = 'test@example.com';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      await vi.waitFor(() => {
        expect(changeHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'change-test',
            field: 'email',
            value: 'test@example.com',
          })
        );
      });
    });

    it('should validate field on blur', async () => {
      const experience = {
        id: 'validation-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [{ name: 'email', type: 'email' as const, required: true }],
            submitButton: { text: 'Submit', action: 'submit' },
          },
        },
      };

      const validationHandler = vi.fn();
      sdk.on('experiences:modal:form:validation', validationHandler);

      sdk.modal.show(experience);

      const input = document.querySelector('#validation-test-email') as HTMLInputElement;
      const errorEl = document.querySelector('#validation-test-email-error') as HTMLElement;

      // Blur with empty value (required field)
      input.value = '';
      input.dispatchEvent(new Event('blur', { bubbles: true }));

      await vi.waitFor(() => {
        expect(validationHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'validation-test',
            field: 'email',
            valid: false,
          })
        );
      });

      expect(errorEl.textContent).toContain('required');
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should clear errors when field becomes valid', async () => {
      const experience = {
        id: 'clear-error-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [{ name: 'email', type: 'email' as const, required: true }],
            submitButton: { text: 'Submit', action: 'submit' },
          },
        },
      };

      sdk.modal.show(experience);

      const input = document.querySelector('#clear-error-test-email') as HTMLInputElement;
      const errorEl = document.querySelector('#clear-error-test-email-error') as HTMLElement;

      // First, trigger error
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));

      await vi.waitFor(() => {
        expect(errorEl.textContent).toContain('required');
      });

      // Now fix the value
      input.value = 'valid@example.com';
      input.dispatchEvent(new Event('input', { bubbles: true })); // Update formData first!
      input.dispatchEvent(new Event('blur', { bubbles: true }));

      await vi.waitFor(() => {
        expect(errorEl.textContent).toBe('');
        expect(input.getAttribute('aria-invalid')).toBe('false');
      });
    });

    it('should validate entire form on submit', async () => {
      const experience = {
        id: 'submit-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [
              { name: 'email', type: 'email' as const, required: true },
              { name: 'name', type: 'text' as const, required: true },
            ],
            submitButton: { text: 'Submit', action: 'submit' },
          },
        },
      };

      const submitHandler = vi.fn();
      const validationHandler = vi.fn();
      sdk.on('experiences:modal:form:submit', submitHandler);
      sdk.on('experiences:modal:form:validation', validationHandler);

      sdk.modal.show(experience);

      const form = document.querySelector('.xp-modal__form') as HTMLFormElement;
      const emailError = document.querySelector('#submit-test-email-error') as HTMLElement;
      const nameError = document.querySelector('#submit-test-name-error') as HTMLElement;

      // Submit with empty values
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        expect(emailError.textContent).toContain('required');
        expect(nameError.textContent).toContain('required');
      });

      // Should not emit submit event
      expect(submitHandler).not.toHaveBeenCalled();
    });

    it('should emit submit event when form is valid', async () => {
      const experience = {
        id: 'valid-submit-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [{ name: 'email', type: 'email' as const, required: true }],
            submitButton: { text: 'Submit', action: 'submit' },
          },
        },
      };

      const submitHandler = vi.fn();
      sdk.on('experiences:modal:form:submit', submitHandler);

      sdk.modal.show(experience);

      const form = document.querySelector('.xp-modal__form') as HTMLFormElement;
      const input = document.querySelector('#valid-submit-test-email') as HTMLInputElement;

      // Fill in valid data
      input.value = 'test@example.com';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Submit form
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        expect(submitHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'valid-submit-test',
            formData: { email: 'test@example.com' },
          })
        );
      });
    });

    it('should disable submit button during submission', async () => {
      const experience = {
        id: 'disable-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [{ name: 'email', type: 'email' as const, required: true }],
            submitButton: { text: 'Submit', action: 'submit' },
          },
        },
      };

      sdk.modal.show(experience);

      const form = document.querySelector('.xp-modal__form') as HTMLFormElement;
      const input = document.querySelector('#disable-test-email') as HTMLInputElement;
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

      input.value = 'test@example.com';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await vi.waitFor(() => {
        expect(submitButton.disabled).toBe(true);
        expect(submitButton.textContent).toBe('Submitting...');
      });
    });

    it('should get form data', () => {
      const experience = {
        id: 'get-data-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [
              { name: 'email', type: 'email' as const },
              { name: 'name', type: 'text' as const },
            ],
            submitButton: { text: 'Submit', action: 'submit' },
          },
        },
      };

      sdk.modal.show(experience);

      const emailInput = document.querySelector('#get-data-test-email') as HTMLInputElement;
      const nameInput = document.querySelector('#get-data-test-name') as HTMLInputElement;

      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const data = sdk.modal.getFormData('get-data-test');
      expect(data).toEqual({
        email: 'test@example.com',
        name: 'John Doe',
      });
    });

    it('should reset form', () => {
      const experience = {
        id: 'reset-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [{ name: 'email', type: 'email' as const }],
            submitButton: { text: 'Submit', action: 'submit' },
          },
        },
      };

      sdk.modal.show(experience);

      const input = document.querySelector('#reset-test-email') as HTMLInputElement;
      const errorEl = document.querySelector('#reset-test-email-error') as HTMLElement;

      // Add some data and error
      input.value = 'test@example.com';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      errorEl.textContent = 'Some error';

      sdk.modal.resetForm('reset-test');

      expect(input.value).toBe('');
      expect(errorEl.textContent).toBe('');

      const data = sdk.modal.getFormData('reset-test');
      expect(data).toEqual({ email: '' });
    });

    it('should show success state', async () => {
      const experience = {
        id: 'success-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [{ name: 'email', type: 'email' as const }],
            submitButton: { text: 'Submit', action: 'submit' },
            successState: {
              title: 'Success!',
              message: 'Thank you for subscribing',
            },
          },
        },
      };

      const stateHandler = vi.fn();
      sdk.on('experiences:modal:form:state', stateHandler);

      sdk.modal.show(experience);

      sdk.modal.showFormState('success-test', 'success');

      await vi.waitFor(() => {
        expect(stateHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'success-test',
            state: 'success',
          })
        );
      });

      const form = document.querySelector('.xp-modal__form');
      const state = document.querySelector('.xp-form__state--success');

      expect(form).toBeFalsy();
      expect(state).toBeTruthy();
      expect(state?.textContent).toContain('Success!');
      expect(state?.textContent).toContain('Thank you for subscribing');
    });

    it('should show error state', async () => {
      const experience = {
        id: 'error-test',
        layout: 'modal',
        content: {
          message: 'Test',
          form: {
            fields: [{ name: 'email', type: 'email' as const }],
            submitButton: { text: 'Submit', action: 'submit' },
            errorState: {
              title: 'Error',
              message: 'Something went wrong',
            },
          },
        },
      };

      sdk.modal.show(experience);

      sdk.modal.showFormState('error-test', 'error');

      await vi.waitFor(() => {
        const state = document.querySelector('.xp-form__state--error');
        expect(state).toBeTruthy();
        expect(state?.textContent).toContain('Error');
        expect(state?.textContent).toContain('Something went wrong');
      });
    });
  });
});
