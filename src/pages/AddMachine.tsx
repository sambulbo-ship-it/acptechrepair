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
import { MachineStatus } from '@/types/machine';
import { toast } from 'sonner';

const AddMachine = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { addMachine } = useMachines();

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    serialNumber: '',
    location: '',
    manufacturer: '',
    model: '',
    status: 'operational' as MachineStatus,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.serialNumber) {
      toast.error(t('language') === 'Langue' ? 'Veuillez remplir les champs obligatoires' : 'Please fill in required fields');
      return;
    }

    addMachine(formData);
    toast.success(t('language') === 'Langue' ? 'Machine ajoutée' : 'Machine added');
    navigate('/');
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t('addMachine')} showBack />
      
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="ios-card p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('machineName')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="h-12 bg-secondary border-0 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t('machineType')}</Label>
            <Input
              id="type"
              value={formData.type}
              onChange={(e) => updateField('type', e.target.value)}
              className="h-12 bg-secondary border-0 rounded-xl"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">{t('manufacturer')}</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => updateField('manufacturer', e.target.value)}
                className="h-12 bg-secondary border-0 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">{t('model')}</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => updateField('model', e.target.value)}
                className="h-12 bg-secondary border-0 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t('location')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              className="h-12 bg-secondary border-0 rounded-xl"
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="bg-secondary border-0 rounded-xl min-h-[100px]"
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
