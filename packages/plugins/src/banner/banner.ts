/**
 * Banner Plugin
 *
 * Renders banner experiences at the top or bottom of the page.
 * Auto-shows banners when experiences are evaluated.
 */

import type { PluginFunction } from '@lytics/sdk-kit';
import type { BannerContent, Decision, Experience } from '../types';
import { sanitizeHTML } from '../utils/sanitize';

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
   * Inject default banner styles if not already present
   */
  function injectDefaultStyles(): void {
    const styleId = 'xp-banner-styles';
    if (document.getElementById(styleId)) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .xp-banner {
        position: fixed;
        left: 0;
        right: 0;
        width: 100%;
        padding: 16px 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
        z-index: 10000;
        background: #f9fafb;
        color: #111827;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      }
      
      .xp-banner--top {
        top: 0;
      }
      
      .xp-banner--bottom {
        bottom: 0;
        border-bottom: none;
        border-top: 1px solid #e5e7eb;
        box-shadow: 0 -1px 3px 0 rgba(0, 0, 0, 0.05);
      }
      
      .xp-banner__container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        width: 100%;
      }
      
      .xp-banner__content {
        flex: 1;
        min-width: 0;
      }
      
      .xp-banner__title {
        font-weight: 600;
        margin-bottom: 4px;
        margin-top: 0;
        font-size: 14px;
      }
      
      .xp-banner__message {
        margin: 0;
        font-size: 14px;
      }
      
      .xp-banner__buttons {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      
      .xp-banner__button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
      }
      
      .xp-banner__button--primary {
        background: #2563eb;
        color: #ffffff;
      }
      
      .xp-banner__button--primary:hover {
        background: #1d4ed8;
      }
      
      .xp-banner__button--secondary {
        background: #ffffff;
        color: #374151;
        border: 1px solid #d1d5db;
      }
      
      .xp-banner__button--secondary:hover {
        background: #f9fafb;
      }
      
      .xp-banner__button--link {
        background: transparent;
        color: #2563eb;
        padding: 4px 8px;
        font-weight: 400;
        text-decoration: underline;
      }
      
      .xp-banner__button--link:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      
      .xp-banner__close {
        background: transparent;
        border: none;
        color: #6b7280;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        margin: 0;
        opacity: 0.7;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }
      
      .xp-banner__close:hover {
        opacity: 1;
      }
      
      @media (max-width: 640px) {
        .xp-banner__container {
          flex-direction: column;
          align-items: stretch;
        }
        
        .xp-banner__buttons {
          width: 100%;
          flex-direction: column;
        }
        
        .xp-banner__button {
          width: 100%;
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .xp-banner {
          background: #1f2937;
          color: #f3f4f6;
          border-bottom-color: #374151;
        }
        
        .xp-banner--bottom {
          border-top-color: #374151;
        }
        
        .xp-banner__button--primary {
          background: #3b82f6;
        }
        
        .xp-banner__button--primary:hover {
          background: #2563eb;
        }
        
        .xp-banner__button--secondary {
          background: #374151;
          color: #f3f4f6;
          border-color: #4b5563;
        }
        
        .xp-banner__button--secondary:hover {
          background: #4b5563;
        }
        
        .xp-banner__button--link {
          color: #93c5fd;
        }
        
        .xp-banner__close {
          color: #9ca3af;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create banner DOM element
   */
  function createBannerElement(experience: Experience): HTMLElement {
    const content = experience.content as BannerContent;
    // Allow per-experience position override, fall back to global config
    const position = content.position ?? config.get('banner.position') ?? 'top';
    const dismissable = content.dismissable ?? config.get('banner.dismissable') ?? true;
    const zIndex = config.get('banner.zIndex') ?? 10000;

    // Inject default styles if needed
    injectDefaultStyles();

    // Create banner container
    const banner = document.createElement('div');
    banner.setAttribute('data-experience-id', experience.id);

    // Build className: base classes + position + user's custom class
    const baseClasses = ['xp-banner', `xp-banner--${position}`];
    if (content.className) {
      baseClasses.push(content.className);
    }
    banner.className = baseClasses.join(' ');

    // Apply user's custom styles
    if (content.style) {
      Object.assign(banner.style, content.style);
    }

    // Override z-index if configured
    if (zIndex !== 10000) {
      banner.style.zIndex = String(zIndex);
    }

    // Create container
    const container = document.createElement('div');
    container.className = 'xp-banner__container';
    banner.appendChild(container);

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'xp-banner__content';

    // Add title if present
    if (content.title) {
      const title = document.createElement('h3');
      title.className = 'xp-banner__title';
      // Sanitize HTML to prevent XSS attacks
      title.innerHTML = sanitizeHTML(content.title);
      contentDiv.appendChild(title);
    }

    // Add message
    const message = document.createElement('p');
    message.className = 'xp-banner__message';
    // Sanitize HTML to prevent XSS attacks
    message.innerHTML = sanitizeHTML(content.message);
    contentDiv.appendChild(message);

    container.appendChild(contentDiv);

    banner.appendChild(contentDiv);

    // Create button container for actions and/or dismiss
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    `;

    // Create buttons container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'xp-banner__buttons';

    // Helper function to create button with variant styling
    function createButton(buttonConfig: {
      text: string;
      action?: string;
      url?: string;
      variant?: 'primary' | 'secondary' | 'link';
      metadata?: Record<string, unknown>;
      className?: string;
      style?: Record<string, string>;
    }): HTMLButtonElement {
      const button = document.createElement('button');
      button.textContent = buttonConfig.text;

      const variant = buttonConfig.variant || 'primary';

      // Build className: base class + variant + user's custom class
      const buttonClasses = ['xp-banner__button', `xp-banner__button--${variant}`];
      if (buttonConfig.className) {
        buttonClasses.push(buttonConfig.className);
      }
      button.className = buttonClasses.join(' ');

      // Apply user's custom styles
      if (buttonConfig.style) {
        Object.assign(button.style, buttonConfig.style);
      }

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
        buttonsDiv.appendChild(button);
      });
    }

    // Add dismiss button if dismissable
    if (dismissable) {
      const closeButton = document.createElement('button');
      closeButton.className = 'xp-banner__close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close banner');

      closeButton.addEventListener('click', () => {
        remove(experience.id);
        instance.emit('experiences:dismissed', {
          experienceId: experience.id,
          type: 'banner',
        });
      });

      buttonsDiv.appendChild(closeButton);
    }

    container.appendChild(buttonsDiv);

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
