import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { EquipmentCategory } from '@/data/equipmentData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, ShoppingCart, Wrench, CalendarCheck } from 'lucide-react';
import { QuoteRequestForm } from '@/components/QuoteRequestForm';
import { usePublicCatalog } from '@/hooks/usePublicCatalog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

  // Repair/maintenance request dialog state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<'repair' | 'maintenance'>('repair');
  const [requestForm, setRequestForm] = useState({
    name: '', email: '', phone: '', brand: '', model: '', description: ''
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);

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
    setRequestForm({ name: '', email: '', phone: '', brand: '', model: '', description: '' });
    setRequestDialogOpen(true);
  };

  const submitRequest = async () => {
    if (!requestForm.email || !requestForm.description || !requestForm.brand) {
      toast.error(language === 'fr' ? 'Veuillez remplir les champs obligatoires' : 'Please fill required fields');
      return;
    }

    setRequestSubmitting(true);
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
            workspace_id: resolvedWorkspaceId,
            client_name: requestForm.name,
            client_email: requestForm.email,
            client_phone: requestForm.phone,
            brand: requestForm.brand,
            model: requestForm.model,
            description: `[${requestType === 'repair' ? 'RÉPARATION' : 'ENTRETIEN'}] ${requestForm.description}`,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error');
      }

      toast.success(language === 'fr' ? 'Demande envoyée avec succès !' : 'Request sent successfully!');
      setRequestDialogOpen(false);
    } catch (err) {
      toast.error(language === 'fr' ? 'Erreur lors de l\'envoi' : 'Failed to send request');
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (loading) return <CatalogLoadingState language={language} />;
  if (noCode) return <CatalogNoCodeState language={language} />;
  if (error) return <CatalogErrorState error={error} language={language} />;

  const showCatalog = guestConfig?.guest_show_catalog ?? true;
  const showRepair = guestConfig?.guest_show_repair_request ?? false;
  const showMaintenance = guestConfig?.guest_show_maintenance_request ?? false;

  return (
    <div className="min-h-screen bg-background">
      <CatalogHeader workspaceName={workspaceName} language={language} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Service request buttons */}
        {(showRepair || showMaintenance) && (
          <div className="flex flex-wrap gap-3">
            {showRepair && (
              <Button
                variant="outline"
                className="gap-2 flex-1 min-w-[200px] h-14 rounded-xl border-primary/30 hover:bg-primary/10"
                onClick={() => openRequestDialog('repair')}
              >
                <Wrench className="w-5 h-5 text-primary" />
                {language === 'fr' ? 'Demander une réparation' : 'Request repair'}
              </Button>
            )}
            {showMaintenance && (
              <Button
                variant="outline"
                className="gap-2 flex-1 min-w-[200px] h-14 rounded-xl border-primary/30 hover:bg-primary/10"
                onClick={() => openRequestDialog('maintenance')}
              >
                <CalendarCheck className="w-5 h-5 text-primary" />
                {language === 'fr' ? 'Demander un entretien' : 'Request maintenance'}
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
            />

            <CatalogCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              language={language}
            />

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
          </>
        )}

        {!showCatalog && !showRepair && !showMaintenance && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {language === 'fr' ? 'Aucun contenu disponible pour le moment.' : 'No content available at the moment.'}
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
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {requestType === 'repair'
                ? (language === 'fr' ? 'Demande de réparation' : 'Repair Request')
                : (language === 'fr' ? 'Demande d\'entretien' : 'Maintenance Request')
              }
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' 
                ? `Remplissez ce formulaire pour soumettre une demande de ${requestType === 'repair' ? 'réparation' : 'entretien'}.`
                : `Fill out this form to submit a ${requestType} request.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Nom *' : 'Name *'}</Label>
              <Input
                value={requestForm.name}
                onChange={(e) => setRequestForm(f => ({ ...f, name: e.target.value }))}
                className="bg-secondary border-0 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Email *' : 'Email *'}</Label>
              <Input
                type="email"
                value={requestForm.email}
                onChange={(e) => setRequestForm(f => ({ ...f, email: e.target.value }))}
                className="bg-secondary border-0 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Téléphone' : 'Phone'}</Label>
              <Input
                value={requestForm.phone}
                onChange={(e) => setRequestForm(f => ({ ...f, phone: e.target.value }))}
                className="bg-secondary border-0 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{language === 'fr' ? 'Marque *' : 'Brand *'}</Label>
                <Input
                  value={requestForm.brand}
                  onChange={(e) => setRequestForm(f => ({ ...f, brand: e.target.value }))}
                  className="bg-secondary border-0 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'fr' ? 'Modèle' : 'Model'}</Label>
                <Input
                  value={requestForm.model}
                  onChange={(e) => setRequestForm(f => ({ ...f, model: e.target.value }))}
                  className="bg-secondary border-0 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Description *' : 'Description *'}</Label>
              <Textarea
                value={requestForm.description}
                onChange={(e) => setRequestForm(f => ({ ...f, description: e.target.value }))}
                className="bg-secondary border-0 rounded-xl min-h-[100px]"
                placeholder={
                  requestType === 'repair'
                    ? (language === 'fr' ? 'Décrivez le problème...' : 'Describe the issue...')
                    : (language === 'fr' ? 'Décrivez l\'entretien souhaité...' : 'Describe the maintenance needed...')
                }
              />
            </div>
            <Button 
              onClick={submitRequest} 
              disabled={requestSubmitting}
              className="w-full h-12 rounded-xl"
            >
              {requestSubmitting 
                ? (language === 'fr' ? 'Envoi...' : 'Sending...')
                : (language === 'fr' ? 'Envoyer la demande' : 'Send request')
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
