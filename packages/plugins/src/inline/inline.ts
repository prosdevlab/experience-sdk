import type { SDK } from '@lytics/sdk-kit';
import type { StoragePlugin } from '@lytics/sdk-kit-plugins';
import { storagePlugin } from '@lytics/sdk-kit-plugins';
import { sanitizeHTML } from '../utils/sanitize';
import { insertContent, removeContent } from './insertion';
import type { InlinePlugin } from './types';

/**
 * SDK instance with storage plugin
 */
type SDKWithStorage = SDK & { storage?: StoragePlugin };

/**
 * Inline Plugin
 *
 * Embeds experiences directly within page content using DOM selectors.
 * Supports multiple insertion positions and dismissal with persistence.
 */
export const inlinePlugin = (plugin: any, instance: SDK, config: any): void => {
  plugin.ns('experiences.inline');

  plugin.defaults({
    inline: {
      retry: false,
      retryTimeout: 5000,
    },
  });

  // Auto-load storage plugin if not present
  if (!(instance as SDKWithStorage).storage) {
    instance.use(storagePlugin);
  }

  // Cast instance to include storage
  const sdkInstance = instance as SDKWithStorage;

  // Inject CSS variables
  if (typeof document !== 'undefined') {
    const styleId = 'xp-inline-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = getInlineStyles();
      document.head.appendChild(style);
    }
  }

  const activeInlines = new Map<string, HTMLElement>();

  /**
   * Show an inline experience
   */
  const show = (experience: any): void => {
    const { id, content } = experience;

    // Check if dismissed and persisted
    if (content.persist && content.dismissable && sdkInstance.storage) {
      const dismissed = sdkInstance.storage.get(`xp-inline-dismissed-${id}`);
      if (dismissed) {
        instance.emit('experiences:inline:dismissed', {
          experienceId: id,
          reason: 'previously-dismissed',
          timestamp: Date.now(),
        });
        return;
      }
    }

    // Try to insert content
    const element = insertContent(
      content.selector,
      sanitizeHTML(content.message),
      content.position || 'replace',
      id
    );

    if (!element) {
      // Selector not found
      instance.emit('experiences:inline:error', {
        experienceId: id,
        error: 'selector-not-found',
        selector: content.selector,
        timestamp: Date.now(),
      });

      // Retry logic (if enabled)
      const retryEnabled = config.get('inline.retry') ?? false;
      const retryTimeout = config.get('inline.retryTimeout') ?? 5000;

      if (retryEnabled) {
        setTimeout(() => {
          show(experience);
        }, retryTimeout);
      }

      return;
    }

    // Store reference
    activeInlines.set(id, element);

    // Apply custom styles
    if (content.className) {
      element.classList.add(content.className);
    }
    if (content.style) {
      Object.assign(element.style, content.style);
    }

    // Add dismissal button if needed
    if (content.dismissable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'xp-inline__close';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '×';
      closeBtn.onclick = () => {
        remove(id);
        if (content.persist && sdkInstance.storage) {
          sdkInstance.storage.set(`xp-inline-dismissed-${id}`, true);
        }
        instance.emit('experiences:dismissed', {
          experienceId: id,
          timestamp: Date.now(),
        });
      };
      element.prepend(closeBtn);
    }

    // Emit shown event
    instance.emit('experiences:shown', {
      experienceId: id,
      type: 'inline',
      selector: content.selector,
      position: content.position || 'replace',
      timestamp: Date.now(),
    });

    // Emit trigger event (for chaining with other experiences)
    instance.emit('trigger:inline', {
      experienceId: id,
      timestamp: Date.now(),
    });
  };

  /**
   * Remove an inline experience
   */
  const remove = (experienceId: string): void => {
    const element = activeInlines.get(experienceId);
    if (!element) return;

    removeContent(experienceId);
    activeInlines.delete(experienceId);
  };

  /**
   * Check if an inline experience is showing
   */
  const isShowing = (experienceId?: string): boolean => {
    if (experienceId) {
      return activeInlines.has(experienceId);
    }
    return activeInlines.size > 0;
  };

  // Expose public API
  plugin.expose({
    inline: {
      show,
      remove,
      isShowing,
    } as InlinePlugin,
  });

  // Auto-show on evaluation
  instance.on('experiences:evaluated', (data: any) => {
    if (data.decision?.show && data.experience?.type === 'inline') {
      show(data.experience);
    }
  });

  // Cleanup on destroy
  instance.on('sdk:destroy', () => {
    for (const id of Array.from(activeInlines.keys())) {
      remove(id);
    }
  });
};

/**
 * Get CSS styles for inline experiences
 */
function getInlineStyles(): string {
  return `
    :root {
      --xp-inline-close-size: 24px;
      --xp-inline-close-color: #666;
      --xp-inline-close-hover-color: #111;
      --xp-inline-close-bg: transparent;
      --xp-inline-close-hover-bg: rgba(0, 0, 0, 0.05);
      --xp-inline-close-border-radius: 4px;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --xp-inline-close-color: #9ca3af;
        --xp-inline-close-hover-color: #f9fafb;
        --xp-inline-close-hover-bg: rgba(255, 255, 255, 0.1);
      }
    }

    .xp-inline {
      position: relative;
    }

    .xp-inline__close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: var(--xp-inline-close-size);
      height: var(--xp-inline-close-size);
      padding: 0;
      border: none;
      background: var(--xp-inline-close-bg);
      color: var(--xp-inline-close-color);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      border-radius: var(--xp-inline-close-border-radius);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .xp-inline__close:hover {
      background: var(--xp-inline-close-hover-bg);
      color: var(--xp-inline-close-hover-color);
    }
  `;
}
