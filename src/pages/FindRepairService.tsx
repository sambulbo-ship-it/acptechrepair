import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wrench, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Send, 
  Loader2,
  CheckCircle,
  ArrowLeft,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface RepairProvider {
  id: string;
  company_name: string;
  contact_email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  description: string | null;
  supported_brands: string[];
  supported_categories: string[];
}

const FindRepairService = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<RepairProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<RepairProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form state
  const [selectedBrand, setSelectedBrand] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<RepairProvider | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Get unique brands from all providers
  const allBrands = [...new Set(providers.flatMap(p => p.supported_brands))].filter(Boolean).sort();

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    // Filter providers based on selected brand
    if (selectedBrand) {
      const filtered = providers.filter(p => 
        p.supported_brands.some(b => b.toLowerCase() === selectedBrand.toLowerCase())
      );
      setFilteredProviders(filtered);
      // Reset selected provider if not in filtered list
      if (selectedProvider && !filtered.find(p => p.id === selectedProvider.id)) {
        setSelectedProvider(null);
      }
    } else {
      setFilteredProviders(providers);
    }
  }, [selectedBrand, providers]);

  const loadProviders = async () => {
    const { data, error } = await supabase
      .from('repair_service_providers')
      .select('*')
      .eq('is_visible', true);

    if (error) {
      console.error('Error loading providers:', error);
      toast.error('Erreur lors du chargement des réparateurs');
    } else {
      setProviders(data || []);
      setFilteredProviders(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvider || !selectedBrand || !description || !clientEmail) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('repair_requests')
        .insert({
          provider_id: selectedProvider.id,
          client_email: clientEmail,
          client_name: clientName || null,
          client_phone: clientPhone || null,
          brand: selectedBrand,
          model: model || null,
          description,
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Demande envoyée avec succès !');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Demande envoyée !</h2>
            <p className="text-muted-foreground mb-6">
              {selectedProvider?.company_name} va recevoir votre demande et vous contactera rapidement.
            </p>
            <Button onClick={() => {
              setSubmitted(false);
              setSelectedProvider(null);
              setSelectedBrand('');
              setModel('');
              setDescription('');
              setClientName('');
              setClientEmail('');
              setClientPhone('');
            }}>
              Faire une autre demande
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-effect border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Où réparer ma machine ?</h1>
            <p className="text-xs text-muted-foreground">Trouvez un réparateur agréé</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun réparateur disponible</h3>
              <p className="text-sm text-muted-foreground">
                Aucune entreprise de réparation n'est actuellement inscrite sur la plateforme.
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Brand */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Quelle marque ?</CardTitle>
                <CardDescription>Sélectionnez la marque de votre machine</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une marque" />
                  </SelectTrigger>
                  <SelectContent>
                    {allBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="mt-3">
                  <Label htmlFor="model" className="text-sm text-muted-foreground">
                    Modèle (optionnel)
                  </Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: Model X, Pro 2024..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Describe Problem */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Décrivez le problème</CardTitle>
                <CardDescription>Plus vous êtes précis, mieux le réparateur pourra vous aider</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez la panne, les symptômes, quand ça a commencé..."
                  rows={4}
                  required
                />
              </CardContent>
            </Card>

            {/* Step 3: Select Provider */}
            {selectedBrand && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">3. Choisissez un réparateur</CardTitle>
                  <CardDescription>
                    {filteredProviders.length} réparateur(s) pour {selectedBrand}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredProviders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun réparateur disponible pour cette marque
                    </p>
                  ) : (
                    filteredProviders.map(provider => (
                      <div
                        key={provider.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedProvider?.id === provider.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            <Wrench className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{provider.company_name}</h4>
                            {provider.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {provider.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              {provider.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {provider.city}
                                </span>
                              )}
                              {provider.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {provider.phone}
                                </span>
                              )}
                              {provider.website && (
                                <a 
                                  href={provider.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Globe className="w-3 h-3" />
                                  Site web
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 4: Your contact info */}
            {selectedProvider && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">4. Vos coordonnées</CardTitle>
                  <CardDescription>Pour que le réparateur puisse vous contacter</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Nom (optionnel)</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Téléphone (optionnel)</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+33 6 00 00 00 00"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            {selectedProvider && (
              <Button 
                type="submit" 
                className="w-full h-12 gap-2"
                disabled={submitting || !description || !clientEmail}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer la demande à {selectedProvider.company_name}
              </Button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default FindRepairService;