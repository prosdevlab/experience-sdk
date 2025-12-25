import { beforeEach, describe, expect, it } from 'vitest';
import {
  createInstance,
  destroy,
  evaluate,
  experiences as experiencesDefault,
  explain,
  getState,
  init,
  on,
  register,
} from './singleton';

describe('Export Pattern', () => {
  beforeEach(async () => {
    // Clean up singleton between tests
    await destroy();
  });

  describe('createInstance()', () => {
    it('should create a new isolated instance', () => {
      const instance1 = createInstance();
      const instance2 = createInstance();

      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1).not.toBe(instance2);
    });

    it('should accept config', () => {
      const instance = createInstance({ debug: true });

      expect(instance).toBeDefined();
    });

    it('should create independent instances', () => {
      const instance1 = createInstance();
      const instance2 = createInstance();

      instance1.register('test1', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test 1', message: 'Message 1' },
      });

      instance2.register('test2', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test 2', message: 'Message 2' },
      });

      const state1 = instance1.getState();
      const state2 = instance2.getState();

      expect(state1.experiences.has('test1')).toBe(true);
      expect(state1.experiences.has('test2')).toBe(false);

      expect(state2.experiences.has('test1')).toBe(false);
      expect(state2.experiences.has('test2')).toBe(true);
    });
  });

  describe('Singleton API', () => {
    it('should initialize singleton', async () => {
      await init({ debug: true });

      const state = getState();
      expect(state.initialized).toBe(true);
    });

    it('should register experiences on singleton', () => {
      register('singleton-test', {
        type: 'banner',
        targeting: {},
        content: { title: 'Singleton', message: 'Test' },
      });

      const state = getState();
      expect(state.experiences.has('singleton-test')).toBe(true);
    });

    it('should evaluate on singleton', () => {
      register('test', {
        type: 'banner',
        targeting: { url: { contains: '/test' } },
        content: { title: 'Test', message: 'Test' },
      });

      const decision = evaluate({ url: 'https://example.com/test' });

      expect(decision.show).toBe(true);
      expect(decision.experienceId).toBe('test');
    });

    it('should explain on singleton', () => {
      register('test', {
        type: 'banner',
        targeting: { url: { contains: '/test' } },
        content: { title: 'Test', message: 'Test' },
      });

      const explanation = explain('test');

      expect(explanation).not.toBeNull();
      expect(explanation?.experienceId).toBe('test');
    });

    it('should get state from singleton', () => {
      register('test', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test', message: 'Test' },
      });

      const state = getState();

      expect(state.experiences.size).toBe(1);
      expect(state.experiences.has('test')).toBe(true);
    });

    it('should subscribe to events on singleton', () => {
      let called = false;
      const unsubscribe = on('experiences:registered', () => {
        called = true;
      });

      register('test', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test', message: 'Test' },
      });

      expect(called).toBe(true);
      unsubscribe();
    });

    it('should destroy singleton', async () => {
      await init();
      register('test', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test', message: 'Test' },
      });

      await destroy();

      const state = getState();
      expect(state.initialized).toBe(false);
      expect(state.experiences.size).toBe(0);
    });
  });

  describe('Default Export', () => {
    it('should have all methods', () => {
      expect(experiencesDefault.createInstance).toBeDefined();
      expect(experiencesDefault.init).toBeDefined();
      expect(experiencesDefault.register).toBeDefined();
      expect(experiencesDefault.evaluate).toBeDefined();
      expect(experiencesDefault.explain).toBeDefined();
      expect(experiencesDefault.getState).toBeDefined();
      expect(experiencesDefault.on).toBeDefined();
      expect(experiencesDefault.destroy).toBeDefined();
    });

    it('should work via default export', async () => {
      await experiencesDefault.init();

      experiencesDefault.register('default-test', {
        type: 'banner',
        targeting: {},
        content: { title: 'Default', message: 'Test' },
      });

      const state = experiencesDefault.getState();
      expect(state.experiences.has('default-test')).toBe(true);

      await experiencesDefault.destroy();
    });
  });

  describe('Instance Isolation', () => {
    it('should not share state between custom instance and singleton', () => {
      const customInstance = createInstance();

      // Register on singleton
      register('singleton-exp', {
        type: 'banner',
        targeting: {},
        content: { title: 'Singleton', message: 'Test' },
      });

      // Register on custom instance
      customInstance.register('custom-exp', {
        type: 'banner',
        targeting: {},
        content: { title: 'Custom', message: 'Test' },
      });

      // Check singleton state
      const singletonState = getState();
      expect(singletonState.experiences.has('singleton-exp')).toBe(true);
      expect(singletonState.experiences.has('custom-exp')).toBe(false);

      // Check custom instance state
      const customState = customInstance.getState();
      expect(customState.experiences.has('singleton-exp')).toBe(false);
      expect(customState.experiences.has('custom-exp')).toBe(true);
    });

    it('should not share decisions between instances', () => {
      const customInstance = createInstance();

      // Evaluate on singleton
      register('test1', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test 1', message: 'Test' },
      });
      evaluate();

      // Evaluate on custom instance
      customInstance.register('test2', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test 2', message: 'Test' },
      });
      customInstance.evaluate();

      const singletonState = getState();
      const customState = customInstance.getState();

      expect(singletonState.decisions.length).toBe(1);
      expect(customState.decisions.length).toBe(1);
    });
  });
});
