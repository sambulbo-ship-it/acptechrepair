import { useState, useEffect } from 'react';
import { Machine, DiagnosticEntry } from '@/types/machine';

const MACHINES_KEY = 'machines_data';
const ENTRIES_KEY = 'diagnostic_entries';

export const useMachines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [entries, setEntries] = useState<DiagnosticEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedMachines = localStorage.getItem(MACHINES_KEY);
    const storedEntries = localStorage.getItem(ENTRIES_KEY);
    
    if (storedMachines) {
      setMachines(JSON.parse(storedMachines));
    }
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(MACHINES_KEY, JSON.stringify(machines));
    }
  }, [machines, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    }
  }, [entries, loading]);

  const addMachine = (machine: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMachine: Machine = {
      ...machine,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setMachines(prev => [...prev, newMachine]);
    return newMachine;
  };

  const updateMachine = (id: string, updates: Partial<Machine>) => {
    setMachines(prev =>
      prev.map(m =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
      )
    );
  };

  const deleteMachine = (id: string) => {
    setMachines(prev => prev.filter(m => m.id !== id));
    setEntries(prev => prev.filter(e => e.machineId !== id));
  };

  const getMachine = (id: string) => machines.find(m => m.id === id);

  const addEntry = (entry: Omit<DiagnosticEntry, 'id' | 'createdAt'>) => {
    const newEntry: DiagnosticEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setEntries(prev => [...prev, newEntry]);
    return newEntry;
  };

  const getEntriesForMachine = (machineId: string) =>
    entries.filter(e => e.machineId === machineId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return {
    machines,
    entries,
    loading,
    addMachine,
    updateMachine,
    deleteMachine,
    getMachine,
    addEntry,
    getEntriesForMachine,
    deleteEntry,
  };
};
