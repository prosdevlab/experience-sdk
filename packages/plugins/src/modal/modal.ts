import type { SDK } from '@lytics/sdk-kit';
import type { ExperienceButton } from '../types';
import { sanitizeHTML } from '../utils/sanitize';
import type { ModalContent, ModalPlugin } from './types';

/**
 * Modal Plugin for @prosdevlab/experience-sdk
 *
 * Renders experiences as accessible modal dialogs with:
 * - Focus trap and keyboard handling
 * - ARIA attributes for screen readers
 * - Backdrop and close button
 * - Responsive design
 */
export const modalPlugin = (plugin: any, instance: SDK): void => {
  plugin.ns('experiences.modal');
  plugin.defaults({
    modal: {
      dismissable: true,
      backdropDismiss: true,
      zIndex: 10001,
      size: 'md',
      mobileFullscreen: false,
      position: 'center',
      animation: 'fade',
      animationDuration: 200,
    },
  });

  // Track active modals
  const activeModals = new Map<string, HTMLElement>();
  // Track focus before modal opened
  const previouslyFocusedElement = new Map<string, HTMLElement | null>();

  /**
   * Get focusable elements within a container
   */
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const selector =
      'a[href], button, textarea, input, select, details, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)).filter(
      (el) => !(el as HTMLElement).hasAttribute('disabled')
    ) as HTMLElement[];
  };

  /**
   * Create focus trap for modal
   */
  const createFocusTrap = (container: HTMLElement): (() => void) => {
    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return () => {};

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Set initial focus
    firstFocusable.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  /**
   * Get modal size width
   */
  const getSizeWidth = (size: string): string => {
    switch (size) {
      case 'sm':
        return '400px';
      case 'md':
        return '600px';
      case 'lg':
        return '800px';
      case 'fullscreen':
        return '100vw';
      case 'auto':
        return 'auto';
      default:
        return '600px'; // md default
    }
  };

  /**
   * Check if mobile viewport
   */
  const isMobile = (): boolean => {
    return typeof window !== 'undefined' && window.innerWidth < 640;
  };

  /**
   * Render modal DOM structure
   */
  const renderModal = (experienceId: string, content: ModalContent): HTMLElement => {
    const modalConfig = instance.get('modal') || {};
    const zIndex = modalConfig.zIndex || 10001;
    const size = modalConfig.size || 'md';
    const position = modalConfig.position || 'center';
    const animation = modalConfig.animation || 'fade';
    const animationDuration = modalConfig.animationDuration || 200;

    // Determine if should be fullscreen
    const mobileFullscreen =
      modalConfig.mobileFullscreen !== undefined ? modalConfig.mobileFullscreen : size === 'lg'; // Auto-enable for lg size
    const shouldBeFullscreen = size === 'fullscreen' || (mobileFullscreen && isMobile());

    // Create modal container
    const container = document.createElement('div');
    const sizeClass = shouldBeFullscreen ? 'fullscreen' : size;
    const positionClass = position === 'bottom' ? 'xp-modal--bottom' : 'xp-modal--center';
    const animationClass = animation !== 'none' ? `xp-modal--${animation}` : '';
    container.className =
      `xp-modal xp-modal--${sizeClass} ${positionClass} ${animationClass} ${content.className || ''}`.trim();
    container.setAttribute('data-xp-id', experienceId);
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    if (content.title) {
      container.setAttribute('aria-labelledby', `xp-modal-title-${experienceId}`);
    }

    // Container styles
    const alignItems = position === 'bottom' ? 'flex-end' : 'center';
    container.style.cssText = `position: fixed; inset: 0; z-index: ${zIndex}; display: flex; align-items: ${alignItems}; justify-content: center;`;

    // Apply animation
    if (animation !== 'none') {
      container.style.opacity = '0';
      container.style.transition = `opacity ${animationDuration}ms ease-in-out`;

      if (animation === 'slide-up') {
        container.style.transform = 'translateY(100%)';
        container.style.transition += `, transform ${animationDuration}ms ease-out`;
      }
    }

    // Apply custom styles
    if (content.style) {
      Object.entries(content.style).forEach(([key, value]) => {
        container.style.setProperty(key, String(value));
      });
    }

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'xp-modal__backdrop';
    backdrop.style.cssText = `position: absolute; inset: 0; background-color: rgba(0, 0, 0, 0.5);`;
    container.appendChild(backdrop);

    // Dialog
    const dialog = document.createElement('div');
    const dialogWidth = shouldBeFullscreen ? '100%' : size === 'auto' ? 'none' : getSizeWidth(size);
    const dialogHeight = shouldBeFullscreen ? '100%' : 'auto';
    const dialogMaxWidth = shouldBeFullscreen ? '100%' : size === 'auto' ? 'none' : '90%';
    const dialogBorderRadius = shouldBeFullscreen ? '0' : '8px';
    const dialogPadding = content.image ? '0' : '24px';

    dialog.className = `xp-modal__dialog${content.image ? ' xp-modal__dialog--has-image' : ''}`;
    dialog.style.cssText = `position: relative; background: white; border-radius: ${dialogBorderRadius}; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: ${dialogWidth}; width: ${dialogMaxWidth}; height: ${dialogHeight}; max-height: ${shouldBeFullscreen ? '100%' : '90vh'}; overflow-y: auto; padding: ${dialogPadding};`;
    container.appendChild(dialog);

    // Hero image (if provided)
    if (content.image) {
      const img = document.createElement('img');
      img.className = 'xp-modal__hero-image';
      img.src = content.image.src;
      img.alt = content.image.alt;
      img.loading = 'lazy';

      // Use custom maxHeight if provided, otherwise default based on viewport
      const maxHeight = content.image.maxHeight || (isMobile() ? 200 : 300);
      img.style.cssText = `width: 100%; height: auto; max-height: ${maxHeight}px; object-fit: cover; border-radius: ${shouldBeFullscreen ? '0' : '8px 8px 0 0'}; display: block; margin: 0;`;

      dialog.appendChild(img);
    }

    // Close button
    if (modalConfig.dismissable !== false) {
      const closeButton = document.createElement('button');
      closeButton.className = 'xp-modal__close';
      closeButton.setAttribute('aria-label', 'Close dialog');
      closeButton.innerHTML = '&times;';
      closeButton.style.cssText = `position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; line-height: 1; cursor: pointer; padding: 4px 8px; color: #666; opacity: 0.7; transition: opacity 0.2s;`;
      closeButton.onmouseover = () => {
        closeButton.style.opacity = '1';
      };
      closeButton.onmouseout = () => {
        closeButton.style.opacity = '0.7';
      };
      closeButton.onclick = () => removeModal(experienceId);
      dialog.appendChild(closeButton);
    }

    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'xp-modal__content';
    const contentPadding = content.image ? '24px' : '24px 24px 0 24px';
    contentWrapper.style.cssText = `padding: ${contentPadding};`;

    // Title
    if (content.title) {
      const title = document.createElement('h2');
      title.id = `xp-modal-title-${experienceId}`;
      title.className = 'xp-modal__title';
      title.textContent = content.title;
      title.style.cssText = `margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111;`;
      contentWrapper.appendChild(title);
    }

    // Message
    const message = document.createElement('div');
    message.className = 'xp-modal__message';
    message.innerHTML = sanitizeHTML(content.message);
    message.style.cssText = `margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #444;`;
    contentWrapper.appendChild(message);

    // Buttons
    if (content.buttons && content.buttons.length > 0) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'xp-modal__buttons';
      buttonContainer.style.cssText = `display: flex; gap: 8px; flex-wrap: wrap;`;

      content.buttons.forEach((button: ExperienceButton) => {
        const btn = document.createElement('button');
        btn.className = `xp-modal__button xp-modal__button--${button.variant || 'secondary'}`;
        btn.textContent = button.text;

        // Base button styles
        let buttonStyles = `padding: 10px 20px; font-size: 14px; font-weight: 500; border-radius: 6px; cursor: pointer; transition: all 0.2s; border: none;`;

        // Variant styles
        if (button.variant === 'primary') {
          buttonStyles += ` background: #2563eb; color: white;`;
          btn.onmouseover = () => {
            btn.style.background = '#1d4ed8';
          };
          btn.onmouseout = () => {
            btn.style.background = '#2563eb';
          };
        } else {
          buttonStyles += ` background: #f3f4f6; color: #374151;`;
          btn.onmouseover = () => {
            btn.style.background = '#e5e7eb';
          };
          btn.onmouseout = () => {
            btn.style.background = '#f3f4f6';
          };
        }

        btn.style.cssText = buttonStyles;

        btn.onclick = () => {
          instance.emit('experiences:action', {
            experienceId,
            action: button.action,
            button,
            timestamp: Date.now(),
          });

          if (button.dismiss) {
            removeModal(experienceId);
          }

          if (button.url) {
            window.location.href = button.url;
          }
        };

        buttonContainer.appendChild(btn);
      });

      contentWrapper.appendChild(buttonContainer);
    }

    dialog.appendChild(contentWrapper);

    // Backdrop dismiss
    if (modalConfig.backdropDismiss !== false) {
      backdrop.onclick = () => removeModal(experienceId);
    }

    // Escape key handler
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalConfig.dismissable !== false) {
        removeModal(experienceId);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Store cleanup for escape listener
    (container as any).__cleanupEscape = () => {
      document.removeEventListener('keydown', handleEscape);
    };

    return container;
  };

  /**
   * Show a modal experience
   */
  const showModal = (experience: any): void => {
    const experienceId = experience.id;

    // Don't show if already showing
    if (activeModals.has(experienceId)) return;

    // Store currently focused element
    previouslyFocusedElement.set(experienceId, document.activeElement as HTMLElement);

    // Render modal
    const modal = renderModal(experienceId, experience.content);
    document.body.appendChild(modal);
    activeModals.set(experienceId, modal);

    // Trigger animation after adding to DOM
    const modalConfig = instance.get('modal') || {};
    const animation = modalConfig.animation || 'fade';

    if (animation !== 'none') {
      requestAnimationFrame(() => {
        modal.style.opacity = '1';

        if (animation === 'slide-up') {
          modal.style.transform = 'translateY(0)';
        }
      });
    }

    // Setup focus trap
    const cleanupFocusTrap = createFocusTrap(modal);
    (modal as any).__cleanupFocusTrap = cleanupFocusTrap;

    // Emit shown event
    instance.emit('experiences:shown', {
      experienceId,
      timestamp: Date.now(),
    });

    // Emit trigger event for context
    instance.emit('trigger:modal', {
      experienceId,
      timestamp: Date.now(),
      shown: true,
    });
  };

  /**
   * Remove a modal
   */
  const removeModal = (experienceId: string): void => {
    const modal = activeModals.get(experienceId);
    if (!modal) return;

    // Cleanup focus trap
    if ((modal as any).__cleanupFocusTrap) {
      (modal as any).__cleanupFocusTrap();
    }

    // Cleanup escape listener
    if ((modal as any).__cleanupEscape) {
      (modal as any).__cleanupEscape();
    }

    // Return focus
    const previousElement = previouslyFocusedElement.get(experienceId);
    if (previousElement && document.body.contains(previousElement)) {
      previousElement.focus();
    }
    previouslyFocusedElement.delete(experienceId);

    // Remove from DOM
    modal.remove();
    activeModals.delete(experienceId);

    // Emit dismissed event
    instance.emit('experiences:dismissed', {
      experienceId,
      timestamp: Date.now(),
    });
  };

  /**
   * Check if a modal is showing
   */
  const isShowing = (experienceId?: string): boolean => {
    if (experienceId) {
      return activeModals.has(experienceId);
    }
    return activeModals.size > 0;
  };

  // Expose public API
  plugin.expose({
    modal: {
      show: showModal,
      remove: removeModal,
      isShowing,
    } as ModalPlugin,
  });

  // Auto-show modal experiences when evaluated
  instance.on('experiences:evaluated', (decision: any) => {
    if (decision.show && decision.experienceId) {
      const experience = decision.experience;
      if (experience?.layout === 'modal') {
        showModal(experience);
      }
    }
  });

  // Cleanup on destroy
  instance.on('sdk:destroy', () => {
    activeModals.forEach((_, id) => {
      removeModal(id);
    });
  });
};
