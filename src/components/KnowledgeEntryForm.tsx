import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplePlatform } from '@/hooks/useApplePlatform';
import { useKnowledgeEntries, CreateKnowledgeEntry } from '@/hooks/useKnowledgeEntries';
import { equipmentCategories } from '@/data/equipmentData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Loader2, Lightbulb, Wrench, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KnowledgeEntryForm = ({ open, onOpenChange }: KnowledgeEntryFormProps) => {
  const { language } = useLanguage();
  const { supportsLiquidGlass } = useApplePlatform();
  const { createEntry } = useKnowledgeEntries();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateKnowledgeEntry>({
    category: '',
    brand: '',
    model: '',
    problem_description: '',
    solution_description: '',
  });

  const t = language === 'fr' ? {
    title: 'Partager une expertise',
    subtitle: 'Enrichissez la base de connaissances pour aider l\'IA et vos collègues',
    category: 'Catégorie d\'équipement *',
    selectCategory: 'Sélectionner une catégorie',
    brand: 'Marque',
    brandPlaceholder: 'Ex: Shure, Sennheiser...',
    model: 'Modèle',
    modelPlaceholder: 'Ex: SM58, e945...',
    problem: 'Problème rencontré *',
    problemPlaceholder: 'Décrivez le problème technique observé...',
    solution: 'Solution trouvée *',
    solutionPlaceholder: 'Décrivez comment vous avez résolu ce problème...',
    save: 'Partager l\'expertise',
    cancel: 'Annuler',
    note: 'Ces informations seront utilisées par l\'IA pour aider d\'autres techniciens avec des problèmes similaires.',
  } : {
    title: 'Share Expertise',
    subtitle: 'Enrich the knowledge base to help AI and your colleagues',
    category: 'Equipment Category *',
    selectCategory: 'Select a category',
    brand: 'Brand',
    brandPlaceholder: 'Ex: Shure, Sennheiser...',
    model: 'Model',
    modelPlaceholder: 'Ex: SM58, e945...',
    problem: 'Problem Encountered *',
    problemPlaceholder: 'Describe the technical problem observed...',
    solution: 'Solution Found *',
    solutionPlaceholder: 'Describe how you solved this problem...',
    save: 'Share Expertise',
    cancel: 'Cancel',
    note: 'This information will be used by AI to help other technicians with similar issues.',
  };

  const handleSave = async () => {
    if (!form.category || !form.problem_description || !form.solution_description) {
      return;
    }

    setSaving(true);
    const success = await createEntry(form);
    setSaving(false);

    if (success) {
      setForm({
        category: '',
        brand: '',
        model: '',
        problem_description: '',
        solution_description: '',
      });
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn(
        'h-[90vh] rounded-t-3xl overflow-hidden border-t-0',
        supportsLiquidGlass && 'glass-dialog'
      )}>
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            {t.title}
          </SheetTitle>
          <SheetDescription>{t.subtitle}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto h-[calc(100%-6rem)] pb-8 px-1">
          {/* Info note */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary">{t.note}</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t.category}</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}
            >
              <SelectTrigger className={cn('h-12', supportsLiquidGlass && 'glass-input')}>
                <SelectValue placeholder={t.selectCategory} />
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

          {/* Brand & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t.brand}</Label>
              <Input
                value={form.brand}
                onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                placeholder={t.brandPlaceholder}
                className={cn('h-12', supportsLiquidGlass && 'glass-input')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.model}</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
                placeholder={t.modelPlaceholder}
                className={cn('h-12', supportsLiquidGlass && 'glass-input')}
              />
            </div>
          </div>

          {/* Problem */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              {t.problem}
            </Label>
            <Textarea
              value={form.problem_description}
              onChange={(e) => setForm(prev => ({ ...prev, problem_description: e.target.value }))}
              placeholder={t.problemPlaceholder}
              className={cn('min-h-[100px]', supportsLiquidGlass && 'glass-input')}
            />
          </div>

          {/* Solution */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-success" />
              {t.solution}
            </Label>
            <Textarea
              value={form.solution_description}
              onChange={(e) => setForm(prev => ({ ...prev, solution_description: e.target.value }))}
              placeholder={t.solutionPlaceholder}
              className={cn('min-h-[120px]', supportsLiquidGlass && 'glass-input')}
            />
          </div>

          {/* Actions */}
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
              disabled={saving || !form.category || !form.problem_description || !form.solution_description}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
