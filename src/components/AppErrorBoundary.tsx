import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Fallback UI rendered after an error is caught. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Top-level React Error Boundary for the Munyaka application.
 *
 * Catches any unhandled JS exception thrown during rendering, lifecycle
 * methods, or constructors of the component tree beneath it. Prevents a
 * crashing component from unmounting the entire app — on Android WebView
 * an uncaught exception can kill the whole webview process.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * The boundary re-throws in development mode so the full stack trace
 * appears in the browser console; in production the fallback is shown
 * and the error is silently swallowed.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Re-throw in development so the full stack trace appears in the console.
    // In production this branch is dead code (process.env.NODE_ENV is 'production').
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[AppErrorBoundary] Caught error:', error, errorInfo);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  override render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback component takes priority.
      if (fallback) return fallback;

      // Default full-screen error fallback.
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md text-center space-y-6">

            {/* Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-200">
              <AlertTriangle size={28} className="text-red-600" />
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-xl font-black text-slate-900">Something went wrong</h1>
              <p className="text-sm text-slate-500 mt-1">
                An unexpected error crashed the app. Try reloading, or clear
                the app cache and reopen.
              </p>
            </div>

            {/* Error detail (development only) */}
            {import.meta.env.DEV && error && (
              <div className="text-left bg-slate-900 rounded-2xl p-4 overflow-auto max-h-48">
                <p className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest mb-2">
                  Error
                </p>
                <p className="text-xs font-mono text-red-300 break-all">{error.message}</p>
                {errorInfo?.componentStack && (
                  <>
                    <p className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest mt-3 mb-1">
                      Component Stack
                    </p>
                    <pre className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap break-all">
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}

            {/* Network status hint */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              {navigator.onLine ? (
                <>
                  <Wifi size={12} className="text-emerald-400" />
                  <span>Online — data sync may have failed</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-amber-400" />
                  <span>Offline — check your connection</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={this.handleReload}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 h-11"
              >
                <RefreshCw size={16} />
                Reload App
              </Button>
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="w-full rounded-xl border-slate-200 text-slate-600 font-semibold h-10"
              >
                Try Again Without Reload
              </Button>
            </div>

            <p className="text-[10px] text-slate-400">
              Munyaka School Management System &bull; v1.3.0
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default AppErrorBoundary;
