import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RentalSaleConfig {
  id: string;
  machine_id: string;
  workspace_id: string;
  available_for_rental: boolean;
  available_for_sale: boolean;
  daily_rental_price: number | null;
  weekly_rental_price: number | null;
  monthly_rental_price: number | null;
  sale_price: number | null;
  currency: string;
  rental_notes: string | null;
  sale_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalTransaction {
  id: string;
  machine_id: string;
  workspace_id: string;
  transaction_type: 'rental' | 'sale';
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  start_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;
  agreed_price: number;
  deposit_amount: number | null;
  currency: string;
  status: 'active' | 'returned' | 'completed' | 'cancelled';
  warranty_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MachineWithRentalInfo {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  status: string;
  serial_number: string | null;
  config?: RentalSaleConfig;
  activeTransaction?: RentalTransaction;
}

export function useRentalSale() {
  const { currentWorkspace, user } = useAuth();
  const [configs, setConfigs] = useState<RentalSaleConfig[]>([]);
  const [transactions, setTransactions] = useState<RentalTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentWorkspace) {
      setConfigs([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [configsResult, transactionsResult] = await Promise.all([
        supabase
          .from('rental_sale_config')
          .select('*')
          .eq('workspace_id', currentWorkspace.id),
        supabase
          .from('rental_transactions')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('created_at', { ascending: false })
      ]);

      if (configsResult.error) throw configsResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      setConfigs(configsResult.data || []);
      setTransactions(transactionsResult.data as RentalTransaction[] || []);
    } catch (error) {
      console.error('Error loading rental data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getConfigForMachine = useCallback((machineId: string): RentalSaleConfig | undefined => {
    return configs.find(c => c.machine_id === machineId);
  }, [configs]);

  const getActiveTransactionForMachine = useCallback((machineId: string): RentalTransaction | undefined => {
    return transactions.find(t => t.machine_id === machineId && t.status === 'active');
  }, [transactions]);

  const saveConfig = async (machineId: string, config: Partial<RentalSaleConfig>): Promise<boolean> => {
    if (!currentWorkspace || !user) return false;

    try {
      const existing = getConfigForMachine(machineId);
      
      if (existing) {
        const { error } = await supabase
          .from('rental_sale_config')
          .update({
            ...config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rental_sale_config')
          .insert({
            machine_id: machineId,
            workspace_id: currentWorkspace.id,
            created_by: user.id,
            ...config,
          });

        if (error) throw error;
      }

      await loadData();
      toast.success('Configuration enregistrée');
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    }
  };

  const createTransaction = async (transaction: Omit<RentalTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!currentWorkspace || !user) return false;

    try {
      const { error } = await supabase
        .from('rental_transactions')
        .insert({
          ...transaction,
          workspace_id: currentWorkspace.id,
          created_by: user.id,
        });

      if (error) throw error;

      await loadData();
      toast.success(transaction.transaction_type === 'rental' ? 'Location créée' : 'Vente enregistrée');
      return true;
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Erreur lors de la création');
      return false;
    }
  };

  const updateTransaction = async (transactionId: string, updates: Partial<RentalTransaction>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('rental_transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) throw error;

      await loadData();
      toast.success('Transaction mise à jour');
      return true;
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  };

  const completeRental = async (transactionId: string, actualEndDate: string): Promise<boolean> => {
    return updateTransaction(transactionId, {
      status: 'returned',
      actual_end_date: actualEndDate,
    });
  };

  const cancelTransaction = async (transactionId: string): Promise<boolean> => {
    return updateTransaction(transactionId, {
      status: 'cancelled',
    });
  };

  // Get machines that are currently rented or sold
  const getActiveRentals = useCallback(() => {
    return transactions.filter(t => t.transaction_type === 'rental' && t.status === 'active');
  }, [transactions]);

  const getActiveSales = useCallback(() => {
    return transactions.filter(t => t.transaction_type === 'sale' && t.status === 'active');
  }, [transactions]);

  // Get machines available for rental (has config and not currently rented)
  const getAvailableForRental = useCallback((machines: MachineWithRentalInfo[]) => {
    return machines.filter(m => {
      const config = getConfigForMachine(m.id);
      const activeTransaction = getActiveTransactionForMachine(m.id);
      return config?.available_for_rental && !activeTransaction;
    });
  }, [getConfigForMachine, getActiveTransactionForMachine]);

  return {
    configs,
    transactions,
    loading,
    loadData,
    getConfigForMachine,
    getActiveTransactionForMachine,
    saveConfig,
    createTransaction,
    updateTransaction,
    completeRental,
    cancelTransaction,
    getActiveRentals,
    getActiveSales,
    getAvailableForRental,
  };
}
