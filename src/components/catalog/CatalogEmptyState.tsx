import { SearchX } from 'lucide-react';

interface CatalogEmptyStateProps {
  language: 'en' | 'fr';
}

export const CatalogEmptyState = ({ language }: CatalogEmptyStateProps) => {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
        <SearchX className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {language === 'fr' ? 'Aucun résultat' : 'No results'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {language === 'fr' 
          ? 'Essayez de modifier vos filtres ou votre recherche.'
          : 'Try adjusting your filters or search terms.'}
      </p>
    </div>
  );
};
