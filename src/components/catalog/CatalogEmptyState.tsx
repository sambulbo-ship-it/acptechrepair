import { Package } from 'lucide-react';

interface CatalogEmptyStateProps {
  language: 'en' | 'fr';
}

export const CatalogEmptyState = ({ language }: CatalogEmptyStateProps) => {
  return (
    <div className="glass-card p-12 text-center">
      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        {language === 'fr' ? 'Aucun équipement trouvé' : 'No equipment found'}
      </h3>
      <p className="text-sm text-muted-foreground">
        {language === 'fr' 
          ? 'Aucun équipement ne correspond à votre recherche.'
          : 'No equipment matches your search.'}
      </p>
    </div>
  );
};
