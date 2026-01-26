import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryIconComponent } from '@/components/CategoryIcon';
import { getCategoryLabel, EquipmentCategory } from '@/data/equipmentData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ShoppingCart, CalendarDays, Loader2, Package, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatalogMachine {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  photos: string[] | null;
  workspace_name: string;
  workspace_logo: string | null;
  workspace_contact_email: string | null;
  available_for_rental: boolean;
  available_for_sale: boolean;
  daily_rental_price: number | null;
  weekly_rental_price: number | null;
  monthly_rental_price: number | null;
  sale_price: number | null;
  currency: string;
  rental_notes: string | null;
  sale_notes: string | null;
}

const ClientCatalog = () => {
  const { language } = useLanguage();
  const [machines, setMachines] = useState<CatalogMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'rental' | 'sale'>('all');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      // Call the public API endpoint
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-catalog`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load catalog');
      }

      const data = await response.json();
      setMachines(data.machines || []);
    } catch (err) {
      console.error('Error loading catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch = 
      machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (machine.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (machine.model?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    if (activeTab === 'rental') return matchesSearch && machine.available_for_rental;
    if (activeTab === 'sale') return matchesSearch && machine.available_for_sale;
    return matchesSearch;
  });

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return '-';
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                {language === 'fr' ? 'Catalogue Équipements' : 'Equipment Catalog'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={language === 'fr' ? 'Rechercher un équipement...' : 'Search equipment...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 glass-input text-lg"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 glass-card h-14">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">
              {language === 'fr' ? 'Tout' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="rental" className="data-[state=active]:bg-primary/20">
              <CalendarDays className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Location' : 'Rental'}
            </TabsTrigger>
            <TabsTrigger value="sale" className="data-[state=active]:bg-primary/20">
              <ShoppingCart className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Vente' : 'Sale'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredMachines.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {language === 'fr' ? 'Aucun équipement trouvé' : 'No equipment found'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'fr' 
                    ? 'Aucun équipement ne correspond à votre recherche.'
                    : 'No equipment matches your search.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMachines.map((machine) => {
                  const CategoryIcon = getCategoryIconComponent(machine.category as EquipmentCategory);
                  
                  return (
                    <div key={machine.id} className="glass-card overflow-hidden">
                      {/* Image placeholder or photo */}
                      <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        {machine.photos && machine.photos.length > 0 ? (
                          <img 
                            src={machine.photos[0]} 
                            alt={machine.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <CategoryIcon className="w-16 h-16 text-primary/40" />
                        )}
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Title & Brand */}
                        <div>
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {machine.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {machine.brand} {machine.model}
                          </p>
                        </div>

                        {/* Category */}
                        <p className="text-xs text-muted-foreground">
                          {getCategoryLabel(machine.category as EquipmentCategory, language)}
                        </p>

                        {/* Badges */}
                        <div className="flex gap-2">
                          {machine.available_for_rental && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                              <CalendarDays className="w-3 h-3 mr-1" />
                              {language === 'fr' ? 'Location' : 'Rental'}
                            </Badge>
                          )}
                          {machine.available_for_sale && (
                            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              {language === 'fr' ? 'Vente' : 'Sale'}
                            </Badge>
                          )}
                        </div>

                        {/* Prices */}
                        <div className="space-y-2 pt-2 border-t border-border">
                          {machine.available_for_rental && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {language === 'fr' ? 'Tarifs location' : 'Rental rates'}
                              </p>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">{language === 'fr' ? 'Jour' : 'Day'}: </span>
                                  <span className="font-medium text-foreground">
                                    {formatPrice(machine.daily_rental_price, machine.currency)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">{language === 'fr' ? 'Sem' : 'Wk'}: </span>
                                  <span className="font-medium text-foreground">
                                    {formatPrice(machine.weekly_rental_price, machine.currency)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">{language === 'fr' ? 'Mois' : 'Mo'}: </span>
                                  <span className="font-medium text-foreground">
                                    {formatPrice(machine.monthly_rental_price, machine.currency)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {machine.available_for_sale && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {language === 'fr' ? 'Prix de vente' : 'Sale price'}
                              </p>
                              <p className="text-xl font-bold text-success">
                                {formatPrice(machine.sale_price, machine.currency)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Provider Info */}
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">
                            {language === 'fr' ? 'Proposé par' : 'Offered by'}
                          </p>
                          <div className="flex items-center gap-2">
                            {machine.workspace_logo ? (
                              <img 
                                src={machine.workspace_logo} 
                                alt={machine.workspace_name}
                                className="w-6 h-6 rounded object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                                <Package className="w-3 h-3 text-primary" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-foreground">
                              {machine.workspace_name}
                            </span>
                          </div>
                          
                          {machine.workspace_contact_email && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 glass-button"
                              asChild
                            >
                              <a href={`mailto:${machine.workspace_contact_email}?subject=${encodeURIComponent(`${language === 'fr' ? 'Demande pour' : 'Inquiry for'} ${machine.name}`)}`}>
                                <Mail className="w-4 h-4 mr-2" />
                                {language === 'fr' ? 'Contacter' : 'Contact'}
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border mt-12">
        <p className="text-xs text-muted-foreground">
          {language === 'fr' 
            ? 'Catalogue d\'équipements professionnels'
            : 'Professional equipment catalog'}
        </p>
      </footer>
    </div>
  );
};

export default ClientCatalog;
