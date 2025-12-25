/**
 * Debug Plugin
 *
 * Emits structured debug events to window and optionally logs to console.
 * Useful for debugging and Chrome extension integration.
 */

import type { PluginFunction } from '@lytics/sdk-kit';

export interface DebugPluginConfig {
  debug?: {
    enabled?: boolean;
    console?: boolean;
    window?: boolean;
  };
}

export interface DebugPlugin {
  log(message: string, data?: unknown): void;
  isEnabled(): boolean;
}

/**
 * Debug Plugin
 *
 * Listens to all SDK events and emits them as window events for debugging.
 * Also optionally logs to console.
 *
 * @example
 * ```typescript
 * import { createInstance } from '@prosdevlab/experience-sdk';
 * import { debugPlugin } from '@prosdevlab/experience-sdk-plugins';
 *
 * const sdk = createInstance({ debug: { enabled: true, console: true } });
 * sdk.use(debugPlugin);
 * ```
 */
export const debugPlugin: PluginFunction = (plugin, instance, config) => {
  plugin.ns('debug');

  // Set defaults
  plugin.defaults({
    debug: {
      enabled: false,
      console: false,
      window: true,
    },
  });

  // Helper to check if debug is enabled
  const isEnabled = (): boolean => config.get('debug.enabled') ?? false;
  const shouldLogConsole = (): boolean => config.get('debug.console') ?? false;
  const shouldEmitWindow = (): boolean => config.get('debug.window') ?? true;

  // Log function
  const log = (message: string, data?: unknown): void => {
    if (!isEnabled()) return;

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      message,
      data,
    };

    // Console logging
    if (shouldLogConsole()) {
      console.log(`[experiences] ${message}`, data || '');
    }

    // Window event emission
    if (shouldEmitWindow() && typeof window !== 'undefined') {
      const event = new CustomEvent('experience-sdk:debug', {
        detail: logData,
      });
      window.dispatchEvent(event);
    }
  };

  // Expose debug API
  plugin.expose({
    debug: {
      log,
      isEnabled,
    },
  });

  // If debug is enabled, listen to all events
  if (isEnabled()) {
    // Listen to experiences:* events
    instance.on('experiences:ready', () => {
      if (!isEnabled()) return;
      log('SDK initialized and ready');
    });

    instance.on('experiences:registered', (payload) => {
      if (!isEnabled()) return;
      log('Experience registered', payload);
    });

    instance.on('experiences:evaluated', (payload) => {
      if (!isEnabled()) return;
      log('Experience evaluated', payload);
    });
  }
};
