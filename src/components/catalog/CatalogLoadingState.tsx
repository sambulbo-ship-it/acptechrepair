import { Loader2 } from 'lucide-react';

interface CatalogLoadingStateProps {
  language: 'en' | 'fr';
}

export const CatalogLoadingState = ({ language }: CatalogLoadingStateProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">
          {language === 'fr' ? 'Chargement du catalogue...' : 'Loading catalog...'}
        </p>
      </div>
    </div>
  );
};
