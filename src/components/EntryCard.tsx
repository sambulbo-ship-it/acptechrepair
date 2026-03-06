import { useState } from 'react';
import { DiagnosticEntry, EntryType } from '@/types/machine';
import { useLanguage } from '@/contexts/LanguageContext';
import { PhotoGallery } from './PhotoGallery';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Stethoscope, Wrench, RefreshCw, Settings, Trash2, ImageIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const { t, language } = useLanguage();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const config = entryTypeConfig[entry.type];
  const Icon = config.icon;
  const hasPhotos = entry.photos && entry.photos.length > 0;

  return (
    <>
      <div className={cn('ios-card p-4', config.className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-secondary">
              <Icon className="w-4 h-4 text-secondary-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-medium uppercase text-primary">
                  {t(entry.type)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </span>
                {hasPhotos && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ImageIcon className="w-3 h-3" />
                    {entry.photos.length}
                  </span>
                )}
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
                <span className="font-medium">{t('technician')}:</span> {entry.technicianName}
              </p>

              {/* Photo thumbnails */}
              {hasPhotos && <PhotoGallery photos={entry.photos} />}
            </div>
          </div>
          
          {onDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg touch-target"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'fr' ? 'Supprimer cette entrée ?' : 'Delete this entry?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'fr'
                ? 'Cette action est irréversible. L\'entrée sera définitivement supprimée de l\'historique.'
                : 'This action cannot be undone. The entry will be permanently removed from history.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'fr' ? 'Annuler' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete?.(); setConfirmDelete(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'fr' ? 'Supprimer' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
