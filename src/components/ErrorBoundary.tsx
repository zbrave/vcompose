import { Component, type ReactNode } from 'react';
import posthog from 'posthog-js';
import { isAnalyticsEnabled } from '../lib/analytics/posthog';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (isAnalyticsEnabled()) {
      posthog.captureException(error, {
        type: 'react_error_boundary',
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]"
          role="alert"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-[var(--accent-primary)] text-[var(--bg-primary)]"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
