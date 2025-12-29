import type { InsertionPosition } from './types';

/**
 * Insert content into a target element using specified position
 *
 * @param selector - CSS selector for target element
 * @param content - HTML content to insert
 * @param position - Where to insert the content
 * @param experienceId - Unique identifier for the experience
 * @returns The created wrapper element, or null if target not found
 */
export function insertContent(
  selector: string,
  content: string,
  position: InsertionPosition,
  experienceId: string
): HTMLElement | null {
  const target = document.querySelector(selector);

  if (!target) {
    return null;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'xp-inline';
  wrapper.setAttribute('data-xp-id', experienceId);
  wrapper.innerHTML = content;

  switch (position) {
    case 'replace':
      target.innerHTML = '';
      target.appendChild(wrapper);
      break;
    case 'append':
      target.appendChild(wrapper);
      break;
    case 'prepend':
      target.insertBefore(wrapper, target.firstChild);
      break;
    case 'before':
      target.parentElement?.insertBefore(wrapper, target);
      break;
    case 'after':
      target.parentElement?.insertBefore(wrapper, target.nextSibling);
      break;
  }

  return wrapper;
}

/**
 * Remove inline content by experience ID
 *
 * @param experienceId - Unique identifier for the experience
 * @returns True if element was found and removed, false otherwise
 */
export function removeContent(experienceId: string): boolean {
  const element = document.querySelector(`[data-xp-id="${experienceId}"]`);

  if (!element) {
    return false;
  }

  element.remove();
  return true;
}
