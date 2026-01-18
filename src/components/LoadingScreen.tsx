import { Loader2, Wrench } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = 'Chargement...' }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <Wrench className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Tech Repair</span>
      </div>
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};
