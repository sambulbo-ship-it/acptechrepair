import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}

export const translations: Translations = {
  // App
  appName: { en: 'Tech Repair', fr: 'Tech Repair' },
  
  // Navigation
  equipment: { en: 'Equipment', fr: 'Équipements' },
  machines: { en: 'Equipment', fr: 'Équipements' },
  addMachine: { en: 'Add', fr: 'Ajouter' },
  addEquipment: { en: 'Add Equipment', fr: 'Ajouter équipement' },
  settings: { en: 'Settings', fr: 'Paramètres' },
  team: { en: 'Team', fr: 'Équipe' },
  
  // Machine List
  searchMachines: { en: 'Search equipment...', fr: 'Rechercher équipement...' },
  noMachines: { en: 'No equipment yet', fr: 'Aucun équipement' },
  addFirst: { en: 'Add your first equipment to start tracking repairs', fr: 'Ajoutez votre premier équipement pour suivre les réparations' },
  allCategories: { en: 'All', fr: 'Tout' },
  
  // Categories
  category: { en: 'Category', fr: 'Catégorie' },
  selectCategory: { en: 'Select category', fr: 'Sélectionner catégorie' },
  
  // Machine Form
  machineName: { en: 'Equipment Name', fr: "Nom de l'équipement" },
  customName: { en: 'Your custom name', fr: 'Votre nom personnalisé' },
  machineType: { en: 'Machine Type', fr: 'Type de machine' },
  serialNumber: { en: 'Serial Number', fr: 'Numéro de série' },
  location: { en: 'Location', fr: 'Emplacement' },
  brand: { en: 'Brand', fr: 'Marque' },
  selectBrand: { en: 'Select brand', fr: 'Sélectionner marque' },
  model: { en: 'Model', fr: 'Modèle' },
  notes: { en: 'Notes', fr: 'Notes' },
  save: { en: 'Save', fr: 'Enregistrer' },
  cancel: { en: 'Cancel', fr: 'Annuler' },
  
  // Diagnostic
  diagnostic: { en: 'Diagnostic', fr: 'Diagnostic' },
  addDiagnostic: { en: 'Add Diagnostic', fr: 'Ajouter Diagnostic' },
  repair: { en: 'Repair', fr: 'Réparation' },
  replacement: { en: 'Replacement', fr: 'Remplacement' },
  change: { en: 'Change', fr: 'Modification' },
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
  
  // Team
  teamMembers: { en: 'Team Members', fr: "Membres de l'équipe" },
  addMember: { en: 'Add Member', fr: 'Ajouter membre' },
  memberName: { en: 'Name', fr: 'Nom' },
  memberRole: { en: 'Role (optional)', fr: 'Rôle (optionnel)' },
  noTeamMembers: { en: 'No team members yet', fr: 'Aucun membre' },
  selectTechnician: { en: 'Select technician', fr: 'Sélectionner technicien' },
  currentUser: { en: 'Logged in as', fr: 'Connecté en tant que' },
  switchUser: { en: 'Switch', fr: 'Changer' },
  selectYourself: { en: 'Who are you?', fr: 'Qui êtes-vous?' },
  
  // Language
  language: { en: 'Language', fr: 'Langue' },
  english: { en: 'English', fr: 'Anglais' },
  french: { en: 'French', fr: 'Français' },
  
  // Stats
  totalEquipment: { en: 'Total Equipment', fr: 'Total équipements' },
  inService: { en: 'In Service', fr: 'En service' },
  needsWork: { en: 'Needs Work', fr: 'À réparer' },
  resources: { en: 'Resources', fr: 'Ressources' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'en';
  });

  const updateLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, t }}>
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
