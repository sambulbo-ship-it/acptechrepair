import { Package } from 'lucide-react';

interface CatalogHeaderProps {
  workspaceName: string;
  language: 'en' | 'fr';
}

export const CatalogHeader = ({ workspaceName, language }: CatalogHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 glass-header pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {workspaceName || (language === 'fr' ? 'Catalogue' : 'Catalog')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {language === 'fr' ? 'Location & Vente' : 'Rental & Sale'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
