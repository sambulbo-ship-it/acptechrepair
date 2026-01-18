import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Machine, DiagnosticEntry, TeamMember, MachineStatus, EntryType } from '@/types/machine';
import { EquipmentCategory } from '@/data/equipmentData';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Database row types
interface DbMachine {
  id: string;
  workspace_id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface DbEntry {
  id: string;
  machine_id: string;
  type: string;
  description: string;
  priority: string;
  technician: string | null;
  photos: string[] | null;
  created_at: string;
  created_by: string | null;
}

interface DbTeamMember {
  id: string;
  workspace_id: string;
  name: string;
  role: string | null;
  created_at: string;
}

export const useCloudData = () => {
  const { currentWorkspace, user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [entries, setEntries] = useState<DiagnosticEntry[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Prevent race conditions with ref
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);

  // Transform DB row to frontend Machine type - with safe defaults
  const dbToMachine = useCallback((row: DbMachine): Machine => ({
    id: row.id || '',
    name: row.name || 'Sans nom',
    category: (row.category as EquipmentCategory) || 'other',
    brand: row.brand || '',
    model: row.model || '',
    serialNumber: row.serial_number || '',
    location: row.location || '',
    status: (row.status as MachineStatus) || 'operational',
    notes: row.notes || '',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  }), []);

  // Transform DB row to frontend DiagnosticEntry type - with safe defaults
  const dbToEntry = useCallback((row: DbEntry): DiagnosticEntry => ({
    id: row.id || '',
    machineId: row.machine_id || '',
    type: (row.type as EntryType) || 'diagnostic',
    description: row.description || '',
    workPerformed: row.description || '',
    technicianId: row.created_by || '',
    technicianName: row.technician || 'Inconnu',
    photos: (row.photos || []).map((url, idx) => ({
      id: `photo-${idx}`,
      dataUrl: url || '',
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    })),
    date: row.created_at ? new Date(row.created_at) : new Date(),
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  }), []);

  // Transform DB row to frontend TeamMember type - with safe defaults
  const dbToTeamMember = useCallback((row: DbTeamMember): TeamMember => ({
    id: row.id || '',
    name: row.name || 'Sans nom',
    role: row.role || undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  }), []);

  // Handle realtime machine changes
  const handleMachineChange = useCallback((payload: RealtimePostgresChangesPayload<DbMachine>) => {
    if (!isMountedRef.current) return;
    
    console.log('Realtime machine change:', payload.eventType);
    
    if (payload.eventType === 'INSERT' && payload.new) {
      const newMachine = dbToMachine(payload.new as DbMachine);
      setMachines(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMachine.id)) return prev;
        return [newMachine, ...prev];
      });
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const updatedMachine = dbToMachine(payload.new as DbMachine);
      setMachines(prev => 
        prev.map(m => m.id === updatedMachine.id ? updatedMachine : m)
      );
    } else if (payload.eventType === 'DELETE' && payload.old) {
      const deletedId = (payload.old as DbMachine).id;
      setMachines(prev => prev.filter(m => m.id !== deletedId));
      setEntries(prev => prev.filter(e => e.machineId !== deletedId));
    }
  }, [dbToMachine]);

  // Handle realtime entry changes
  const handleEntryChange = useCallback((payload: RealtimePostgresChangesPayload<DbEntry>) => {
    if (!isMountedRef.current) return;
    
    console.log('Realtime entry change:', payload.eventType);
    
    if (payload.eventType === 'INSERT' && payload.new) {
      const newEntry = dbToEntry(payload.new as DbEntry);
      setEntries(prev => {
        if (prev.some(e => e.id === newEntry.id)) return prev;
        return [newEntry, ...prev];
      });
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const updatedEntry = dbToEntry(payload.new as DbEntry);
      setEntries(prev => 
        prev.map(e => e.id === updatedEntry.id ? updatedEntry : e)
      );
    } else if (payload.eventType === 'DELETE' && payload.old) {
      const deletedId = (payload.old as DbEntry).id;
      setEntries(prev => prev.filter(e => e.id !== deletedId));
    }
  }, [dbToEntry]);

  // Handle realtime team member changes
  const handleTeamChange = useCallback((payload: RealtimePostgresChangesPayload<DbTeamMember>) => {
    if (!isMountedRef.current) return;
    
    console.log('Realtime team change:', payload.eventType);
    
    if (payload.eventType === 'INSERT' && payload.new) {
      const newMember = dbToTeamMember(payload.new as DbTeamMember);
      setTeam(prev => {
        if (prev.some(m => m.id === newMember.id)) return prev;
        return [newMember, ...prev];
      });
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const updatedMember = dbToTeamMember(payload.new as DbTeamMember);
      setTeam(prev => 
        prev.map(m => m.id === updatedMember.id ? updatedMember : m)
      );
    } else if (payload.eventType === 'DELETE' && payload.old) {
      const deletedId = (payload.old as DbTeamMember).id;
      setTeam(prev => prev.filter(m => m.id !== deletedId));
    }
  }, [dbToTeamMember]);

  // Fetch all data for current workspace with error handling
  const fetchData = useCallback(async () => {
    if (!currentWorkspace || fetchingRef.current) {
      if (!currentWorkspace) {
        setMachines([]);
        setEntries([]);
        setTeam([]);
        setLoading(false);
      }
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Fetch machines with timeout
      const machinesPromise = supabase
        .from('machines')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      const { data: machinesData, error: machinesError } = await machinesPromise;

      if (!isMountedRef.current) return;

      if (machinesError) {
        console.error('Error fetching machines:', machinesError);
        throw new Error('Erreur lors du chargement des équipements');
      }

      const fetchedMachines = (machinesData || []).map(dbToMachine);
      setMachines(fetchedMachines);

      // Fetch entries for all machines
      if (machinesData && machinesData.length > 0) {
        const machineIds = machinesData.map(m => m.id);
        const { data: entriesData, error: entriesError } = await supabase
          .from('diagnostic_entries')
          .select('*')
          .in('machine_id', machineIds)
          .order('created_at', { ascending: false });

        if (!isMountedRef.current) return;

        if (entriesError) {
          console.error('Error fetching entries:', entriesError);
          // Don't throw - entries are secondary data
        } else {
          setEntries((entriesData || []).map(dbToEntry));
        }
      } else {
        setEntries([]);
      }

      // Fetch team members
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return;

      if (teamError) {
        console.error('Error fetching team:', teamError);
        // Don't throw - team is secondary data
      } else {
        setTeam((teamData || []).map(dbToTeamMember));
      }

    } catch (err) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      console.error('fetchData error:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        fetchingRef.current = false;
      }
    }
  }, [currentWorkspace, dbToMachine, dbToEntry, dbToTeamMember]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch data when workspace changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!currentWorkspace) return;

    console.log('Setting up realtime subscriptions for workspace:', currentWorkspace.id);

    const channel = supabase
      .channel(`workspace-${currentWorkspace.id}`)
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'diagnostic_entries',
        },
        (payload) => {
          // For entries, we need to check if the machine belongs to our workspace
          // We'll let the RLS handle this and just process all events
          handleEntryChange(payload as RealtimePostgresChangesPayload<DbEntry>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `workspace_id=eq.${currentWorkspace.id}`,
        },
        handleTeamChange
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
    };
  }, [currentWorkspace, handleMachineChange, handleEntryChange, handleTeamChange]);

  // Machine operations with optimistic updates and error handling
  const addMachine = async (machine: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Machine | null> => {
    if (!currentWorkspace || !user) {
      console.error('addMachine: no workspace or user');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('machines')
        .insert({
          workspace_id: currentWorkspace.id,
          name: machine.name || 'Sans nom',
          category: machine.category || 'other',
          brand: machine.brand || null,
          model: machine.model || null,
          serial_number: machine.serialNumber || null,
          location: machine.location || null,
          status: machine.status || 'operational',
          notes: machine.notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding machine:', error);
        return null;
      }

      if (!data) return null;

      const newMachine = dbToMachine(data);
      setMachines(prev => [newMachine, ...prev]);
      return newMachine;
    } catch (err) {
      console.error('addMachine error:', err);
      return null;
    }
  };

  const updateMachine = async (id: string, updates: Partial<Machine>): Promise<boolean> => {
    if (!id) return false;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand || null;
      if (updates.model !== undefined) dbUpdates.model = updates.model || null;
      if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber || null;
      if (updates.location !== undefined) dbUpdates.location = updates.location || null;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;

      const { error } = await supabase
        .from('machines')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating machine:', error);
        return false;
      }

      setMachines(prev =>
        prev.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m)
      );
      return true;
    } catch (err) {
      console.error('updateMachine error:', err);
      return false;
    }
  };

  const deleteMachine = async (id: string): Promise<boolean> => {
    if (!id) return false;

    try {
      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting machine:', error);
        return false;
      }

      setMachines(prev => prev.filter(m => m.id !== id));
      setEntries(prev => prev.filter(e => e.machineId !== id));
      return true;
    } catch (err) {
      console.error('deleteMachine error:', err);
      return false;
    }
  };

  const getMachine = useCallback((id: string) => {
    if (!id) return undefined;
    return machines.find(m => m.id === id);
  }, [machines]);

  // Entry operations
  const addEntry = async (entry: Omit<DiagnosticEntry, 'id' | 'createdAt'>): Promise<DiagnosticEntry | null> => {
    if (!user || !entry.machineId) {
      console.error('addEntry: missing user or machineId');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('diagnostic_entries')
        .insert({
          machine_id: entry.machineId,
          type: entry.type || 'diagnostic',
          description: entry.description || '',
          priority: 'medium',
          technician: entry.technicianName || null,
          photos: entry.photos?.map(p => p.dataUrl).filter(Boolean) || [],
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding entry:', error);
        return null;
      }

      if (!data) return null;

      const newEntry = dbToEntry(data);
      setEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (err) {
      console.error('addEntry error:', err);
      return null;
    }
  };

  const getEntriesForMachine = useCallback((machineId: string) => {
    if (!machineId) return [];
    return entries
      .filter(e => e.machineId === machineId)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
        const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
        return dateB - dateA;
      });
  }, [entries]);

  const deleteEntry = async (id: string): Promise<boolean> => {
    if (!id) return false;

    try {
      const { error } = await supabase
        .from('diagnostic_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting entry:', error);
        return false;
      }

      setEntries(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (err) {
      console.error('deleteEntry error:', err);
      return false;
    }
  };

  // Team operations
  const addTeamMember = async (name: string, role?: string): Promise<TeamMember | null> => {
    if (!currentWorkspace || !name?.trim()) {
      console.error('addTeamMember: missing workspace or name');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          workspace_id: currentWorkspace.id,
          name: name.trim(),
          role: role?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding team member:', error);
        return null;
      }

      if (!data) return null;

      const newMember = dbToTeamMember(data);
      setTeam(prev => [newMember, ...prev]);
      return newMember;
    } catch (err) {
      console.error('addTeamMember error:', err);
      return null;
    }
  };

  const removeTeamMember = async (id: string): Promise<boolean> => {
    if (!id) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing team member:', error);
        return false;
      }

      setTeam(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (err) {
      console.error('removeTeamMember error:', err);
      return false;
    }
  };

  // Statistics with safe calculations
  const getStats = useCallback(() => {
    const operational = machines.filter(m => m.status === 'operational').length;
    const needsAttention = machines.filter(m => m.status === 'needs-attention').length;
    const outOfService = machines.filter(m => m.status === 'out-of-service').length;

    return {
      total: machines.length,
      operational,
      needsAttention,
      outOfService,
      totalEntries: entries.length,
    };
  }, [machines, entries]);

  return {
    machines,
    entries,
    team,
    loading,
    error,
    addMachine,
    updateMachine,
    deleteMachine,
    getMachine,
    addEntry,
    getEntriesForMachine,
    deleteEntry,
    addTeamMember,
    removeTeamMember,
    getStats,
    refreshData: fetchData,
  };
};
