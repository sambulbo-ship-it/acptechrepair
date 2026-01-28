import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useRentalSale, RentalTransaction } from '@/hooks/useRentalSale';
import { useCloudData } from '@/hooks/useCloudData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplePlatform } from '@/hooks/useApplePlatform';
import { useAuth } from '@/contexts/AuthContext';
import { downloadRentalContract } from '@/lib/pdfGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingCart,
  Calendar,
  Euro,
  Package,
  User,
  Phone,
  Mail,
  Building2,
  Loader2,
  Settings2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Shield,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const RentalSale = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { supportsLiquidGlass } = useApplePlatform();
  const { currentWorkspace } = useAuth();
  const { machines, loading: machinesLoading } = useCloudData();
  const {
    configs,
    transactions,
    loading,
    getConfigForMachine,
    getActiveTransactionForMachine,
    saveConfig,
    createTransaction,
    updateTransaction,
    completeRental,
  } = useRentalSale();

  const [activeTab, setActiveTab] = useState('available');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<'rental' | 'sale'>('rental');
  const [saving, setSaving] = useState(false);

  // Form states for config
  const [configForm, setConfigForm] = useState({
    available_for_rental: true,
    available_for_sale: false,
    daily_rental_price: '',
    weekly_rental_price: '',
    monthly_rental_price: '',
    sale_price: '',
    rental_notes: '',
    sale_notes: '',
  });

  // Form states for transaction
  const [transactionForm, setTransactionForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_company: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    expected_end_date: '',
    agreed_price: '',
    deposit_amount: '',
    warranty_end_date: '',
    notes: '',
  });

  const t = language === 'fr' ? {
    title: 'Location / Vente',
    available: 'Disponible',
    rentals: 'Locations',
    sales: 'Ventes',
    configure: 'Configurer',
    startRental: 'Démarrer location',
    startSale: 'Enregistrer vente',
    returnMachine: 'Retour',
    noMachines: 'Aucune machine configurée',
    noRentals: 'Aucune location active',
    noSales: 'Aucune vente active',
    configTitle: 'Configuration prix',
    rentalPricing: 'Tarifs location',
    salePricing: 'Prix de vente',
    dailyPrice: 'Prix/jour',
    weeklyPrice: 'Prix/semaine',
    monthlyPrice: 'Prix/mois',
    availableForRental: 'Disponible à la location',
    availableForSale: 'Disponible à la vente',
    client: 'Client',
    clientName: 'Nom du client',
    clientEmail: 'Email',
    clientPhone: 'Téléphone',
    clientCompany: 'Société',
    startDate: 'Date de début',
    endDate: 'Date de fin prévue',
    agreedPrice: 'Prix convenu',
    deposit: 'Caution',
    warrantyEnd: 'Fin de garantie',
    notes: 'Notes',
    save: 'Enregistrer',
    cancel: 'Annuler',
    active: 'Actif',
    returned: 'Retourné',
    inStock: 'En stock',
    rented: 'En location',
    sold: 'Vendu',
    notConfigured: 'Non configuré',
    excluded: 'Exclu',
  } : {
    title: 'Rental / Sale',
    available: 'Available',
    rentals: 'Rentals',
    sales: 'Sales',
    configure: 'Configure',
    startRental: 'Start Rental',
    startSale: 'Record Sale',
    returnMachine: 'Return',
    noMachines: 'No machines configured',
    noRentals: 'No active rentals',
    noSales: 'No active sales',
    configTitle: 'Price Configuration',
    rentalPricing: 'Rental Pricing',
    salePricing: 'Sale Price',
    dailyPrice: 'Price/day',
    weeklyPrice: 'Price/week',
    monthlyPrice: 'Price/month',
    availableForRental: 'Available for rental',
    availableForSale: 'Available for sale',
    client: 'Client',
    clientName: 'Client name',
    clientEmail: 'Email',
    clientPhone: 'Phone',
    clientCompany: 'Company',
    startDate: 'Start date',
    endDate: 'Expected end date',
    agreedPrice: 'Agreed price',
    deposit: 'Deposit',
    warrantyEnd: 'Warranty end',
    notes: 'Notes',
    save: 'Save',
    cancel: 'Cancel',
    active: 'Active',
    returned: 'Returned',
    inStock: 'In stock',
    rented: 'Rented',
    sold: 'Sold',
    notConfigured: 'Not configured',
    excluded: 'Excluded',
  };

  // Categorize machines
  const categorizedMachines = useMemo(() => {
    const available: typeof machines = [];
    const rented: typeof machines = [];
    const sold: typeof machines = [];

    machines.forEach(machine => {
      const config = getConfigForMachine(machine.id);
      const activeTransaction = getActiveTransactionForMachine(machine.id);

      if (activeTransaction) {
        if (activeTransaction.transaction_type === 'rental') {
          rented.push(machine);
        } else {
          sold.push(machine);
        }
      } else if (config && (config.available_for_rental || config.available_for_sale)) {
        available.push(machine);
      }
    });

    return { available, rented, sold };
  }, [machines, getConfigForMachine, getActiveTransactionForMachine]);

  const openConfigDialog = (machineId: string) => {
    const config = getConfigForMachine(machineId);
    setSelectedMachineId(machineId);
    setConfigForm({
      available_for_rental: config?.available_for_rental ?? true,
      available_for_sale: config?.available_for_sale ?? false,
      daily_rental_price: config?.daily_rental_price?.toString() || '',
      weekly_rental_price: config?.weekly_rental_price?.toString() || '',
      monthly_rental_price: config?.monthly_rental_price?.toString() || '',
      sale_price: config?.sale_price?.toString() || '',
      rental_notes: config?.rental_notes || '',
      sale_notes: config?.sale_notes || '',
    });
    setConfigDialogOpen(true);
  };

  const openTransactionDialog = (machineId: string, type: 'rental' | 'sale') => {
    setSelectedMachineId(machineId);
    setTransactionType(type);
    setTransactionForm({
      client_name: '',
      client_email: '',
      client_phone: '',
      client_company: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      expected_end_date: '',
      agreed_price: '',
      deposit_amount: '',
      warranty_end_date: '',
      notes: '',
    });
    setTransactionDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedMachineId) return;
    setSaving(true);
    
    await saveConfig(selectedMachineId, {
      available_for_rental: configForm.available_for_rental,
      available_for_sale: configForm.available_for_sale,
      daily_rental_price: configForm.daily_rental_price ? parseFloat(configForm.daily_rental_price) : null,
      weekly_rental_price: configForm.weekly_rental_price ? parseFloat(configForm.weekly_rental_price) : null,
      monthly_rental_price: configForm.monthly_rental_price ? parseFloat(configForm.monthly_rental_price) : null,
      sale_price: configForm.sale_price ? parseFloat(configForm.sale_price) : null,
      rental_notes: configForm.rental_notes || null,
      sale_notes: configForm.sale_notes || null,
    });

    setSaving(false);
    setConfigDialogOpen(false);
  };

  const handleCreateTransaction = async () => {
    if (!selectedMachineId || !transactionForm.agreed_price) return;
    setSaving(true);

    await createTransaction({
      machine_id: selectedMachineId,
      workspace_id: '', // Will be set in hook
      transaction_type: transactionType,
      client_name: transactionForm.client_name || null,
      client_email: transactionForm.client_email || null,
      client_phone: transactionForm.client_phone || null,
      client_company: transactionForm.client_company || null,
      start_date: transactionForm.start_date,
      expected_end_date: transactionForm.expected_end_date || null,
      actual_end_date: null,
      agreed_price: parseFloat(transactionForm.agreed_price),
      deposit_amount: transactionForm.deposit_amount ? parseFloat(transactionForm.deposit_amount) : null,
      currency: 'EUR',
      status: 'active',
      warranty_end_date: transactionForm.warranty_end_date || null,
      notes: transactionForm.notes || null,
    });

    setSaving(false);
    setTransactionDialogOpen(false);
  };

  const handleReturn = async (transaction: RentalTransaction) => {
    await completeRental(transaction.id, format(new Date(), 'yyyy-MM-dd'));
  };

  const handleDownloadContract = (transaction: RentalTransaction) => {
    const machine = getMachineById(transaction.machine_id);
    if (!machine) return;

    const config = getConfigForMachine(machine.id);
    
    downloadRentalContract({
      companyName: currentWorkspace?.name || 'Company',
      clientName: transaction.client_name || '',
      clientEmail: transaction.client_email || undefined,
      clientPhone: transaction.client_phone || undefined,
      clientCompany: transaction.client_company || undefined,
      machineName: machine.name,
      machineBrand: machine.brand || undefined,
      machineModel: machine.model || undefined,
      machineSerialNumber: machine.serialNumber || undefined,
      machineCategory: machine.category,
      startDate: transaction.start_date,
      expectedEndDate: transaction.expected_end_date || undefined,
      agreedPrice: transaction.agreed_price,
      depositAmount: transaction.deposit_amount || undefined,
      currency: transaction.currency,
      notes: transaction.notes || undefined,
      dailyPrice: config?.daily_rental_price || undefined,
      weeklyPrice: config?.weekly_rental_price || undefined,
      monthlyPrice: config?.monthly_rental_price || undefined,
      contractNumber: transaction.id.slice(0, 8).toUpperCase(),
      language: language as 'fr' | 'en',
    });
  };

  const getMachineById = (id: string) => machines.find(m => m.id === id);

  const getStatusBadge = (machine: typeof machines[0]) => {
    const config = getConfigForMachine(machine.id);
    const transaction = getActiveTransactionForMachine(machine.id);

    if (transaction) {
      return transaction.transaction_type === 'rental' ? (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
          <Calendar className="w-3 h-3 mr-1" />
          {t.rented}
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
          <ShoppingCart className="w-3 h-3 mr-1" />
          {t.sold}
        </Badge>
      );
    }

    if (!config) {
      return (
        <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border/50">
          {t.notConfigured}
        </Badge>
      );
    }

    if (!config.available_for_rental && !config.available_for_sale) {
      return (
        <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border/50">
          {t.excluded}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
        <Package className="w-3 h-3 mr-1" />
        {t.inStock}
      </Badge>
    );
  };

  const cardClass = cn(
    "p-4 rounded-xl border transition-all",
    supportsLiquidGlass ? "glass-card" : "bg-card border-border/30"
  );

  if (loading || machinesLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col pb-20">
      <Header title={t.title} showBack />

      <main className="flex-1 px-4 py-4 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn(
            "grid w-full grid-cols-3",
            supportsLiquidGlass && "glass"
          )}>
            <TabsTrigger value="available" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">{t.available}</span>
              <Badge variant="secondary" className="ml-1">{categorizedMachines.available.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rentals" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">{t.rentals}</span>
              <Badge variant="secondary" className="ml-1">{categorizedMachines.rented.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{t.sales}</span>
              <Badge variant="secondary" className="ml-1">{categorizedMachines.sold.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Available Tab */}
          <TabsContent value="available" className="space-y-3 mt-4">
            {/* Show all machines for configuration */}
            {machines.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t.noMachines}
              </div>
            ) : (
              machines.map(machine => {
                const config = getConfigForMachine(machine.id);
                const transaction = getActiveTransactionForMachine(machine.id);
                const isAvailable = !transaction && config && (config.available_for_rental || config.available_for_sale);

                return (
                  <div key={machine.id} className={cardClass}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{machine.name}</h3>
                          {getStatusBadge(machine)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {machine.brand} {machine.model}
                        </p>
                        {config && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {config.daily_rental_price && (
                              <span className="flex items-center gap-1">
                                <Euro className="w-3 h-3" />
                                {config.daily_rental_price}€/{language === 'fr' ? 'jour' : 'day'}
                              </span>
                            )}
                            {config.sale_price && (
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="w-3 h-3" />
                                {config.sale_price}€
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openConfigDialog(machine.id)}
                          className="h-8"
                        >
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        {isAvailable && (
                          <div className="flex gap-1">
                            {config?.available_for_rental && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openTransactionDialog(machine.id, 'rental')}
                                className="h-8 text-blue-400"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                            {config?.available_for_sale && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openTransactionDialog(machine.id, 'sale')}
                                className="h-8 text-green-400"
                              >
                                <ShoppingCart className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* Rentals Tab */}
          <TabsContent value="rentals" className="space-y-3 mt-4">
            {categorizedMachines.rented.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t.noRentals}
              </div>
            ) : (
              transactions
                .filter(tr => tr.transaction_type === 'rental' && tr.status === 'active')
                .map(transaction => {
                  const machine = getMachineById(transaction.machine_id);
                  if (!machine) return null;

                  return (
                    <div key={transaction.id} className={cardClass}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground">{machine.name}</h3>
                          <p className="text-sm text-muted-foreground">{machine.brand} {machine.model}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {transaction.client_name && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {transaction.client_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(transaction.start_date), 'dd/MM/yyyy')}
                              {transaction.expected_end_date && (
                                <> → {format(new Date(transaction.expected_end_date), 'dd/MM/yyyy')}</>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Euro className="w-3 h-3" />
                              {transaction.agreed_price}€
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadContract(transaction)}
                            className="h-8"
                            title={language === 'fr' ? 'Télécharger contrat PDF' : 'Download PDF contract'}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturn(transaction)}
                            className="h-8"
                          >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            {t.returnMachine}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-3 mt-4">
            {categorizedMachines.sold.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t.noSales}
              </div>
            ) : (
              transactions
                .filter(tr => tr.transaction_type === 'sale' && (tr.status === 'active' || tr.status === 'completed'))
                .map(transaction => {
                  const machine = getMachineById(transaction.machine_id);
                  if (!machine) return null;

                  return (
                    <div key={transaction.id} className={cardClass}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground">{machine.name}</h3>
                            {transaction.warranty_end_date && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                                <Shield className="w-3 h-3 mr-1" />
                                Garantie
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{machine.brand} {machine.model}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {transaction.client_name && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {transaction.client_name}
                              </span>
                            )}
                            {transaction.client_company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {transaction.client_company}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(transaction.start_date), 'dd/MM/yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Euro className="w-3 h-3" />
                              {transaction.agreed_price}€
                            </span>
                            {transaction.warranty_end_date && (
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Garantie jusqu'au {format(new Date(transaction.warranty_end_date), 'dd/MM/yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className={cn(supportsLiquidGlass && "glass-dialog")}>
          <DialogHeader>
            <DialogTitle>{t.configTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Availability toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t.availableForRental}</Label>
                <Switch
                  checked={configForm.available_for_rental}
                  onCheckedChange={(checked) => setConfigForm(f => ({ ...f, available_for_rental: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t.availableForSale}</Label>
                <Switch
                  checked={configForm.available_for_sale}
                  onCheckedChange={(checked) => setConfigForm(f => ({ ...f, available_for_sale: checked }))}
                />
              </div>
            </div>

            {/* Rental pricing */}
            {configForm.available_for_rental && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">{t.rentalPricing}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t.dailyPrice}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={configForm.daily_rental_price}
                      onChange={(e) => setConfigForm(f => ({ ...f, daily_rental_price: e.target.value }))}
                      className={supportsLiquidGlass ? "glass-input" : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t.weeklyPrice}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={configForm.weekly_rental_price}
                      onChange={(e) => setConfigForm(f => ({ ...f, weekly_rental_price: e.target.value }))}
                      className={supportsLiquidGlass ? "glass-input" : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t.monthlyPrice}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={configForm.monthly_rental_price}
                      onChange={(e) => setConfigForm(f => ({ ...f, monthly_rental_price: e.target.value }))}
                      className={supportsLiquidGlass ? "glass-input" : ""}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sale pricing */}
            {configForm.available_for_sale && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">{t.salePricing}</h4>
                <div className="space-y-1">
                  <Label className="text-xs">{t.salePricing}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={configForm.sale_price}
                    onChange={(e) => setConfigForm(f => ({ ...f, sale_price: e.target.value }))}
                    className={supportsLiquidGlass ? "glass-input" : ""}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfigDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className={cn("max-w-lg", supportsLiquidGlass && "glass-dialog")}>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'rental' ? t.startRental : t.startSale}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Client info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                {t.client}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t.clientName}</Label>
                  <Input
                    value={transactionForm.client_name}
                    onChange={(e) => setTransactionForm(f => ({ ...f, client_name: e.target.value }))}
                    className={supportsLiquidGlass ? "glass-input" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t.clientCompany}</Label>
                  <Input
                    value={transactionForm.client_company}
                    onChange={(e) => setTransactionForm(f => ({ ...f, client_company: e.target.value }))}
                    className={supportsLiquidGlass ? "glass-input" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t.clientEmail}</Label>
                  <Input
                    type="email"
                    value={transactionForm.client_email}
                    onChange={(e) => setTransactionForm(f => ({ ...f, client_email: e.target.value }))}
                    className={supportsLiquidGlass ? "glass-input" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t.clientPhone}</Label>
                  <Input
                    type="tel"
                    value={transactionForm.client_phone}
                    onChange={(e) => setTransactionForm(f => ({ ...f, client_phone: e.target.value }))}
                    className={supportsLiquidGlass ? "glass-input" : ""}
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t.startDate}</Label>
                <Input
                  type="date"
                  value={transactionForm.start_date}
                  onChange={(e) => setTransactionForm(f => ({ ...f, start_date: e.target.value }))}
                  className={supportsLiquidGlass ? "glass-input" : ""}
                />
              </div>
              {transactionType === 'rental' && (
                <div className="space-y-1">
                  <Label className="text-xs">{t.endDate}</Label>
                  <Input
                    type="date"
                    value={transactionForm.expected_end_date}
                    onChange={(e) => setTransactionForm(f => ({ ...f, expected_end_date: e.target.value }))}
                    className={supportsLiquidGlass ? "glass-input" : ""}
                  />
                </div>
              )}
              {transactionType === 'sale' && (
                <div className="space-y-1">
                  <Label className="text-xs">{t.warrantyEnd}</Label>
                  <Input
                    type="date"
                    value={transactionForm.warranty_end_date}
                    onChange={(e) => setTransactionForm(f => ({ ...f, warranty_end_date: e.target.value }))}
                    className={supportsLiquidGlass ? "glass-input" : ""}
                  />
                </div>
              )}
            </div>

            {/* Financial */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t.agreedPrice} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={transactionForm.agreed_price}
                  onChange={(e) => setTransactionForm(f => ({ ...f, agreed_price: e.target.value }))}
                  className={supportsLiquidGlass ? "glass-input" : ""}
                />
              </div>
              {transactionType === 'rental' && (
                <div className="space-y-1">
                  <Label className="text-xs">{t.deposit}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={transactionForm.deposit_amount}
                    onChange={(e) => setTransactionForm(f => ({ ...f, deposit_amount: e.target.value }))}
                    className={supportsLiquidGlass ? "glass-input" : ""}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">{t.notes}</Label>
              <Textarea
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm(f => ({ ...f, notes: e.target.value }))}
                className={supportsLiquidGlass ? "glass-input" : ""}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTransactionDialogOpen(false)}>{t.cancel}</Button>
            <Button 
              onClick={handleCreateTransaction} 
              disabled={saving || !transactionForm.agreed_price}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default RentalSale;
