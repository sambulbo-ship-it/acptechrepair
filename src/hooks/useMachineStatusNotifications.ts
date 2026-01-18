import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface MachineRecord {
  id: string;
  name: string;
  status: string;
  workspace_id: string;
  category: string;
  location: string | null;
}

type MachineChangePayload = RealtimePostgresChangesPayload<MachineRecord>;

const STATUS_LABELS: Record<string, string> = {
  operational: 'Opérationnel',
  maintenance: 'En maintenance',
  repair: 'En réparation',
  broken: 'Hors service',
  'out-of-service': 'Hors service',
};

const STATUS_EMOJIS: Record<string, string> = {
  operational: '✅',
  maintenance: '🔧',
  repair: '🛠️',
  broken: '🚫',
  'out-of-service': '🚫',
};

export const useMachineStatusNotifications = () => {
  const { currentWorkspace, user } = useAuth();
  const { sendNotification, permission } = useNotifications();
  const { preferences } = useNotificationPreferences();
  const previousMachinesRef = useRef<Map<string, MachineRecord>>(new Map());
  const isInitialLoadRef = useRef(true);

  const shouldNotify = useCallback((oldStatus: string | undefined, newStatus: string): {
    shouldSend: boolean;
    type: 'repair' | 'ready' | 'critical' | 'stock_in' | 'stock_out' | null;
  } => {
    if (!preferences) return { shouldSend: false, type: null };

    // Machine entered repair
    if (newStatus === 'repair' && oldStatus !== 'repair') {
      return { 
        shouldSend: preferences.notify_machine_in_repair, 
        type: 'repair' 
      };
    }

    // Machine became operational (ready/fixed)
    if (newStatus === 'operational' && oldStatus && oldStatus !== 'operational') {
      return { 
        shouldSend: preferences.notify_machine_ready, 
        type: 'ready' 
      };
    }

    // Machine became critical (broken/out-of-service)
    if ((newStatus === 'broken' || newStatus === 'out-of-service') && 
        oldStatus !== 'broken' && oldStatus !== 'out-of-service') {
      return { 
        shouldSend: preferences.notify_status_critical, 
        type: 'critical' 
      };
    }

    // Entered maintenance (stock out for repair)
    if (newStatus === 'maintenance' && oldStatus === 'operational') {
      return { 
        shouldSend: preferences.notify_stock_out, 
        type: 'stock_out' 
      };
    }

    // Back from maintenance (stock in)
    if (newStatus === 'operational' && oldStatus === 'maintenance') {
      return { 
        shouldSend: preferences.notify_stock_in, 
        type: 'stock_in' 
      };
    }

    return { shouldSend: false, type: null };
  }, [preferences]);

  const handleMachineChange = useCallback((payload: MachineChangePayload) => {
    // Skip during initial load
    if (isInitialLoadRef.current) return;
    
    // Skip if notifications not allowed
    if (permission !== 'granted') return;

    const eventType = payload.eventType;

    if (eventType === 'UPDATE') {
      const newMachine = payload.new as MachineRecord;
      const oldMachine = previousMachinesRef.current.get(newMachine.id);

      if (oldMachine && oldMachine.status !== newMachine.status) {
        const { shouldSend, type } = shouldNotify(oldMachine.status, newMachine.status);

        if (shouldSend && type) {
          const emoji = STATUS_EMOJIS[newMachine.status] || '🔄';
          const newStatusLabel = STATUS_LABELS[newMachine.status] || newMachine.status;
          const oldStatusLabel = STATUS_LABELS[oldMachine.status] || oldMachine.status;

          let title = '';
          let body = '';
          let requireInteraction = false;

          switch (type) {
            case 'repair':
              title = '🛠️ Machine en réparation';
              body = `${newMachine.name} est entrée en réparation`;
              requireInteraction = true;
              break;
            case 'ready':
              title = '✅ Machine prête';
              body = `${newMachine.name} est maintenant opérationnelle`;
              break;
            case 'critical':
              title = '🚨 Statut critique';
              body = `${newMachine.name} est maintenant ${newStatusLabel.toLowerCase()}`;
              requireInteraction = true;
              break;
            case 'stock_out':
              title = '📤 Sortie de stock';
              body = `${newMachine.name} est en maintenance`;
              break;
            case 'stock_in':
              title = '📥 Retour en stock';
              body = `${newMachine.name} est de retour opérationnelle`;
              break;
          }

          if (newMachine.location) {
            body += ` • ${newMachine.location}`;
          }

          sendNotification({
            title,
            body,
            tag: `machine-status-${newMachine.id}`,
            requireInteraction,
          });
        }
      }

      // Update reference
      previousMachinesRef.current.set(newMachine.id, newMachine);
    } else if (eventType === 'INSERT') {
      const newMachine = payload.new as MachineRecord;
      previousMachinesRef.current.set(newMachine.id, newMachine);
    } else if (eventType === 'DELETE') {
      const oldMachine = payload.old as { id: string };
      if (oldMachine?.id) {
        previousMachinesRef.current.delete(oldMachine.id);
      }
    }
  }, [permission, shouldNotify, sendNotification]);

  // Load initial machines state
  useEffect(() => {
    if (!currentWorkspace || !user) return;

    const loadInitialMachines = async () => {
      const { data } = await supabase
        .from('machines')
        .select('id, name, status, workspace_id, category, location')
        .eq('workspace_id', currentWorkspace.id);

      if (data) {
        previousMachinesRef.current.clear();
        data.forEach(machine => {
          previousMachinesRef.current.set(machine.id, machine as MachineRecord);
        });
      }

      // Mark initial load as complete after a short delay
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 1000);
    };

    loadInitialMachines();

    return () => {
      isInitialLoadRef.current = true;
      previousMachinesRef.current.clear();
    };
  }, [currentWorkspace, user]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!currentWorkspace || !user) return;

    const channel = supabase
      .channel(`machines-status-${currentWorkspace.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machines',
          filter: `workspace_id=eq.${currentWorkspace.id}`,
        },
        handleMachineChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspace, user, handleMachineChange]);

  return null;
};
