/**
 * Error Boundary - Catch and handle React component errors
 * Enterprise-grade error handling with graceful fallback UI
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';
import Card from './Card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to error tracking service (e.g., Sentry)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback({ error, resetError: this.resetError });
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
          <Card variant="elevated" className="max-w-md w-full">
            <div className="p-8 text-center">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
                <AlertCircle className="text-red-400" size={28} />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
              <p className="text-slate-400 mb-6">
                We encountered an unexpected error. Our team has been notified.
              </p>

              {process.env.NODE_ENV === 'development' && error && (
                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 text-left">
                  <p className="text-xs font-mono text-red-400 overflow-auto max-h-40">
                    {error.toString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={this.resetError}
                  icon={RefreshCw}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>

              {errorCount > 3 && (
                <p className="text-xs text-yellow-400 mt-4">
                  Multiple errors detected. Consider reloading the page.
                </p>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
