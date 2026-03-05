import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudData } from '@/hooks/useCloudData';
import { useWorkspaceSettings } from '@/hooks/useWorkspaceSettings';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { EntryCard } from '@/components/EntryCard';
import { PhotoCapture } from '@/components/PhotoCapture';
import { PhotoGallery } from '@/components/PhotoGallery';
import { CodeDisplay } from '@/components/QRCodeDisplay';
import { getCategoryIconComponent } from '@/components/CategoryIcon';
import { getCategoryLabel } from '@/data/equipmentData';
import { MaintenanceScheduleCard } from '@/components/MaintenanceScheduleCard';
import AIDiagnosticChat from '@/components/AIDiagnosticChat';
import { MachineStatusEditor } from '@/components/MachineStatusEditor';
import { ManualRepairEntry, RepairEntryData } from '@/components/ManualRepairEntry';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EntryType, EntryPhoto, MachineStatus } from '@/types/machine';
import { Plus, Trash2, MapPin, Hash, AlertCircle, Bot, ChevronDown, Settings2, Wrench, Images, Copy } from 'lucide-react';
import { toast } from 'sonner';

const MachineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isWorkspaceAdmin } = useAuth();
  const { getMachine, getEntriesForMachine, addEntry, deleteEntry, deleteMachine, updateMachine, team, addMachine } = useCloudData();
  const { settings } = useWorkspaceSettings();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isStatusEditorOpen, setIsStatusEditorOpen] = useState(false);
  const [isManualRepairOpen, setIsManualRepairOpen] = useState(false);
  const [isPhotosEditorOpen, setIsPhotosEditorOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [duplicateSerial, setDuplicateSerial] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [photos, setPhotos] = useState<EntryPhoto[]>([]);
  const [presentationPhotos, setPresentationPhotos] = useState<EntryPhoto[]>([]);
  const [entryForm, setEntryForm] = useState({
    type: 'diagnostic' as EntryType,
    description: '',
    workPerformed: '',
    partsReplaced: '',
    technicianId: '',
    date: new Date().toISOString().split('T')[0],
  });

  const machine = getMachine(id || '');
  const entries = getEntriesForMachine(id || '');

  useEffect(() => {
    if (!isPhotosEditorOpen || !machine) return;

    setPresentationPhotos(
      (machine.photos || []).map((url, index) => ({
        id: `presentation-${index}`,
        dataUrl: url,
        createdAt: new Date(),
      }))
    );
  }, [isPhotosEditorOpen, machine]);

  if (!machine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          {language === 'fr' ? 'Équipement non trouvé' : 'Equipment not found'}
        </p>
      </div>
    );
  }

  const CategoryIcon = getCategoryIconComponent(machine.category);

  const handleAddEntry = async () => {
    if (!entryForm.description) {
      toast.error(language === 'fr' ? 'Veuillez ajouter une description' : 'Please add a description');
      return;
    }

    const technician = team.find(m => m.id === entryForm.technicianId);
    
    if (!technician) {
      toast.error(language === 'fr' ? 'Sélectionnez un technicien' : 'Select a technician');
      return;
    }

    const result = await addEntry({
      machineId: machine.id,
      type: entryForm.type,
      description: entryForm.description,
      workPerformed: entryForm.workPerformed,
      partsReplaced: entryForm.partsReplaced,
      technicianId: technician.id,
      technicianName: technician.name,
      photos: photos,
      date: new Date(entryForm.date),
    });

    if (result) {
      setEntryForm({
        type: 'diagnostic',
        description: '',
        workPerformed: '',
        partsReplaced: '',
        technicianId: '',
        date: new Date().toISOString().split('T')[0],
      });
      setPhotos([]);
      setIsSheetOpen(false);
      toast.success(language === 'fr' ? 'Entrée ajoutée' : 'Entry added');
    } else {
      toast.error(language === 'fr' ? 'Erreur' : 'Error');
    }
  };

  const handleDeleteMachine = async () => {
    if (!isWorkspaceAdmin) {
      toast.error(language === 'fr' ? 'Seuls les admins peuvent supprimer' : 'Only admins can delete');
      return;
    }
    if (confirm(language === 'fr' ? 'Supprimer cet équipement?' : 'Delete this equipment?')) {
      const success = await deleteMachine(machine.id);
      if (success) {
        navigate('/');
        toast.success(language === 'fr' ? 'Équipement supprimé' : 'Equipment deleted');
      }
    }
  };

  const handleSheetOpen = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setPhotos([]);
    }
    setIsSheetOpen(open);
  };

  const handleSaveStatus = async (status: MachineStatus, notes: string): Promise<boolean> => {
    console.log('Saving status:', { status, notes, machineId: machine.id });
    const result = await updateMachine(machine.id, { status, notes });
    console.log('Status save result:', result);
    if (result) {
      toast.success(language === 'fr' ? 'Statut mis à jour' : 'Status updated');
    }
    return result;
  };

  const handleSaveManualRepair = async (data: RepairEntryData): Promise<boolean> => {
    const technician = team.find(m => m.id === data.technicianId);
    const result = await addEntry({
      machineId: machine.id,
      type: data.type === 'external-repair' ? 'repair' : data.type,
      description: data.externalProvider 
        ? `[${language === 'fr' ? 'Réparation externe' : 'External repair'}: ${data.externalProvider}${data.cost ? ` - ${data.cost}${data.currency}` : ''}] ${data.description}`
        : data.description,
      workPerformed: data.workPerformed || '',
      technicianId: technician?.id || '',
      technicianName: technician?.name || data.externalProvider || '',
      photos: [],
      date: new Date(data.date),
    });
    return result !== null;
  };

  const handleSavePresentationPhotos = async () => {
    const urls = presentationPhotos.map(p => p.dataUrl).filter(Boolean);
    console.log('Saving presentation photos:', { count: urls.length, machineId: machine.id });
    
    // Check if photos are too large (base64 can be very large)
    const totalSize = urls.reduce((acc, url) => acc + url.length, 0);
    console.log('Total photo data size (chars):', totalSize);
    
    if (totalSize > 5000000) { // 5MB limit warning
      toast.warning(language === 'fr' 
        ? 'Les photos sont très volumineuses, cela peut prendre du temps...' 
        : 'Photos are very large, this may take a while...');
    }
    
    const ok = await updateMachine(machine.id, { photos: urls });
    console.log('Photo save result:', ok);
    
    if (ok) {
      toast.success(language === 'fr' ? 'Photos enregistrées' : 'Photos saved');
      setIsPhotosEditorOpen(false);
    } else {
      toast.error(language === 'fr' ? 'Impossible d\'enregistrer les photos' : 'Failed to save photos');
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateSerial.trim()) {
      toast.error(language === 'fr' ? 'Le numéro de série est obligatoire' : 'Serial number is required');
      return;
    }
    if (duplicateSerial.trim().toLowerCase() === machine.serialNumber.toLowerCase()) {
      toast.error(language === 'fr' ? 'Le numéro de série doit être différent' : 'Serial number must be different');
      return;
    }
    setDuplicating(true);
    const result = await addMachine({
      name: machine.name,
      category: machine.category,
      brand: machine.brand,
      model: machine.model,
      serialNumber: duplicateSerial.trim(),
      location: machine.location,
      status: 'operational',
      notes: machine.notes,
    });
    setDuplicating(false);
    if (result) {
      toast.success(language === 'fr' ? 'Machine dupliquée avec succès' : 'Machine duplicated successfully');
      setIsDuplicateOpen(false);
      setDuplicateSerial('');
      navigate(`/machine/${result.id}`);
    } else {
      toast.error(language === 'fr' ? 'Erreur lors de la duplication' : 'Error duplicating machine');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header
        title={machine.name}
        showBack
        rightAction={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDuplicateOpen(true)}
              className="p-2 text-muted-foreground hover:text-primary touch-target"
              title={language === 'fr' ? 'Dupliquer' : 'Duplicate'}
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsStatusEditorOpen(true)}
              className="p-2 text-primary touch-target"
              title={language === 'fr' ? 'Modifier l\'état' : 'Edit status'}
            >
              <Settings2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDeleteMachine}
              className="p-2 text-destructive touch-target"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        }
      />

      {/* Status Editor Dialog */}
      <MachineStatusEditor
        open={isStatusEditorOpen}
        onOpenChange={setIsStatusEditorOpen}
        currentStatus={machine.status}
        currentNotes={machine.notes}
        machineName={machine.name}
        onSave={handleSaveStatus}
      />

      {/* Duplicate Machine Dialog */}
      <Dialog open={isDuplicateOpen} onOpenChange={(open) => { setIsDuplicateOpen(open); if (!open) setDuplicateSerial(''); }}>
        <DialogContent className="glass-dialog">
          <DialogHeader>
            <DialogTitle>
              {language === 'fr' ? 'Dupliquer l\'équipement' : 'Duplicate equipment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {language === 'fr'
                ? `Toutes les informations de "${machine.name}" seront copiées. Vous devez entrer un nouveau numéro de série unique.`
                : `All information from "${machine.name}" will be copied. You must enter a new unique serial number.`}
            </p>
            <div className="space-y-2">
              <Label htmlFor="duplicate-serial" className="text-sm font-medium text-foreground">
                {language === 'fr' ? 'Nouveau numéro de série' : 'New serial number'} *
              </Label>
              <Input
                id="duplicate-serial"
                value={duplicateSerial}
                onChange={(e) => setDuplicateSerial(e.target.value)}
                placeholder={language === 'fr' ? 'Entrez un numéro de série différent' : 'Enter a different serial number'}
                className="h-12 glass-input"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDuplicate(); } }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDuplicateOpen(false)}>
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={handleDuplicate} disabled={!duplicateSerial.trim() || duplicating}>
              {duplicating
                ? (language === 'fr' ? 'Duplication...' : 'Duplicating...')
                : (language === 'fr' ? 'Dupliquer' : 'Duplicate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPhotosEditorOpen} onOpenChange={setIsPhotosEditorOpen}>
        <DialogContent className="sm:max-w-lg glass-dialog max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'fr' ? 'Photos de présentation' : 'Presentation photos'}
            </DialogTitle>
          </DialogHeader>

          <PhotoCapture photos={presentationPhotos} onPhotosChange={setPresentationPhotos} maxPhotos={8} />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPhotosEditorOpen(false)}>
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={handleSavePresentationPhotos}>
              {language === 'fr' ? 'Enregistrer' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Repair Entry Sheet */}
      <ManualRepairEntry
        open={isManualRepairOpen}
        onOpenChange={setIsManualRepairOpen}
        machineId={machine.id}
        machineName={machine.name}
        onSave={handleSaveManualRepair}
        teamMembers={team}
      />

      <div className="p-4 space-y-4">
        {/* Machine Info Card - Glass Effect */}
        <div className="glass-card p-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl glass-button flex items-center justify-center flex-shrink-0">
              <CategoryIcon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">{machine.name}</h2>
              <p className="text-sm text-muted-foreground">
                {machine.brand} {machine.model}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getCategoryLabel(machine.category, language)}
              </p>
            </div>
            <StatusBadge status={machine.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span className="truncate">{machine.serialNumber}</span>
            </div>
            {machine.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{machine.location}</span>
              </div>
            )}
          </div>

          {/* Code Display Section */}
          {machine.serialNumber && (
            <div className="pt-4 border-t border-border/50 mt-4">
              <CodeDisplay 
                serialNumber={machine.serialNumber} 
                machineName={machine.name}
                showBarcode={settings?.enable_barcode_print ?? true}
                showQRCode={settings?.enable_qrcode_print ?? true}
              />
            </div>
          )}

          {/* Presentation photos */}
          <div className="pt-4 border-t border-border/50 mt-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Images className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground truncate">
                  {language === 'fr' ? 'Photos de présentation' : 'Presentation photos'}
                </span>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsPhotosEditorOpen(true)}>
                {language === 'fr' ? 'Modifier' : 'Edit'}
              </Button>
            </div>

            {machine.photos && machine.photos.length > 0 ? (
              <PhotoGallery
                photos={machine.photos.map((url, index) => ({
                  id: `photo-${index}`,
                  dataUrl: url,
                  createdAt: new Date(),
                }))}
                size="md"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {language === 'fr' ? 'Aucune photo pour le moment.' : 'No photos yet.'}
              </p>
            )}
          </div>

          {machine.notes && (
            <p className="mt-4 text-sm text-muted-foreground border-t border-border/50 pt-4">
              {machine.notes}
            </p>
          )}
        </div>

        {/* Maintenance Schedule */}
        <MaintenanceScheduleCard 
          machineId={machine.id} 
          machineName={machine.name} 
        />

        {/* AI Diagnostic Assistant */}
        <Collapsible open={isAIOpen} onOpenChange={setIsAIOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between h-14 rounded-xl glass-card border-primary/20 hover:bg-primary/10"
            >
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {language === 'fr' ? 'Assistant IA Diagnostic' : 'AI Diagnostic Assistant'}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${isAIOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <AIDiagnosticChat
              machineCategory={machine.category}
              machineBrand={machine.brand}
              machineModel={machine.model}
              machineName={machine.name}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* No Team Members Warning */}
        {team.length === 0 && (
          <div className="flex items-center gap-3 p-3 glass-card border-warning/30">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
            <p className="text-sm text-warning">
              {language === 'fr' 
                ? 'Ajoutez des membres dans l\'onglet Équipe pour enregistrer des entrées'
                : 'Add team members in the Team tab to log entries'}
            </p>
          </div>
        )}

        {/* History Section */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('history')}</h3>
          
          <div className="flex items-center gap-2">
            {/* Manual Repair Button */}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1"
              onClick={() => setIsManualRepairOpen(true)}
            >
              <Wrench className="w-4 h-4" />
              {language === 'fr' ? 'Manuel' : 'Manual'}
            </Button>
            
            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  size="sm" 
                  className="rounded-full gap-1"
                  disabled={team.length === 0}
                >
                  <Plus className="w-4 h-4" />
                  {t('addEntry')}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-hidden glass-dialog border-t-0">
                <SheetHeader className="mb-4">
                  <SheetTitle>{t('addEntry')}</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-4 overflow-y-auto h-[calc(100%-4rem)] pb-8">
                <div className="space-y-2">
                  <Label>{t('entryType')}</Label>
                  <Select
                    value={entryForm.type}
                    onValueChange={(value) => setEntryForm(prev => ({ ...prev, type: value as EntryType }))}
                  >
                    <SelectTrigger className="h-12 glass-input">
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
                    className="h-12 glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('technician')} *</Label>
                  <Select
                    value={entryForm.technicianId}
                    onValueChange={(value) => setEntryForm(prev => ({ ...prev, technicianId: value }))}
                  >
                    <SelectTrigger className="h-12 glass-input">
                      <SelectValue placeholder={t('selectTechnician')} />
                    </SelectTrigger>
                    <SelectContent>
                      {team.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} {member.role ? `(${member.role})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('description')} *</Label>
                  <Textarea
                    value={entryForm.description}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="glass-input min-h-[80px]"
                    placeholder={language === 'fr' ? 'Décrivez le problème ou l\'intervention...' : 'Describe the issue or work done...'}
                    required
                  />
                </div>

                {/* Photo Capture */}
                <PhotoCapture 
                  photos={photos} 
                  onPhotosChange={setPhotos}
                  maxPhotos={5}
                />

                <div className="space-y-2">
                  <Label>{t('workPerformed')}</Label>
                  <Textarea
                    value={entryForm.workPerformed}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, workPerformed: e.target.value }))}
                    className="glass-input min-h-[80px]"
                    placeholder={language === 'fr' ? 'Travaux effectués...' : 'Work performed...'}
                  />
                </div>

                {(entryForm.type === 'replacement' || entryForm.type === 'repair') && (
                  <div className="space-y-2">
                    <Label>{t('partsReplaced')}</Label>
                    <Input
                      value={entryForm.partsReplaced}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, partsReplaced: e.target.value }))}
                      className="h-12 glass-input"
                      placeholder={language === 'fr' ? 'Ex: Fader, alimentation...' : 'Ex: Fader, power supply...'}
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
        </div>

        {entries.length === 0 ? (
          <div className="glass-card p-8 text-center">
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
