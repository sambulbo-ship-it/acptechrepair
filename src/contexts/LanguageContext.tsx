import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}

export const translations: Translations = {
  // Navigation
  machines: { en: 'Machines', fr: 'Machines' },
  addMachine: { en: 'Add Machine', fr: 'Ajouter Machine' },
  settings: { en: 'Settings', fr: 'Paramètres' },
  
  // Machine List
  searchMachines: { en: 'Search machines...', fr: 'Rechercher machines...' },
  noMachines: { en: 'No machines yet', fr: 'Aucune machine' },
  addFirst: { en: 'Add your first machine to start tracking', fr: 'Ajoutez votre première machine' },
  
  // Machine Form
  machineName: { en: 'Machine Name', fr: 'Nom de la machine' },
  machineType: { en: 'Machine Type', fr: 'Type de machine' },
  serialNumber: { en: 'Serial Number', fr: 'Numéro de série' },
  location: { en: 'Location', fr: 'Emplacement' },
  manufacturer: { en: 'Manufacturer', fr: 'Fabricant' },
  model: { en: 'Model', fr: 'Modèle' },
  notes: { en: 'Notes', fr: 'Notes' },
  save: { en: 'Save', fr: 'Enregistrer' },
  cancel: { en: 'Cancel', fr: 'Annuler' },
  
  // Diagnostic
  diagnostic: { en: 'Diagnostic', fr: 'Diagnostic' },
  addDiagnostic: { en: 'Add Diagnostic', fr: 'Ajouter Diagnostic' },
  repair: { en: 'Repair', fr: 'Réparation' },
  replacement: { en: 'Replacement', fr: 'Remplacement' },
  change: { en: 'Change', fr: 'Changement' },
  description: { en: 'Description', fr: 'Description' },
  date: { en: 'Date', fr: 'Date' },
  technician: { en: 'Technician', fr: 'Technicien' },
  status: { en: 'Status', fr: 'Statut' },
  
  // Status
  operational: { en: 'Operational', fr: 'Opérationnel' },
  needsAttention: { en: 'Needs Attention', fr: 'Attention requise' },
  outOfService: { en: 'Out of Service', fr: 'Hors service' },
  
  // Entry Types
  entryType: { en: 'Entry Type', fr: "Type d'entrée" },
  partsReplaced: { en: 'Parts Replaced', fr: 'Pièces remplacées' },
  workPerformed: { en: 'Work Performed', fr: 'Travaux effectués' },
  
  // Actions
  delete: { en: 'Delete', fr: 'Supprimer' },
  edit: { en: 'Edit', fr: 'Modifier' },
  view: { en: 'View', fr: 'Voir' },
  back: { en: 'Back', fr: 'Retour' },
  addEntry: { en: 'Add Entry', fr: 'Ajouter entrée' },
  
  // History
  history: { en: 'History', fr: 'Historique' },
  noHistory: { en: 'No history yet', fr: 'Aucun historique' },
  
  // Language
  language: { en: 'Language', fr: 'Langue' },
  english: { en: 'English', fr: 'Anglais' },
  french: { en: 'French', fr: 'Français' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
