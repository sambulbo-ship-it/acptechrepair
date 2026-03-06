import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkspaceSettings {
  id: string;
  workspace_id: string;
  enable_barcode_scan: boolean;
  enable_qrcode_scan: boolean;
  enable_barcode_print: boolean;
  enable_qrcode_print: boolean;
  require_scan_notes: boolean;
  scan_history_retention_days: number;
  guest_link_enabled: boolean;
  guest_show_catalog: boolean;
  guest_show_repair_request: boolean;
  guest_show_maintenance_request: boolean;
}

const defaultSettings: Omit<WorkspaceSettings, 'id' | 'workspace_id'> = {
  enable_barcode_scan: true,
  enable_qrcode_scan: true,
  enable_barcode_print: true,
  enable_qrcode_print: true,
  require_scan_notes: false,
  scan_history_retention_days: 365,
  guest_link_enabled: false,
  guest_show_catalog: true,
  guest_show_repair_request: false,
  guest_show_maintenance_request: false,
};

export const useWorkspaceSettings = () => {
  const { currentWorkspace, isWorkspaceAdmin } = useAuth();
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!currentWorkspace) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings(data as WorkspaceSettings);
      } else {
        if (isWorkspaceAdmin) {
          const { data: newSettings, error: insertError } = await supabase
            .from('workspace_settings')
            .insert({
              workspace_id: currentWorkspace.id,
              ...defaultSettings,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newSettings as WorkspaceSettings);
        } else {
          setSettings({
            id: '',
            workspace_id: currentWorkspace.id,
            ...defaultSettings,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching workspace settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSettings({
        id: '',
        workspace_id: currentWorkspace?.id || '',
        ...defaultSettings,
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, isWorkspaceAdmin]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Omit<WorkspaceSettings, 'id' | 'workspace_id'>>): Promise<boolean> => {
    if (!currentWorkspace || !settings?.id || !isWorkspaceAdmin) {
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('workspace_settings')
        .update(updates)
        .eq('id', settings.id);

      if (updateError) throw updateError;

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err) {
      console.error('Error updating workspace settings:', err);
      return false;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    isAdmin: isWorkspaceAdmin,
  };
};
