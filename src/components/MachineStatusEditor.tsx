import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplePlatform } from '@/hooks/useApplePlatform';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MachineStatus } from '@/types/machine';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MachineStatusEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: MachineStatus;
  currentNotes: string;
  machineName: string;
  onSave: (status: MachineStatus, notes: string) => Promise<boolean>;
}

const STATUS_OPTIONS: { value: MachineStatus; labelFr: string; labelEn: string; icon: React.ElementType; color: string }[] = [
  { 
    value: 'operational', 
    labelFr: 'Opérationnel', 
    labelEn: 'Operational',
    icon: CheckCircle2,
    color: 'text-success',
  },
  { 
    value: 'needs-attention', 
    labelFr: 'Attention requise', 
    labelEn: 'Needs Attention',
    icon: AlertTriangle,
    color: 'text-warning',
  },
  { 
    value: 'out-of-service', 
    labelFr: 'Hors service', 
    labelEn: 'Out of Service',
    icon: XCircle,
    color: 'text-destructive',
  },
];

export const MachineStatusEditor = ({
  open,
  onOpenChange,
  currentStatus,
  currentNotes,
  machineName,
  onSave,
}: MachineStatusEditorProps) => {
  const { language } = useLanguage();
  const { supportsLiquidGlass } = useApplePlatform();
  const [status, setStatus] = useState<MachineStatus>(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);

  const t = language === 'fr' ? {
    title: 'Modifier l\'état',
    status: 'Statut',
    notes: 'Notes',
    notesPlaceholder: 'Ajouter des notes sur l\'état de l\'équipement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    restockHelp: 'Pour remettre en stock un équipement en réparation, changez son statut en "Opérationnel".',
  } : {
    title: 'Edit Status',
    status: 'Status',
    notes: 'Notes',
    notesPlaceholder: 'Add notes about the equipment status...',
    save: 'Save',
    cancel: 'Cancel',
    restockHelp: 'To restock equipment that was in repair, change its status to "Operational".',
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(status, notes);
    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStatus(currentStatus);
      setNotes(currentNotes);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('max-w-md', supportsLiquidGlass && 'glass-dialog')}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            {t.title} - {machineName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Help */}
          {(currentStatus === 'needs-attention' || currentStatus === 'out-of-service') && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">{t.restockHelp}</p>
            </div>
          )}

          {/* Status Select */}
          <div className="space-y-2">
            <Label>{t.status}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as MachineStatus)}>
              <SelectTrigger className={cn('h-12', supportsLiquidGlass && 'glass-input')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', option.color)} />
                        <span>{language === 'fr' ? option.labelFr : option.labelEn}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t.notes}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className={cn('min-h-[100px]', supportsLiquidGlass && 'glass-input')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
