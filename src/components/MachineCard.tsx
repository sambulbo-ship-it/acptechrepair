import { Machine } from '@/types/machine';
import { StatusBadge } from './StatusBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryById, getCategoryLabel } from '@/data/equipmentData';
import { getCategoryIconComponent } from './CategoryIcon';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MachineCardProps {
  machine: Machine;
  onClick: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

export const MachineCard = ({ machine, onClick, selectable, selected, onSelect }: MachineCardProps) => {
  const { language } = useLanguage();
  const category = getCategoryById(machine.category);
  const CategoryIcon = getCategoryIconComponent(machine.category);

  return (
    <div className={cn(
      "w-full glass-card p-4 text-left flex items-center gap-4 transition-all duration-200",
      selectable && selected && "ring-2 ring-primary/50 bg-primary/5"
    )}>
      {selectable && (
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect?.(!!checked)}
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <button
        onClick={onClick}
        className="flex items-center gap-4 flex-1 min-w-0 touch-target active:scale-[0.98]"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <CategoryIcon className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-foreground truncate">
              {machine.name}
            </h3>
          </div>
          
          <p className="text-sm text-muted-foreground truncate">
            {machine.brand} {machine.model}
          </p>
          {machine.serialNumber && (
            <p className="text-xs text-muted-foreground/70 mb-1.5 truncate font-mono">
              S/N: {machine.serialNumber}
            </p>
          )}
          
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
    </div>
  );
};
