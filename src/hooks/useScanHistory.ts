import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ScanRecord {
  id: string;
  workspace_id: string;
  machine_id: string | null;
  scanned_code: string;
  scan_type: 'barcode' | 'qrcode';
  scanned_by: string | null;
  scanned_at: Date;
  found: boolean;
  device_info: string | null;
  machine_name?: string;
}

export const useScanHistory = () => {
  const { currentWorkspace, user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    if (!currentWorkspace) {
      setScans([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('scan_history')
        .select(`
          *,
          machines (name)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('scanned_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      const formattedScans: ScanRecord[] = (data || []).map((scan: any) => ({
        id: scan.id,
        workspace_id: scan.workspace_id,
        machine_id: scan.machine_id,
        scanned_code: scan.scanned_code,
        scan_type: scan.scan_type,
        scanned_by: scan.scanned_by,
        scanned_at: new Date(scan.scanned_at),
        found: scan.found,
        device_info: scan.device_info,
        machine_name: scan.machines?.name || null,
      }));

      setScans(formattedScans);
    } catch (err) {
      console.error('Error fetching scan history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentWorkspace) return;

    const channel = supabase
      .channel(`scan-history-${currentWorkspace.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scan_history',
          filter: `workspace_id=eq.${currentWorkspace.id}`,
        },
        (payload) => {
          const newScan = payload.new as any;
          setScans(prev => [{
            id: newScan.id,
            workspace_id: newScan.workspace_id,
            machine_id: newScan.machine_id,
            scanned_code: newScan.scanned_code,
            scan_type: newScan.scan_type,
            scanned_by: newScan.scanned_by,
            scanned_at: new Date(newScan.scanned_at),
            found: newScan.found,
            device_info: newScan.device_info,
          }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspace]);

  const recordScan = async (
    scannedCode: string,
    scanType: 'barcode' | 'qrcode',
    machineId: string | null,
    found: boolean
  ): Promise<boolean> => {
    if (!currentWorkspace || !user) return false;

    try {
      // Get device info
      const deviceInfo = navigator.userAgent.substring(0, 255);

      const { error: insertError } = await supabase
        .from('scan_history')
        .insert({
          workspace_id: currentWorkspace.id,
          machine_id: machineId,
          scanned_code: scannedCode,
          scan_type: scanType,
          scanned_by: user.id,
          found,
          device_info: deviceInfo,
        });

      if (insertError) throw insertError;
      return true;
    } catch (err) {
      console.error('Error recording scan:', err);
      return false;
    }
  };

  const clearHistory = async (): Promise<boolean> => {
    if (!currentWorkspace) return false;

    try {
      const { error: deleteError } = await supabase
        .from('scan_history')
        .delete()
        .eq('workspace_id', currentWorkspace.id);

      if (deleteError) throw deleteError;
      setScans([]);
      return true;
    } catch (err) {
      console.error('Error clearing scan history:', err);
      return false;
    }
  };

  return {
    scans,
    loading,
    error,
    recordScan,
    clearHistory,
    refresh: fetchScans,
  };
};
