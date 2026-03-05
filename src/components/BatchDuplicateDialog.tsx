import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCloudData } from '@/hooks/useCloudData';
import { Machine } from '@/types/machine';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Copy, AlertCircle } from 'lucide-react';

interface BatchDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMachines: Machine[];
  onComplete: () => void;
}

export const BatchDuplicateDialog = ({ open, onOpenChange, selectedMachines, onComplete }: BatchDuplicateDialogProps) => {
  const { language } = useLanguage();
  const { addMachine } = useCloudData();
  const [serialNumbers, setSerialNumbers] = useState<Record<string, string>>({});
  const [duplicating, setDuplicating] = useState(false);

  const updateSerial = (machineId: string, value: string) => {
    setSerialNumbers(prev => ({ ...prev, [machineId]: value }));
  };

  const getErrors = () => {
    const errors: Record<string, string> = {};
    const serials = Object.values(serialNumbers).filter(Boolean).map(s => s.trim().toLowerCase());

    for (const machine of selectedMachines) {
      const serial = (serialNumbers[machine.id] || '').trim();
      if (!serial) {
        errors[machine.id] = language === 'fr' ? 'Obligatoire' : 'Required';
      } else if (serial.toLowerCase() === machine.serialNumber.toLowerCase()) {
        errors[machine.id] = language === 'fr' ? 'Doit être différent de l\'original' : 'Must differ from original';
      } else if (serials.filter(s => s === serial.toLowerCase()).length > 1) {
        errors[machine.id] = language === 'fr' ? 'Doublon détecté' : 'Duplicate detected';
      }
    }
    return errors;
  };

  const errors = getErrors();
  const hasErrors = Object.keys(errors).length > 0;
  const allFilled = selectedMachines.every(m => (serialNumbers[m.id] || '').trim());

  const handleDuplicate = async () => {
    if (hasErrors || !allFilled) return;

    setDuplicating(true);
    let successCount = 0;

    for (const machine of selectedMachines) {
      const result = await addMachine({
        name: machine.name,
        category: machine.category,
        brand: machine.brand,
        model: machine.model,
        serialNumber: serialNumbers[machine.id].trim(),
        location: machine.location,
        status: 'operational',
        notes: machine.notes,
      });
      if (result) successCount++;
    }

    setDuplicating(false);

    if (successCount === selectedMachines.length) {
      toast.success(
        language === 'fr'
          ? `${successCount} machine(s) dupliquée(s) avec succès`
          : `${successCount} machine(s) duplicated successfully`
      );
    } else {
      toast.warning(
        language === 'fr'
          ? `${successCount}/${selectedMachines.length} machines dupliquées`
          : `${successCount}/${selectedMachines.length} machines duplicated`
      );
    }

    setSerialNumbers({});
    onOpenChange(false);
    onComplete();
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setSerialNumbers({});
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-dialog sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary" />
            {language === 'fr'
              ? `Dupliquer ${selectedMachines.length} équipement(s)`
              : `Duplicate ${selectedMachines.length} equipment(s)`}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {language === 'fr'
            ? 'Entrez un numéro de série unique pour chaque machine à dupliquer.'
            : 'Enter a unique serial number for each machine to duplicate.'}
        </p>

        <ScrollArea className="max-h-[50vh] pr-2">
          <div className="space-y-4 py-2">
            {selectedMachines.map((machine) => (
              <div key={machine.id} className="glass-card p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground truncate">{machine.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {machine.brand} {machine.model}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr' ? 'Original' : 'Original'}: {machine.serialNumber}
                </p>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'fr' ? 'Nouveau n° de série' : 'New serial number'} *
                  </Label>
                  <Input
                    value={serialNumbers[machine.id] || ''}
                    onChange={(e) => updateSerial(machine.id, e.target.value)}
                    placeholder={language === 'fr' ? 'Entrez le nouveau n° de série' : 'Enter new serial number'}
                    className="h-10 glass-input text-sm"
                  />
                  {errors[machine.id] && (serialNumbers[machine.id] || '').trim() && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors[machine.id]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={duplicating}>
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </Button>
          <Button onClick={handleDuplicate} disabled={hasErrors || !allFilled || duplicating}>
            {duplicating
              ? (language === 'fr' ? 'Duplication...' : 'Duplicating...')
              : (language === 'fr' ? 'Dupliquer tout' : 'Duplicate all')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
