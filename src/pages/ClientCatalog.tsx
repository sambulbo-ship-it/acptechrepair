import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { EquipmentCategory } from '@/data/equipmentData';
import { CalendarDays, ShoppingCart, Wrench, CalendarCheck } from 'lucide-react';
import { QuoteRequestForm } from '@/components/QuoteRequestForm';
import { usePublicCatalog } from '@/hooks/usePublicCatalog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
import { CatalogRequestDialog } from '@/components/catalog/CatalogRequestDialog';

type TabValue = 'all' | 'rental' | 'sale';

const ClientCatalog = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspace');
  const inviteCode = searchParams.get('invite_code');
  
  const { machines, workspace, resolvedWorkspaceId, guestConfig, loading, error, noCode } = usePublicCatalog(workspaceId, inviteCode);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [selectedMachineForQuote, setSelectedMachineForQuote] = useState<CatalogMachine | null>(null);

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<'repair' | 'maintenance'>('repair');

  const workspaceName = workspace?.name || machines[0]?.workspace_name || '';

  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        machine.name.toLowerCase().includes(searchLower) ||
        (machine.brand?.toLowerCase().includes(searchLower) ?? false) ||
        (machine.model?.toLowerCase().includes(searchLower) ?? false);
      
      const matchesCategory = selectedCategory === 'all' || machine.category === selectedCategory;
      
      if (activeTab === 'rental') return matchesSearch && matchesCategory && machine.available_for_rental;
      if (activeTab === 'sale') return matchesSearch && matchesCategory && machine.available_for_sale;
      return matchesSearch && matchesCategory;
    });
  }, [machines, searchQuery, selectedCategory, activeTab]);

  const openQuoteForm = (machine: CatalogMachine) => {
    setSelectedMachineForQuote(machine);
    setQuoteFormOpen(true);
  };

  const openRequestDialog = (type: 'repair' | 'maintenance') => {
    setRequestType(type);
    setRequestDialogOpen(true);
  };

  if (loading) return <CatalogLoadingState language={language} />;
  if (noCode) return <CatalogNoCodeState language={language} />;
  if (error) return <CatalogErrorState error={error} language={language} />;

  const showCatalog = guestConfig?.guest_show_catalog ?? true;
  const showRepair = guestConfig?.guest_show_repair_request ?? false;
  const showMaintenance = guestConfig?.guest_show_maintenance_request ?? false;

  const tabOptions = [
    { value: 'all' as TabValue, label: language === 'fr' ? 'Tout' : 'All', icon: null },
    { value: 'rental' as TabValue, label: language === 'fr' ? 'Location' : 'Rental', icon: CalendarDays },
    { value: 'sale' as TabValue, label: language === 'fr' ? 'Vente' : 'Sale', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-background">
      <CatalogHeader 
        workspaceName={workspaceName} 
        language={language}
        logoUrl={workspace?.logo_url}
      />

      <div className="container mx-auto px-4 py-5 space-y-4 max-w-6xl">
        {/* Service request buttons */}
        {(showRepair || showMaintenance) && (
          <div className="flex gap-2">
            {showRepair && (
              <Button
                variant="outline"
                className="gap-2 flex-1 h-12 rounded-xl border-border/60 hover:border-primary/30 hover:bg-primary/5"
                onClick={() => openRequestDialog('repair')}
              >
                <Wrench className="w-4 h-4 text-primary" />
                <span className="text-sm">{language === 'fr' ? 'Réparation' : 'Repair'}</span>
              </Button>
            )}
            {showMaintenance && (
              <Button
                variant="outline"
                className="gap-2 flex-1 h-12 rounded-xl border-border/60 hover:border-primary/30 hover:bg-primary/5"
                onClick={() => openRequestDialog('maintenance')}
              >
                <CalendarCheck className="w-4 h-4 text-primary" />
                <span className="text-sm">{language === 'fr' ? 'Entretien' : 'Maintenance'}</span>
              </Button>
            )}
          </div>
        )}

        {showCatalog && (
          <>
            <CatalogSearch 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              language={language}
              resultCount={filteredMachines.length}
            />

            <CatalogCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              language={language}
            />

            {/* Tab filter pills */}
            <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl w-fit">
              {tabOptions.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    activeTab === tab.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results */}
            {filteredMachines.length === 0 ? (
              <CatalogEmptyState language={language} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </>
        )}

        {!showCatalog && !showRepair && !showMaintenance && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">
              {language === 'fr' ? 'Aucun contenu disponible.' : 'No content available.'}
            </p>
          </div>
        )}
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

      {/* Repair / Maintenance Request Dialog */}
      <CatalogRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        requestType={requestType}
        workspaceId={resolvedWorkspaceId}
        language={language}
      />

      {/* Footer */}
      <footer className="py-6 text-center border-t border-border/30 mt-12">
        <p className="text-[11px] text-muted-foreground/60">
          {workspaceName} — {language === 'fr' ? 'Catalogue d\'équipements' : 'Equipment catalog'}
        </p>
      </footer>
    </div>
  );
};

export default ClientCatalog;
