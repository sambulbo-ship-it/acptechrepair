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
import { equipmentCategories, EquipmentCategory } from '@/data/equipmentData';
import { Search, Wrench, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MachineList = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { currentWorkspace } = useAuth();
  const { machines, loading, getStats, setNotificationCallbacks } = useCloudData();
  const { notifyNewEntry, notifyStatusChange, notifyTeamMemberAdded, permission } = useNotifications();
  const { settings } = useWorkspaceSettings();
  const { recordScan } = useScanHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'all'>('all');

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

  // Handle barcode/QR scan - find machine by serial number
  const handleScan = async (scannedCode: string, scanType: 'barcode' | 'qrcode') => {
    const machine = machines.find(
      m => m.serialNumber.toLowerCase() === scannedCode.toLowerCase()
    );
    
    // Record the scan in history
    await recordScan(scannedCode, scanType, machine?.id || null, !!machine);
    
    if (machine) {
      navigate(`/machine/${machine.id}`);
    } else {
      toast.error(
        language === 'fr' 
          ? `Aucun équipement trouvé avec le numéro: ${scannedCode}`
          : `No equipment found with serial: ${scannedCode}`
      );
      // Set the scanned code as search query to help user find it
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t('equipment')} />
      
      <div className="p-4 space-y-4">
        {/* Workspace Selector */}
        {currentWorkspace && (
          <WorkspaceSelector />
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="ios-card p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{t('totalEquipment')}</p>
          </div>
          <div className="ios-card p-3 text-center">
            <p className="text-2xl font-bold text-success">{stats.operational}</p>
            <p className="text-xs text-muted-foreground">{t('inService')}</p>
          </div>
          <div className="ios-card p-3 text-center">
            <p className="text-2xl font-bold text-warning">{stats.needsAttention + stats.outOfService}</p>
            <p className="text-xs text-muted-foreground">{t('needsWork')}</p>
          </div>
        </div>

        {/* Search with Scanner and History */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchMachines')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-secondary border-0 rounded-xl"
            />
          </div>
          <BarcodeScanner 
            onScan={handleScan}
            enableBarcode={settings?.enable_barcode_scan ?? true}
            enableQRCode={settings?.enable_qrcode_scan ?? true}
          />
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/scan-history')}
            aria-label={language === 'fr' ? 'Historique des scans' : 'Scan history'}
          >
            <History className="w-5 h-5" />
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {t('allCategories')}
          </button>
          {equipmentCategories.filter(c => c.id !== 'other').map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              {language === 'fr' ? cat.labelFr : cat.labelEn}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredMachines.length === 0 ? (
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
            {filteredMachines.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onClick={() => navigate(`/machine/${machine.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MachineList;
