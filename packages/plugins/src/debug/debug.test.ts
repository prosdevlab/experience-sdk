import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SDK } from '@lytics/sdk-kit';
import { debugPlugin, type DebugPlugin } from './debug';

describe('Debug Plugin', () => {
  let sdk: SDK & { debug: DebugPlugin };

  beforeEach(() => {
    sdk = new SDK({ debug: { enabled: true, console: true, window: true } }) as SDK & {
      debug: DebugPlugin;
    };
  });

  describe('Plugin Registration', () => {
    it('should register without errors', () => {
      expect(() => sdk.use(debugPlugin)).not.toThrow();
    });

    it('should expose debug API', () => {
      sdk.use(debugPlugin);

      expect(sdk.debug).toBeDefined();
      expect(sdk.debug.log).toBeTypeOf('function');
      expect(sdk.debug.isEnabled).toBeTypeOf('function');
    });
  });

  describe('Configuration', () => {
    it('should respect debug.enabled config', () => {
      const disabledSdk = new SDK({ debug: { enabled: false } });
      disabledSdk.use(debugPlugin);

      expect(disabledSdk.debug.isEnabled()).toBe(false);
    });

    it('should default to disabled', () => {
      const defaultSdk = new SDK();
      defaultSdk.use(debugPlugin);

      expect(defaultSdk.debug.isEnabled()).toBe(false);
    });

    it('should respect debug.console config', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const consoleEnabledSdk = new SDK({ debug: { enabled: true, console: true } });
      consoleEnabledSdk.use(debugPlugin);
      consoleEnabledSdk.debug.log('test message');

      expect(consoleSpy).toHaveBeenCalledWith('[experiences] test message', '');
      consoleSpy.mockRestore();
    });

    it('should not log to console when disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const consoleDisabledSdk = new SDK({ debug: { enabled: true, console: false } });
      consoleDisabledSdk.use(debugPlugin);
      consoleDisabledSdk.debug.log('test message');

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Window Events', () => {
    it('should emit window events when enabled', () => {
      if (typeof window === 'undefined') {
        // Skip in non-browser environment
        return;
      }

      const eventHandler = vi.fn();
      window.addEventListener('experience-sdk:debug', eventHandler);

      sdk.use(debugPlugin);
      sdk.debug.log('test message', { foo: 'bar' });

      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toMatchObject({
        message: 'test message',
        data: { foo: 'bar' },
      });
      expect(event.detail.timestamp).toBeDefined();

      window.removeEventListener('experience-sdk:debug', eventHandler);
    });

    it('should not emit window events when debug is disabled', () => {
      if (typeof window === 'undefined') {
        return;
      }

      const eventHandler = vi.fn();
      window.addEventListener('experience-sdk:debug', eventHandler);

      const disabledSdk = new SDK({ debug: { enabled: false } });
      disabledSdk.use(debugPlugin);
      disabledSdk.debug.log('test message');

      expect(eventHandler).not.toHaveBeenCalled();

      window.removeEventListener('experience-sdk:debug', eventHandler);
    });

    it('should not emit window events when window is disabled', () => {
      if (typeof window === 'undefined') {
        return;
      }

      const eventHandler = vi.fn();
      window.addEventListener('experience-sdk:debug', eventHandler);

      const windowDisabledSdk = new SDK({ debug: { enabled: true, window: false } });
      windowDisabledSdk.use(debugPlugin);
      windowDisabledSdk.debug.log('test message');

      expect(eventHandler).not.toHaveBeenCalled();

      window.removeEventListener('experience-sdk:debug', eventHandler);
    });
  });

  describe('Event Listening', () => {
    it('should listen to experiences:ready event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      sdk.use(debugPlugin);
      sdk.emit('experiences:ready');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[experiences] SDK initialized and ready',
        ''
      );

      consoleSpy.mockRestore();
    });

    it('should listen to experiences:registered event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      sdk.use(debugPlugin);
      const payload = { id: 'test', experience: { type: 'banner' } };
      sdk.emit('experiences:registered', payload);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[experiences] Experience registered',
        payload
      );

      consoleSpy.mockRestore();
    });

    it('should listen to experiences:evaluated event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      sdk.use(debugPlugin);
      const decision = { show: true, experienceId: 'test' };
      sdk.emit('experiences:evaluated', decision);

      expect(consoleSpy).toHaveBeenCalledWith('[experiences] Experience evaluated', decision);

      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const disabledSdk = new SDK({ debug: { enabled: false } });
      disabledSdk.use(debugPlugin);
      disabledSdk.emit('experiences:ready');

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('debug.log() method', () => {
    it('should log message without data', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      sdk.use(debugPlugin);
      sdk.debug.log('test message');

      expect(consoleSpy).toHaveBeenCalledWith('[experiences] test message', '');

      consoleSpy.mockRestore();
    });

    it('should log message with data', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      sdk.use(debugPlugin);
      const data = { foo: 'bar', count: 42 };
      sdk.debug.log('test message', data);

      expect(consoleSpy).toHaveBeenCalledWith('[experiences] test message', data);

      consoleSpy.mockRestore();
    });

    it('should include timestamp in window event', () => {
      if (typeof window === 'undefined') {
        return;
      }

      const eventHandler = vi.fn();
      window.addEventListener('experience-sdk:debug', eventHandler);

      sdk.use(debugPlugin);
      sdk.debug.log('test message');

      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      window.removeEventListener('experience-sdk:debug', eventHandler);
    });
  });

  describe('debug.isEnabled() method', () => {
    it('should return true when enabled', () => {
      sdk.use(debugPlugin);

      expect(sdk.debug.isEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      const disabledSdk = new SDK({ debug: { enabled: false } });
      disabledSdk.use(debugPlugin);

      expect(disabledSdk.debug.isEnabled()).toBe(false);
    });
  });
});

