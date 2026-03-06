import { Store, ShoppingBag } from 'lucide-react';

interface CatalogHeaderProps {
  workspaceName: string;
  language: 'en' | 'fr';
  logoUrl?: string | null;
}

export const CatalogHeader = ({ workspaceName, language, logoUrl }: CatalogHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={workspaceName} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                {workspaceName || (language === 'fr' ? 'Boutique' : 'Shop')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {language === 'fr' ? 'Location · Vente · Services' : 'Rental · Sale · Services'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
