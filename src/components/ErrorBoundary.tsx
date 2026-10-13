import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorCount: 0 };

  static getDerivedStateFromError(error: Error, prevState: State): State {
    return { hasError: true, error, errorCount: (prevState?.errorCount || 0) + 1 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleFullReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isPersistent = this.state.errorCount >= 2;
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">Something went wrong</h1>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              {isPersistent
                ? 'A persistent error is preventing the app from loading. Try a full page reload.'
                : 'The app encountered an unexpected error. Try reloading — your data is safe.'}
            </p>
            {isPersistent ? (
              <button
                onClick={this.handleFullReload}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                <RefreshCw className="h-4 w-4" /> Reload Page
              </button>
            ) : (
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                <RefreshCw className="h-4 w-4" /> Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
