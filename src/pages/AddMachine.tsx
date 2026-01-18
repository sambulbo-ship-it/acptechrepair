import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMachines } from '@/hooks/useMachines';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { equipmentCategories, EquipmentCategory, getCategoryById } from '@/data/equipmentData';
import { MachineStatus } from '@/types/machine';
import { toast } from 'sonner';

const AddMachine = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { addMachine } = useMachines();

  const [formData, setFormData] = useState({
    name: '',
    category: '' as EquipmentCategory | '',
    brand: '',
    customBrand: '',
    model: '',
    serialNumber: '',
    location: '',
    status: 'operational' as MachineStatus,
    notes: '',
  });

  const selectedCategory = formData.category ? getCategoryById(formData.category) : null;
  const availableBrands = selectedCategory?.brands || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.serialNumber) {
      toast.error(language === 'fr' ? 'Veuillez remplir les champs obligatoires' : 'Please fill in required fields');
      return;
    }

    const finalBrand = formData.brand === 'Other' ? formData.customBrand : formData.brand;

    addMachine({
      name: formData.name,
      category: formData.category as EquipmentCategory,
      brand: finalBrand,
      model: formData.model,
      serialNumber: formData.serialNumber,
      location: formData.location,
      status: formData.status,
      notes: formData.notes,
    });

    toast.success(language === 'fr' ? 'Équipement ajouté' : 'Equipment added');
    navigate('/');
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Reset brand when category changes
    if (field === 'category') {
      setFormData((prev) => ({ ...prev, brand: '', customBrand: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t('addEquipment')} showBack />
      
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="ios-card p-4 space-y-4">
          {/* Custom Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('customName')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder={language === 'fr' ? 'Ex: Console FOH Salle 1' : 'Ex: FOH Console Room 1'}
              className="h-12 bg-secondary border-0 rounded-xl"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t('category')} *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => updateField('category', value)}
            >
              <SelectTrigger className="h-12 bg-secondary border-0 rounded-xl">
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {equipmentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === 'fr' ? cat.labelFr : cat.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand */}
          {formData.category && (
            <div className="space-y-2">
              <Label>{t('brand')} *</Label>
              <Select
                value={formData.brand}
                onValueChange={(value) => updateField('brand', value)}
              >
                <SelectTrigger className="h-12 bg-secondary border-0 rounded-xl">
                  <SelectValue placeholder={t('selectBrand')} />
                </SelectTrigger>
                <SelectContent>
                  {availableBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Brand Input */}
          {formData.brand === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="customBrand">{t('brand')}</Label>
              <Input
                id="customBrand"
                value={formData.customBrand}
                onChange={(e) => updateField('customBrand', e.target.value)}
                placeholder={language === 'fr' ? 'Entrez la marque' : 'Enter brand name'}
                className="h-12 bg-secondary border-0 rounded-xl"
              />
            </div>
          )}

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">{t('model')}</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder={language === 'fr' ? 'Ex: CL5, M32, etc.' : 'Ex: CL5, M32, etc.'}
              className="h-12 bg-secondary border-0 rounded-xl"
            />
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <Label htmlFor="serialNumber">{t('serialNumber')} *</Label>
            <Input
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(e) => updateField('serialNumber', e.target.value)}
              className="h-12 bg-secondary border-0 rounded-xl"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">{t('location')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder={language === 'fr' ? 'Ex: Entrepôt A, Salle 1' : 'Ex: Warehouse A, Room 1'}
              className="h-12 bg-secondary border-0 rounded-xl"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>{t('status')}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => updateField('status', value)}
            >
              <SelectTrigger className="h-12 bg-secondary border-0 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operational">{t('operational')}</SelectItem>
                <SelectItem value="needs-attention">{t('needsAttention')}</SelectItem>
                <SelectItem value="out-of-service">{t('outOfService')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="bg-secondary border-0 rounded-xl min-h-[100px]"
              placeholder={language === 'fr' ? 'Notes additionnelles...' : 'Additional notes...'}
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-14 text-lg rounded-xl">
          {t('save')}
        </Button>
      </form>

      <BottomNav />
    </div>
  );
};

export default AddMachine;
