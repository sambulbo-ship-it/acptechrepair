import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Machine, DiagnosticEntry, TeamMember } from '@/types/machine';

interface PendingOperation {
  id: string;
  tableName: 'machines' | 'diagnostic_entries' | 'team_members';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId?: string;
  data: Record<string, unknown>;
  createdAt: Date;
  workspaceId: string;
}

interface OfflineDBSchema extends DBSchema {
  machines: {
    key: string;
    value: Machine & { workspaceId: string };
    indexes: { 'by-workspace': string };
  };
  entries: {
    key: string;
    value: DiagnosticEntry & { workspaceId: string };
    indexes: { 'by-workspace': string; 'by-machine': string };
  };
  teamMembers: {
    key: string;
    value: TeamMember & { workspaceId: string };
    indexes: { 'by-workspace': string };
  };
  pendingOperations: {
    key: string;
    value: PendingOperation;
    indexes: { 'by-workspace': string };
  };
  syncMeta: {
    key: string;
    value: { lastSync: Date; workspaceId: string };
  };
}

const DB_NAME = 'acp-tech-repair-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

export const getDB = async (): Promise<IDBPDatabase<OfflineDBSchema>> => {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Machines store
        if (!db.objectStoreNames.contains('machines')) {
          const machinesStore = db.createObjectStore('machines', { keyPath: 'id' });
          machinesStore.createIndex('by-workspace', 'workspaceId');
        }

        // Entries store
        if (!db.objectStoreNames.contains('entries')) {
          const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });
          entriesStore.createIndex('by-workspace', 'workspaceId');
          entriesStore.createIndex('by-machine', 'machineId');
        }

        // Team members store
        if (!db.objectStoreNames.contains('teamMembers')) {
          const teamStore = db.createObjectStore('teamMembers', { keyPath: 'id' });
          teamStore.createIndex('by-workspace', 'workspaceId');
        }

        // Pending operations store
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const pendingStore = db.createObjectStore('pendingOperations', { keyPath: 'id' });
          pendingStore.createIndex('by-workspace', 'workspaceId');
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('syncMeta')) {
          db.createObjectStore('syncMeta', { keyPath: 'workspaceId' });
        }
      },
    });
  }
  return dbPromise;
};

// Machine operations
export const saveMachinesOffline = async (machines: Machine[], workspaceId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('machines', 'readwrite');
  
  // Clear old machines for this workspace
  const existingMachines = await tx.store.index('by-workspace').getAllKeys(workspaceId);
  for (const key of existingMachines) {
    await tx.store.delete(key);
  }
  
  // Add new machines
  for (const machine of machines) {
    await tx.store.put({ ...machine, workspaceId });
  }
  
  await tx.done;
};

export const getMachinesOffline = async (workspaceId: string): Promise<Machine[]> => {
  const db = await getDB();
  const machines = await db.getAllFromIndex('machines', 'by-workspace', workspaceId);
  return machines.map(({ workspaceId: _, ...machine }) => machine as Machine);
};

// Entry operations
export const saveEntriesOffline = async (entries: DiagnosticEntry[], workspaceId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('entries', 'readwrite');
  
  // Clear old entries for this workspace
  const existingEntries = await tx.store.index('by-workspace').getAllKeys(workspaceId);
  for (const key of existingEntries) {
    await tx.store.delete(key);
  }
  
  // Add new entries
  for (const entry of entries) {
    await tx.store.put({ ...entry, workspaceId });
  }
  
  await tx.done;
};

export const getEntriesOffline = async (workspaceId: string): Promise<DiagnosticEntry[]> => {
  const db = await getDB();
  const entries = await db.getAllFromIndex('entries', 'by-workspace', workspaceId);
  return entries.map(({ workspaceId: _, ...entry }) => entry as DiagnosticEntry);
};

// Team operations
export const saveTeamOffline = async (team: TeamMember[], workspaceId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('teamMembers', 'readwrite');
  
  // Clear old team members for this workspace
  const existingMembers = await tx.store.index('by-workspace').getAllKeys(workspaceId);
  for (const key of existingMembers) {
    await tx.store.delete(key);
  }
  
  // Add new team members
  for (const member of team) {
    await tx.store.put({ ...member, workspaceId });
  }
  
  await tx.done;
};

export const getTeamOffline = async (workspaceId: string): Promise<TeamMember[]> => {
  const db = await getDB();
  const members = await db.getAllFromIndex('teamMembers', 'by-workspace', workspaceId);
  return members.map(({ workspaceId: _, ...member }) => member as TeamMember);
};

// Pending operations
export const addPendingOperation = async (
  operation: Omit<PendingOperation, 'id' | 'createdAt'>
): Promise<void> => {
  const db = await getDB();
  await db.put('pendingOperations', {
    ...operation,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  });
};

export const getPendingOperations = async (workspaceId: string): Promise<PendingOperation[]> => {
  const db = await getDB();
  return db.getAllFromIndex('pendingOperations', 'by-workspace', workspaceId);
};

export const removePendingOperation = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('pendingOperations', id);
};

export const clearPendingOperations = async (workspaceId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('pendingOperations', 'readwrite');
  const keys = await tx.store.index('by-workspace').getAllKeys(workspaceId);
  for (const key of keys) {
    await tx.store.delete(key);
  }
  await tx.done;
};

// Sync metadata
export const updateLastSync = async (workspaceId: string): Promise<void> => {
  const db = await getDB();
  await db.put('syncMeta', { workspaceId, lastSync: new Date() });
};

export const getLastSync = async (workspaceId: string): Promise<Date | null> => {
  const db = await getDB();
  const meta = await db.get('syncMeta', workspaceId);
  return meta?.lastSync || null;
};

// Clear all offline data for a workspace
export const clearOfflineData = async (workspaceId: string): Promise<void> => {
  const db = await getDB();
  
  const stores = ['machines', 'entries', 'teamMembers', 'pendingOperations'] as const;
  
  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readwrite');
    const keys = await tx.store.index('by-workspace').getAllKeys(workspaceId);
    for (const key of keys) {
      await tx.store.delete(key);
    }
    await tx.done;
  }
  
  await db.delete('syncMeta', workspaceId);
};

// Check if there are pending changes
export const hasPendingChanges = async (workspaceId: string): Promise<boolean> => {
  const pending = await getPendingOperations(workspaceId);
  return pending.length > 0;
};
