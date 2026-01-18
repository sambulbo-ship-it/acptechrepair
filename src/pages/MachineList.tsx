import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMachines } from '@/hooks/useMachines';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MachineCard } from '@/components/MachineCard';
import { Search, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MachineList = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { machines, loading } = useMachines();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMachines = machines.filter(
    (machine) =>
      machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t('machines')} />
      
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('searchMachines')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-secondary border-0 rounded-xl"
          />
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
