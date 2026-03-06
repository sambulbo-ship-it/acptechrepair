import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CatalogSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  language: 'en' | 'fr';
  resultCount?: number;
}

export const CatalogSearch = ({ searchQuery, onSearchChange, language, resultCount }: CatalogSearchProps) => {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={language === 'fr' ? 'Rechercher par nom, marque, modèle...' : 'Search by name, brand, model...'}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-11 pr-10 h-12 bg-muted/50 border-border/50 rounded-xl text-sm focus:bg-background"
          maxLength={100}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
            onClick={() => onSearchChange('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {resultCount !== undefined && searchQuery && (
        <p className="text-xs text-muted-foreground px-1">
          {resultCount} {language === 'fr' ? 'résultat(s)' : 'result(s)'}
        </p>
      )}
    </div>
  );
};
