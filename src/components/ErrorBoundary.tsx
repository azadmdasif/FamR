import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleClearDataAndReload = (): void => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown runtime error';
      const isFirebaseKeyError =
        errorMessage.toLowerCase().includes('api-key') ||
        errorMessage.toLowerCase().includes('firebase');

      return (
        <div className="min-h-screen bg-[#f7f9f6] text-[#27382b] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h1 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 mb-4 leading-relaxed">
              {isFirebaseKeyError
                ? 'A Firebase configuration issue occurred during startup. If you deployed to Vercel, make sure your VITE_FIREBASE_API_KEY environment variable is configured.'
                : 'The application encountered an unexpected error. You can refresh the page or reset cached session data.'}
            </p>

            <div className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-left font-mono text-[11px] text-stone-700 break-words mb-5 max-h-32 overflow-y-auto">
              {errorMessage}
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-emerald-900 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleClearDataAndReload}
                className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs sm:text-sm font-medium rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4 text-stone-400" />
                Clear Local Storage & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
