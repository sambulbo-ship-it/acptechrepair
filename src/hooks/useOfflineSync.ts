import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Machine, DiagnosticEntry, TeamMember } from '@/types/machine';
import {
  saveMachinesOffline,
  getMachinesOffline,
  saveEntriesOffline,
  getEntriesOffline,
  saveTeamOffline,
  getTeamOffline,
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  updateLastSync,
  hasPendingChanges,
} from '@/lib/offlineDB';
import { toast } from 'sonner';

export const useOfflineSync = () => {
  const { currentWorkspace, user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie', { description: 'Synchronisation en cours...' });
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Mode hors-ligne', { description: 'Les modifications seront synchronisées au retour du réseau' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check pending changes count
  useEffect(() => {
    const checkPending = async () => {
      if (currentWorkspace) {
        const pending = await getPendingOperations(currentWorkspace.id);
        setPendingCount(pending.length);
      }
    };
    checkPending();
  }, [currentWorkspace]);

  // Sync pending changes to server
  const syncPendingChanges = useCallback(async () => {
    if (!currentWorkspace || !user || syncingRef.current || !navigator.onLine) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const pending = await getPendingOperations(currentWorkspace.id);
      
      for (const op of pending) {
        try {
          if (op.tableName === 'machines') {
            if (op.operation === 'INSERT') {
              await supabase.from('machines').insert(op.data as any);
            } else if (op.operation === 'UPDATE' && op.recordId) {
              await supabase.from('machines').update(op.data as any).eq('id', op.recordId);
            } else if (op.operation === 'DELETE' && op.recordId) {
              await supabase.from('machines').delete().eq('id', op.recordId);
            }
          } else if (op.tableName === 'diagnostic_entries') {
            if (op.operation === 'INSERT') {
              await supabase.from('diagnostic_entries').insert(op.data as any);
            } else if (op.operation === 'UPDATE' && op.recordId) {
              await supabase.from('diagnostic_entries').update(op.data as any).eq('id', op.recordId);
            } else if (op.operation === 'DELETE' && op.recordId) {
              await supabase.from('diagnostic_entries').delete().eq('id', op.recordId);
            }
          } else if (op.tableName === 'team_members') {
            if (op.operation === 'INSERT') {
              await supabase.from('team_members').insert(op.data as any);
            } else if (op.operation === 'UPDATE' && op.recordId) {
              await supabase.from('team_members').update(op.data as any).eq('id', op.recordId);
            } else if (op.operation === 'DELETE' && op.recordId) {
              await supabase.from('team_members').delete().eq('id', op.recordId);
            }
          }
          
          // Remove successfully synced operation
          await removePendingOperation(op.id);
        } catch (err) {
          console.error('Error syncing operation:', op, err);
        }
      }

      await updateLastSync(currentWorkspace.id);
      setPendingCount(0);
      
      if (pending.length > 0) {
        toast.success('Synchronisation terminée', { description: `${pending.length} modification(s) synchronisée(s)` });
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Erreur de synchronisation');
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [currentWorkspace, user]);

  // Save data locally for offline access
  const cacheDataLocally = useCallback(async (
    machines: Machine[],
    entries: DiagnosticEntry[],
    team: TeamMember[]
  ) => {
    if (!currentWorkspace) return;

    try {
      await Promise.all([
        saveMachinesOffline(machines, currentWorkspace.id),
        saveEntriesOffline(entries, currentWorkspace.id),
        saveTeamOffline(team, currentWorkspace.id),
      ]);
    } catch (err) {
      console.error('Error caching data locally:', err);
    }
  }, [currentWorkspace]);

  // Get cached data when offline
  const getCachedData = useCallback(async (): Promise<{
    machines: Machine[];
    entries: DiagnosticEntry[];
    team: TeamMember[];
  } | null> => {
    if (!currentWorkspace) return null;

    try {
      const [machines, entries, team] = await Promise.all([
        getMachinesOffline(currentWorkspace.id),
        getEntriesOffline(currentWorkspace.id),
        getTeamOffline(currentWorkspace.id),
      ]);

      return { machines, entries, team };
    } catch (err) {
      console.error('Error getting cached data:', err);
      return null;
    }
  }, [currentWorkspace]);

  // Queue an operation for later sync
  const queueOperation = useCallback(async (
    tableName: 'machines' | 'diagnostic_entries' | 'team_members',
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: Record<string, unknown>,
    recordId?: string
  ) => {
    if (!currentWorkspace) return;

    await addPendingOperation({
      tableName,
      operation,
      data,
      recordId,
      workspaceId: currentWorkspace.id,
    });

    setPendingCount(prev => prev + 1);
  }, [currentWorkspace]);

  // Check if we have pending changes
  const checkHasPendingChanges = useCallback(async (): Promise<boolean> => {
    if (!currentWorkspace) return false;
    return hasPendingChanges(currentWorkspace.id);
  }, [currentWorkspace]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncPendingChanges,
    cacheDataLocally,
    getCachedData,
    queueOperation,
    checkHasPendingChanges,
  };
};
