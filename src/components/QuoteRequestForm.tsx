import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Send, CalendarDays, ShoppingCart, Wrench, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

interface QuoteRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
  };
  workspaceId: string;
  workspaceName: string;
  availableForRental: boolean;
  availableForSale: boolean;
}

const quoteSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  email: z.string().trim().email('Email invalide').max(255, 'Email trop long'),
  phone: z.string().trim().max(20, 'Téléphone trop long').optional(),
  company: z.string().trim().max(100, 'Nom entreprise trop long').optional(),
  requestType: z.enum(['rental', 'sale', 'repair']),
  message: z.string().trim().min(10, 'Message trop court').max(2000, 'Message trop long'),
});

export const QuoteRequestForm = ({
  open,
  onOpenChange,
  machine,
  workspaceId,
  workspaceName,
  availableForRental,
  availableForSale,
}: QuoteRequestFormProps) => {
  const { language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    requestType: availableForRental ? 'rental' : availableForSale ? 'sale' : 'repair',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = quoteSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-quote-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            machine_id: machine.id,
            machine_name: machine.name,
            machine_brand: machine.brand,
            machine_model: machine.model,
            client_name: form.name,
            client_email: form.email,
            client_phone: form.phone || null,
            client_company: form.company || null,
            request_type: form.requestType,
            message: form.message,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      setIsSuccess(true);
      toast.success(
        language === 'fr'
          ? 'Demande envoyée avec succès !'
          : 'Request sent successfully!'
      );

      // Reset form after 2 seconds and close
      setTimeout(() => {
        setForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          requestType: availableForRental ? 'rental' : availableForSale ? 'sale' : 'repair',
          message: '',
        });
        setIsSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      console.error('Error submitting quote request:', err);
      toast.error(
        language === 'fr'
          ? 'Erreur lors de l\'envoi. Veuillez réessayer.'
          : 'Error sending request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md glass-dialog">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {language === 'fr' ? 'Demande envoyée !' : 'Request sent!'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'fr'
                ? `L'équipe de ${workspaceName} vous contactera bientôt.`
                : `The ${workspaceName} team will contact you soon.`}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-dialog max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'fr' ? 'Demander un devis' : 'Request a quote'}
          </DialogTitle>
          <DialogDescription>
            {machine.name} {machine.brand && `- ${machine.brand}`} {machine.model && machine.model}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Request Type */}
          <div className="space-y-2">
            <Label>
              {language === 'fr' ? 'Type de demande' : 'Request type'} *
            </Label>
            <RadioGroup
              value={form.requestType}
              onValueChange={(value) => handleChange('requestType', value)}
              className="grid grid-cols-3 gap-2"
            >
              {availableForRental && (
                <div>
                  <RadioGroupItem value="rental" id="rental" className="peer sr-only" />
                  <Label
                    htmlFor="rental"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer"
                  >
                    <CalendarDays className="w-5 h-5 mb-1" />
                    <span className="text-xs">
                      {language === 'fr' ? 'Location' : 'Rental'}
                    </span>
                  </Label>
                </div>
              )}
              {availableForSale && (
                <div>
                  <RadioGroupItem value="sale" id="sale" className="peer sr-only" />
                  <Label
                    htmlFor="sale"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer"
                  >
                    <ShoppingCart className="w-5 h-5 mb-1" />
                    <span className="text-xs">
                      {language === 'fr' ? 'Achat' : 'Purchase'}
                    </span>
                  </Label>
                </div>
              )}
              <div>
                <RadioGroupItem value="repair" id="repair" className="peer sr-only" />
                <Label
                  htmlFor="repair"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer"
                >
                  <Wrench className="w-5 h-5 mb-1" />
                  <span className="text-xs">
                    {language === 'fr' ? 'Réparation' : 'Repair'}
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'fr' ? 'Nom complet' : 'Full name'} *
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={language === 'fr' ? 'Votre nom' : 'Your name'}
              className="glass-input"
              required
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemple.com"
              className="glass-input"
              required
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              {language === 'fr' ? 'Téléphone' : 'Phone'}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+33 6 00 00 00 00"
              className="glass-input"
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">
              {language === 'fr' ? 'Entreprise' : 'Company'}
            </Label>
            <Input
              id="company"
              value={form.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder={language === 'fr' ? 'Nom de votre entreprise' : 'Your company name'}
              className="glass-input"
            />
            {errors.company && (
              <p className="text-xs text-destructive">{errors.company}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder={
                language === 'fr'
                  ? 'Décrivez votre demande (dates souhaitées, durée, questions...)'
                  : 'Describe your request (desired dates, duration, questions...)'
              }
              className="glass-input min-h-[100px]"
              required
            />
            {errors.message && (
              <p className="text-xs text-destructive">{errors.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'fr' ? 'Envoi...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Envoyer la demande' : 'Send request'}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
