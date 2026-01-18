import { Machine } from '@/types/machine';
import { StatusBadge } from './StatusBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryById, getCategoryLabel } from '@/data/equipmentData';
import { getCategoryIconComponent } from './CategoryIcon';
import { ChevronRight, MapPin } from 'lucide-react';

interface MachineCardProps {
  machine: Machine;
  onClick: () => void;
}

export const MachineCard = ({ machine, onClick }: MachineCardProps) => {
  const { language } = useLanguage();
  const category = getCategoryById(machine.category);
  const CategoryIcon = getCategoryIconComponent(machine.category);

  return (
    <button
      onClick={onClick}
      className="w-full ios-card p-4 text-left touch-target flex items-center gap-4 active:scale-[0.98] transition-transform"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <CategoryIcon className="w-6 h-6 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-foreground truncate">
            {machine.name}
          </h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-1.5 truncate">
          {machine.brand} {machine.model}
        </p>
        
        <div className="flex items-center gap-3">
          <StatusBadge status={machine.status} />
          {machine.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {machine.location}
            </span>
          )}
        </div>
      </div>
      
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
};
