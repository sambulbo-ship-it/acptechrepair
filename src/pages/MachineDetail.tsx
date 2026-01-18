import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMachines } from '@/hooks/useMachines';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EntryCard } from '@/components/EntryCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { EntryType } from '@/types/machine';
import { Plus, Trash2, MapPin, Hash, Building, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

const MachineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { getMachine, getEntriesForMachine, addEntry, deleteEntry, deleteMachine } = useMachines();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({
    type: 'diagnostic' as EntryType,
    description: '',
    workPerformed: '',
    partsReplaced: '',
    technician: '',
    date: new Date().toISOString().split('T')[0],
  });

  const machine = getMachine(id || '');
  const entries = getEntriesForMachine(id || '');

  if (!machine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Machine not found</p>
      </div>
    );
  }

  const handleAddEntry = () => {
    if (!entryForm.description || !entryForm.technician) {
      toast.error(t('language') === 'Langue' ? 'Veuillez remplir les champs obligatoires' : 'Please fill in required fields');
      return;
    }

    addEntry({
      machineId: machine.id,
      type: entryForm.type,
      description: entryForm.description,
      workPerformed: entryForm.workPerformed,
      partsReplaced: entryForm.partsReplaced,
      technician: entryForm.technician,
      date: new Date(entryForm.date),
    });

    setEntryForm({
      type: 'diagnostic',
      description: '',
      workPerformed: '',
      partsReplaced: '',
      technician: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsSheetOpen(false);
    toast.success(t('language') === 'Langue' ? 'Entrée ajoutée' : 'Entry added');
  };

  const handleDeleteMachine = () => {
    if (confirm(t('language') === 'Langue' ? 'Êtes-vous sûr?' : 'Are you sure?')) {
      deleteMachine(machine.id);
      navigate('/');
      toast.success(t('language') === 'Langue' ? 'Machine supprimée' : 'Machine deleted');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header
        title={machine.name}
        showBack
        rightAction={
          <button
            onClick={handleDeleteMachine}
            className="p-2 text-destructive touch-target"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Machine Info Card */}
        <div className="ios-card p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{machine.name}</h2>
              <p className="text-sm text-muted-foreground">
                {machine.manufacturer} {machine.model}
              </p>
            </div>
            <StatusBadge status={machine.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span>{machine.serialNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{machine.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="w-4 h-4" />
              <span>{machine.manufacturer}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Settings2 className="w-4 h-4" />
              <span>{machine.type || '-'}</span>
            </div>
          </div>

          {machine.notes && (
            <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
              {machine.notes}
            </p>
          )}
        </div>

        {/* History Section */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('history')}</h3>
          
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="rounded-full gap-1">
                <Plus className="w-4 h-4" />
                {t('addEntry')}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader className="mb-4">
                <SheetTitle>{t('addEntry')}</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <Label>{t('entryType')}</Label>
                  <Select
                    value={entryForm.type}
                    onValueChange={(value) => setEntryForm(prev => ({ ...prev, type: value as EntryType }))}
                  >
                    <SelectTrigger className="h-12 bg-secondary border-0 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagnostic">{t('diagnostic')}</SelectItem>
                      <SelectItem value="repair">{t('repair')}</SelectItem>
                      <SelectItem value="replacement">{t('replacement')}</SelectItem>
                      <SelectItem value="change">{t('change')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('date')}</Label>
                  <Input
                    type="date"
                    value={entryForm.date}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, date: e.target.value }))}
                    className="h-12 bg-secondary border-0 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('technician')} *</Label>
                  <Input
                    value={entryForm.technician}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, technician: e.target.value }))}
                    className="h-12 bg-secondary border-0 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('description')} *</Label>
                  <Textarea
                    value={entryForm.description}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-secondary border-0 rounded-xl min-h-[80px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('workPerformed')}</Label>
                  <Textarea
                    value={entryForm.workPerformed}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, workPerformed: e.target.value }))}
                    className="bg-secondary border-0 rounded-xl min-h-[80px]"
                  />
                </div>

                {(entryForm.type === 'replacement' || entryForm.type === 'repair') && (
                  <div className="space-y-2">
                    <Label>{t('partsReplaced')}</Label>
                    <Input
                      value={entryForm.partsReplaced}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, partsReplaced: e.target.value }))}
                      className="h-12 bg-secondary border-0 rounded-xl"
                    />
                  </div>
                )}

                <Button onClick={handleAddEntry} className="w-full h-14 text-lg rounded-xl mt-4">
                  {t('save')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {entries.length === 0 ? (
          <div className="ios-card p-8 text-center">
            <p className="text-muted-foreground">{t('noHistory')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineDetail;
