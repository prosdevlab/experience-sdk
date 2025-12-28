import type { SDK } from '@lytics/sdk-kit';
import type { ExperienceButton } from '../types';
import { sanitizeHTML } from '../utils/sanitize';
import { renderForm, renderFormState } from './form-rendering';
import { getInputErrorStyles } from './form-styles';
import { validateField, validateForm } from './form-validation';
import {
  getBackdropStyles,
  getButtonContainerStyles,
  getCloseButtonDefaultOpacity,
  getCloseButtonHoverOpacity,
  getCloseButtonStyles,
  getContentWrapperStyles,
  getDialogStyles,
  getHeroImageStyles,
  getMessageStyles,
  getPrimaryButtonDefaultBg,
  getPrimaryButtonHoverBg,
  getPrimaryButtonStyles,
  getSecondaryButtonDefaultBg,
  getSecondaryButtonHoverBg,
  getSecondaryButtonStyles,
  getTitleStyles,
} from './modal-styles';
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
  // Track form data by experience ID
  const formData = new Map<string, Record<string, string>>();

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
    backdrop.style.cssText = getBackdropStyles();
    container.appendChild(backdrop);

    // Dialog
    const dialog = document.createElement('div');
    const dialogWidth = shouldBeFullscreen ? '100%' : size === 'auto' ? 'none' : getSizeWidth(size);
    const dialogHeight = shouldBeFullscreen ? '100%' : 'auto';
    const dialogMaxWidth = shouldBeFullscreen ? '100%' : size === 'auto' ? 'none' : '90%';
    const dialogBorderRadius = shouldBeFullscreen ? '0' : '8px';
    const dialogPadding = content.image ? '0' : '24px';

    dialog.className = `xp-modal__dialog${content.image ? ' xp-modal__dialog--has-image' : ''}`;
    dialog.style.cssText = getDialogStyles({
      width: dialogWidth,
      maxWidth: dialogMaxWidth,
      height: dialogHeight,
      maxHeight: shouldBeFullscreen ? '100%' : '90vh',
      borderRadius: dialogBorderRadius,
      padding: dialogPadding,
    });
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
      img.style.cssText = getHeroImageStyles({
        maxHeight,
        borderRadius: shouldBeFullscreen ? '0' : '8px 8px 0 0',
      });

      dialog.appendChild(img);
    }

    // Close button
    if (modalConfig.dismissable !== false) {
      const closeButton = document.createElement('button');
      closeButton.className = 'xp-modal__close';
      closeButton.setAttribute('aria-label', 'Close dialog');
      closeButton.innerHTML = '&times;';
      closeButton.style.cssText = getCloseButtonStyles();
      closeButton.onmouseover = () => {
        closeButton.style.opacity = getCloseButtonHoverOpacity();
      };
      closeButton.onmouseout = () => {
        closeButton.style.opacity = getCloseButtonDefaultOpacity();
      };
      closeButton.onclick = () => removeModal(experienceId);
      dialog.appendChild(closeButton);
    }

    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'xp-modal__content';
    const contentPadding = content.image ? '24px' : '24px 24px 0 24px';
    contentWrapper.style.cssText = getContentWrapperStyles(contentPadding);

    // Title
    if (content.title) {
      const title = document.createElement('h2');
      title.id = `xp-modal-title-${experienceId}`;
      title.className = 'xp-modal__title';
      title.textContent = content.title;
      title.style.cssText = getTitleStyles();
      contentWrapper.appendChild(title);
    }

    // Message
    const message = document.createElement('div');
    message.className = 'xp-modal__message';
    message.innerHTML = sanitizeHTML(content.message);
    message.style.cssText = getMessageStyles();
    contentWrapper.appendChild(message);

    // Form or Buttons
    if (content.form) {
      // Render form
      const form = renderForm(experienceId, content.form);
      contentWrapper.appendChild(form);

      // Store form config for later use (state rendering)
      (container as any).__formConfig = content.form;

      // Initialize form data
      const data: Record<string, string> = {};
      content.form.fields.forEach((field) => {
        data[field.name] = '';
      });
      formData.set(experienceId, data);

      // Add form event listeners
      content.form.fields.forEach((field) => {
        const input = form.querySelector(`#${experienceId}-${field.name}`) as
          | HTMLInputElement
          | HTMLTextAreaElement;
        const errorEl = form.querySelector(`#${experienceId}-${field.name}-error`) as HTMLElement;

        if (!input) return;

        // Update form data on input change
        input.addEventListener('input', () => {
          const currentData = formData.get(experienceId) || {};
          currentData[field.name] = input.value;
          formData.set(experienceId, currentData);

          // Emit change event
          instance.emit('experiences:modal:form:change', {
            experienceId,
            field: field.name,
            value: input.value,
            formData: { ...currentData },
            timestamp: Date.now(),
          });
        });

        // Validate on blur
        input.addEventListener('blur', () => {
          const currentData = formData.get(experienceId) || {};
          const result = validateField(field, currentData[field.name] || '');

          if (!result.valid && result.errors) {
            // Show error
            input.style.cssText += `; ${getInputErrorStyles()}`;
            input.setAttribute('aria-invalid', 'true');
            errorEl.textContent = result.errors[field.name] || '';

            // Emit validation event
            instance.emit('experiences:modal:form:validation', {
              experienceId,
              field: field.name,
              valid: false,
              errors: result.errors,
              timestamp: Date.now(),
            });
          } else {
            // Clear error
            input.style.cssText = input.style.cssText.replace(getInputErrorStyles(), '');
            input.setAttribute('aria-invalid', 'false');
            errorEl.textContent = '';

            // Emit validation event
            instance.emit('experiences:modal:form:validation', {
              experienceId,
              field: field.name,
              valid: true,
              timestamp: Date.now(),
            });
          }
        });
      });

      // Handle form submission
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!content.form) return;

        const currentData = formData.get(experienceId) || {};
        const result = validateForm(content.form, currentData);

        if (!result.valid && result.errors) {
          // Show all errors
          content.form.fields.forEach((field) => {
            if (result.errors?.[field.name]) {
              const input = form.querySelector(
                `#${experienceId}-${field.name}`
              ) as HTMLInputElement;
              const errorEl = form.querySelector(
                `#${experienceId}-${field.name}-error`
              ) as HTMLElement;

              if (input) {
                input.style.cssText += `; ${getInputErrorStyles()}`;
                input.setAttribute('aria-invalid', 'true');
              }
              if (errorEl) {
                errorEl.textContent = result.errors[field.name] || '';
              }
            }
          });

          // Emit validation failure
          instance.emit('experiences:modal:form:validation', {
            experienceId,
            valid: false,
            errors: result.errors,
            timestamp: Date.now(),
          });

          return;
        }

        // Disable submit button
        const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Submitting...';
        }

        // Emit submit event
        instance.emit('experiences:modal:form:submit', {
          experienceId,
          formData: { ...currentData },
          timestamp: Date.now(),
        });
      });
    } else if (content.buttons && content.buttons.length > 0) {
      // Render buttons
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'xp-modal__buttons';
      buttonContainer.style.cssText = getButtonContainerStyles();

      content.buttons.forEach((button: ExperienceButton) => {
        const btn = document.createElement('button');
        btn.className = `xp-modal__button xp-modal__button--${button.variant || 'secondary'}`;
        btn.textContent = button.text;

        // Apply button styles based on variant
        if (button.variant === 'primary') {
          btn.style.cssText = getPrimaryButtonStyles();
          btn.onmouseover = () => {
            btn.style.background = getPrimaryButtonHoverBg();
          };
          btn.onmouseout = () => {
            btn.style.background = getPrimaryButtonDefaultBg();
          };
        } else {
          btn.style.cssText = getSecondaryButtonStyles();
          btn.onmouseover = () => {
            btn.style.background = getSecondaryButtonHoverBg();
          };
          btn.onmouseout = () => {
            btn.style.background = getSecondaryButtonDefaultBg();
          };
        }

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

  /**
   * Show form success or error state
   */
  const showFormState = (experienceId: string, state: 'success' | 'error'): void => {
    const modal = activeModals.get(experienceId);
    if (!modal) return;

    const form = modal.querySelector('.xp-modal__form') as HTMLFormElement;
    if (!form) return;

    // Get the form config from the experience
    // Note: We need to store this when the modal is created
    const formConfig = (modal as any).__formConfig;
    if (!formConfig) return;

    const stateConfig = state === 'success' ? formConfig.successState : formConfig.errorState;
    if (!stateConfig) return;

    // Render state element
    const stateEl = renderFormState(state, stateConfig);

    // Replace form with state
    form.replaceWith(stateEl);

    // Emit state event
    instance.emit('experiences:modal:form:state', {
      experienceId,
      state,
      timestamp: Date.now(),
    });
  };

  /**
   * Reset form to initial state
   */
  const resetForm = (experienceId: string): void => {
    const modal = activeModals.get(experienceId);
    if (!modal) return;

    const form = modal.querySelector('.xp-modal__form') as HTMLFormElement;
    if (!form) return;

    // Reset form element
    form.reset();

    // Clear form data
    const data = formData.get(experienceId);
    if (data) {
      Object.keys(data).forEach((key) => {
        data[key] = '';
      });
    }

    // Clear all error messages
    const errors = form.querySelectorAll('.xp-form__error');
    errors.forEach((error) => {
      (error as HTMLElement).textContent = '';
    });

    // Reset all inputs
    const inputs = form.querySelectorAll('.xp-form__input') as NodeListOf<
      HTMLInputElement | HTMLTextAreaElement
    >;
    inputs.forEach((input) => {
      input.setAttribute('aria-invalid', 'false');
      input.style.cssText = input.style.cssText.replace(getInputErrorStyles(), '');
    });
  };

  /**
   * Get current form data
   */
  const getFormData = (experienceId: string): Record<string, string> | null => {
    return formData.get(experienceId) || null;
  };

  // Expose public API
  plugin.expose({
    modal: {
      show: showModal,
      remove: removeModal,
      isShowing,
      showFormState,
      resetForm,
      getFormData,
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
