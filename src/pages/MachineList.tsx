import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudData } from '@/hooks/useCloudData';
import { useNotifications } from '@/hooks/useNotifications';
import { useWorkspaceSettings } from '@/hooks/useWorkspaceSettings';
import { useScanHistory } from '@/hooks/useScanHistory';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MachineCard } from '@/components/MachineCard';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { AIProductScanner } from '@/components/AIProductScanner';
import { RecentRepairsSuggestions } from '@/components/RecentRepairsSuggestions';
import { BatchDuplicateDialog } from '@/components/BatchDuplicateDialog';
import { equipmentCategories, EquipmentCategory } from '@/data/equipmentData';
import { getCategoryIconComponent } from '@/components/CategoryIcon';
import { Search, Wrench, History, Copy, X, CheckSquare, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MachineList = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { currentWorkspace } = useAuth();
  const { machines, entries, loading, getStats, setNotificationCallbacks } = useCloudData();
  const { notifyNewEntry, notifyStatusChange, notifyTeamMemberAdded, permission } = useNotifications();
  const { settings } = useWorkspaceSettings();
  const { recordScan } = useScanHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDuplicateOpen, setBatchDuplicateOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name-asc');

  // Setup notification callbacks
  useEffect(() => {
    if (permission === 'granted') {
      setNotificationCallbacks({
        onNewEntry: notifyNewEntry,
        onStatusChange: notifyStatusChange,
        onTeamMemberAdded: notifyTeamMemberAdded,
      });
    } else {
      setNotificationCallbacks({});
    }
  }, [permission, setNotificationCallbacks, notifyNewEntry, notifyStatusChange, notifyTeamMemberAdded]);

  const stats = getStats();

  const handleScan = async (scannedCode: string, scanType: 'barcode' | 'qrcode') => {
    const machine = machines.find(
      m => m.serialNumber.toLowerCase() === scannedCode.toLowerCase()
    );
    await recordScan(scannedCode, scanType, machine?.id || null, !!machine);
    if (machine) {
      navigate(`/machine/${machine.id}`);
    } else {
      toast.error(
        language === 'fr' 
          ? `Aucun équipement trouvé avec le numéro: ${scannedCode}`
          : `No equipment found with serial: ${scannedCode}`
      );
      setSearchQuery(scannedCode);
    }
  };

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch = 
      machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || machine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedMachines = [...filteredMachines].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'serial-asc': return a.serialNumber.localeCompare(b.serialNumber);
      case 'serial-desc': return b.serialNumber.localeCompare(a.serialNumber);
      case 'brand-asc': return a.brand.localeCompare(b.brand);
      case 'brand-desc': return b.brand.localeCompare(a.brand);
      case 'status':
        const statusOrder: Record<string, number> = { 'out-of-service': 0, 'needs-attention': 1, 'operational': 2 };
        return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default: return 0;
    }
  });

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const selectedMachines = machines.filter(m => selectedIds.has(m.id));

  const handleBatchComplete = () => {
    exitSelectionMode();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        title={selectionMode
          ? (language === 'fr' ? `${selectedIds.size} sélectionné(s)` : `${selectedIds.size} selected`)
          : t('equipment')
        }
        rightAction={
          selectionMode ? (
            <button onClick={exitSelectionMode} className="p-2 text-muted-foreground touch-target">
              <X className="w-5 h-5" />
            </button>
          ) : undefined
        }
      />
      
      <div className="p-4 space-y-4">
        {currentWorkspace && <WorkspaceSelector />}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-stats p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{t('totalEquipment')}</p>
          </div>
          <div className="glass-stats p-3 text-center">
            <p className="text-2xl font-bold text-success">{stats.operational}</p>
            <p className="text-xs text-muted-foreground">{t('inService')}</p>
          </div>
          <div className="glass-stats p-3 text-center">
            <p className="text-2xl font-bold text-warning">{stats.needsAttention + stats.outOfService}</p>
            <p className="text-xs text-muted-foreground">{t('needsWork')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchMachines')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 glass-input"
            />
          </div>
          <BarcodeScanner 
            onScan={handleScan}
            enableBarcode={settings?.enable_barcode_scan ?? true}
            enableQRCode={settings?.enable_qrcode_scan ?? true}
          />
          <AIProductScanner 
            onExistingProductFound={(machineId) => navigate(`/machine/${machineId}`)}
          />
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 glass-button"
            onClick={() => navigate('/scan-history')}
            aria-label={language === 'fr' ? 'Historique des scans' : 'Scan history'}
          >
            <History className="w-5 h-5" />
          </Button>
        </div>

        <RecentRepairsSuggestions machines={machines} entries={entries} />

        {/* Selection mode toggle + actions bar */}
        {!selectionMode && filteredMachines.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5 text-xs"
              onClick={() => setSelectionMode(true)}
            >
              <CheckSquare className="w-4 h-4" />
              {language === 'fr' ? 'Sélectionner' : 'Select'}
            </Button>
          </div>
        )}

        {selectionMode && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => {
                if (selectedIds.size === filteredMachines.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(filteredMachines.map(m => m.id)));
                }
              }}
            >
              {selectedIds.size === filteredMachines.length
                ? (language === 'fr' ? 'Tout désélectionner' : 'Deselect all')
                : (language === 'fr' ? 'Tout sélectionner' : 'Select all')}
            </Button>
            <Button
              size="sm"
              className="rounded-full gap-1.5 text-xs"
              disabled={selectedIds.size === 0}
              onClick={() => setBatchDuplicateOpen(true)}
            >
              <Copy className="w-4 h-4" />
              {language === 'fr' ? `Dupliquer (${selectedIds.size})` : `Duplicate (${selectedIds.size})`}
            </Button>
          </div>
        )}

        {/* Sort + Category Filter */}
        <div className="flex items-center gap-2">
          <div className="shrink-0">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10 w-auto gap-1.5 glass-input text-xs font-medium">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">{language === 'fr' ? 'Nom A→Z' : 'Name A→Z'}</SelectItem>
                <SelectItem value="name-desc">{language === 'fr' ? 'Nom Z→A' : 'Name Z→A'}</SelectItem>
                <SelectItem value="serial-asc">{language === 'fr' ? 'N° série A→Z' : 'Serial A→Z'}</SelectItem>
                <SelectItem value="serial-desc">{language === 'fr' ? 'N° série Z→A' : 'Serial Z→A'}</SelectItem>
                <SelectItem value="brand-asc">{language === 'fr' ? 'Marque A→Z' : 'Brand A→Z'}</SelectItem>
                <SelectItem value="brand-desc">{language === 'fr' ? 'Marque Z→A' : 'Brand Z→A'}</SelectItem>
                <SelectItem value="status">{language === 'fr' ? 'Statut (urgent)' : 'Status (urgent)'}</SelectItem>
                <SelectItem value="recent">{language === 'fr' ? 'Récent' : 'Recent'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
              {t('allCategories')}
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : sortedMachines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t('noMachines')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('addFirst')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMachines.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onClick={() => !selectionMode && navigate(`/machine/${machine.id}`)}
                selectable={selectionMode}
                selected={selectedIds.has(machine.id)}
                onSelect={(checked) => toggleSelection(machine.id, checked)}
              />
            ))}
          </div>
        )}
      </div>

      <BatchDuplicateDialog
        open={batchDuplicateOpen}
        onOpenChange={setBatchDuplicateOpen}
        selectedMachines={selectedMachines}
        onComplete={handleBatchComplete}
      />

      <BottomNav />
    </div>
  );
};

export default MachineList;
