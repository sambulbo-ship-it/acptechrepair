export type MachineStatus = 'operational' | 'needs-attention' | 'out-of-service';

export type EntryType = 'diagnostic' | 'repair' | 'replacement' | 'change';

export interface Machine {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  location: string;
  manufacturer: string;
  model: string;
  status: MachineStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosticEntry {
  id: string;
  machineId: string;
  type: EntryType;
  description: string;
  partsReplaced?: string;
  workPerformed: string;
  technician: string;
  date: Date;
  createdAt: Date;
}
