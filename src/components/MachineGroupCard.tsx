import { useState } from 'react';
import { Machine } from '@/types/machine';
import { StatusBadge } from './StatusBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryIconComponent } from './CategoryIcon';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface MachineGroupCardProps {
  machines: Machine[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string, checked: boolean) => void;
}

export const MachineGroupCard = ({ machines, selectable, selectedIds, onToggleSelection }: MachineGroupCardProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const representative = machines[0];
  const count = machines.length;
  const CategoryIcon = getCategoryIconComponent(representative.category);
  const allSelected = machines.every(m => selectedIds?.has(m.id));

  if (count === 1) {
    // Single machine - navigate directly
    return (
      <div className={cn(
        "w-full glass-card p-4 text-left flex items-center gap-4 transition-all duration-200",
        selectable && selectedIds?.has(representative.id) && "ring-2 ring-primary/50 bg-primary/5"
      )}>
        {selectable && (
          <Checkbox
            checked={selectedIds?.has(representative.id)}
            onCheckedChange={(checked) => onToggleSelection?.(representative.id, !!checked)}
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <button
          onClick={() => !selectable && navigate(`/machine/${representative.id}`)}
          className="flex items-center gap-4 flex-1 min-w-0 touch-target active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <CategoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{representative.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{representative.brand} {representative.model}</p>
            {representative.serialNumber && (
              <p className="text-xs text-muted-foreground/70 mb-1.5 truncate font-mono">S/N: {representative.serialNumber}</p>
            )}
            <div className="flex items-center gap-3">
              <StatusBadge status={representative.status} />
              {representative.location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {representative.location}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>
      </div>
    );
  }

  // Group card - expandable
  return (
    <div className="space-y-1">
      <div className={cn(
        "w-full glass-card p-4 text-left flex items-center gap-4 transition-all duration-200",
        selectable && allSelected && "ring-2 ring-primary/50 bg-primary/5"
      )}>
        {selectable && (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              machines.forEach(m => onToggleSelection?.(m.id, !!checked));
            }}
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <button
          onClick={() => !selectable && setExpanded(!expanded)}
          className="flex items-center gap-4 flex-1 min-w-0 touch-target active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <CategoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-foreground truncate">
                {representative.name}
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
                  × {count}
                </span>
              </h3>
            </div>
            <p className="text-sm text-muted-foreground truncate">{representative.brand} {representative.model}</p>
            {representative.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                {representative.location}
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="ml-6 space-y-1 border-l-2 border-primary/20 pl-3">
          {machines.map((machine) => (
            <button
              key={machine.id}
              onClick={() => navigate(`/machine/${machine.id}`)}
              className="w-full glass-card p-3 text-left flex items-center gap-3 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground font-mono truncate">
                  S/N: {machine.serialNumber || (language === 'fr' ? 'Sans numéro' : 'No serial')}
                </p>
                {machine.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {machine.location}
                  </span>
                )}
              </div>
              <StatusBadge status={machine.status} />
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
