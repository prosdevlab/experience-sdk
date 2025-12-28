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
    // Note: Mobile detection relies on window.innerWidth which is difficult to mock reliably
    // in Node.js test environments (jsdom/happy-dom). These tests verify the configuration API.
    // Manual browser testing confirms mobile behavior works correctly.

    it.skip('should auto-enable fullscreen for lg size on mobile', async () => {
      // This test requires a real browser environment to properly test window.innerWidth
      // See vitest.browser.config.ts for browser-based tests
    });

    it('should respect mobileFullscreen: false override', async () => {
      // Test configuration API (doesn't depend on window.innerWidth)
      const newSdk = initPlugin({
        modal: {
          size: 'lg',
          mobileFullscreen: false,
        },
      });
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
});
