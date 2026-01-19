import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRepairResources, RepairLocation, ExternalRepair, SparePart } from '@/hooks/useRepairResources';
import { useCloudData } from '@/hooks/useCloudData';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Package, 
  Truck, 
  Plus, 
  Pencil, 
  Trash2, 
  Phone, 
  Mail, 
  Globe,
  AlertTriangle,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { equipmentCategories } from '@/data/equipmentData';

const RepairResources = () => {
  const { language } = useLanguage();
  const dateLocale = language === 'fr' ? fr : enUS;
  const { machines } = useCloudData();
  const {
    repairLocations,
    externalRepairs,
    spareParts,
    loading,
    addRepairLocation,
    updateRepairLocation,
    deleteRepairLocation,
    addExternalRepair,
    updateExternalRepair,
    deleteExternalRepair,
    addSparePart,
    updateSparePart,
    deleteSparePart,
  } = useRepairResources();

  const [activeTab, setActiveTab] = useState('locations');
  const [searchQuery, setSearchQuery] = useState('');

  // Location Dialog State
  const [locationDialog, setLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<RepairLocation | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    specialties: [] as string[],
    notes: '',
  });

  // External Repair Dialog State
  const [repairDialog, setRepairDialog] = useState(false);
  const [editingRepair, setEditingRepair] = useState<ExternalRepair | null>(null);
  const [repairForm, setRepairForm] = useState({
    machine_id: '',
    repair_location_id: '',
    status: 'sent' as 'sent' | 'in_progress' | 'completed' | 'returned',
    sent_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    actual_return_date: '',
    issue_description: '',
    repair_description: '',
    cost: '',
    tracking_number: '',
    notes: '',
  });

  // Spare Part Dialog State
  const [partDialog, setPartDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [partForm, setPartForm] = useState({
    name: '',
    part_number: '',
    category: '',
    compatible_models: '',
    quantity: '0',
    min_quantity: '0',
    unit_price: '',
    supplier: '',
    supplier_part_number: '',
    location: '',
    notes: '',
  });

  // Handlers
  const handleSaveLocation = async () => {
    if (!locationForm.name.trim()) {
      toast.error(language === 'fr' ? 'Le nom est requis' : 'Name is required');
      return;
    }

    const data = {
      name: locationForm.name,
      address: locationForm.address || null,
      city: locationForm.city || null,
      phone: locationForm.phone || null,
      email: locationForm.email || null,
      website: locationForm.website || null,
      specialties: locationForm.specialties.length > 0 ? locationForm.specialties : null,
      notes: locationForm.notes || null,
    };

    if (editingLocation) {
      const success = await updateRepairLocation(editingLocation.id, data);
      if (success) {
        toast.success(language === 'fr' ? 'Lieu modifié' : 'Location updated');
      }
    } else {
      const result = await addRepairLocation(data);
      if (result) {
        toast.success(language === 'fr' ? 'Lieu ajouté' : 'Location added');
      }
    }

    setLocationDialog(false);
    resetLocationForm();
  };

  const handleSaveRepair = async () => {
    if (!repairForm.machine_id || !repairForm.issue_description.trim()) {
      toast.error(language === 'fr' ? 'Machine et description requises' : 'Machine and description required');
      return;
    }

    const data = {
      machine_id: repairForm.machine_id,
      repair_location_id: repairForm.repair_location_id || null,
      status: repairForm.status,
      sent_date: repairForm.sent_date,
      expected_return_date: repairForm.expected_return_date || null,
      actual_return_date: repairForm.actual_return_date || null,
      issue_description: repairForm.issue_description,
      repair_description: repairForm.repair_description || null,
      cost: repairForm.cost ? parseFloat(repairForm.cost) : null,
      currency: 'EUR',
      tracking_number: repairForm.tracking_number || null,
      notes: repairForm.notes || null,
    };

    if (editingRepair) {
      const success = await updateExternalRepair(editingRepair.id, data);
      if (success) {
        toast.success(language === 'fr' ? 'Réparation modifiée' : 'Repair updated');
      }
    } else {
      const result = await addExternalRepair(data);
      if (result) {
        toast.success(language === 'fr' ? 'Réparation ajoutée' : 'Repair added');
      }
    }

    setRepairDialog(false);
    resetRepairForm();
  };

  const handleSavePart = async () => {
    if (!partForm.name.trim()) {
      toast.error(language === 'fr' ? 'Le nom est requis' : 'Name is required');
      return;
    }

    const data = {
      name: partForm.name,
      part_number: partForm.part_number || null,
      category: partForm.category || null,
      compatible_models: partForm.compatible_models ? partForm.compatible_models.split(',').map(s => s.trim()) : null,
      quantity: parseInt(partForm.quantity) || 0,
      min_quantity: parseInt(partForm.min_quantity) || 0,
      unit_price: partForm.unit_price ? parseFloat(partForm.unit_price) : null,
      currency: 'EUR',
      supplier: partForm.supplier || null,
      supplier_part_number: partForm.supplier_part_number || null,
      location: partForm.location || null,
      notes: partForm.notes || null,
    };

    if (editingPart) {
      const success = await updateSparePart(editingPart.id, data);
      if (success) {
        toast.success(language === 'fr' ? 'Pièce modifiée' : 'Part updated');
      }
    } else {
      const result = await addSparePart(data);
      if (result) {
        toast.success(language === 'fr' ? 'Pièce ajoutée' : 'Part added');
      }
    }

    setPartDialog(false);
    resetPartForm();
  };

  const resetLocationForm = () => {
    setEditingLocation(null);
    setLocationForm({ name: '', address: '', city: '', phone: '', email: '', website: '', specialties: [], notes: '' });
  };

  const resetRepairForm = () => {
    setEditingRepair(null);
    setRepairForm({
      machine_id: '', repair_location_id: '', status: 'sent', sent_date: new Date().toISOString().split('T')[0],
      expected_return_date: '', actual_return_date: '', issue_description: '', repair_description: '',
      cost: '', tracking_number: '', notes: '',
    });
  };

  const resetPartForm = () => {
    setEditingPart(null);
    setPartForm({
      name: '', part_number: '', category: '', compatible_models: '', quantity: '0', min_quantity: '0',
      unit_price: '', supplier: '', supplier_part_number: '', location: '', notes: '',
    });
  };

  const openEditLocation = (loc: RepairLocation) => {
    setEditingLocation(loc);
    setLocationForm({
      name: loc.name,
      address: loc.address || '',
      city: loc.city || '',
      phone: loc.phone || '',
      email: loc.email || '',
      website: loc.website || '',
      specialties: loc.specialties || [],
      notes: loc.notes || '',
    });
    setLocationDialog(true);
  };

  const openEditRepair = (repair: ExternalRepair) => {
    setEditingRepair(repair);
    setRepairForm({
      machine_id: repair.machine_id,
      repair_location_id: repair.repair_location_id || '',
      status: repair.status,
      sent_date: repair.sent_date,
      expected_return_date: repair.expected_return_date || '',
      actual_return_date: repair.actual_return_date || '',
      issue_description: repair.issue_description,
      repair_description: repair.repair_description || '',
      cost: repair.cost?.toString() || '',
      tracking_number: repair.tracking_number || '',
      notes: repair.notes || '',
    });
    setRepairDialog(true);
  };

  const openEditPart = (part: SparePart) => {
    setEditingPart(part);
    setPartForm({
      name: part.name,
      part_number: part.part_number || '',
      category: part.category || '',
      compatible_models: part.compatible_models?.join(', ') || '',
      quantity: part.quantity.toString(),
      min_quantity: part.min_quantity?.toString() || '0',
      unit_price: part.unit_price?.toString() || '',
      supplier: part.supplier || '',
      supplier_part_number: part.supplier_part_number || '',
      location: part.location || '',
      notes: part.notes || '',
    });
    setPartDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: 'bg-blue-500/20 text-blue-700',
      in_progress: 'bg-yellow-500/20 text-yellow-700',
      completed: 'bg-green-500/20 text-green-700',
      returned: 'bg-gray-500/20 text-gray-700',
    };
    const labels: Record<string, { fr: string; en: string }> = {
      sent: { fr: 'Envoyé', en: 'Sent' },
      in_progress: { fr: 'En cours', en: 'In Progress' },
      completed: { fr: 'Terminé', en: 'Completed' },
      returned: { fr: 'Retourné', en: 'Returned' },
    };
    return (
      <Badge className={styles[status] || ''}>
        {labels[status]?.[language] || status}
      </Badge>
    );
  };

  const lowStockParts = spareParts.filter(p => p.quantity <= (p.min_quantity || 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header title={language === 'fr' ? 'Ressources' : 'Resources'} showBack />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={language === 'fr' ? 'Ressources Réparation' : 'Repair Resources'} showBack />

      <div className="p-4 space-y-4">
        {/* Low Stock Alert */}
        {lowStockParts.length > 0 && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              <span className="text-sm">
                {language === 'fr' 
                  ? `${lowStockParts.length} pièce(s) en stock faible`
                  : `${lowStockParts.length} part(s) low in stock`}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="locations" className="text-xs sm:text-sm">
              <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
              {language === 'fr' ? 'Lieux' : 'Locations'}
            </TabsTrigger>
            <TabsTrigger value="repairs" className="text-xs sm:text-sm">
              <Truck className="w-4 h-4 mr-1 sm:mr-2" />
              {language === 'fr' ? 'Envois' : 'Repairs'}
            </TabsTrigger>
            <TabsTrigger value="parts" className="text-xs sm:text-sm">
              <Package className="w-4 h-4 mr-1 sm:mr-2" />
              {language === 'fr' ? 'Pièces' : 'Parts'}
            </TabsTrigger>
          </TabsList>

          {/* Repair Locations Tab */}
          <TabsContent value="locations" className="space-y-4">
            <Dialog open={locationDialog} onOpenChange={(open) => { setLocationDialog(open); if (!open) resetLocationForm(); }}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Ajouter un lieu' : 'Add Location'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingLocation 
                      ? (language === 'fr' ? 'Modifier le lieu' : 'Edit Location')
                      : (language === 'fr' ? 'Nouveau lieu de réparation' : 'New Repair Location')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{language === 'fr' ? 'Nom *' : 'Name *'}</Label>
                    <Input value={locationForm.name} onChange={(e) => setLocationForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'fr' ? 'Adresse' : 'Address'}</Label>
                      <Input value={locationForm.address} onChange={(e) => setLocationForm(f => ({ ...f, address: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{language === 'fr' ? 'Ville' : 'City'}</Label>
                      <Input value={locationForm.city} onChange={(e) => setLocationForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'fr' ? 'Téléphone' : 'Phone'}</Label>
                      <Input value={locationForm.phone} onChange={(e) => setLocationForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={locationForm.email} onChange={(e) => setLocationForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'fr' ? 'Site web' : 'Website'}</Label>
                    <Input value={locationForm.website} onChange={(e) => setLocationForm(f => ({ ...f, website: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{language === 'fr' ? 'Spécialités' : 'Specialties'}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {equipmentCategories.map(cat => (
                        <Badge
                          key={cat.id}
                          variant={locationForm.specialties.includes(cat.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setLocationForm(f => ({
                            ...f,
                            specialties: f.specialties.includes(cat.id)
                              ? f.specialties.filter(s => s !== cat.id)
                              : [...f.specialties, cat.id]
                          }))}
                        >
                          {language === 'fr' ? cat.labelFr : cat.labelEn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={locationForm.notes} onChange={(e) => setLocationForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <Button onClick={handleSaveLocation} className="w-full">
                    {language === 'fr' ? 'Enregistrer' : 'Save'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              {repairLocations
                .filter(loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || loc.city?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(loc => (
                  <Card key={loc.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{loc.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditLocation(loc)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteRepairLocation(loc.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {loc.city && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {loc.address ? `${loc.address}, ${loc.city}` : loc.city}
                        </div>
                      )}
                      {loc.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {loc.phone}
                        </div>
                      )}
                      {loc.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {loc.email}
                        </div>
                      )}
                      {loc.website && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <a href={loc.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            {loc.website}
                          </a>
                        </div>
                      )}
                      {loc.specialties && loc.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {loc.specialties.map(s => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {equipmentCategories.find(c => c.id === s)?.[language === 'fr' ? 'labelFr' : 'labelEn'] || s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

              {repairLocations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'fr' ? 'Aucun lieu de réparation' : 'No repair locations'}
                </div>
              )}
            </div>
          </TabsContent>

          {/* External Repairs Tab */}
          <TabsContent value="repairs" className="space-y-4">
            <Dialog open={repairDialog} onOpenChange={(open) => { setRepairDialog(open); if (!open) resetRepairForm(); }}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Nouvel envoi' : 'New Repair'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRepair 
                      ? (language === 'fr' ? 'Modifier l\'envoi' : 'Edit Repair')
                      : (language === 'fr' ? 'Nouvel envoi en réparation' : 'New External Repair')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{language === 'fr' ? 'Machine *' : 'Machine *'}</Label>
                    <Select value={repairForm.machine_id} onValueChange={(v) => setRepairForm(f => ({ ...f, machine_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={language === 'fr' ? 'Sélectionner...' : 'Select...'} /></SelectTrigger>
                      <SelectContent>
                        {machines.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name} ({m.serialNumber})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'fr' ? 'Lieu de réparation' : 'Repair Location'}</Label>
                    <Select value={repairForm.repair_location_id} onValueChange={(v) => setRepairForm(f => ({ ...f, repair_location_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={language === 'fr' ? 'Sélectionner...' : 'Select...'} /></SelectTrigger>
                      <SelectContent>
                        {repairLocations.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'fr' ? 'Date d\'envoi *' : 'Sent Date *'}</Label>
                      <Input type="date" value={repairForm.sent_date} onChange={(e) => setRepairForm(f => ({ ...f, sent_date: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{language === 'fr' ? 'Statut' : 'Status'}</Label>
                      <Select value={repairForm.status} onValueChange={(v: any) => setRepairForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sent">{language === 'fr' ? 'Envoyé' : 'Sent'}</SelectItem>
                          <SelectItem value="in_progress">{language === 'fr' ? 'En cours' : 'In Progress'}</SelectItem>
                          <SelectItem value="completed">{language === 'fr' ? 'Terminé' : 'Completed'}</SelectItem>
                          <SelectItem value="returned">{language === 'fr' ? 'Retourné' : 'Returned'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'fr' ? 'Retour prévu' : 'Expected Return'}</Label>
                      <Input type="date" value={repairForm.expected_return_date} onChange={(e) => setRepairForm(f => ({ ...f, expected_return_date: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{language === 'fr' ? 'Retour effectif' : 'Actual Return'}</Label>
                      <Input type="date" value={repairForm.actual_return_date} onChange={(e) => setRepairForm(f => ({ ...f, actual_return_date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'fr' ? 'Problème *' : 'Issue *'}</Label>
                    <Textarea value={repairForm.issue_description} onChange={(e) => setRepairForm(f => ({ ...f, issue_description: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{language === 'fr' ? 'Réparation effectuée' : 'Repair Done'}</Label>
                    <Textarea value={repairForm.repair_description} onChange={(e) => setRepairForm(f => ({ ...f, repair_description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'fr' ? 'Coût (€)' : 'Cost (€)'}</Label>
                      <Input type="number" step="0.01" value={repairForm.cost} onChange={(e) => setRepairForm(f => ({ ...f, cost: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{language === 'fr' ? 'N° suivi' : 'Tracking #'}</Label>
                      <Input value={repairForm.tracking_number} onChange={(e) => setRepairForm(f => ({ ...f, tracking_number: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={repairForm.notes} onChange={(e) => setRepairForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <Button onClick={handleSaveRepair} className="w-full">
                    {language === 'fr' ? 'Enregistrer' : 'Save'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              {externalRepairs
                .filter(r => 
                  r.machine_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.issue_description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(repair => (
                  <Card key={repair.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{repair.machine_name || 'Machine'}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {repair.location_name || (language === 'fr' ? 'Lieu non spécifié' : 'Location not specified')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(repair.status)}
                          <Button variant="ghost" size="icon" onClick={() => openEditRepair(repair)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteExternalRepair(repair.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><strong>{language === 'fr' ? 'Problème:' : 'Issue:'}</strong> {repair.issue_description}</p>
                      {repair.repair_description && (
                        <p><strong>{language === 'fr' ? 'Réparation:' : 'Repair:'}</strong> {repair.repair_description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-muted-foreground">
                        <span>{language === 'fr' ? 'Envoyé:' : 'Sent:'} {format(new Date(repair.sent_date), 'dd/MM/yyyy', { locale: dateLocale })}</span>
                        {repair.cost && <span>{language === 'fr' ? 'Coût:' : 'Cost:'} {repair.cost}€</span>}
                        {repair.tracking_number && <span>{language === 'fr' ? 'Suivi:' : 'Tracking:'} {repair.tracking_number}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {externalRepairs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'fr' ? 'Aucun envoi en réparation' : 'No external repairs'}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Spare Parts Tab */}
          <TabsContent value="parts" className="space-y-4">
            <Dialog open={partDialog} onOpenChange={(open) => { setPartDialog(open); if (!open) resetPartForm(); }}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Ajouter une pièce' : 'Add Part'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPart 
                      ? (language === 'fr' ? 'Modifier la pièce' : 'Edit Part')
                      : (language === 'fr' ? 'Nouvelle pièce de rechange' : 'New Spare Part')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{language === 'fr' ? 'Nom *' : 'Name *'}</Label>
                    <Input value={partForm.name} onChange={(e) => setPartForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'fr' ? 'Référence' : 'Part Number'}</Label>
                      <Input value={partForm.part_number} onChange={(e) => setPartForm(f => ({ ...f, part_number: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{language === 'fr' ? 'Catégorie' : 'Category'}</Label>
                      <Select value={partForm.category} onValueChange={(v) => setPartForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>
                          {equipmentCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{language === 'fr' ? cat.labelFr : cat.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'fr' ? 'Modèles compatibles (séparés par virgule)' : 'Compatible Models (comma separated)'}</Label>
                    <Input value={partForm.compatible_models} onChange={(e) => setPartForm(f => ({ ...f, compatible_models: e.target.value }))} placeholder="Model A, Model B" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>{language === 'fr' ? 'Quantité' : 'Quantity'}</Label>
                      <Input type="number" value={partForm.quantity} onChange={(e) => setPartForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{language === 'fr' ? 'Seuil min' : 'Min Qty'}</Label>
                      <Input type="number" value={partForm.min_quantity} onChange={(e) => setPartForm(f => ({ ...f, min_quantity: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{language === 'fr' ? 'Prix (€)' : 'Price (€)'}</Label>
                      <Input type="number" step="0.01" value={partForm.unit_price} onChange={(e) => setPartForm(f => ({ ...f, unit_price: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'fr' ? 'Fournisseur' : 'Supplier'}</Label>
                      <Input value={partForm.supplier} onChange={(e) => setPartForm(f => ({ ...f, supplier: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{language === 'fr' ? 'Réf. fournisseur' : 'Supplier Ref'}</Label>
                      <Input value={partForm.supplier_part_number} onChange={(e) => setPartForm(f => ({ ...f, supplier_part_number: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'fr' ? 'Emplacement stockage' : 'Storage Location'}</Label>
                    <Input value={partForm.location} onChange={(e) => setPartForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={partForm.notes} onChange={(e) => setPartForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <Button onClick={handleSavePart} className="w-full">
                    {language === 'fr' ? 'Enregistrer' : 'Save'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'fr' ? 'Nom' : 'Name'}</TableHead>
                    <TableHead>{language === 'fr' ? 'Réf' : 'Ref'}</TableHead>
                    <TableHead className="text-center">{language === 'fr' ? 'Qté' : 'Qty'}</TableHead>
                    <TableHead>{language === 'fr' ? 'Prix' : 'Price'}</TableHead>
                    <TableHead>{language === 'fr' ? 'Lieu' : 'Location'}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spareParts
                    .filter(p => 
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.part_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(part => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">
                          <div>
                            {part.name}
                            {part.quantity <= (part.min_quantity || 0) && (
                              <AlertTriangle className="w-4 h-4 text-warning inline ml-2" />
                            )}
                          </div>
                          {part.compatible_models && part.compatible_models.length > 0 && (
                            <div className="text-xs text-muted-foreground">{part.compatible_models.join(', ')}</div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{part.part_number || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={part.quantity <= (part.min_quantity || 0) ? 'destructive' : 'secondary'}>
                            {part.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>{part.unit_price ? `${part.unit_price}€` : '-'}</TableCell>
                        <TableCell className="text-xs">{part.location || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditPart(part)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteSparePart(part.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {spareParts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'fr' ? 'Aucune pièce de rechange' : 'No spare parts'}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default RepairResources;
