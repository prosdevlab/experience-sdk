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
    experienceCount: number;
  };
}

export function ExperienceDemo() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [impressionCount, setImpressionCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize SDK
  useEffect(() => {
    // Load SDK script dynamically
    const script = document.createElement('script');
    script.src = '/sdk/index.global.js';
    script.async = true;
    script.onload = () => {
      if (window.experiences) {
        window.experiences.init({ debug: true }).then(() => {
          // Register a sample experience
          window.experiences.register('welcome-banner', {
            type: 'banner',
            targeting: {
              url: { contains: '/' },
            },
            content: {
              title: 'Welcome to Experience SDK!',
              message: 'This is a live demo showing explainability in action.',
            },
            frequency: {
              max: 3,
              per: 'session',
            },
          });

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

  const handleEvaluate = () => {
    if (!window.experiences) return;
    const newDecision = window.experiences.evaluate({ url: window.location.href });
    setDecision(newDecision);
    setImpressionCount((prev) => prev + 1);
  };

  const handleReset = () => {
    if (!window.experiences) return;
    window.experiences.destroy().then(() => {
      window.experiences.init({ debug: true }).then(() => {
        window.experiences.register('welcome-banner', {
          type: 'banner',
          targeting: {
            url: { contains: '/' },
          },
          content: {
            title: 'Welcome to Experience SDK!',
            message: 'This is a live demo showing explainability in action.',
          },
          frequency: {
            max: 3,
            per: 'session',
          },
        });

        const newDecision = window.experiences.evaluate({ url: window.location.href });
        setDecision(newDecision);
        setImpressionCount(0);
      });
    });
  };

  if (error) {
    return <div className="p-4 border rounded bg-red-50 text-red-700">{error}</div>;
  }

  if (!isInitialized) {
    return <div className="p-4 border rounded">Loading SDK...</div>;
  }

  return (
    <div className="space-y-6 my-8">
      {/* Banner Display */}
      {decision?.show && (
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">Welcome to Experience SDK!</h3>
              <p className="text-sm mt-1">This is a live demo showing explainability in action.</p>
            </div>
            <button
              onClick={handleEvaluate}
              type="button"
              className="text-white hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={handleEvaluate}
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Evaluate Again
        </button>
        <button
          onClick={handleReset}
          type="button"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset State
        </button>
      </div>

      {/* Decision Output */}
      {decision && (
        <div className="space-y-4">
          {/* Decision Summary */}
          <div
            className={`p-4 rounded-lg border-2 ${
              decision.show ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{decision.show ? '✅' : '❌'}</span>
              <h3 className="font-bold text-lg">{decision.show ? 'SHOW' : 'HIDE'}</h3>
            </div>
            {decision.experienceId && (
              <p className="text-sm text-gray-700">
                Experience:{' '}
                <code className="bg-white px-2 py-1 rounded">{decision.experienceId}</code>
              </p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Evaluated in {decision.metadata.totalDuration.toFixed(2)}ms
            </p>
          </div>

          {/* Reasons */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-bold mb-3">Reasons</h4>
            <ul className="space-y-2">
              {decision.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span>{reason.startsWith('✅') || reason.startsWith('❌') ? '' : '•'}</span>
                  <span className="text-sm">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trace Steps */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-bold mb-3">Trace Steps</h4>
            <div className="space-y-2">
              {decision.trace.map((step, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{idx + 1}.</span>
                    <span className="font-medium">{step.step}</span>
                    <span className={step.passed ? 'text-green-600' : 'text-red-600'}>
                      {step.passed ? '✓' : '✗'}
                    </span>
                  </div>
                  {step.output && (
                    <div className="ml-6 text-gray-600">Output: {JSON.stringify(step.output)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Context */}
          <details className="p-4 border rounded-lg">
            <summary className="font-bold cursor-pointer">Context</summary>
            <pre className="mt-3 text-sm bg-gray-50 p-3 rounded overflow-x-auto">
              {JSON.stringify(decision.context, null, 2)}
            </pre>
          </details>

          {/* Full Decision JSON */}
          <details className="p-4 border rounded-lg">
            <summary className="font-bold cursor-pointer">Full Decision Object</summary>
            <pre className="mt-3 text-sm bg-gray-50 p-3 rounded overflow-x-auto">
              {JSON.stringify(decision, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Stats */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-bold mb-2">Session Stats</h4>
        <p className="text-sm">Total Evaluations: {impressionCount}</p>
        <p className="text-sm">Frequency Cap: 3 per session</p>
      </div>
    </div>
  );
}
