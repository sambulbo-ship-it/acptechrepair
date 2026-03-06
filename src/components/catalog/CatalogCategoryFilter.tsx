import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getCategoryIconComponent } from '@/components/CategoryIcon';
import { equipmentCategories, EquipmentCategory } from '@/data/equipmentData';
import { cn } from '@/lib/utils';
import { LayoutGrid } from 'lucide-react';

interface CatalogCategoryFilterProps {
  selectedCategory: EquipmentCategory | 'all';
  onCategoryChange: (category: EquipmentCategory | 'all') => void;
  language: 'en' | 'fr';
}

export const CatalogCategoryFilter = ({ 
  selectedCategory, 
  onCategoryChange, 
  language 
}: CatalogCategoryFilterProps) => {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 min-w-fit border',
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-background text-muted-foreground border-border/60 hover:border-primary/30 hover:text-foreground'
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          {language === 'fr' ? 'Tout' : 'All'}
        </button>
        {equipmentCategories.filter(c => c.id !== 'other').map((cat) => {
          const CategoryIcon = getCategoryIconComponent(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 min-w-fit border',
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border/60 hover:border-primary/30 hover:text-foreground'
              )}
            >
              <CategoryIcon className="w-3.5 h-3.5" />
              {language === 'fr' ? cat.labelFr : cat.labelEn}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
