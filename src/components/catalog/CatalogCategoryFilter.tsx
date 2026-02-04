import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getCategoryIconComponent } from '@/components/CategoryIcon';
import { equipmentCategories, EquipmentCategory } from '@/data/equipmentData';
import { cn } from '@/lib/utils';

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
      <div className="flex gap-3 pb-3">
        <button
          onClick={() => onCategoryChange('all')}
          className={cn(
            'px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 min-w-fit',
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
              : 'glass-card hover:bg-secondary/50 text-foreground border border-border/50'
          )}
        >
          {language === 'fr' ? 'Toutes catégories' : 'All categories'}
        </button>
        {equipmentCategories.filter(c => c.id !== 'other').map((cat) => {
          const CategoryIcon = getCategoryIconComponent(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                'px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2 min-w-fit',
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'glass-card hover:bg-secondary/50 text-foreground border border-border/50'
              )}
            >
              <CategoryIcon className="w-4 h-4" />
              {language === 'fr' ? cat.labelFr : cat.labelEn}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
