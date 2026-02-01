import { EquipmentCategory } from '@/data/equipmentData';

export type MachineStatus = 'operational' | 'needs-attention' | 'out-of-service';

export type EntryType = 'diagnostic' | 'repair' | 'replacement' | 'change';

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  createdAt: Date;
}

export interface EntryPhoto {
  id: string;
  dataUrl: string;
  caption?: string;
  createdAt: Date;
}

export interface Machine {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serialNumber: string;
  location: string;
  status: MachineStatus;
  notes: string;
  photos?: string[];
  assignedTo?: string;
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
  technicianId: string;
  technicianName: string;
  photos: EntryPhoto[];
  date: Date;
  createdAt: Date;
}
