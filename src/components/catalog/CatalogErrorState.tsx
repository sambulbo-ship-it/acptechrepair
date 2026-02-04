import { X } from 'lucide-react';

interface CatalogErrorStateProps {
  error: string;
  language: 'en' | 'fr';
}

export const CatalogErrorState = ({ error, language }: CatalogErrorStateProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card p-8 text-center max-w-md">
        <X className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          {language === 'fr' ? 'Erreur' : 'Error'}
        </h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  );
};
