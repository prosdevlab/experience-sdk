# Phase 2: Presentation Layer - Implementation Plan

## Overview

This document provides step-by-step implementation guidance for Phase 2: Presentation Layer.

---

## Task 1: Modal Plugin

### 1.1 Create File Structure

```bash
mkdir -p packages/plugins/src/modal
touch packages/plugins/src/modal/index.ts
touch packages/plugins/src/modal/modal.ts
touch packages/plugins/src/modal/modal.test.ts
touch packages/plugins/src/modal/types.ts
```

### 1.2 Define Types (`types.ts`)

```typescript
import type { PluginFunction } from '@lytics/sdk-kit';
import type { BannerButton } from '../types';

export interface ModalConfig {
  modal?: {
    /** Allow dismissal via close button */
    dismissable?: boolean;
    /** Allow dismissal via backdrop click */
    backdropDismiss?: boolean;
    /** Z-index for modal */
    zIndex?: number;
  };
}

export interface ModalContent {
  /** Modal title */
  title?: string;
  /** Modal message (supports HTML via sanitizer) */
  message: string;
  /** Array of action buttons */
  buttons?: BannerButton[];
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
}

export interface ModalPlugin {
  /** Show a modal experience */
  show(experience: any): void;
  /** Remove a specific modal */
  remove(experienceId: string): void;
  /** Check if modal is showing */
  isShowing(experienceId?: string): boolean;
}

export type { PluginFunction };
```

### 1.3 Implement Core Modal (`modal.ts`)

```typescript
import type { SDK } from '@lytics/sdk-kit';
import type { ModalContent, ModalPlugin } from './types';
import { sanitizeHtml } from '../utils/sanitize';

const MODAL_CONTAINER_ID = 'xp-modal-container';

// Pure function: Create modal HTML
export function createModalHTML(
  experienceId: string,
  content: ModalContent,
  dismissable: boolean
): string {
  const sanitizedMessage = sanitizeHtml(content.message);
  const sanitizedTitle = content.title ? sanitizeHtml(content.title) : '';
  
  const titleHTML = sanitizedTitle
    ? `<div class="xp-modal__header"><h2 class="xp-modal__title" id="xp-modal-title-${experienceId}">${sanitizedTitle}</h2></div>`
    : '';
  
  const closeButton = dismissable
    ? `<button type="button" class="xp-modal__close" aria-label="Close" data-xp-action="dismiss">×</button>`
    : '';
  
  const buttonsHTML = content.buttons?.map((button, index) => {
    const variant = button.variant || 'primary';
    const btnClass = `xp-modal__button xp-modal__button--${variant} ${button.className || ''}`;
    const action = button.action || button.text.toLowerCase().replace(/\s+/g, '-');
    
    return button.url
      ? `<a href="${button.url}" class="${btnClass}" data-xp-action="${action}" data-xp-button-index="${index}">${button.text}</a>`
      : `<button type="button" class="${btnClass}" data-xp-action="${action}" data-xp-button-index="${index}">${button.text}</button>`;
  }).join('') || '';
  
  return `
    <div class="xp-modal ${content.className || ''}" role="dialog" aria-modal="true" aria-labelledby="xp-modal-title-${experienceId}" data-xp-id="${experienceId}" style="z-index: ${10001}">
      <div class="xp-modal__backdrop" data-xp-action="backdrop"></div>
      <div class="xp-modal__dialog" role="document">
        <div class="xp-modal__content">
          ${closeButton}
          ${titleHTML}
          <div class="xp-modal__body" id="xp-modal-desc-${experienceId}">
            ${sanitizedMessage}
          </div>
          ${buttonsHTML ? `<div class="xp-modal__footer">${buttonsHTML}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

// Pure function: Get focusable elements
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  
  return Array.from(container.querySelectorAll(selectors));
}

// Pure function: Create focus trap
export function createFocusTrap(
  container: HTMLElement,
  onEscape: () => void
): { activate: () => void; deactivate: () => void } {
  let previouslyFocused: HTMLElement | null = null;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onEscape();
      return;
    }
    
    if (e.key === 'Tab') {
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;
      
      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };
  
  return {
    activate: () => {
      previouslyFocused = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus first focusable element
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    },
    deactivate: () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Return focus to previously focused element
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    }
  };
}

export const modalPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('experiences.modal');
  
  plugin.defaults({
    modal: {
      dismissable: true,
      backdropDismiss: true,
      zIndex: 10001
    }
  });
  
  const modalConfig = (instance as SDK).config('modal') || {};
  const activeModals = new Map<string, { element: HTMLElement; trap: any }>();
  
  // Ensure container exists
  const getOrCreateContainer = (): HTMLElement => {
    let container = document.getElementById(MODAL_CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = MODAL_CONTAINER_ID;
      document.body.appendChild(container);
    }
    return container;
  };
  
  // Show modal
  const show = (experience: any) => {
    const { id, content } = experience;
    
    // Remove existing modal if present
    if (activeModals.has(id)) {
      remove(id);
    }
    
    const container = getOrCreateContainer();
    const modalHTML = createModalHTML(
      id,
      content,
      modalConfig.dismissable ?? true
    );
    
    // Create modal element
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHTML;
    const modalElement = wrapper.firstElementChild as HTMLElement;
    
    // Apply custom styles
    if (content.style) {
      const dialog = modalElement.querySelector('.xp-modal__dialog') as HTMLElement;
      if (dialog) {
        Object.assign(dialog.style, content.style);
      }
    }
    
    container.appendChild(modalElement);
    
    // Create focus trap
    const trap = createFocusTrap(modalElement, () => {
      if (modalConfig.dismissable) {
        remove(id);
        (instance as SDK).emit('experiences:dismissed', { experienceId: id });
      }
    });
    
    // Store modal reference
    activeModals.set(id, { element: modalElement, trap });
    
    // Activate focus trap
    trap.activate();
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Set up event listeners
    modalElement.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.xpAction;
      
      if (!action) return;
      
      e.preventDefault();
      
      if (action === 'backdrop' && modalConfig.backdropDismiss) {
        remove(id);
        (instance as SDK).emit('experiences:dismissed', { experienceId: id });
      } else if (action === 'dismiss') {
        remove(id);
        (instance as SDK).emit('experiences:dismissed', { experienceId: id });
      } else {
        const buttonIndex = target.dataset.xpButtonIndex;
        const button = content.buttons?.[Number(buttonIndex)];
        
        (instance as SDK).emit('experiences:action', {
          experienceId: id,
          action,
          button,
          text: target.textContent?.trim(),
          variant: button?.variant,
          metadata: button?.metadata,
          url: button?.url
        });
        
        // Navigate if URL provided
        if (button?.url && target.tagName === 'A') {
          // Let default behavior handle navigation
        } else if (button?.url) {
          window.location.href = button.url;
        }
        
        // Remove modal after action
        remove(id);
      }
    });
    
    // Emit shown event
    (instance as SDK).emit('experiences:shown', {
      experienceId: id,
      type: 'modal'
    });
  };
  
  // Remove modal
  const remove = (experienceId: string) => {
    const modal = activeModals.get(experienceId);
    if (!modal) return;
    
    // Deactivate focus trap
    modal.trap.deactivate();
    
    // Remove element
    modal.element.remove();
    activeModals.delete(experienceId);
    
    // Restore body scroll if no modals remain
    if (activeModals.size === 0) {
      document.body.style.overflow = '';
      
      const container = document.getElementById(MODAL_CONTAINER_ID);
      if (container && container.children.length === 0) {
        container.remove();
      }
    }
  };
  
  // Check if showing
  const isShowing = (experienceId?: string): boolean => {
    if (experienceId) {
      return activeModals.has(experienceId);
    }
    return activeModals.size > 0;
  };
  
  // Expose API
  plugin.expose({
    modal: {
      show,
      remove,
      isShowing
    } as ModalPlugin
  });
  
  // Listen for evaluated experiences
  (instance as SDK).on('experiences:evaluated', (data: any) => {
    if (data.decision?.show && data.experience?.type === 'modal') {
      show(data.experience);
    }
  });
  
  // Cleanup on destroy
  (instance as SDK).on('destroy', () => {
    for (const id of Array.from(activeModals.keys())) {
      remove(id);
    }
  });
};
```

### 1.4 Barrel Export (`index.ts`)

```typescript
export * from './types';
export { modalPlugin } from './modal';
```

### 1.5 Add Default Styles

Add minimal styles to support modal rendering. These go in the plugin file as a string that gets injected.

---

## Task 2: Inline Plugin

[Similar structure - I can continue if you'd like the full plan]

---

## Task 3: Integration Tests

[Test modal + display conditions working together]

---

## Task 4: Playground Examples

[Build interactive demos]

---

## Task 5: Documentation

[Add modal/inline plugin docs]

---

Would you like me to continue with the full implementation plan, or should we move to creating the GitHub issues (tasks.md)?

