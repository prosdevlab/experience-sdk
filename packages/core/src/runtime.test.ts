import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExperienceRuntime, evaluateUrlRule } from './runtime';

describe('ExperienceRuntime', () => {
  let runtime: ExperienceRuntime;

  beforeEach(() => {
    runtime = new ExperienceRuntime({ debug: false });
  });

  describe('constructor', () => {
    it('should create runtime with default config', () => {
      const runtime = new ExperienceRuntime();

      expect(runtime).toBeDefined();
      expect(runtime.getState().initialized).toBe(false);
    });

    it('should accept initial config', () => {
      const runtime = new ExperienceRuntime({ debug: true });

      expect(runtime).toBeDefined();
    });
  });

  describe('init()', () => {
    it('should initialize runtime', async () => {
      await runtime.init();

      expect(runtime.getState().initialized).toBe(true);
    });

    it('should emit ready event', async () => {
      const readyHandler = vi.fn();
      runtime.on('experiences:ready', readyHandler);

      await runtime.init();

      expect(readyHandler).toHaveBeenCalledOnce();
    });

    it('should not re-initialize if already initialized', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await runtime.init();
      await runtime.init();

      expect(consoleWarnSpy).toHaveBeenCalledWith('[experiences] Already initialized');
      consoleWarnSpy.mockRestore();
    });

    it('should accept config on init', async () => {
      await runtime.init({ debug: true });

      expect(runtime.getState().initialized).toBe(true);
    });
  });

  describe('register()', () => {
    it('should register an experience', () => {
      runtime.register('welcome', {
        type: 'banner',
        targeting: {
          url: { contains: '/' },
        },
        content: {
          title: 'Welcome!',
          message: 'Welcome to our site',
        },
      });

      const state = runtime.getState();
      expect(state.experiences.has('welcome')).toBe(true);
    });

    it('should emit registered event', () => {
      const registeredHandler = vi.fn();
      runtime.on('experiences:registered', registeredHandler);

      runtime.register('test', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test', message: 'Test message' },
      });

      expect(registeredHandler).toHaveBeenCalledOnce();
      expect(registeredHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test',
          experience: expect.objectContaining({ type: 'banner' }),
        })
      );
    });

    it('should allow multiple experiences', () => {
      runtime.register('exp1', {
        type: 'banner',
        targeting: {},
        content: { title: 'Exp 1', message: 'Message 1' },
      });

      runtime.register('exp2', {
        type: 'banner',
        targeting: {},
        content: { title: 'Exp 2', message: 'Message 2' },
      });

      const state = runtime.getState();
      expect(state.experiences.size).toBe(2);
    });
  });

  describe('evaluate()', () => {
    beforeEach(() => {
      runtime.register('test', {
        type: 'banner',
        targeting: {
          url: { contains: '/products' },
        },
        content: { title: 'Test', message: 'Test message' },
      });
    });

    it('should return decision with matched experience', () => {
      const decision = runtime.evaluate({
        url: 'https://example.com/products/123',
      });

      expect(decision.show).toBe(true);
      expect(decision.experienceId).toBe('test');
      expect(decision.reasons).toContain('URL matches targeting rule');
    });

    it('should return decision with no match', () => {
      const decision = runtime.evaluate({
        url: 'https://example.com/about',
      });

      expect(decision.show).toBe(false);
      expect(decision.experienceId).toBeUndefined();
      expect(decision.reasons).toContain('URL does not match targeting rule');
    });

    it('should include trace steps', () => {
      const decision = runtime.evaluate({
        url: 'https://example.com/products',
      });

      expect(decision.trace).toHaveLength(1);
      expect(decision.trace[0]).toMatchObject({
        step: 'evaluate-url-rule',
        passed: true,
      });
    });

    it('should include context', () => {
      const decision = runtime.evaluate({
        url: 'https://example.com/products',
        user: { id: '123' },
      });

      expect(decision.context).toMatchObject({
        url: 'https://example.com/products',
        user: { id: '123' },
      });
    });

    it('should include metadata', () => {
      const decision = runtime.evaluate();

      expect(decision.metadata).toMatchObject({
        evaluatedAt: expect.any(Number),
        totalDuration: expect.any(Number),
        experiencesEvaluated: 1,
      });
    });

    it('should emit evaluated event', () => {
      const evaluatedHandler = vi.fn();
      runtime.on('experiences:evaluated', evaluatedHandler);

      runtime.evaluate();

      expect(evaluatedHandler).toHaveBeenCalledOnce();
    });

    it('should store decision history', () => {
      runtime.evaluate();
      runtime.evaluate();

      const state = runtime.getState();
      expect(state.decisions).toHaveLength(2);
    });

    it('should use current URL when none provided', () => {
      const decision = runtime.evaluate();

      expect(decision.context.url).toBeDefined();
    });

    it('should match first experience only', () => {
      runtime.register('test2', {
        type: 'banner',
        targeting: {
          url: { contains: '/products' },
        },
        content: { title: 'Test 2', message: 'Test 2 message' },
      });

      const decision = runtime.evaluate({
        url: 'https://example.com/products',
      });

      expect(decision.show).toBe(true);
      expect(decision.experienceId).toBe('test');
    });
  });

  describe('explain()', () => {
    it('should explain specific experience', () => {
      runtime.register('test', {
        type: 'banner',
        targeting: {
          url: { contains: '/test' },
        },
        content: { title: 'Test', message: 'Test message' },
      });

      const explanation = runtime.explain('test');

      expect(explanation).not.toBeNull();
      expect(explanation?.experienceId).toBe('test');
      expect(explanation?.reasons).toBeDefined();
    });

    it('should return null for non-existent experience', () => {
      const explanation = runtime.explain('non-existent');

      expect(explanation).toBeNull();
    });
  });

  describe('getState()', () => {
    it('should return runtime state', () => {
      const state = runtime.getState();

      expect(state).toMatchObject({
        initialized: false,
        experiences: expect.any(Map),
        decisions: expect.any(Array),
        config: expect.any(Object),
      });
    });

    it('should reflect registered experiences', () => {
      runtime.register('test', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test', message: 'Test message' },
      });

      const state = runtime.getState();
      expect(state.experiences.size).toBe(1);
      expect(state.experiences.get('test')).toBeDefined();
    });
  });

  describe('on()', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn();
      const unsubscribe = runtime.on('experiences:ready', handler);

      expect(unsubscribe).toBeTypeOf('function');
    });

    it('should allow unsubscribe', async () => {
      const handler = vi.fn();
      const unsubscribe = runtime.on('experiences:ready', handler);

      unsubscribe();
      await runtime.init();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('destroy()', () => {
    it('should clean up runtime', async () => {
      await runtime.init();
      runtime.register('test', {
        type: 'banner',
        targeting: {},
        content: { title: 'Test', message: 'Test message' },
      });

      await runtime.destroy();

      const state = runtime.getState();
      expect(state.initialized).toBe(false);
      expect(state.experiences.size).toBe(0);
      expect(state.decisions).toHaveLength(0);
    });
  });

  describe('URL targeting', () => {
    describe('equals rule', () => {
      beforeEach(() => {
        runtime.register('exact', {
          type: 'banner',
          targeting: {
            url: { equals: 'https://example.com/exact' },
          },
          content: { title: 'Exact', message: 'Exact match' },
        });
      });

      it('should match exact URL', () => {
        const decision = runtime.evaluate({
          url: 'https://example.com/exact',
        });

        expect(decision.show).toBe(true);
      });

      it('should not match different URL', () => {
        const decision = runtime.evaluate({
          url: 'https://example.com/other',
        });

        expect(decision.show).toBe(false);
      });
    });

    describe('contains rule', () => {
      beforeEach(() => {
        runtime.register('contains', {
          type: 'banner',
          targeting: {
            url: { contains: '/products' },
          },
          content: { title: 'Products', message: 'Products page' },
        });
      });

      it('should match URL containing substring', () => {
        const decision = runtime.evaluate({
          url: 'https://example.com/products/123',
        });

        expect(decision.show).toBe(true);
      });

      it('should not match URL without substring', () => {
        const decision = runtime.evaluate({
          url: 'https://example.com/about',
        });

        expect(decision.show).toBe(false);
      });
    });

    describe('matches (regex) rule', () => {
      beforeEach(() => {
        runtime.register('regex', {
          type: 'banner',
          targeting: {
            url: { matches: /\/product\/\d+/ },
          },
          content: { title: 'Product', message: 'Product page' },
        });
      });

      it('should match URL with regex', () => {
        const decision = runtime.evaluate({
          url: 'https://example.com/product/123',
        });

        expect(decision.show).toBe(true);
      });

      it('should not match URL without regex pattern', () => {
        const decision = runtime.evaluate({
          url: 'https://example.com/product/abc',
        });

        expect(decision.show).toBe(false);
      });
    });

    describe('empty rule', () => {
      it('should match when no rule properties specified', () => {
        const result = evaluateUrlRule({}, 'https://example.com/any-page');

        expect(result).toBe(true);
      });
    });
  });

  describe('evaluateUrlRule', () => {
    it('should match with equals rule', () => {
      expect(evaluateUrlRule({ equals: 'https://example.com' }, 'https://example.com')).toBe(true);
      expect(evaluateUrlRule({ equals: 'https://example.com' }, 'https://other.com')).toBe(false);
    });

    it('should match with contains rule', () => {
      expect(evaluateUrlRule({ contains: '/products' }, 'https://example.com/products')).toBe(true);
      expect(evaluateUrlRule({ contains: '/products' }, 'https://example.com/about')).toBe(false);
    });

    it('should match with regex rule', () => {
      expect(
        evaluateUrlRule({ matches: /\/product\/\d+/ }, 'https://example.com/product/123')
      ).toBe(true);
      expect(
        evaluateUrlRule({ matches: /\/product\/\d+/ }, 'https://example.com/product/abc')
      ).toBe(false);
    });

    it('should return true for empty rule', () => {
      expect(evaluateUrlRule({}, 'https://example.com')).toBe(true);
    });

    it('should handle empty URL', () => {
      expect(evaluateUrlRule({ equals: '' }, '')).toBe(true);
      expect(evaluateUrlRule({ contains: 'test' }, '')).toBe(false);
    });
  });

  describe('frequency targeting', () => {
    it('should track frequency rule in trace', () => {
      runtime.register('limited', {
        type: 'banner',
        targeting: {},
        frequency: {
          per: 'session',
          max: 1,
        },
        content: { title: 'Limited', message: 'Limited banner' },
      });

      const decision = runtime.evaluate();

      expect(decision.trace.some((step) => step.step === 'check-frequency-rule')).toBe(true);
      expect(decision.reasons.some((r) => r.includes('Frequency rule'))).toBe(true);
    });
  });

  describe('no targeting', () => {
    it('should always match when no targeting rules', () => {
      runtime.register('always', {
        type: 'banner',
        targeting: {},
        content: { title: 'Always', message: 'Always shown' },
      });

      const decision = runtime.evaluate({
        url: 'https://example.com/any-page',
      });

      expect(decision.show).toBe(true);
    });
  });
});
