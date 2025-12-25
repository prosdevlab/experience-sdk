/**
 * Banner Plugin
 *
 * Renders banner experiences at the top or bottom of the page.
 * Auto-shows banners when experiences are evaluated.
 */

import type { PluginFunction } from '@lytics/sdk-kit';
import type { BannerContent, Decision, Experience } from '../types';

export interface BannerPluginConfig {
  banner?: {
    position?: 'top' | 'bottom';
    dismissable?: boolean;
    zIndex?: number;
  };
}

export interface BannerPlugin {
  show(experience: Experience): void;
  remove(): void;
  isShowing(): boolean;
}

/**
 * Banner Plugin
 *
 * Automatically renders banner experiences when they are evaluated.
 *
 * @example
 * ```typescript
 * import { createInstance } from '@prosdevlab/experience-sdk';
 * import { bannerPlugin } from '@prosdevlab/experience-sdk-plugins';
 *
 * const sdk = createInstance({ banner: { position: 'top', dismissable: true } });
 * sdk.use(bannerPlugin);
 * ```
 */
export const bannerPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('banner');

  // Set defaults
  plugin.defaults({
    banner: {
      position: 'top',
      dismissable: true,
      zIndex: 10000,
    },
  });

  let activeBanner: HTMLElement | null = null;

  /**
   * Create banner DOM element
   */
  function createBannerElement(experience: Experience): HTMLElement {
    const content = experience.content as BannerContent;
    const position = config.get('banner.position') ?? 'top';
    const dismissable = config.get('banner.dismissable') ?? true;
    const zIndex = config.get('banner.zIndex') ?? 10000;

    // Create banner container
    const banner = document.createElement('div');
    banner.setAttribute('data-experience-id', experience.id);
    banner.style.cssText = `
      position: fixed;
      ${position}: 0;
      left: 0;
      right: 0;
      background: #007bff;
      color: #ffffff;
      padding: 16px 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      z-index: ${zIndex};
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    `;

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'flex: 1; margin-right: 20px;';

    // Add title if present
    if (content.title) {
      const title = document.createElement('div');
      title.textContent = content.title;
      title.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
      contentDiv.appendChild(title);
    }

    // Add message
    const message = document.createElement('div');
    message.textContent = content.message;
    contentDiv.appendChild(message);

    banner.appendChild(contentDiv);

    // Add dismiss button if dismissable
    if (dismissable) {
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close banner');
      closeButton.style.cssText = `
        background: transparent;
        border: none;
        color: inherit;
        font-size: 28px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        margin: 0;
        opacity: 0.8;
        transition: opacity 0.2s;
      `;

      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.opacity = '1';
      });

      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.opacity = '0.8';
      });

      closeButton.addEventListener('click', () => {
        remove();
        instance.emit('experiences:dismissed', {
          experienceId: experience.id,
          type: 'banner',
        });
      });

      banner.appendChild(closeButton);
    }

    return banner;
  }

  /**
   * Show a banner experience
   */
  function show(experience: Experience): void {
    // Remove any existing banner first
    if (activeBanner) {
      remove();
    }

    // Only show if we're in a browser environment
    if (typeof document === 'undefined') {
      return;
    }

    const banner = createBannerElement(experience);
    document.body.appendChild(banner);
    activeBanner = banner;

    instance.emit('experiences:shown', {
      experienceId: experience.id,
      type: 'banner',
      timestamp: Date.now(),
    });
  }

  /**
   * Remove the active banner
   */
  function remove(): void {
    if (activeBanner?.parentNode) {
      activeBanner.parentNode.removeChild(activeBanner);
      activeBanner = null;
    }
  }

  /**
   * Check if a banner is currently showing
   */
  function isShowing(): boolean {
    return activeBanner !== null;
  }

  // Expose banner API
  plugin.expose({
    banner: {
      show,
      remove,
      isShowing,
    },
  });

  // Auto-show banner on experiences:evaluated event
  instance.on('experiences:evaluated', ({ decision, experience }) => {
    // Only handle banner-type experiences
    if (experience?.type === 'banner') {
      if (decision.show) {
        show(experience);
      } else if (activeBanner) {
        // Hide banner if decision says don't show
        remove();
      }
    }
  });

  // Cleanup on destroy
  instance.on('sdk:destroy', () => {
    remove();
  });
};
