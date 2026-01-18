import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Machine, DiagnosticEntry, TeamMember, MachineStatus, EntryType } from '@/types/machine';
import { EquipmentCategory } from '@/data/equipmentData';

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

  // Transform DB row to frontend Machine type
  const dbToMachine = (row: DbMachine): Machine => ({
    id: row.id,
    name: row.name,
    category: row.category as EquipmentCategory,
    brand: row.brand || '',
    model: row.model || '',
    serialNumber: row.serial_number || '',
    location: row.location || '',
    status: row.status as MachineStatus,
    notes: row.notes || '',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });

  // Transform DB row to frontend DiagnosticEntry type
  const dbToEntry = (row: DbEntry): DiagnosticEntry => ({
    id: row.id,
    machineId: row.machine_id,
    type: row.type as EntryType,
    description: row.description,
    workPerformed: row.description, // Use description as work performed
    technicianId: row.created_by || '',
    technicianName: row.technician || '',
    photos: (row.photos || []).map((url, idx) => ({
      id: `photo-${idx}`,
      dataUrl: url,
      createdAt: new Date(row.created_at),
    })),
    date: new Date(row.created_at),
    createdAt: new Date(row.created_at),
  });

  // Transform DB row to frontend TeamMember type
  const dbToTeamMember = (row: DbTeamMember): TeamMember => ({
    id: row.id,
    name: row.name,
    role: row.role || undefined,
    createdAt: new Date(row.created_at),
  });

  // Fetch all data for current workspace
  const fetchData = useCallback(async () => {
    if (!currentWorkspace) {
      setMachines([]);
      setEntries([]);
      setTeam([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch machines
      const { data: machinesData, error: machinesError } = await supabase
        .from('machines')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (machinesError) throw machinesError;

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

        if (entriesError) throw entriesError;
        setEntries((entriesData || []).map(dbToEntry));
      } else {
        setEntries([]);
      }

      // Fetch team members
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (teamError) throw teamError;
      setTeam((teamData || []).map(dbToTeamMember));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Machine operations
  const addMachine = async (machine: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Machine | null> => {
    if (!currentWorkspace || !user) return null;

    const { data, error } = await supabase
      .from('machines')
      .insert({
        workspace_id: currentWorkspace.id,
        name: machine.name,
        category: machine.category,
        brand: machine.brand || null,
        model: machine.model || null,
        serial_number: machine.serialNumber || null,
        location: machine.location || null,
        status: machine.status,
        notes: machine.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding machine:', error);
      return null;
    }

    const newMachine = dbToMachine(data);
    setMachines(prev => [newMachine, ...prev]);
    return newMachine;
  };

  const updateMachine = async (id: string, updates: Partial<Machine>): Promise<boolean> => {
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
  };

  const deleteMachine = async (id: string): Promise<boolean> => {
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
  };

  const getMachine = (id: string) => machines.find(m => m.id === id);

  // Entry operations
  const addEntry = async (entry: Omit<DiagnosticEntry, 'id' | 'createdAt'>): Promise<DiagnosticEntry | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('diagnostic_entries')
      .insert({
        machine_id: entry.machineId,
        type: entry.type,
        description: entry.description,
        priority: 'medium',
        technician: entry.technicianName || null,
        photos: entry.photos?.map(p => p.dataUrl) || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding entry:', error);
      return null;
    }

    const newEntry = dbToEntry(data);
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const getEntriesForMachine = (machineId: string) =>
    entries
      .filter(e => e.machineId === machineId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const deleteEntry = async (id: string): Promise<boolean> => {
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
  };

  // Team operations
  const addTeamMember = async (name: string, role?: string): Promise<TeamMember | null> => {
    if (!currentWorkspace) return null;

    const { data, error } = await supabase
      .from('team_members')
      .insert({
        workspace_id: currentWorkspace.id,
        name,
        role: role || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding team member:', error);
      return null;
    }

    const newMember = dbToTeamMember(data);
    setTeam(prev => [newMember, ...prev]);
    return newMember;
  };

  const removeTeamMember = async (id: string): Promise<boolean> => {
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
  };

  // Statistics
  const getStats = () => {
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
  };

  return {
    machines,
    entries,
    team,
    loading,
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
