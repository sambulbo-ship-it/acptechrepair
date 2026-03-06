import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Wrench, CalendarCheck } from 'lucide-react';

interface CatalogRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestType: 'repair' | 'maintenance';
  workspaceId: string | null;
  language: 'en' | 'fr';
}

export const CatalogRequestDialog = ({
  open,
  onOpenChange,
  requestType,
  workspaceId,
  language,
}: CatalogRequestDialogProps) => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', brand: '', model: '', description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.email || !form.description || !form.brand) {
      toast.error(language === 'fr' ? 'Veuillez remplir les champs obligatoires' : 'Please fill required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-repair-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            client_name: form.name,
            client_email: form.email,
            client_phone: form.phone,
            brand: form.brand,
            model: form.model,
            description: `[${requestType === 'repair' ? 'RÉPARATION' : 'ENTRETIEN'}] ${form.description}`,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error');
      }

      toast.success(language === 'fr' ? 'Demande envoyée !' : 'Request sent!');
      onOpenChange(false);
      setForm({ name: '', email: '', phone: '', brand: '', model: '', description: '' });
    } catch {
      toast.error(language === 'fr' ? 'Erreur lors de l\'envoi' : 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = requestType === 'repair' ? Wrench : CalendarCheck;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {requestType === 'repair'
                  ? (language === 'fr' ? 'Demande de réparation' : 'Repair Request')
                  : (language === 'fr' ? 'Demande d\'entretien' : 'Maintenance Request')
                }
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {language === 'fr' 
                  ? 'Remplissez le formulaire, nous vous recontacterons.'
                  : 'Fill out the form, we\'ll get back to you.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{language === 'fr' ? 'Nom' : 'Name'}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{language === 'fr' ? 'Téléphone' : 'Phone'}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{language === 'fr' ? 'Marque *' : 'Brand *'}</Label>
              <Input
                value={form.brand}
                onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))}
                className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{language === 'fr' ? 'Modèle' : 'Model'}</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))}
                className="h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              {language === 'fr' ? 'Description *' : 'Description *'}
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="rounded-xl bg-muted/50 border-border/50 min-h-[80px] text-sm"
              placeholder={
                requestType === 'repair'
                  ? (language === 'fr' ? 'Décrivez le problème...' : 'Describe the issue...')
                  : (language === 'fr' ? 'Décrivez l\'entretien souhaité...' : 'Describe the maintenance needed...')
              }
            />
          </div>
          <Button 
            onClick={submit} 
            disabled={submitting}
            className="w-full h-11 rounded-xl mt-1"
          >
            {submitting 
              ? (language === 'fr' ? 'Envoi...' : 'Sending...')
              : (language === 'fr' ? 'Envoyer la demande' : 'Send request')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
