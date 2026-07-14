import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary. Renders outside LanguageProvider,
 * so labels are bilingual FR/EN inline.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6" role="alert">
          <div className="glass-card p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              L'application a rencontré un problème. Essayez de rafraîchir la page.
              <span className="block mt-1 text-xs opacity-70">Something went wrong — please refresh.</span>
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={this.handleRetry} variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Réessayer / Retry
              </Button>
              <Button onClick={this.handleReload} className="w-full">
                Recharger / Reload
              </Button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 p-3 bg-secondary rounded-lg text-xs text-left text-destructive overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
