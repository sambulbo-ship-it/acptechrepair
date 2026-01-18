import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MaintenanceSchedule {
  id: string;
  machine_id: string;
  workspace_id: string;
  interval_days: number;
  last_maintenance_date: string | null;
  next_maintenance_date: string;
  reminder_days_before: number;
  enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useMaintenanceSchedule = (machineId?: string) => {
  const { currentWorkspace, user } = useAuth();
  const [schedule, setSchedule] = useState<MaintenanceSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!currentWorkspace || !machineId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('machine_id', machineId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setSchedule(data as MaintenanceSchedule | null);
    } catch (err) {
      console.error('Error fetching maintenance schedule:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, machineId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const createSchedule = useCallback(async (data: {
    interval_days: number;
    next_maintenance_date: string;
    reminder_days_before: number;
    notes?: string;
  }): Promise<{ error: Error | null; schedule?: MaintenanceSchedule }> => {
    if (!currentWorkspace || !machineId || !user) {
      return { error: new Error('Données manquantes') };
    }

    try {
      const { data: newSchedule, error: insertError } = await supabase
        .from('maintenance_schedules')
        .insert({
          machine_id: machineId,
          workspace_id: currentWorkspace.id,
          interval_days: data.interval_days,
          next_maintenance_date: data.next_maintenance_date,
          reminder_days_before: data.reminder_days_before,
          notes: data.notes || null,
          enabled: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setSchedule(newSchedule as MaintenanceSchedule);
      return { error: null, schedule: newSchedule as MaintenanceSchedule };
    } catch (err) {
      console.error('Error creating maintenance schedule:', err);
      return { error: err as Error };
    }
  }, [currentWorkspace, machineId, user]);

  const updateSchedule = useCallback(async (data: Partial<{
    interval_days: number;
    last_maintenance_date: string | null;
    next_maintenance_date: string;
    reminder_days_before: number;
    enabled: boolean;
    notes: string | null;
  }>): Promise<{ error: Error | null }> => {
    if (!schedule) {
      return { error: new Error('Pas de planning à mettre à jour') };
    }

    try {
      const { error: updateError } = await supabase
        .from('maintenance_schedules')
        .update(data)
        .eq('id', schedule.id);

      if (updateError) throw updateError;
      setSchedule(prev => prev ? { ...prev, ...data } : null);
      return { error: null };
    } catch (err) {
      console.error('Error updating maintenance schedule:', err);
      return { error: err as Error };
    }
  }, [schedule]);

  const deleteSchedule = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!schedule) {
      return { error: new Error('Pas de planning à supprimer') };
    }

    try {
      const { error: deleteError } = await supabase
        .from('maintenance_schedules')
        .delete()
        .eq('id', schedule.id);

      if (deleteError) throw deleteError;
      setSchedule(null);
      return { error: null };
    } catch (err) {
      console.error('Error deleting maintenance schedule:', err);
      return { error: err as Error };
    }
  }, [schedule]);

  const markMaintenanceDone = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!schedule) {
      return { error: new Error('Pas de planning') };
    }

    const today = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + schedule.interval_days);
    const nextMaintenanceDate = nextDate.toISOString().split('T')[0];

    try {
      const { error: updateError } = await supabase
        .from('maintenance_schedules')
        .update({
          last_maintenance_date: today,
          next_maintenance_date: nextMaintenanceDate,
        })
        .eq('id', schedule.id);

      if (updateError) throw updateError;
      setSchedule(prev => prev ? { 
        ...prev, 
        last_maintenance_date: today,
        next_maintenance_date: nextMaintenanceDate,
      } : null);
      return { error: null };
    } catch (err) {
      console.error('Error marking maintenance done:', err);
      return { error: err as Error };
    }
  }, [schedule]);

  return {
    schedule,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    markMaintenanceDone,
    refetch: fetchSchedule,
  };
};
