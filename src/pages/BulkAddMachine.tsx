import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCloudData } from '@/hooks/useCloudData';
import { useWorkspaceBrands } from '@/hooks/useWorkspaceBrands';
import { Header } from '@/components/Header';
import { AppLayout } from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { equipmentCategories, EquipmentCategory } from '@/data/equipmentData';
import { MachineStatus } from '@/types/machine';
import { toast } from 'sonner';
import { Layers, Plus, X, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_QUANTITIES = [10, 20, 50, 100, 200];
const PAD_OPTIONS = [
  { value: '0', label: 'Aucun  (1, 2, 3…)' },
  { value: '2', label: '2 chiffres  (01, 02…)' },
  { value: '3', label: '3 chiffres  (001, 002…)' },
  { value: '4', label: '4 chiffres  (0001, 0002…)' },
];

const pad = (n: number, digits: number) =>
  digits === 0 ? String(n) : String(n).padStart(digits, '0');

const BulkAddMachine = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { addMachinesBulk, machines } = useCloudData();
  const { getBrandsForCategory, addCustomBrand, getCustomBrandsForCategory, removeCustomBrand } = useWorkspaceBrands();

  const fr = language === 'fr';

  const [base, setBase] = useState({
    name: '',
    category: '' as EquipmentCategory | '',
    brand: '',
    customBrand: '',
    model: '',
    location: '',
    status: 'operational' as MachineStatus,
    notes: '',
  });

  const [quantity, setQuantity] = useState<number>(10);
  const [quantityInput, setQuantityInput] = useState('10');
  const [prefix, setPrefix] = useState('');
  const [startNum, setStartNum] = useState(1);
  const [padDigits, setPadDigits] = useState(3);
  const [showPreview, setShowPreview] = useState(false);

  // Bulk progress state
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ added: number; skipped: number; errors: number } | null>(null);

  // Add brand dialog
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  const availableBrands = base.category ? getBrandsForCategory(base.category) : [];
  const customBrandsForCategory = base.category ? getCustomBrandsForCategory(base.category) : [];

  const updateBase = (field: string, value: string) => {
    setBase(prev => ({ ...prev, [field]: value }));
    if (field === 'category') setBase(prev => ({ ...prev, brand: '', customBrand: '' }));
  };

  // Generate serial numbers preview
  const serialNumbers = useMemo(() => {
    return Array.from({ length: quantity }, (_, i) =>
      `${prefix}${pad(startNum + i, padDigits)}`
    );
  }, [quantity, prefix, startNum, padDigits]);

  // Check duplicates against existing stock
  const duplicates = useMemo(() => {
    const finalBrand = base.brand === 'Other' ? base.customBrand : base.brand;
    return serialNumbers.filter(sn =>
      machines.some(m =>
        m.brand.toLowerCase() === finalBrand.toLowerCase() &&
        m.model.toLowerCase() === (base.model || '').toLowerCase() &&
        m.serialNumber.toLowerCase() === sn.toLowerCase()
      )
    );
  }, [serialNumbers, machines, base.brand, base.customBrand, base.model]);

  const handleQuantityInput = (v: string) => {
    setQuantityInput(v);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0 && n <= 1000) setQuantity(n);
  };

  const canSubmit = base.name && base.category && (base.brand && base.brand !== 'Other' || base.customBrand) && quantity > 0 && !running;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    const finalBrand = base.brand === 'Other' ? base.customBrand : base.brand;
    if (!finalBrand) {
      toast.error(fr ? 'Veuillez sélectionner une marque' : 'Please select a brand');
      return;
    }

    setRunning(true);
    setProgress(0);
    setResult(null);

    const res = await addMachinesBulk(
      {
        name: base.name,
        category: base.category as EquipmentCategory,
        brand: finalBrand,
        model: base.model,
        location: base.location,
        status: base.status,
        notes: base.notes,
        photos: [],
      },
      serialNumbers,
      (done, total) => setProgress(Math.round((done / total) * 100))
    );

    setProgress(100);
    setRunning(false);
    setResult(res);

    if (res.added > 0) {
      toast.success(
        fr ? `${res.added} équipements ajoutés en stock` : `${res.added} items added to stock`
      );
    }
    if (res.errors > 0) {
      toast.error(fr ? `${res.errors} erreurs lors de l'ajout` : `${res.errors} errors during import`);
    }
  }, [canSubmit, base, serialNumbers, addMachinesBulk, fr]);

  const handleAddBrand = async () => {
    if (!base.category || !newBrandName.trim()) return;
    const success = await addCustomBrand(base.category, newBrandName.trim());
    if (success) {
      setBase(prev => ({ ...prev, brand: newBrandName.trim() }));
      setNewBrandName('');
      setShowAddBrand(false);
    }
  };

  if (result && result.added > 0) {
    return (
      <AppLayout>
      <div className="min-h-screen lg:min-h-0 bg-background pb-24 lg:pb-0">
        <Header title={fr ? 'Mise en stock massive' : 'Bulk stock entry'} showBack />
        <div className="p-6 flex flex-col items-center justify-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              {fr ? 'Import terminé' : 'Import complete'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {fr
                ? `${result.added} équipement(s) ajouté(s) au stock`
                : `${result.added} item(s) added to stock`}
            </p>
            {result.skipped > 0 && (
              <p className="text-warning text-sm mt-1">
                {fr ? `${result.skipped} doublon(s) ignoré(s)` : `${result.skipped} duplicate(s) skipped`}
              </p>
            )}
          </div>

          <div className="glass-card p-4 w-full max-w-sm text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{fr ? 'Ajoutés' : 'Added'}</span>
              <span className="font-semibold text-success">{result.added}</span>
            </div>
            {result.skipped > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{fr ? 'Doublons ignorés' : 'Skipped duplicates'}</span>
                <span className="font-semibold text-warning">{result.skipped}</span>
              </div>
            )}
            {result.errors > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{fr ? 'Erreurs' : 'Errors'}</span>
                <span className="font-semibold text-destructive">{result.errors}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setResult(null); setBase(prev => ({ ...prev })); }}>
              {fr ? 'Nouveau lot' : 'New batch'}
            </Button>
            <Button onClick={() => navigate('/')}>
              {fr ? 'Voir le stock' : 'View stock'}
            </Button>
          </div>
        </div>
      </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
    <div className="min-h-screen lg:min-h-0 bg-background pb-24 lg:pb-0">
      <Header title={fr ? 'Mise en stock massive' : 'Bulk stock entry'} showBack />

      <div className="p-4 lg:px-8 lg:py-6 space-y-4 lg:space-y-5 max-w-3xl">

        {/* Section: Equipment details */}
        <div className="glass-card p-5 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4" />
            {fr ? 'Informations équipement' : 'Equipment details'}
          </h2>

          {/* Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{fr ? 'Nom personnalisé' : 'Custom name'} *</Label>
            <Input
              value={base.name}
              onChange={e => updateBase('name', e.target.value)}
              placeholder={fr ? 'Ex: Well Fit Chauvet' : 'Ex: Well Fit Chauvet'}
              className="h-12 glass-input"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{fr ? 'Catégorie' : 'Category'} *</Label>
            <Select value={base.category} onValueChange={v => updateBase('category', v)}>
              <SelectTrigger className="h-12 glass-input">
                <SelectValue placeholder={fr ? 'Sélectionner une catégorie' : 'Select a category'} />
              </SelectTrigger>
              <SelectContent>
                {equipmentCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === 'fr' ? cat.labelFr : cat.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand */}
          {base.category && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{fr ? 'Marque' : 'Brand'} *</Label>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-primary"
                  onClick={() => setShowAddBrand(v => !v)}>
                  <Plus className="w-3 h-3 mr-1" />
                  {fr ? 'Ajouter' : 'Add brand'}
                </Button>
              </div>
              <Select value={base.brand} onValueChange={v => updateBase('brand', v)}>
                <SelectTrigger className="h-12 glass-input">
                  <SelectValue placeholder={fr ? 'Sélectionner une marque' : 'Select brand'} />
                </SelectTrigger>
                <SelectContent>
                  {availableBrands.map(brand => (
                    <SelectItem key={brand} value={brand}>
                      <div className="flex items-center gap-2">
                        {brand}
                        {customBrandsForCategory.some(cb => cb.brand_name === brand) && (
                          <Badge variant="secondary" className="text-[10px] py-0">{fr ? 'Perso' : 'Custom'}</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customBrandsForCategory.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {customBrandsForCategory.map(brand => (
                    <Badge key={brand.id} variant="outline" className="flex items-center gap-1 text-xs pr-1">
                      {brand.brand_name}
                      <button type="button" onClick={() => removeCustomBrand(brand.id)}
                        className="ml-1 p-0.5 hover:bg-destructive/20 rounded-full">
                        <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {showAddBrand && (
                <div className="flex gap-2 mt-2">
                  <Input value={newBrandName} onChange={e => setNewBrandName(e.target.value)}
                    placeholder={fr ? 'Nom de la marque' : 'Brand name'} className="h-10 glass-input flex-1" />
                  <Button size="sm" onClick={handleAddBrand} disabled={!newBrandName.trim()}>
                    {fr ? 'Ajouter' : 'Add'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Custom brand */}
          {base.brand === 'Other' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">{fr ? 'Nom de la marque' : 'Brand name'}</Label>
              <Input value={base.customBrand} onChange={e => updateBase('customBrand', e.target.value)}
                placeholder={fr ? 'Entrez la marque' : 'Enter brand'} className="h-12 glass-input" />
            </div>
          )}

          {/* Model */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{fr ? 'Modèle' : 'Model'}</Label>
            <Input value={base.model} onChange={e => updateBase('model', e.target.value)}
              placeholder="Ex: Well Fit, CL5..." className="h-12 glass-input" />
          </div>

          {/* Location + Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{fr ? 'Emplacement' : 'Location'}</Label>
              <Input value={base.location} onChange={e => updateBase('location', e.target.value)}
                placeholder={fr ? 'Ex: Entrepôt A' : 'Ex: Warehouse A'} className="h-12 glass-input" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{fr ? 'Statut' : 'Status'}</Label>
              <Select value={base.status} onValueChange={v => updateBase('status', v)}>
                <SelectTrigger className="h-12 glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">{fr ? 'Opérationnel' : 'Operational'}</SelectItem>
                  <SelectItem value="needs-attention">{fr ? 'À surveiller' : 'Needs attention'}</SelectItem>
                  <SelectItem value="out-of-service">{fr ? 'Hors service' : 'Out of service'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{fr ? 'Notes' : 'Notes'}</Label>
            <Textarea value={base.notes} onChange={e => updateBase('notes', e.target.value)}
              className="glass-input min-h-[80px] rounded-xl"
              placeholder={fr ? 'Notes additionnelles...' : 'Additional notes...'} />
          </div>
        </div>

        {/* Section: Quantity & serial numbers */}
        <div className="glass-card p-5 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {fr ? 'Quantité & numéros de série' : 'Quantity & serial numbers'}
          </h2>

          {/* Quantity quick pick */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{fr ? 'Quantité' : 'Quantity'}</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {QUICK_QUANTITIES.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setQuantity(q); setQuantityInput(String(q)); }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border',
                    quantity === q
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30'
                      : 'border-border/50 text-foreground hover:bg-secondary/60'
                  )}
                >
                  {q}
                </button>
              ))}
              <Input
                type="number"
                min={1}
                max={1000}
                value={quantityInput}
                onChange={e => handleQuantityInput(e.target.value)}
                className="h-10 w-24 glass-input text-center font-semibold"
                placeholder={fr ? 'Autre' : 'Custom'}
              />
            </div>
          </div>

          {/* Serial number format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{fr ? 'Format du numéro de série' : 'Serial number format'}</Label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{fr ? 'Préfixe (optionnel)' : 'Prefix (optional)'}</p>
                <Input
                  value={prefix}
                  onChange={e => setPrefix(e.target.value)}
                  placeholder="Ex: WF- ou INT-"
                  className="h-10 glass-input font-mono"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{fr ? 'Numéro de départ' : 'Start number'}</p>
                <Input
                  type="number"
                  min={0}
                  value={startNum}
                  onChange={e => setStartNum(Math.max(0, parseInt(e.target.value, 10) || 1))}
                  className="h-10 glass-input font-mono"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{fr ? 'Zéros de remplissage' : 'Zero padding'}</p>
                <Select value={String(padDigits)} onValueChange={v => setPadDigits(parseInt(v))}>
                  <SelectTrigger className="h-10 glass-input font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAD_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live preview */}
            <div className="glass-stats p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {fr ? 'Aperçu' : 'Preview'}
                </p>
                <button type="button" className="text-xs text-primary flex items-center gap-1"
                  onClick={() => setShowPreview(v => !v)}>
                  <Eye className="w-3.5 h-3.5" />
                  {showPreview ? (fr ? 'Masquer' : 'Hide') : (fr ? 'Voir tout' : 'Show all')}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(showPreview ? serialNumbers : serialNumbers.slice(0, 8)).map((sn, i) => (
                  <span
                    key={i}
                    className={cn(
                      'font-mono text-xs px-2 py-0.5 rounded-md',
                      duplicates.includes(sn)
                        ? 'bg-destructive/20 text-destructive line-through'
                        : 'bg-secondary text-foreground'
                    )}
                  >
                    {sn}
                  </span>
                ))}
                {!showPreview && serialNumbers.length > 8 && (
                  <span className="text-xs text-muted-foreground px-2 py-0.5">
                    +{serialNumbers.length - 8} {fr ? 'autres' : 'more'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {fr
                  ? `De ${serialNumbers[0]} à ${serialNumbers[serialNumbers.length - 1]} — ${quantity} pièce(s)`
                  : `From ${serialNumbers[0]} to ${serialNumbers[serialNumbers.length - 1]} — ${quantity} item(s)`}
              </p>
              {duplicates.length > 0 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {fr
                    ? `${duplicates.length} doublon(s) détecté(s) — ils seront ignorés`
                    : `${duplicates.length} duplicate(s) detected — they will be skipped`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar during import */}
        {running && (
          <div className="glass-card p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              {fr ? 'Import en cours…' : 'Importing…'}
            </p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full h-14 text-base rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground border-0 gap-2"
        >
          <Layers className="w-5 h-5" />
          {running
            ? (fr ? 'Import en cours…' : 'Importing…')
            : (fr
                ? `Ajouter ${quantity - duplicates.length} équipement(s) en stock`
                : `Add ${quantity - duplicates.length} item(s) to stock`)}
        </Button>
      </div>
    </div>
    </AppLayout>
  );
};

export default BulkAddMachine;
