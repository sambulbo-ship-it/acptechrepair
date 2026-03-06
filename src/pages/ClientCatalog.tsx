import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { EquipmentCategory } from '@/data/equipmentData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, ShoppingCart } from 'lucide-react';
import { QuoteRequestForm } from '@/components/QuoteRequestForm';
import { usePublicCatalog } from '@/hooks/usePublicCatalog';
import {
  CatalogHeader,
  CatalogSearch,
  CatalogCategoryFilter,
  CatalogMachineCard,
  CatalogEmptyState,
  CatalogLoadingState,
  CatalogErrorState,
  CatalogNoCodeState,
  type CatalogMachine,
} from '@/components/catalog';

type TabValue = 'all' | 'rental' | 'sale';

const ClientCatalog = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspace');
  const inviteCode = searchParams.get('invite_code');
  
  // Use custom hook for data fetching
  const { machines, workspace, resolvedWorkspaceId, loading, error, noCode } = usePublicCatalog(workspaceId, inviteCode);
  
  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  
  // Quote form state
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [selectedMachineForQuote, setSelectedMachineForQuote] = useState<CatalogMachine | null>(null);

  // Derive workspace info
  const workspaceName = workspace?.name || machines[0]?.workspace_name || '';

  // Filter machines based on search, category, and tab
  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        machine.name.toLowerCase().includes(searchLower) ||
        (machine.brand?.toLowerCase().includes(searchLower) ?? false) ||
        (machine.model?.toLowerCase().includes(searchLower) ?? false);
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || machine.category === selectedCategory;
      
      // Tab filter
      if (activeTab === 'rental') return matchesSearch && matchesCategory && machine.available_for_rental;
      if (activeTab === 'sale') return matchesSearch && matchesCategory && machine.available_for_sale;
      return matchesSearch && matchesCategory;
    });
  }, [machines, searchQuery, selectedCategory, activeTab]);

  const openQuoteForm = (machine: CatalogMachine) => {
    setSelectedMachineForQuote(machine);
    setQuoteFormOpen(true);
  };

  // Loading state
  if (loading) {
    return <CatalogLoadingState language={language} />;
  }

  // No invite code provided
  if (noCode) {
    return <CatalogNoCodeState language={language} />;
  }

  // Error state
  if (error) {
    return <CatalogErrorState error={error} language={language} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <CatalogHeader workspaceName={workspaceName} language={language} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        <CatalogSearch 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          language={language}
        />

        <CatalogCategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          language={language}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
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
              <CatalogEmptyState language={language} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMachines.map((machine) => (
                  <CatalogMachineCard
                    key={machine.id}
                    machine={machine}
                    language={language}
                    onRequestQuote={openQuoteForm}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quote Request Form */}
      {selectedMachineForQuote && (
        <QuoteRequestForm
          open={quoteFormOpen}
          onOpenChange={setQuoteFormOpen}
          machine={{
            id: selectedMachineForQuote.id,
            name: selectedMachineForQuote.name,
            brand: selectedMachineForQuote.brand,
            model: selectedMachineForQuote.model,
          }}
          workspaceId={resolvedWorkspaceId || ''}
          workspaceName={workspaceName}
          availableForRental={selectedMachineForQuote.available_for_rental}
          availableForSale={selectedMachineForQuote.available_for_sale}
        />
      )}

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
