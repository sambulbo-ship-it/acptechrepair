import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CatalogSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  language: 'en' | 'fr';
}

export const CatalogSearch = ({ searchQuery, onSearchChange, language }: CatalogSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="search"
        placeholder={language === 'fr' ? 'Rechercher un équipement...' : 'Search equipment...'}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-12 h-14 glass-input text-lg"
        maxLength={100}
      />
    </div>
  );
};
