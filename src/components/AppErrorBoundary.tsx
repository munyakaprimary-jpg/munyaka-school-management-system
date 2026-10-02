import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught app error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 font-sans text-white">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black">Portal Exception Encountered</h2>
              <p className="text-xs text-slate-400">
                {this.state.error?.message || "An unexpected rendering error occurred in the application view."}
              </p>
            </div>
            <Button
              onClick={this.handleReset}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs"
            >
              <RefreshCcw size={16} /> Reset State & Reload Portal
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
