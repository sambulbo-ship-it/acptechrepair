import { Machine } from '@/types/machine';
import { StatusBadge } from './StatusBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight, MapPin, Hash } from 'lucide-react';

interface MachineCardProps {
  machine: Machine;
  onClick: () => void;
}

export const MachineCard = ({ machine, onClick }: MachineCardProps) => {
  const { t } = useLanguage();

  return (
    <button
      onClick={onClick}
      className="w-full ios-card p-4 text-left touch-target flex items-center gap-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">
            {machine.name}
          </h3>
          <StatusBadge status={machine.status} />
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">
          {machine.manufacturer} {machine.model}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {machine.location}
          </span>
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {machine.serialNumber}
          </span>
        </div>
      </div>
      
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
};
