import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCloudData } from '@/hooks/useCloudData';
import { useWorkspaceBrands } from '@/hooks/useWorkspaceBrands';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { equipmentCategories, EquipmentCategory, getCategoryById } from '@/data/equipmentData';
import { MachineStatus } from '@/types/machine';
import { toast } from 'sonner';
import { Plus, X, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AddMachine = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addMachine } = useCloudData();
  const { getBrandsForCategory, addCustomBrand, getCustomBrandsForCategory, removeCustomBrand } = useWorkspaceBrands();

  // Pre-fill from URL params (from AI scanner)
  const prefillBrand = searchParams.get('brand') || '';
  const prefillModel = searchParams.get('model') || '';
  const prefillSerial = searchParams.get('serial') || '';
  const prefillCategory = searchParams.get('category') as EquipmentCategory || '';

  const [formData, setFormData] = useState({
    name: prefillBrand && prefillModel ? `${prefillBrand} ${prefillModel}` : '',
    category: prefillCategory as EquipmentCategory | '',
    brand: '',  // Will be set after category is selected
    customBrand: '',
    model: prefillModel,
    serialNumber: prefillSerial,
    location: '',
    status: 'operational' as MachineStatus,
    notes: '',
  });

  // Set brand once category is loaded and brands are available
  useEffect(() => {
    if (prefillBrand && formData.category) {
      const availableBrands = getBrandsForCategory(formData.category);
      const matchedBrand = availableBrands.find(b => 
        b.toLowerCase() === prefillBrand.toLowerCase()
      );
      if (matchedBrand) {
        setFormData(prev => ({ ...prev, brand: matchedBrand }));
      } else {
        // Brand not in list - set as custom
        setFormData(prev => ({ ...prev, brand: 'Other', customBrand: prefillBrand }));
      }
    }
  }, [prefillBrand, formData.category, getBrandsForCategory]);

  const [showAddBrandDialog, setShowAddBrandDialog] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);

  const availableBrands = formData.category ? getBrandsForCategory(formData.category) : [];
  const customBrandsForCategory = formData.category ? getCustomBrandsForCategory(formData.category) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.serialNumber) {
      toast.error(language === 'fr' ? 'Veuillez remplir les champs obligatoires' : 'Please fill in required fields');
      return;
    }

    const finalBrand = formData.brand === 'Other' ? formData.customBrand : formData.brand;

    // Check for duplicate serial number with same brand + model
    const duplicate = machines.find(m =>
      m.serialNumber.toLowerCase() === formData.serialNumber.trim().toLowerCase() &&
      m.brand.toLowerCase() === finalBrand.toLowerCase() &&
      m.model.toLowerCase() === formData.model.trim().toLowerCase()
    );
    if (duplicate) {
      toast.error(
        language === 'fr'
          ? `Un équipement ${finalBrand} ${formData.model} avec ce numéro de série existe déjà`
          : `A ${finalBrand} ${formData.model} with this serial number already exists`
      );
      return;
    }

    const result = await addMachine({
      name: formData.name,
      category: formData.category as EquipmentCategory,
      brand: finalBrand,
      model: formData.model,
      serialNumber: formData.serialNumber,
      location: formData.location,
      status: formData.status,
      notes: formData.notes,
    });

    if (result) {
      toast.success(language === 'fr' ? 'Équipement ajouté' : 'Equipment added');
      navigate('/');
    } else {
      toast.error(language === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding equipment');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Reset brand when category changes
    if (field === 'category') {
      setFormData((prev) => ({ ...prev, brand: '', customBrand: '' }));
    }
  };

  const handleAddBrand = async () => {
    if (!formData.category || !newBrandName.trim()) return;

    setAddingBrand(true);
    const success = await addCustomBrand(formData.category, newBrandName.trim());
    setAddingBrand(false);

    if (success) {
      setFormData((prev) => ({ ...prev, brand: newBrandName.trim() }));
      setNewBrandName('');
      setShowAddBrandDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t('addEquipment')} showBack />
      
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="glass-card p-5 space-y-5">
          {/* Custom Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">{t('customName')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder={language === 'fr' ? 'Ex: Console FOH Salle 1' : 'Ex: FOH Console Room 1'}
              className="h-12 glass-input"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">{t('category')} *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => updateField('category', value)}
            >
              <SelectTrigger className="h-12 glass-input">
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent className="glass-dialog">
                {equipmentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === 'fr' ? cat.labelFr : cat.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand with custom brand management */}
          {formData.category && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">{t('brand')} *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-primary hover:text-primary/80"
                  onClick={() => setShowAddBrandDialog(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {language === 'fr' ? 'Ajouter une marque' : 'Add brand'}
                </Button>
              </div>
              <Select
                value={formData.brand}
                onValueChange={(value) => updateField('brand', value)}
              >
                <SelectTrigger className="h-12 glass-input">
                  <SelectValue placeholder={t('selectBrand')} />
                </SelectTrigger>
                <SelectContent className="glass-dialog max-h-[300px]">
                  {availableBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      <div className="flex items-center gap-2">
                        {brand}
                        {customBrandsForCategory.some(cb => cb.brand_name === brand) && (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            {language === 'fr' ? 'Perso' : 'Custom'}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Show custom brands chips */}
              {customBrandsForCategory.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {customBrandsForCategory.map((brand) => (
                    <Badge
                      key={brand.id}
                      variant="outline"
                      className="flex items-center gap-1 text-xs pr-1"
                    >
                      {brand.brand_name}
                      <button
                        type="button"
                        onClick={() => removeCustomBrand(brand.id)}
                        className="ml-1 p-0.5 hover:bg-destructive/20 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Brand Input */}
          {formData.brand === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="customBrand" className="text-sm font-medium text-foreground">{t('brand')}</Label>
              <Input
                id="customBrand"
                value={formData.customBrand}
                onChange={(e) => updateField('customBrand', e.target.value)}
                placeholder={language === 'fr' ? 'Entrez la marque' : 'Enter brand name'}
                className="h-12 glass-input"
              />
            </div>
          )}

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model" className="text-sm font-medium text-foreground">{t('model')}</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder={language === 'fr' ? 'Ex: CL5, M32, etc.' : 'Ex: CL5, M32, etc.'}
              className="h-12 glass-input"
            />
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <Label htmlFor="serialNumber" className="text-sm font-medium text-foreground">{t('serialNumber')} *</Label>
            <Input
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(e) => updateField('serialNumber', e.target.value)}
              className="h-12 glass-input"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-foreground">{t('location')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder={language === 'fr' ? 'Ex: Entrepôt A, Salle 1' : 'Ex: Warehouse A, Room 1'}
              className="h-12 glass-input"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">{t('status')}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => updateField('status', value)}
            >
              <SelectTrigger className="h-12 glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-dialog">
                <SelectItem value="operational">{t('operational')}</SelectItem>
                <SelectItem value="needs-attention">{t('needsAttention')}</SelectItem>
                <SelectItem value="out-of-service">{t('outOfService')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-foreground">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="glass-input min-h-[100px] rounded-xl"
              placeholder={language === 'fr' ? 'Notes additionnelles...' : 'Additional notes...'}
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-14 text-lg rounded-2xl glass-button bg-primary hover:bg-primary/90 text-primary-foreground border-0">
          {t('save')}
        </Button>
      </form>

      {/* Add Brand Dialog */}
      <Dialog open={showAddBrandDialog} onOpenChange={setShowAddBrandDialog}>
        <DialogContent className="glass-dialog">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {language === 'fr' ? 'Ajouter une marque' : 'Add a brand'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {language === 'fr' 
                ? 'Cette marque sera disponible uniquement dans votre espace de travail.'
                : 'This brand will only be available in your workspace.'}
            </p>
            <Input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder={language === 'fr' ? 'Nom de la marque' : 'Brand name'}
              className="h-12 glass-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBrand();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowAddBrandDialog(false)}
              className="glass-button"
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button
              onClick={handleAddBrand}
              disabled={!newBrandName.trim() || addingBrand}
              className="bg-primary hover:bg-primary/90"
            >
              {addingBrand 
                ? (language === 'fr' ? 'Ajout...' : 'Adding...') 
                : (language === 'fr' ? 'Ajouter' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default AddMachine;
