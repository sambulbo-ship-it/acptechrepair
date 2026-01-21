import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Save, 
  Loader2,
  Eye,
  EyeOff,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface RepairProvider {
  id: string;
  workspace_id: string;
  is_visible: boolean;
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

const RepairServiceSettings = () => {
  const { user, currentWorkspace, isWorkspaceAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<RepairProvider | null>(null);
  
  // Form state
  const [isVisible, setIsVisible] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState('');

  useEffect(() => {
    if (currentWorkspace) {
      loadProvider();
    }
  }, [currentWorkspace]);

  const loadProvider = async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('repair_service_providers')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading provider:', error);
    } else if (data) {
      setProvider(data);
      setIsVisible(data.is_visible);
      setCompanyName(data.company_name);
      setContactEmail(data.contact_email);
      setPhone(data.phone || '');
      setAddress(data.address || '');
      setCity(data.city || '');
      setWebsite(data.website || '');
      setDescription(data.description || '');
      setBrands(data.supported_brands || []);
    } else {
      // Pre-fill with workspace name and user email
      setCompanyName(currentWorkspace.name);
      setContactEmail(user?.email || '');
    }
    setLoading(false);
  };

  const handleAddBrand = () => {
    if (newBrand.trim() && !brands.includes(newBrand.trim())) {
      setBrands([...brands, newBrand.trim()]);
      setNewBrand('');
    }
  };

  const handleRemoveBrand = (brand: string) => {
    setBrands(brands.filter(b => b !== brand));
  };

  const handleSave = async () => {
    if (!currentWorkspace || !companyName || !contactEmail) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setSaving(true);

    try {
      const providerData = {
        workspace_id: currentWorkspace.id,
        is_visible: isVisible,
        company_name: companyName,
        contact_email: contactEmail,
        phone: phone || null,
        address: address || null,
        city: city || null,
        website: website || null,
        description: description || null,
        supported_brands: brands,
        created_by: user?.id,
      };

      if (provider) {
        // Update existing
        const { error } = await supabase
          .from('repair_service_providers')
          .update(providerData)
          .eq('id', provider.id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('repair_service_providers')
          .insert(providerData)
          .select()
          .single();

        if (error) throw error;
        setProvider(data);
      }

      toast.success('Paramètres enregistrés !');
    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!isWorkspaceAdmin) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header title="Service de réparation" showBack />
        <div className="p-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Seuls les administrateurs peuvent configurer le service de réparation.
              </p>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Service de réparation" showBack />

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Visibility Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  Visibilité publique
                </CardTitle>
                <CardDescription>
                  Rendez votre entreprise visible sur la page "Où réparer ma machine"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {isVisible ? 'Visible publiquement' : 'Non visible'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isVisible 
                        ? 'Les clients peuvent vous trouver et vous envoyer des demandes'
                        : 'Votre entreprise n\'apparaît pas dans les résultats'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={setIsVisible}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Informations de l'entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nom de votre entreprise"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre activité, vos spécialités..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Coordonnées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contactEmail">Email de contact *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Les demandes de réparation seront envoyées à cette adresse
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 1 00 00 00 00"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Adresse
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 rue de la Réparation"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Site web
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.exemple.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Supported Brands */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Marques réparées</CardTitle>
                <CardDescription>
                  Ajoutez les marques que vous acceptez en réparation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Nom de la marque"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBrand())}
                  />
                  <Button type="button" onClick={handleAddBrand} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brands.map(brand => (
                    <Badge key={brand} variant="secondary" className="gap-1">
                      {brand}
                      <button onClick={() => handleRemoveBrand(brand)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {brands.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucune marque ajoutée
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              className="w-full h-12 gap-2"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer
            </Button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default RepairServiceSettings;