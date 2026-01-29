import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryIconComponent } from '@/components/CategoryIcon';
import { getCategoryLabel, equipmentCategories, EquipmentCategory } from '@/data/equipmentData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Search, ShoppingCart, CalendarDays, Loader2, Package, Mail, Phone, Check, X, Sparkles } from 'lucide-react';
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
  workspace_phone: string | null;
  available_for_rental: boolean;
  available_for_sale: boolean;
  daily_rental_price: number | null;
  weekly_rental_price: number | null;
  monthly_rental_price: number | null;
  sale_price: number | null;
  currency: string;
  rental_notes: string | null;
  sale_notes: string | null;
  in_stock: boolean;
  condition: 'new' | 'used' | 'unspecified';
}

const ClientCatalog = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspace');
  const inviteCode = searchParams.get('invite_code');
  
  const [machines, setMachines] = useState<CatalogMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'rental' | 'sale'>('all');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  const [workspaceName, setWorkspaceName] = useState<string>('');

  useEffect(() => {
    if (workspaceId || inviteCode) {
      loadCatalog();
    } else {
      setError(language === 'fr' 
        ? 'Paramètre workspace ou invite_code manquant. Utilisez ?workspace=ID ou ?invite_code=CODE' 
        : 'Missing workspace or invite_code parameter. Use ?workspace=ID or ?invite_code=CODE');
      setLoading(false);
    }
  }, [workspaceId, inviteCode]);

  const loadCatalog = async () => {
    if (!workspaceId && !inviteCode) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Build query params - support both workspace_id and invite_code
      const queryParams = new URLSearchParams();
      if (workspaceId) {
        queryParams.set('workspace_id', workspaceId);
      } else if (inviteCode) {
        queryParams.set('invite_code', inviteCode);
      }
      
      // Call the public API endpoint
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-catalog?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load catalog');
      }

      const data = await response.json();
      setMachines(data.machines || []);
      
      // Get workspace name from first item
      if (data.machines?.length > 0) {
        setWorkspaceName(data.machines[0].workspace_name);
      }
    } catch (err) {
      console.error('Error loading catalog:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch = 
      machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (machine.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (machine.model?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesCategory = selectedCategory === 'all' || machine.category === selectedCategory;
    
    if (activeTab === 'rental') return matchesSearch && matchesCategory && machine.available_for_rental;
    if (activeTab === 'sale') return matchesSearch && matchesCategory && machine.available_for_sale;
    return matchesSearch && matchesCategory;
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
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === 'fr' ? 'Chargement du catalogue...' : 'Loading catalog...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <X className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            {language === 'fr' ? 'Erreur' : 'Error'}
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
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
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {workspaceName || (language === 'fr' ? 'Catalogue' : 'Catalog')}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr' ? 'Location & Vente' : 'Rental & Sale'}
                </p>
              </div>
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

        {/* Category Filter - Larger readable bubbles */}
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 min-w-fit',
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'glass-card hover:bg-secondary/50 text-foreground border border-border/50'
              )}
            >
              {language === 'fr' ? 'Toutes catégories' : 'All categories'}
            </button>
            {equipmentCategories.filter(c => c.id !== 'other').map((cat) => {
              const CategoryIcon = getCategoryIconComponent(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2 min-w-fit',
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'glass-card hover:bg-secondary/50 text-foreground border border-border/50'
                  )}
                >
                  <CategoryIcon className="w-4 h-4" />
                  {language === 'fr' ? cat.labelFr : cat.labelEn}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 glass-card h-14">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 rounded-xl">
              {language === 'fr' ? 'Tout' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="rental" className="data-[state=active]:bg-primary/20 rounded-xl">
              <CalendarDays className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Location' : 'Rental'}
            </TabsTrigger>
            <TabsTrigger value="sale" className="data-[state=active]:bg-primary/20 rounded-xl">
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
                    <div key={machine.id} className="glass-card overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                      {/* Image */}
                      <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                        {machine.photos && machine.photos.length > 0 ? (
                          <img 
                            src={machine.photos[0]} 
                            alt={machine.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <CategoryIcon className="w-20 h-20 text-primary/30" />
                        )}
                        
                        {/* Stock badge */}
                        <div className="absolute top-3 right-3">
                          {machine.in_stock ? (
                            <Badge className="bg-success/90 text-white border-0">
                              <Check className="w-3 h-3 mr-1" />
                              {language === 'fr' ? 'En stock' : 'In stock'}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <X className="w-3 h-3 mr-1" />
                              {language === 'fr' ? 'Rupture' : 'Out of stock'}
                            </Badge>
                          )}
                        </div>

                        {/* Condition badge for sales */}
                        {machine.available_for_sale && machine.condition !== 'unspecified' && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className={cn(
                              "border-0",
                              machine.condition === 'new' 
                                ? "bg-primary/90 text-white" 
                                : "bg-secondary/90 text-foreground"
                            )}>
                              <Sparkles className="w-3 h-3 mr-1" />
                              {machine.condition === 'new' 
                                ? (language === 'fr' ? 'Neuf' : 'New')
                                : (language === 'fr' ? 'Occasion' : 'Used')}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Title & Brand */}
                        <div>
                          <h3 className="text-lg font-bold text-foreground truncate">
                            {machine.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {machine.brand} {machine.model}
                          </p>
                        </div>

                        {/* Category - readable */}
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {getCategoryLabel(machine.category as EquipmentCategory, language)}
                          </span>
                        </div>

                        {/* Availability badges */}
                        <div className="flex flex-wrap gap-2">
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
                        <div className="space-y-3 pt-3 border-t border-border/50">
                          {machine.available_for_rental && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === 'fr' ? 'Tarifs location' : 'Rental rates'}
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="glass-card p-2 text-center">
                                  <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Jour' : 'Day'}</p>
                                  <p className="text-sm font-bold text-foreground">
                                    {formatPrice(machine.daily_rental_price, machine.currency)}
                                  </p>
                                </div>
                                <div className="glass-card p-2 text-center">
                                  <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Sem.' : 'Week'}</p>
                                  <p className="text-sm font-bold text-foreground">
                                    {formatPrice(machine.weekly_rental_price, machine.currency)}
                                  </p>
                                </div>
                                <div className="glass-card p-2 text-center">
                                  <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Mois' : 'Month'}</p>
                                  <p className="text-sm font-bold text-foreground">
                                    {formatPrice(machine.monthly_rental_price, machine.currency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {machine.available_for_sale && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                {language === 'fr' ? 'Prix de vente' : 'Sale price'}
                              </p>
                              <p className="text-2xl font-bold text-success">
                                {formatPrice(machine.sale_price, machine.currency)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Contact */}
                        {(machine.workspace_contact_email || machine.workspace_phone) && (
                          <div className="pt-3 border-t border-border/50 space-y-2">
                            {machine.workspace_contact_email && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full glass-button"
                                asChild
                              >
                                <a href={`mailto:${machine.workspace_contact_email}?subject=${encodeURIComponent(`${language === 'fr' ? 'Demande pour' : 'Inquiry for'} ${machine.name}`)}`}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  {language === 'fr' ? 'Contacter par email' : 'Contact by email'}
                                </a>
                              </Button>
                            )}
                            {machine.workspace_phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full glass-button"
                                asChild
                              >
                                <a href={`tel:${machine.workspace_phone}`}>
                                  <Phone className="w-4 h-4 mr-2" />
                                  {machine.workspace_phone}
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
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
          {workspaceName} - {language === 'fr' ? 'Catalogue d\'équipements' : 'Equipment catalog'}
        </p>
      </footer>
    </div>
  );
};

export default ClientCatalog;
