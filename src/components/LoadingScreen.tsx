import { forwardRef } from 'react';
import { Loader2, Wrench } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

/**
 * Full-screen loading state. Language-neutral default (spinner only)
 * since it can render before LanguageProvider settles.
 */
export const LoadingScreen = forwardRef<HTMLDivElement, LoadingScreenProps>(
  ({ message }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className="min-h-screen min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6"
      >
        <div className="flex items-center gap-3 mb-8 fade-in">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Wrench className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">ACP Tech Repair</span>
        </div>
        <Loader2 className="w-7 h-7 text-primary animate-spin mb-3" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    );
  }
);

LoadingScreen.displayName = 'LoadingScreen';
