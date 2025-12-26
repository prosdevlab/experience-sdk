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

  // Track multiple active banners by experience ID
  const activeBanners = new Map<string, HTMLElement>();

  /**
   * Create banner DOM element
   */
  function createBannerElement(experience: Experience): HTMLElement {
    const content = experience.content as BannerContent;
    // Allow per-experience position override, fall back to global config
    const position = content.position ?? config.get('banner.position') ?? 'top';
    const dismissable = content.dismissable ?? config.get('banner.dismissable') ?? true;
    const zIndex = config.get('banner.zIndex') ?? 10000;

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Theme-aware colors - professional subtle style
    const bgColor = isDarkMode ? '#1f2937' : '#f9fafb';
    const textColor = isDarkMode ? '#f3f4f6' : '#111827';
    const borderColor = isDarkMode ? '#374151' : '#e5e7eb';
    const shadowColor = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)';

    // Create banner container
    const banner = document.createElement('div');
    banner.setAttribute('data-experience-id', experience.id);

    // Add responsive media query styles
    const styleId = `banner-responsive-${experience.id}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media (max-width: 640px) {
          [data-experience-id="${experience.id}"] {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          [data-experience-id="${experience.id}"] > div:last-child {
            width: 100%;
            flex-direction: column !important;
          }
          [data-experience-id="${experience.id}"] button {
            width: 100%;
          }
        }
      `;
      document.head.appendChild(style);
    }

    banner.style.cssText = `
      position: fixed;
      ${position}: 0;
      left: 0;
      right: 0;
      background: ${bgColor};
      color: ${textColor};
      padding: 16px 20px;
      border-${position === 'top' ? 'bottom' : 'top'}: 1px solid ${borderColor};
      box-shadow: 0 ${position === 'top' ? '1' : '-1'}px 3px 0 ${shadowColor};
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

    // Create button container for actions and/or dismiss
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    `;

    // Helper function to create button with variant styling
    function createButton(buttonConfig: {
      text: string;
      action?: string;
      url?: string;
      variant?: 'primary' | 'secondary' | 'link';
      metadata?: Record<string, unknown>;
    }): HTMLButtonElement {
      const button = document.createElement('button');
      button.textContent = buttonConfig.text;

      const variant = buttonConfig.variant || 'primary';

      // Variant-based styling
      let bg: string, hoverBg: string, textColor: string, border: string;

      if (variant === 'primary') {
        bg = isDarkMode ? '#3b82f6' : '#2563eb';
        hoverBg = isDarkMode ? '#2563eb' : '#1d4ed8';
        textColor = '#ffffff';
        border = 'none';
      } else if (variant === 'secondary') {
        bg = isDarkMode ? '#374151' : '#ffffff';
        hoverBg = isDarkMode ? '#4b5563' : '#f9fafb';
        textColor = isDarkMode ? '#f3f4f6' : '#374151';
        border = isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db';
      } else {
        // 'link'
        bg = 'transparent';
        hoverBg = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        textColor = isDarkMode ? '#93c5fd' : '#2563eb';
        border = 'none';
      }

      button.style.cssText = `
        background: ${bg};
        border: ${border};
        color: ${textColor};
        padding: ${variant === 'link' ? '4px 8px' : '8px 16px'};
        font-size: 14px;
        font-weight: ${variant === 'link' ? '400' : '500'};
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: ${variant === 'link' ? 'underline' : 'none'};
      `;

      button.addEventListener('mouseenter', () => {
        button.style.background = hoverBg;
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = bg;
      });

      button.addEventListener('click', () => {
        // Emit action event
        instance.emit('experiences:action', {
          experienceId: experience.id,
          type: 'banner',
          action: buttonConfig.action,
          url: buttonConfig.url,
          metadata: buttonConfig.metadata,
          variant: variant,
          timestamp: Date.now(),
        });

        // Navigate if URL provided
        if (buttonConfig.url) {
          window.location.href = buttonConfig.url;
        }
      });

      return button;
    }

    // Add buttons from buttons array
    if (content.buttons && content.buttons.length > 0) {
      content.buttons.forEach((buttonConfig) => {
        const button = createButton(buttonConfig);
        buttonContainer.appendChild(button);
      });
    }

    // Add dismiss button if dismissable
    if (dismissable) {
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close banner');

      const closeColor = isDarkMode ? '#9ca3af' : '#6b7280';

      closeButton.style.cssText = `
        background: transparent;
        border: none;
        color: ${closeColor};
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        margin: 0;
        opacity: 0.7;
        transition: opacity 0.2s;
      `;

      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.opacity = '1';
      });

      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.opacity = '0.7';
      });

      closeButton.addEventListener('click', () => {
        remove(experience.id);
        instance.emit('experiences:dismissed', {
          experienceId: experience.id,
          type: 'banner',
        });
      });

      buttonContainer.appendChild(closeButton);
    }

    banner.appendChild(buttonContainer);

    return banner;
  }

  /**
   * Show a banner experience
   */
  function show(experience: Experience): void {
    // If banner already showing for this experience, skip
    if (activeBanners.has(experience.id)) {
      return;
    }

    // Only show if we're in a browser environment
    if (typeof document === 'undefined') {
      return;
    }

    const banner = createBannerElement(experience);
    document.body.appendChild(banner);
    activeBanners.set(experience.id, banner);

    instance.emit('experiences:shown', {
      experienceId: experience.id,
      type: 'banner',
      timestamp: Date.now(),
    });
  }

  /**
   * Remove a banner by experience ID (or all if no ID provided)
   */
  function remove(experienceId?: string): void {
    if (experienceId) {
      // Remove specific banner
      const banner = activeBanners.get(experienceId);
      if (banner?.parentNode) {
        banner.parentNode.removeChild(banner);
      }
      activeBanners.delete(experienceId);
    } else {
      // Remove all banners
      for (const [id, banner] of activeBanners.entries()) {
        if (banner?.parentNode) {
          banner.parentNode.removeChild(banner);
        }
        activeBanners.delete(id);
      }
    }
  }

  /**
   * Check if any banner is currently showing
   */
  function isShowing(): boolean {
    return activeBanners.size > 0;
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
  instance.on('experiences:evaluated', (payload: unknown) => {
    // Handle both single decision and array of decisions
    // evaluate() emits: { decision, experience }
    // evaluateAll() emits: [{ decision, experience }, ...]
    const items = Array.isArray(payload) ? payload : [payload];

    for (const item of items) {
      // Item is { decision, experience }
      const typedItem = item as { decision?: Decision; experience?: Experience };
      const decision = typedItem.decision;
      const experience = typedItem.experience;

      // Only handle banner-type experiences
      if (experience?.type === 'banner') {
        if (decision?.show) {
          show(experience);
        } else if (experience.id && activeBanners.has(experience.id)) {
          // Hide specific banner if decision says don't show
          remove(experience.id);
        }
      }
    }
  });

  // Cleanup on destroy
  instance.on('sdk:destroy', () => {
    remove();
  });
};
