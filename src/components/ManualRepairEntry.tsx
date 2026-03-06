import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplePlatform } from '@/hooks/useApplePlatform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  FileText, 
  Upload, 
  X, 
  Wrench, 
  Building2,
  Calendar,
  Euro,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ManualRepairEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId: string;
  machineName: string;
  onSave: (data: RepairEntryData) => Promise<boolean>;
  teamMembers: { id: string; name: string }[];
  onAddTeamMember?: (name: string) => Promise<{ id: string; name: string } | null>;
  onUpdateTeamMember?: (id: string, name: string) => Promise<boolean>;
  onDeleteTeamMember?: (id: string) => Promise<boolean>;
}

export interface RepairEntryData {
  type: 'diagnostic' | 'repair' | 'replacement' | 'change' | 'external-repair';
  description: string;
  workPerformed?: string;
  partsReplaced?: string;
  technicianId?: string;
  technicianName?: string;
  externalProvider?: string;
  cost?: number;
  currency?: string;
  invoicePdf?: File;
  invoiceUrl?: string;
  date: string;
}

export const ManualRepairEntry = ({
  open,
  onOpenChange,
  machineId,
  machineName,
  onSave,
  teamMembers,
  onAddTeamMember,
}: ManualRepairEntryProps) => {
  const { language } = useLanguage();
  const { supportsLiquidGlass } = useApplePlatform();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showAddTechnician, setShowAddTechnician] = useState(false);
  const [newTechnicianName, setNewTechnicianName] = useState('');
  const [addingTechnician, setAddingTechnician] = useState(false);

  const [form, setForm] = useState<RepairEntryData>({
    type: 'repair',
    description: '',
    workPerformed: '',
    partsReplaced: '',
    technicianId: '',
    technicianName: '',
    externalProvider: '',
    cost: undefined,
    currency: 'EUR',
    date: new Date().toISOString().split('T')[0],
  });

  const t = language === 'fr' ? {
    title: 'Ajouter réparation manuelle',
    type: 'Type d\'intervention',
    diagnostic: 'Diagnostic',
    repair: 'Réparation',
    replacement: 'Remplacement',
    change: 'Modification',
    externalRepair: 'Réparation externe',
    description: 'Description',
    descriptionPlaceholder: 'Décrivez l\'intervention...',
    workPerformed: 'Travaux effectués',
    workPerformedPlaceholder: 'Détails des travaux...',
    partsReplaced: 'Pièces remplacées',
    partsPlaceholder: 'Liste des pièces...',
    technician: 'Technicien',
    selectTechnician: 'Sélectionner un technicien',
    externalProvider: 'Prestataire externe',
    providerPlaceholder: 'Nom du prestataire...',
    cost: 'Coût',
    date: 'Date',
    attachInvoice: 'Joindre facture PDF',
    invoiceAttached: 'Facture jointe',
    removeFile: 'Retirer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    externalNote: 'Pour une réparation effectuée par un prestataire externe, vous pouvez joindre la facture PDF.',
  } : {
    title: 'Add Manual Repair',
    type: 'Intervention Type',
    diagnostic: 'Diagnostic',
    repair: 'Repair',
    replacement: 'Replacement',
    change: 'Modification',
    externalRepair: 'External Repair',
    description: 'Description',
    descriptionPlaceholder: 'Describe the intervention...',
    workPerformed: 'Work Performed',
    workPerformedPlaceholder: 'Work details...',
    partsReplaced: 'Parts Replaced',
    partsPlaceholder: 'Parts list...',
    technician: 'Technician',
    selectTechnician: 'Select a technician',
    externalProvider: 'External Provider',
    providerPlaceholder: 'Provider name...',
    cost: 'Cost',
    date: 'Date',
    attachInvoice: 'Attach PDF Invoice',
    invoiceAttached: 'Invoice attached',
    removeFile: 'Remove',
    save: 'Save',
    cancel: 'Cancel',
    externalNote: 'For repairs done by an external provider, you can attach the PDF invoice.',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error(language === 'fr' ? 'Seuls les fichiers PDF sont acceptés' : 'Only PDF files are accepted');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(language === 'fr' ? 'Fichier trop volumineux (max 10MB)' : 'File too large (max 10MB)');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleRemoveFile = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTechnician = async () => {
    if (!newTechnicianName.trim() || !onAddTeamMember) return;
    setAddingTechnician(true);
    const member = await onAddTeamMember(newTechnicianName.trim());
    setAddingTechnician(false);
    if (member) {
      setForm(prev => ({ ...prev, technicianId: member.id }));
      setNewTechnicianName('');
      setShowAddTechnician(false);
      toast.success(language === 'fr' ? 'Technicien ajouté' : 'Technician added');
    } else {
      toast.error(language === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding technician');
    }
  };

  const handleSave = async () => {
    if (!form.description) {
      toast.error(language === 'fr' ? 'Veuillez ajouter une description' : 'Please add a description');
      return;
    }

    setSaving(true);
    
    const technician = teamMembers.find(m => m.id === form.technicianId);
    
    const success = await onSave({
      ...form,
      technicianName: technician?.name || form.externalProvider || '',
      invoicePdf: pdfFile || undefined,
    });

    setSaving(false);

    if (success) {
      // Reset form
      setForm({
        type: 'repair',
        description: '',
        workPerformed: '',
        partsReplaced: '',
        technicianId: '',
        technicianName: '',
        externalProvider: '',
        cost: undefined,
        currency: 'EUR',
        date: new Date().toISOString().split('T')[0],
      });
      setPdfFile(null);
      onOpenChange(false);
    }
  };

  const isExternalRepair = form.type === 'external-repair';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn(
        'h-[90vh] rounded-t-3xl overflow-hidden border-t-0',
        supportsLiquidGlass && 'glass-dialog'
      )}>
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            {t.title} - {machineName}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto h-[calc(100%-4rem)] pb-8 px-1">
          {/* Type */}
          <div className="space-y-2">
            <Label>{t.type}</Label>
            <Select 
              value={form.type} 
              onValueChange={(v) => setForm(prev => ({ ...prev, type: v as RepairEntryData['type'] }))}
            >
              <SelectTrigger className={cn('h-12', supportsLiquidGlass && 'glass-input')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diagnostic">{t.diagnostic}</SelectItem>
                <SelectItem value="repair">{t.repair}</SelectItem>
                <SelectItem value="replacement">{t.replacement}</SelectItem>
                <SelectItem value="change">{t.change}</SelectItem>
                <SelectItem value="external-repair">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {t.externalRepair}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>{t.date}</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
              className={cn('h-12', supportsLiquidGlass && 'glass-input')}
            />
          </div>

          {/* External provider info */}
          {isExternalRepair && (
            <>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-primary">{t.externalNote}</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {t.externalProvider}
                </Label>
                <Input
                  value={form.externalProvider}
                  onChange={(e) => setForm(prev => ({ ...prev, externalProvider: e.target.value }))}
                  placeholder={t.providerPlaceholder}
                  className={cn('h-12', supportsLiquidGlass && 'glass-input')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Euro className="w-4 h-4" />
                    {t.cost}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.cost || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || undefined }))}
                    className={cn('h-12', supportsLiquidGlass && 'glass-input')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Select 
                    value={form.currency} 
                    onValueChange={(v) => setForm(prev => ({ ...prev, currency: v }))}
                  >
                    <SelectTrigger className={cn('h-12', supportsLiquidGlass && 'glass-input')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR €</SelectItem>
                      <SelectItem value="USD">USD $</SelectItem>
                      <SelectItem value="GBP">GBP £</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PDF Upload */}
              <div className="space-y-2">
                <Label>{t.attachInvoice}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {pdfFile ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-sm truncate">{pdfFile.name}</span>
                    <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className={cn('w-full h-12', supportsLiquidGlass && 'glass-button')}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t.attachInvoice}
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Internal technician */}
          {!isExternalRepair && (
            <div className="space-y-2">
              <Label>{t.technician}</Label>
              <Select 
                value={form.technicianId} 
                onValueChange={(v) => setForm(prev => ({ ...prev, technicianId: v }))}
              >
                <SelectTrigger className={cn('h-12', supportsLiquidGlass && 'glass-input')}>
                  <SelectValue placeholder={t.selectTechnician} />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add technician inline */}
              {onAddTeamMember && (
                <>
                  {showAddTechnician ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={newTechnicianName}
                        onChange={(e) => setNewTechnicianName(e.target.value)}
                        placeholder={language === 'fr' ? 'Nom du technicien' : 'Technician name'}
                        className={cn('h-10 flex-1', supportsLiquidGlass && 'glass-input')}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTechnician(); } }}
                      />
                      <Button size="sm" onClick={handleAddTechnician} disabled={addingTechnician || !newTechnicianName.trim()}>
                        {addingTechnician ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowAddTechnician(false); setNewTechnicianName(''); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => setShowAddTechnician(true)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {language === 'fr' ? 'Ajouter un technicien' : 'Add a technician'}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>{t.description} *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t.descriptionPlaceholder}
              className={cn('min-h-[80px]', supportsLiquidGlass && 'glass-input')}
            />
          </div>

          {/* Work performed */}
          <div className="space-y-2">
            <Label>{t.workPerformed}</Label>
            <Textarea
              value={form.workPerformed}
              onChange={(e) => setForm(prev => ({ ...prev, workPerformed: e.target.value }))}
              placeholder={t.workPerformedPlaceholder}
              className={cn('min-h-[80px]', supportsLiquidGlass && 'glass-input')}
            />
          </div>

          {/* Parts replaced */}
          <div className="space-y-2">
            <Label>{t.partsReplaced}</Label>
            <Input
              value={form.partsReplaced}
              onChange={(e) => setForm(prev => ({ ...prev, partsReplaced: e.target.value }))}
              placeholder={t.partsPlaceholder}
              className={cn('h-12', supportsLiquidGlass && 'glass-input')}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="ghost" 
              className="flex-1 h-12" 
              onClick={() => onOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button 
              className="flex-1 h-12" 
              onClick={handleSave}
              disabled={saving || !form.description}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
