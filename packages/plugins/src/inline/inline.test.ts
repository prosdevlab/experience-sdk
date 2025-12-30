/**
 * @vitest-environment happy-dom
 */
import { SDK } from '@lytics/sdk-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inlinePlugin } from './inline';

// Helper to initialize SDK with inline plugin
function initPlugin(config = {}) {
  const sdk = new SDK({
    name: 'test-sdk',
    ...config,
  });

  sdk.use(inlinePlugin);

  // Ensure body exists
  if (!document.body) {
    document.body = document.createElement('body');
  }

  return sdk;
}

describe('Inline Plugin', () => {
  let sdk: SDK & { inline?: any };

  beforeEach(async () => {
    vi.useFakeTimers();
    sdk = initPlugin();
    await sdk.init();
  });

  afterEach(async () => {
    // Clean up any inline content
    document.querySelectorAll('.xp-inline').forEach((el) => {
      el.remove();
    });

    // Clean up any target elements
    document.body.innerHTML = '';

    if (sdk) {
      await sdk.destroy();
    }

    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should register the inline plugin', () => {
    expect(sdk.inline).toBeDefined();
    expect(sdk.inline.show).toBeInstanceOf(Function);
    expect(sdk.inline.remove).toBeInstanceOf(Function);
    expect(sdk.inline.isShowing).toBeInstanceOf(Function);
  });

  it('should set default configuration', () => {
    // Check that defaults were set by verifying plugin registered
    expect(sdk.inline).toBeDefined();
  });

  describe('Insertion Methods', () => {
    it('should insert content with "replace" position', () => {
      // Create target element
      const target = document.createElement('div');
      target.id = 'test-target';
      target.innerHTML = '<p>Original content</p>';
      document.body.appendChild(target);

      const experience = {
        id: 'replace-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          position: 'replace',
          message: '<p>New content</p>',
        },
      };

      sdk.inline.show(experience);

      const inline = document.querySelector('.xp-inline');
      expect(inline).toBeTruthy();
      expect(inline?.innerHTML).toBe('<p>New content</p>');
      expect(target.querySelector('p')?.textContent).toBe('New content'); // Content replaced
    });

    it('should insert content with "append" position', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      target.innerHTML = '<p>Original</p>';
      document.body.appendChild(target);

      const experience = {
        id: 'append-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          position: 'append',
          message: '<span>Appended</span>',
        },
      };

      sdk.inline.show(experience);

      const inline = document.querySelector('.xp-inline');
      expect(inline).toBeTruthy();
      expect(target.children.length).toBe(2); // Original + appended
      expect(target.children[0].tagName).toBe('P'); // Original first
      expect(target.children[1].className).toBe('xp-inline'); // Appended second
    });

    it('should insert content with "prepend" position', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      target.innerHTML = '<p>Original</p>';
      document.body.appendChild(target);

      const experience = {
        id: 'prepend-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          position: 'prepend',
          message: '<span>Prepended</span>',
        },
      };

      sdk.inline.show(experience);

      const inline = document.querySelector('.xp-inline');
      expect(inline).toBeTruthy();
      expect(target.children.length).toBe(2); // Prepended + original
      expect(target.children[0].className).toBe('xp-inline'); // Prepended first
      expect(target.children[1].tagName).toBe('P'); // Original second
    });

    it('should insert content with "before" position', () => {
      const container = document.createElement('div');
      const target = document.createElement('p');
      target.id = 'test-target';
      target.textContent = 'Target';
      container.appendChild(target);
      document.body.appendChild(container);

      const experience = {
        id: 'before-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          position: 'before',
          message: '<span>Before</span>',
        },
      };

      sdk.inline.show(experience);

      const inline = document.querySelector('.xp-inline');
      expect(inline).toBeTruthy();
      expect(container.children.length).toBe(2); // Inline + target
      expect(container.children[0].className).toBe('xp-inline'); // Inline first
      expect(container.children[1].id).toBe('test-target'); // Target second
    });

    it('should insert content with "after" position', () => {
      const container = document.createElement('div');
      const target = document.createElement('p');
      target.id = 'test-target';
      target.textContent = 'Target';
      container.appendChild(target);
      document.body.appendChild(container);

      const experience = {
        id: 'after-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          position: 'after',
          message: '<span>After</span>',
        },
      };

      sdk.inline.show(experience);

      const inline = document.querySelector('.xp-inline');
      expect(inline).toBeTruthy();
      expect(container.children.length).toBe(2); // Target + inline
      expect(container.children[0].id).toBe('test-target'); // Target first
      expect(container.children[1].className).toBe('xp-inline'); // Inline second
    });

    it('should default to "replace" when position not specified', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      target.innerHTML = '<p>Original</p>';
      document.body.appendChild(target);

      const experience = {
        id: 'default-position',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<h2>Replaced</h2>',
        },
      };

      sdk.inline.show(experience);

      const inline = document.querySelector('.xp-inline');
      expect(inline).toBeTruthy();
      expect(target.querySelector('p')).toBeFalsy(); // Original replaced
    });
  });

  describe('Error Handling', () => {
    it('should emit error event when selector not found', async () => {
      const errorHandler = vi.fn();
      sdk.on('experiences:inline:error', errorHandler);

      const experience = {
        id: 'not-found',
        type: 'inline',
        content: {
          selector: '#does-not-exist',
          message: '<p>Content</p>',
        },
      };

      sdk.inline.show(experience);

      await vi.waitFor(() => {
        expect(errorHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'not-found',
            error: 'selector-not-found',
            selector: '#does-not-exist',
          })
        );
      });
    });

    it('should not throw error when removing non-existent inline', () => {
      expect(() => {
        sdk.inline.remove('does-not-exist');
      }).not.toThrow();
    });
  });

  describe('Dismissal', () => {
    it('should render close button when dismissable is true', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      const experience = {
        id: 'dismissable-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
          dismissable: true,
        },
      };

      sdk.inline.show(experience);

      const closeBtn = document.querySelector('.xp-inline__close');
      expect(closeBtn).toBeTruthy();
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
    });

    it('should not render close button when dismissable is false', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      const experience = {
        id: 'not-dismissable',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
          dismissable: false,
        },
      };

      sdk.inline.show(experience);

      const closeBtn = document.querySelector('.xp-inline__close');
      expect(closeBtn).toBeFalsy();
    });

    it('should remove inline when close button is clicked', async () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      const dismissHandler = vi.fn();
      sdk.on('experiences:dismissed', dismissHandler);

      const experience = {
        id: 'dismiss-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
          dismissable: true,
        },
      };

      sdk.inline.show(experience);

      const closeBtn = document.querySelector('.xp-inline__close') as HTMLElement;
      closeBtn.click();

      await vi.waitFor(() => {
        expect(dismissHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'dismiss-test',
          })
        );
      });

      expect(document.querySelector('.xp-inline')).toBeFalsy();
    });

    it('should persist dismissal in localStorage when persist is true', async () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      const experience = {
        id: 'persist-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
          dismissable: true,
          persist: true,
        },
      };

      sdk.inline.show(experience);

      const closeBtn = document.querySelector('.xp-inline__close') as HTMLElement;
      closeBtn.click();

      // Try to show again
      const dismissedHandler = vi.fn();
      sdk.on('experiences:inline:dismissed', dismissedHandler);

      sdk.inline.show(experience);

      await vi.waitFor(() => {
        expect(dismissedHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'persist-test',
            reason: 'previously-dismissed',
          })
        );
      });

      expect(document.querySelector('.xp-inline')).toBeFalsy();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      const experience = {
        id: 'class-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
          className: 'custom-class',
        },
      };

      sdk.inline.show(experience);

      const inline = document.querySelector('.xp-inline');
      expect(inline?.classList.contains('custom-class')).toBe(true);
    });

    it('should apply custom inline styles', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      const experience = {
        id: 'style-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
          style: {
            padding: '20px',
            backgroundColor: 'red',
          },
        },
      };

      sdk.inline.show(experience);

      const inline = document.querySelector('.xp-inline') as HTMLElement;
      expect(inline?.style.padding).toBe('20px');
      expect(inline?.style.backgroundColor).toBe('red');
    });
  });

  describe('Multi-instance', () => {
    it('should support multiple inline experiences', () => {
      const target1 = document.createElement('div');
      target1.id = 'target-1';
      document.body.appendChild(target1);

      const target2 = document.createElement('div');
      target2.id = 'target-2';
      document.body.appendChild(target2);

      sdk.inline.show({
        id: 'inline-1',
        type: 'inline',
        content: {
          selector: '#target-1',
          message: '<p>Content 1</p>',
        },
      });

      sdk.inline.show({
        id: 'inline-2',
        type: 'inline',
        content: {
          selector: '#target-2',
          message: '<p>Content 2</p>',
        },
      });

      const inlines = document.querySelectorAll('.xp-inline');
      expect(inlines.length).toBe(2);
    });

    it('should prevent duplicate inline experiences', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      const experience = {
        id: 'duplicate-test',
        type: 'inline' as const,
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
        },
      };

      // Show the same experience twice
      sdk.inline.show(experience);
      sdk.inline.show(experience);

      // Should only insert once
      const inlines = document.querySelectorAll('[data-xp-id="duplicate-test"]');
      expect(inlines.length).toBe(1);
      expect(sdk.inline.isShowing('duplicate-test')).toBe(true);
    });

    it('should check if specific inline is showing', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      sdk.inline.show({
        id: 'check-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
        },
      });

      expect(sdk.inline.isShowing('check-test')).toBe(true);
      expect(sdk.inline.isShowing('does-not-exist')).toBe(false);
    });

    it('should check if any inline is showing', () => {
      expect(sdk.inline.isShowing()).toBe(false);

      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      sdk.inline.show({
        id: 'any-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
        },
      });

      expect(sdk.inline.isShowing()).toBe(true);
    });
  });

  describe('Events', () => {
    it('should emit shown event when inline is displayed', async () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      const shownHandler = vi.fn();
      sdk.on('experiences:shown', shownHandler);

      sdk.inline.show({
        id: 'shown-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
        },
      });

      await vi.waitFor(() => {
        expect(shownHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            experienceId: 'shown-test',
            type: 'inline',
            selector: '#test-target',
            position: 'replace',
          })
        );
      });
    });
  });

  describe('Cleanup', () => {
    it('should remove inline on explicit remove call', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      sdk.inline.show({
        id: 'remove-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Content</p>',
        },
      });

      expect(document.querySelector('.xp-inline')).toBeTruthy();

      sdk.inline.remove('remove-test');

      expect(document.querySelector('.xp-inline')).toBeFalsy();
    });

    it('should remove all inlines on destroy', async () => {
      const target1 = document.createElement('div');
      target1.id = 'target-1';
      document.body.appendChild(target1);

      const target2 = document.createElement('div');
      target2.id = 'target-2';
      document.body.appendChild(target2);

      sdk.inline.show({
        id: 'destroy-1',
        type: 'inline',
        content: {
          selector: '#target-1',
          message: '<p>Content 1</p>',
        },
      });

      sdk.inline.show({
        id: 'destroy-2',
        type: 'inline',
        content: {
          selector: '#target-2',
          message: '<p>Content 2</p>',
        },
      });

      expect(document.querySelectorAll('.xp-inline').length).toBe(2);

      await sdk.destroy();

      expect(document.querySelectorAll('.xp-inline').length).toBe(0);
    });
  });

  describe('HTML Sanitization', () => {
    it('should sanitize HTML content', () => {
      const target = document.createElement('div');
      target.id = 'test-target';
      document.body.appendChild(target);

      const experience = {
        id: 'sanitize-test',
        type: 'inline',
        content: {
          selector: '#test-target',
          message: '<p>Safe content</p><script>alert("xss")</script>',
        },
      };

      sdk.inline.show(experience);

      const inline = document.querySelector('.xp-inline');
      expect(inline?.innerHTML).not.toContain('<script>');
      expect(inline?.innerHTML).toContain('<p>Safe content</p>');
    });
  });
});
