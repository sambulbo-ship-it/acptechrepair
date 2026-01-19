import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RepairLocation {
  id: string;
  workspace_id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  specialties: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalRepair {
  id: string;
  workspace_id: string;
  machine_id: string;
  repair_location_id: string | null;
  status: 'sent' | 'in_progress' | 'completed' | 'returned';
  sent_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  issue_description: string;
  repair_description: string | null;
  cost: number | null;
  currency: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  machine_name?: string;
  location_name?: string;
}

export interface SparePart {
  id: string;
  workspace_id: string;
  name: string;
  part_number: string | null;
  category: string | null;
  compatible_models: string[] | null;
  quantity: number;
  min_quantity: number | null;
  unit_price: number | null;
  currency: string | null;
  supplier: string | null;
  supplier_part_number: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useRepairResources = () => {
  const { currentWorkspace, user } = useAuth();
  const [repairLocations, setRepairLocations] = useState<RepairLocation[]>([]);
  const [externalRepairs, setExternalRepairs] = useState<ExternalRepair[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) {
      setRepairLocations([]);
      setExternalRepairs([]);
      setSpareParts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch repair locations
      const { data: locationsData } = await supabase
        .from('repair_locations')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('name');

      setRepairLocations((locationsData || []) as RepairLocation[]);

      // Fetch external repairs with machine names
      const { data: repairsData } = await supabase
        .from('external_repairs')
        .select(`
          *,
          machines:machine_id(name),
          repair_locations:repair_location_id(name)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('sent_date', { ascending: false });

      const mappedRepairs = (repairsData || []).map((r: any) => ({
        ...r,
        machine_name: r.machines?.name,
        location_name: r.repair_locations?.name,
      }));
      setExternalRepairs(mappedRepairs);

      // Fetch spare parts
      const { data: partsData } = await supabase
        .from('spare_parts')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('name');

      setSpareParts((partsData || []) as SparePart[]);
    } catch (error) {
      console.error('Error fetching repair resources:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Repair Locations CRUD
  const addRepairLocation = async (location: Omit<RepairLocation, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
    if (!currentWorkspace || !user) return null;

    const { data, error } = await supabase
      .from('repair_locations')
      .insert({
        ...location,
        workspace_id: currentWorkspace.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding repair location:', error);
      return null;
    }

    setRepairLocations(prev => [...prev, data as RepairLocation]);
    return data as RepairLocation;
  };

  const updateRepairLocation = async (id: string, updates: Partial<RepairLocation>) => {
    const { error } = await supabase
      .from('repair_locations')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating repair location:', error);
      return false;
    }

    setRepairLocations(prev =>
      prev.map(l => l.id === id ? { ...l, ...updates } : l)
    );
    return true;
  };

  const deleteRepairLocation = async (id: string) => {
    const { error } = await supabase
      .from('repair_locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting repair location:', error);
      return false;
    }

    setRepairLocations(prev => prev.filter(l => l.id !== id));
    return true;
  };

  // External Repairs CRUD
  const addExternalRepair = async (repair: Omit<ExternalRepair, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'machine_name' | 'location_name'>) => {
    if (!currentWorkspace || !user) return null;

    const { data, error } = await supabase
      .from('external_repairs')
      .insert({
        ...repair,
        workspace_id: currentWorkspace.id,
        created_by: user.id,
      })
      .select(`
        *,
        machines:machine_id(name),
        repair_locations:repair_location_id(name)
      `)
      .single();

    if (error) {
      console.error('Error adding external repair:', error);
      return null;
    }

    const mapped = {
      ...data,
      machine_name: (data as any).machines?.name,
      location_name: (data as any).repair_locations?.name,
    };
    setExternalRepairs(prev => [mapped as ExternalRepair, ...prev]);
    return mapped as ExternalRepair;
  };

  const updateExternalRepair = async (id: string, updates: Partial<ExternalRepair>) => {
    const { error } = await supabase
      .from('external_repairs')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating external repair:', error);
      return false;
    }

    setExternalRepairs(prev =>
      prev.map(r => r.id === id ? { ...r, ...updates } : r)
    );
    return true;
  };

  const deleteExternalRepair = async (id: string) => {
    const { error } = await supabase
      .from('external_repairs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting external repair:', error);
      return false;
    }

    setExternalRepairs(prev => prev.filter(r => r.id !== id));
    return true;
  };

  // Spare Parts CRUD
  const addSparePart = async (part: Omit<SparePart, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
    if (!currentWorkspace || !user) return null;

    const { data, error } = await supabase
      .from('spare_parts')
      .insert({
        ...part,
        workspace_id: currentWorkspace.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding spare part:', error);
      return null;
    }

    setSpareParts(prev => [...prev, data as SparePart]);
    return data as SparePart;
  };

  const updateSparePart = async (id: string, updates: Partial<SparePart>) => {
    const { error } = await supabase
      .from('spare_parts')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating spare part:', error);
      return false;
    }

    setSpareParts(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
    return true;
  };

  const deleteSparePart = async (id: string) => {
    const { error } = await supabase
      .from('spare_parts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting spare part:', error);
      return false;
    }

    setSpareParts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  return {
    repairLocations,
    externalRepairs,
    spareParts,
    loading,
    refetch: fetchData,
    // Locations
    addRepairLocation,
    updateRepairLocation,
    deleteRepairLocation,
    // External Repairs
    addExternalRepair,
    updateExternalRepair,
    deleteExternalRepair,
    // Spare Parts
    addSparePart,
    updateSparePart,
    deleteSparePart,
  };
};
