import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Info, ArrowRight } from 'lucide-react';

interface CatalogNoCodeStateProps {
  language: 'en' | 'fr';
}

export const CatalogNoCodeState = ({ language }: CatalogNoCodeStateProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Info className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {language === 'fr' ? 'Catalogue d\'équipements' : 'Equipment Catalog'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {language === 'fr' 
            ? 'Pour accéder au catalogue d\'une entreprise, vous avez besoin d\'un code d\'invitation. Contactez l\'entreprise pour obtenir un lien d\'accès direct.'
            : 'To access a company\'s catalog, you need an invitation code. Contact the company to get a direct access link.'}
        </p>
        <div className="space-y-3">
          <Link to="/find-repair">
            <Button variant="outline" className="w-full gap-2">
              {language === 'fr' ? 'Trouver un réparateur' : 'Find a repair service'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
