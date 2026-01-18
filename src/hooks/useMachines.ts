import { useState, useEffect } from 'react';
import { Machine, DiagnosticEntry, TeamMember } from '@/types/machine';

const MACHINES_KEY = 'machines_data';
const ENTRIES_KEY = 'diagnostic_entries';
const TEAM_KEY = 'team_members';
const CURRENT_USER_KEY = 'current_user';

export const useMachines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [entries, setEntries] = useState<DiagnosticEntry[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUserState] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedMachines = localStorage.getItem(MACHINES_KEY);
    const storedEntries = localStorage.getItem(ENTRIES_KEY);
    const storedTeam = localStorage.getItem(TEAM_KEY);
    const storedCurrentUser = localStorage.getItem(CURRENT_USER_KEY);
    
    if (storedMachines) {
      setMachines(JSON.parse(storedMachines));
    }
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }
    if (storedTeam) {
      setTeam(JSON.parse(storedTeam));
    }
    if (storedCurrentUser) {
      setCurrentUserState(JSON.parse(storedCurrentUser));
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

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(TEAM_KEY, JSON.stringify(team));
    }
  }, [team, loading]);

  useEffect(() => {
    if (!loading && currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser, loading]);

  // Team management
  const addTeamMember = (name: string, role?: string) => {
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name,
      role,
      createdAt: new Date(),
    };
    setTeam(prev => [...prev, newMember]);
    return newMember;
  };

  const removeTeamMember = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  };

  const setCurrentUser = (member: TeamMember | null) => {
    setCurrentUserState(member);
    if (member) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(member));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  // Machine management
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

  // Entry management
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
    currentUser,
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
    setCurrentUser,
    getStats,
  };
};
