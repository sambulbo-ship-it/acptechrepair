import { DiagnosticEntry, EntryType } from '@/types/machine';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Stethoscope, Wrench, RefreshCw, Settings, Trash2 } from 'lucide-react';

interface EntryCardProps {
  entry: DiagnosticEntry;
  onDelete?: () => void;
}

const entryTypeConfig: Record<EntryType, { icon: typeof Stethoscope; className: string }> = {
  diagnostic: { icon: Stethoscope, className: 'entry-diagnostic' },
  repair: { icon: Wrench, className: 'entry-repair' },
  replacement: { icon: RefreshCw, className: 'entry-replacement' },
  change: { icon: Settings, className: 'entry-change' },
};

export const EntryCard = ({ entry, onDelete }: EntryCardProps) => {
  const { t } = useLanguage();
  const config = entryTypeConfig[entry.type];
  const Icon = config.icon;

  return (
    <div className={cn('ios-card p-4', config.className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-secondary">
            <Icon className="w-4 h-4 text-secondary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium uppercase text-primary">
                {t(entry.type)}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(entry.date), 'MMM d, yyyy')}
              </span>
            </div>
            
            <p className="text-sm text-foreground mb-2">
              {entry.description}
            </p>
            
            {entry.workPerformed && (
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">{t('workPerformed')}:</span> {entry.workPerformed}
              </p>
            )}
            
            {entry.partsReplaced && (
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">{t('partsReplaced')}:</span> {entry.partsReplaced}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{t('technician')}:</span> {entry.technician}
            </p>
          </div>
        </div>
        
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg touch-target"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
