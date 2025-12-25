import { SDK } from '@lytics/sdk-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Experience } from '../types';
import { type BannerPlugin, bannerPlugin } from './banner';

type SDKWithBanner = SDK & { banner: BannerPlugin };

describe('Banner Plugin', () => {
  let sdk: SDKWithBanner;

  beforeEach(() => {
    sdk = new SDK({
      banner: { position: 'top', dismissable: true },
    }) as SDKWithBanner;
    sdk.use(bannerPlugin);

    // Clean up any existing banners
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
  });

  describe('Plugin Registration', () => {
    it('should register banner plugin', () => {
      expect(sdk.banner).toBeDefined();
    });

    it('should expose banner API methods', () => {
      expect(sdk.banner.show).toBeTypeOf('function');
      expect(sdk.banner.remove).toBeTypeOf('function');
      expect(sdk.banner.isShowing).toBeTypeOf('function');
    });
  });

  describe('Configuration', () => {
    it('should use default config', () => {
      const position = sdk.get('banner.position');
      const dismissable = sdk.get('banner.dismissable');
      const zIndex = sdk.get('banner.zIndex');

      expect(position).toBe('top');
      expect(dismissable).toBe(true);
      expect(zIndex).toBe(10000);
    });

    it('should allow custom config', () => {
      const customSdk = new SDK({
        banner: { position: 'bottom', dismissable: false, zIndex: 5000 },
      }) as SDKWithBanner;
      customSdk.use(bannerPlugin);

      expect(customSdk.get('banner.position')).toBe('bottom');
      expect(customSdk.get('banner.dismissable')).toBe(false);
      expect(customSdk.get('banner.zIndex')).toBe(5000);
    });
  });

  describe('Banner Creation', () => {
    it('should create and show a banner', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: { url: { contains: '/' } },
        content: {
          title: 'Test Title',
          message: 'Test message',
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('Test Title');
      expect(banner?.textContent).toContain('Test message');
    });

    it('should show banner at top position by default', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]') as HTMLElement;
      expect(banner.style.top).toBe('0px');
      expect(banner.style.bottom).toBe('');
    });

    it('should show banner at bottom position when configured', () => {
      const customSdk = new SDK({ banner: { position: 'bottom' } }) as SDKWithBanner;
      customSdk.use(bannerPlugin);

      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      customSdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]') as HTMLElement;
      expect(banner.style.bottom).toBe('0px');
      expect(banner.style.top).toBe('');
    });

    it('should create banner with title and message', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Welcome!',
          message: 'This is a test banner',
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]');
      expect(banner?.textContent).toContain('Welcome!');
      expect(banner?.textContent).toContain('This is a test banner');
    });

    it('should create banner with only message (no title)', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: '',
          message: 'Just a message',
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]');
      expect(banner?.textContent).toContain('Just a message');
    });
  });

  describe('Banner Dismissal', () => {
    it('should include close button when dismissable', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);

      const closeButton = document.querySelector('[data-experience-id="test-banner"] button');
      expect(closeButton).toBeTruthy();
      expect(closeButton?.getAttribute('aria-label')).toBe('Close banner');
    });

    it('should not include close button when not dismissable', () => {
      const customSdk = new SDK({ banner: { dismissable: false } }) as SDKWithBanner;
      customSdk.use(bannerPlugin);

      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      customSdk.banner.show(experience);

      const closeButton = document.querySelector('[data-experience-id="test-banner"] button');
      expect(closeButton).toBeNull();
    });

    it('should remove banner when close button is clicked', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);

      const closeButton = document.querySelector(
        '[data-experience-id="test-banner"] button'
      ) as HTMLElement;
      closeButton.click();

      const banner = document.querySelector('[data-experience-id="test-banner"]');
      expect(banner).toBeNull();
    });

    it('should emit experiences:dismissed event when banner is dismissed', () => {
      const handler = vi.fn();
      sdk.on('experiences:dismissed', handler);

      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);

      const closeButton = document.querySelector(
        '[data-experience-id="test-banner"] button'
      ) as HTMLElement;
      closeButton.click();

      expect(handler).toHaveBeenCalledWith({
        experienceId: 'test-banner',
        type: 'banner',
      });
    });
  });

  describe('Banner Management', () => {
    it('should return false for isShowing when no banner is active', () => {
      expect(sdk.banner.isShowing()).toBe(false);
    });

    it('should return true for isShowing when banner is active', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);
      expect(sdk.banner.isShowing()).toBe(true);
    });

    it('should remove existing banner when showing new one', () => {
      const experience1: Experience = {
        id: 'banner-1',
        type: 'banner',
        targeting: {},
        content: {
          title: 'First',
          message: 'First message',
        },
      };

      const experience2: Experience = {
        id: 'banner-2',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Second',
          message: 'Second message',
        },
      };

      sdk.banner.show(experience1);
      expect(document.querySelector('[data-experience-id="banner-1"]')).toBeTruthy();

      sdk.banner.show(experience2);
      expect(document.querySelector('[data-experience-id="banner-1"]')).toBeNull();
      expect(document.querySelector('[data-experience-id="banner-2"]')).toBeTruthy();
    });

    it('should manually remove banner via remove()', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);
      expect(sdk.banner.isShowing()).toBe(true);

      sdk.banner.remove();
      expect(sdk.banner.isShowing()).toBe(false);
      expect(document.querySelector('[data-experience-id="test-banner"]')).toBeNull();
    });

    it('should handle remove() when no banner is showing', () => {
      expect(() => sdk.banner.remove()).not.toThrow();
      expect(sdk.banner.isShowing()).toBe(false);
    });
  });

  describe('Events', () => {
    it('should emit experiences:shown event when banner is shown', () => {
      const handler = vi.fn();
      sdk.on('experiences:shown', handler);

      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);

      expect(handler).toHaveBeenCalledWith({
        experienceId: 'test-banner',
        type: 'banner',
        timestamp: expect.any(Number),
      });
    });

    it('should auto-render banner on experiences:evaluated event', () => {
      const experience: Experience = {
        id: 'auto-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Auto Banner',
          message: 'Auto message',
        },
      };

      // Emit the event that runtime would emit
      sdk.emit('experiences:evaluated', {
        decision: {
          show: true,
          experienceId: 'auto-banner',
          reasons: ['test'],
          trace: [],
          context: {},
          metadata: { evaluatedAt: Date.now(), totalDuration: 0, experiencesEvaluated: 1 },
        },
        experience,
      });

      // Banner should be automatically rendered
      const banner = document.querySelector('[data-experience-id="auto-banner"]');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('Auto Banner');
    });

    it('should auto-hide banner when decision is false', () => {
      const experience: Experience = {
        id: 'hide-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Hide Test',
          message: 'Will hide',
        },
      };

      // First show the banner
      sdk.banner.show(experience);
      expect(sdk.banner.isShowing()).toBe(true);

      // Emit event with show: false
      sdk.emit('experiences:evaluated', {
        decision: {
          show: false,
          experienceId: 'hide-banner',
          reasons: ['Frequency cap reached'],
          trace: [],
          context: {},
          metadata: { evaluatedAt: Date.now(), totalDuration: 0, experiencesEvaluated: 1 },
        },
        experience,
      });

      // Banner should be removed
      expect(sdk.banner.isShowing()).toBe(false);
      expect(document.querySelector('[data-experience-id="hide-banner"]')).toBeNull();
    });

    it('should only handle banner-type experiences', () => {
      const modalExperience = {
        id: 'modal',
        type: 'modal' as const,
        targeting: {},
        content: {
          title: 'Modal',
          body: 'Modal content',
        },
      };

      // Emit event with modal type
      sdk.emit('experiences:evaluated', {
        decision: {
          show: true,
          experienceId: 'modal',
          reasons: ['test'],
          trace: [],
          context: {},
          metadata: { evaluatedAt: Date.now(), totalDuration: 0, experiencesEvaluated: 1 },
        },
        experience: modalExperience,
      });

      // Banner should NOT be rendered
      expect(document.querySelector('[data-experience-id="modal"]')).toBeNull();
      expect(sdk.banner.isShowing()).toBe(false);
    });

    it('should remove banner on destroy event', async () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);
      expect(sdk.banner.isShowing()).toBe(true);
      expect(document.querySelector('[data-experience-id="test-banner"]')).toBeTruthy();

      await sdk.destroy();

      // After destroy, the banner should be removed from DOM
      expect(document.querySelector('[data-experience-id="test-banner"]')).toBeNull();
    });
  });

  describe('CTA Button', () => {
    it('should render CTA button when provided', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          message: 'Test message',
          button: {
            text: 'Click Me',
            url: '/test',
          },
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]');
      const button = banner?.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe('Click Me');
    });

    it('should not render CTA button when not provided', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          message: 'Test message',
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]');
      // Should only have dismiss button (×), not a CTA button
      const buttons = banner?.querySelectorAll('button');
      expect(buttons?.length).toBe(1);
      expect(buttons?.[0].textContent).toBe('×');
    });

    it('should emit experiences:action event when CTA clicked', () => {
      const handler = vi.fn();
      sdk.on('experiences:action', handler);

      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          message: 'Test message',
          button: {
            text: 'Click Me',
            action: 'test-action',
            url: '/test',
          },
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]');
      const ctaButton = Array.from(banner?.querySelectorAll('button') || []).find(
        (btn) => btn.textContent === 'Click Me'
      ) as HTMLElement;

      ctaButton.click();

      expect(handler).toHaveBeenCalledWith({
        experienceId: 'test-banner',
        type: 'banner',
        action: 'test-action',
        url: '/test',
        timestamp: expect.any(Number),
      });
    });

    it('should respect dismissable: false config', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          message: 'Test message',
          button: {
            text: 'Click Me',
          },
          dismissable: false,
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]');
      const buttons = banner?.querySelectorAll('button');

      // Should only have CTA button, no dismiss button
      expect(buttons?.length).toBe(1);
      expect(buttons?.[0].textContent).toBe('Click Me');
    });

    it('should show both CTA and dismiss button when both provided', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          message: 'Test message',
          button: {
            text: 'Learn More',
          },
          dismissable: true,
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]');
      const buttons = banner?.querySelectorAll('button');

      // Should have both buttons
      expect(buttons?.length).toBe(2);
      expect(buttons?.[0].textContent).toBe('Learn More');
      expect(buttons?.[1].textContent).toBe('×');
    });
  });

  describe('Styling', () => {
    it('should apply correct z-index', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]') as HTMLElement;
      expect(banner.style.zIndex).toBe('10000');
    });

    it('should apply custom z-index', () => {
      const customSdk = new SDK({ banner: { zIndex: 99999 } }) as SDKWithBanner;
      customSdk.use(bannerPlugin);

      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      customSdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]') as HTMLElement;
      expect(banner.style.zIndex).toBe('99999');
    });

    it('should be fixed position', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]') as HTMLElement;
      expect(banner.style.position).toBe('fixed');
    });

    it('should span full width', () => {
      const experience: Experience = {
        id: 'test-banner',
        type: 'banner',
        targeting: {},
        content: {
          title: 'Test',
          message: 'Message',
        },
      };

      sdk.banner.show(experience);

      const banner = document.querySelector('[data-experience-id="test-banner"]') as HTMLElement;
      expect(banner.style.left).toBe('0px');
      expect(banner.style.right).toBe('0px');
    });
  });
});
