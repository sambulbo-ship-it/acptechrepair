import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id: string;
  workspace_id: string;
  user_id: string;
  notify_machine_in_repair: boolean;
  notify_machine_ready: boolean;
  notify_stock_out: boolean;
  notify_stock_in: boolean;
  notify_status_critical: boolean;
  notify_new_team_member: boolean;
}

const defaultPreferences: Omit<NotificationPreferences, 'id' | 'workspace_id' | 'user_id'> = {
  notify_machine_in_repair: true,
  notify_machine_ready: true,
  notify_stock_out: true,
  notify_stock_in: true,
  notify_status_critical: true,
  notify_new_team_member: true,
};

export const useNotificationPreferences = () => {
  const { currentWorkspace, user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!currentWorkspace || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences
        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            workspace_id: currentWorkspace.id,
            user_id: user.id,
            ...defaultPreferences,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData as NotificationPreferences);
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      setError('Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(async (
    key: keyof Omit<NotificationPreferences, 'id' | 'workspace_id' | 'user_id'>,
    value: boolean
  ): Promise<boolean> => {
    if (!preferences) return false;

    try {
      const { error: updateError } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('id', preferences.id);

      if (updateError) throw updateError;

      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
      return true;
    } catch (err) {
      console.error('Error updating notification preference:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [preferences]);

  const updateAllPreferences = useCallback(async (
    updates: Partial<Omit<NotificationPreferences, 'id' | 'workspace_id' | 'user_id'>>
  ): Promise<boolean> => {
    if (!preferences) return false;

    try {
      const { error: updateError } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('id', preferences.id);

      if (updateError) throw updateError;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Préférences sauvegardées');
      return true;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [preferences]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    updateAllPreferences,
    refetch: fetchPreferences,
  };
};
