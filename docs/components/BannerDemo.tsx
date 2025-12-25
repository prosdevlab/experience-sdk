'use client';

import { useEffect, useState } from 'react';

// Use global experiences API (loaded from IIFE script)
declare global {
  interface Window {
    experiences: any;
  }
}

interface Decision {
  show: boolean;
  experienceId?: string;
  reasons: string[];
  trace: Array<{
    step: string;
    timestamp: number;
    duration: number;
    input?: any;
    output?: any;
    passed: boolean;
  }>;
  context: Record<string, any>;
  metadata: {
    evaluatedAt: number;
    totalDuration: number;
    experiencesEvaluated: number;
  };
}

export function BannerDemo() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single banner configuration for the demo
  const DEMO_BANNER = {
    id: 'welcome-banner',
    type: 'banner' as const,
    targeting: { url: { contains: '/' } },
    content: {
      title: '👋 Welcome to Experience SDK',
      message: 'See how explainable client-side experiences work in real-time',
      button: {
        text: 'View Docs',
        url: '/getting-started',
      },
    },
    frequency: { max: 3, per: 'session' as const },
  };

  // Initialize SDK once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/sdk/index.global.js';
    script.async = true;
    script.onload = () => {
      if (window.experiences) {
        window.experiences.init({ debug: true, banner: { zIndex: 100 } }).then(() => {
          window.experiences.register(DEMO_BANNER.id, DEMO_BANNER);
          setIsInitialized(true);

          // Initial evaluation
          const initialDecision = window.experiences.evaluate({ url: window.location.href });
          setDecision(initialDecision);
        });
      } else {
        setError('Failed to load Experience SDK');
      }
    };
    script.onerror = () => {
      setError('Failed to load SDK script');
    };

    document.head.appendChild(script);

    return () => {
      if (window.experiences) {
        window.experiences.destroy();
      }
      document.head.removeChild(script);
    };
  }, []);

  const handleReset = () => {
    if (!window.experiences) return;

    // Clear frequency data from session storage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('experiences:frequency:')) {
        sessionStorage.removeItem(key);
      }
    });

    // Re-evaluate to update the UI
    const newDecision = window.experiences.evaluate({ url: window.location.href });
    setDecision(newDecision);
  };

  if (error) {
    return <div className="p-4 border rounded bg-red-50 text-red-700">{error}</div>;
  }

  if (!isInitialized) {
    return <div className="p-4 border rounded">Loading SDK...</div>;
  }

  return (
    <div className="space-y-6 my-8">
      {/* Controls */}
      <div className="p-6 border rounded-lg nx-bg-primary-100/5 dark:nx-bg-primary-100/10 space-y-4">
        <h3 className="font-bold text-xl mb-4">Interactive Demo</h3>
        <p className="text-sm opacity-80 mb-4">
          The banner appears at the <strong>top of the page</strong> when you first load this page.
          The SDK automatically evaluates and tracks impressions. After{' '}
          <strong>3 page views</strong>, the banner will stop showing (frequency cap reached).
        </p>
        <p className="text-sm opacity-80 mb-4">
          <strong>To test:</strong> Navigate to another page (e.g.,{' '}
          <a href="/" className="text-blue-600 dark:text-blue-400 underline">
            Home
          </a>{' '}
          or{' '}
          <a href="/getting-started" className="text-blue-600 dark:text-blue-400 underline">
            Getting Started
          </a>
          ) and come back. Each visit counts as an impression. After 3 visits, the banner won't
          appear.
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Reset Frequency Cap (for testing)
          </button>
        </div>
      </div>

      {decision && (
        <div className="space-y-4">
          {/* Reasons */}
          <div className="p-4 border rounded-lg nx-bg-primary-100/5 dark:nx-bg-primary-100/10">
            <h4 className="font-bold mb-3">Reasons (Explainability)</h4>
            <ul className="space-y-2">
              {decision.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span>{reason.startsWith('✅') || reason.startsWith('❌') ? '' : '•'}</span>
                  <span className="text-sm opacity-90">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trace Steps */}
          <details className="p-4 border rounded-lg nx-bg-primary-100/5 dark:nx-bg-primary-100/10">
            <summary className="font-bold cursor-pointer">Trace Steps</summary>
            <div className="mt-3 space-y-2">
              {decision.trace.map((step, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">{idx + 1}.</span>
                    <span className="font-medium">{step.step}</span>
                    <span
                      className={
                        step.passed
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {step.passed ? '✓' : '✗'}
                    </span>
                    <span className="opacity-50 text-xs">{step.duration.toFixed(2)}ms</span>
                  </div>
                  {step.output !== undefined && (
                    <div className="ml-6 opacity-70 text-xs">
                      Output: {JSON.stringify(step.output)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>

          {/* Context */}
          <details className="p-4 border rounded-lg nx-bg-primary-100/5 dark:nx-bg-primary-100/10">
            <summary className="font-bold cursor-pointer">Context</summary>
            <pre className="mt-3 text-sm nx-bg-primary-700/5 dark:nx-bg-primary-300/10 p-3 rounded overflow-x-auto">
              {JSON.stringify(decision.context, null, 2)}
            </pre>
          </details>

          {/* Full Decision JSON */}
          <details className="p-4 border rounded-lg nx-bg-primary-100/5 dark:nx-bg-primary-100/10">
            <summary className="font-bold cursor-pointer">Full Decision Object</summary>
            <pre className="mt-3 text-sm nx-bg-primary-700/5 dark:nx-bg-primary-300/10 p-3 rounded overflow-x-auto">
              {JSON.stringify(decision, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
