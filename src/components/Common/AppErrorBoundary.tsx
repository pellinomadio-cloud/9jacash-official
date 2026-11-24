import React from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onResetToHome?: () => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Unexpected display error';
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('AppErrorBoundary caught render error:', error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onResetToHome) {
      this.props.onResetToHome();
    } else if (typeof window !== 'undefined') {
      try {
        window.location.hash = '';
      } catch {
        // ignore
      }
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-5">
          <div className="w-full max-w-sm rounded-3xl border border-amber-500/30 bg-[#14151c] text-white p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-extrabold tracking-tight">
                {this.props.fallbackTitle || 'Something went wrong loading this page'}
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                Tap retry below to reload the page cleanly. Your account and balance remain completely safe.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border border-stone-700"
              >
                <Home className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
