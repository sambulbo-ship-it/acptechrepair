import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}

export const translations: Translations = {
  // App
  appName: { en: 'ACP Tech Repair', fr: 'ACP Tech Repair' },
  appTagline: { en: 'Equipment Management', fr: "Gestion d'équipements" },

  // Navigation
  equipment: { en: 'Equipment', fr: 'Équipements' },
  machines: { en: 'Equipment', fr: 'Équipements' },
  workspaces: { en: 'Workspaces', fr: 'Espaces' },
  addMachine: { en: 'Add', fr: 'Ajouter' },
  addEquipment: { en: 'Add Equipment', fr: 'Ajouter équipement' },
  bulkAdd: { en: 'Bulk stock', fr: 'Stock en masse' },
  bulkAddFull: { en: 'Bulk stock entry', fr: 'Mise en stock massive' },
  settings: { en: 'Settings', fr: 'Paramètres' },
  team: { en: 'Team', fr: 'Équipe' },
  analytics: { en: 'Analytics', fr: 'Statistiques' },
  aiAssistant: { en: 'AI Assistant', fr: 'Assistant IA' },
  privacy: { en: 'Privacy', fr: 'Confidentialité' },
  privacyPolicy: { en: 'Privacy policy', fr: 'Politique de confidentialité' },

  // Machine List
  searchMachines: { en: 'Search equipment…', fr: 'Rechercher un équipement…' },
  noMachines: { en: 'No equipment yet', fr: 'Aucun équipement' },
  addFirst: { en: 'Add your first equipment to start tracking repairs', fr: 'Ajoutez votre premier équipement pour suivre les réparations' },
  allCategories: { en: 'All', fr: 'Tout' },
  machinesInAlert: { en: 'Machines needing attention', fr: 'Machines en alerte' },
  operationalSection: { en: 'Operational', fr: 'Opérationnels' },
  select: { en: 'Select', fr: 'Sélectionner' },
  selectAll: { en: 'Select all', fr: 'Tout sélectionner' },
  deselectAll: { en: 'Deselect all', fr: 'Tout désélectionner' },
  selected: { en: 'selected', fr: 'sélectionné(s)' },
  duplicate: { en: 'Duplicate', fr: 'Dupliquer' },
  scanHistory: { en: 'Scan history', fr: 'Historique des scans' },
  toWatch: { en: 'Needs attention', fr: 'À surveiller' },

  // Sorting
  sortNameAsc: { en: 'Name A→Z', fr: 'Nom A→Z' },
  sortNameDesc: { en: 'Name Z→A', fr: 'Nom Z→A' },
  sortSerialAsc: { en: 'Serial A→Z', fr: 'N° série A→Z' },
  sortSerialDesc: { en: 'Serial Z→A', fr: 'N° série Z→A' },
  sortBrandAsc: { en: 'Brand A→Z', fr: 'Marque A→Z' },
  sortBrandDesc: { en: 'Brand Z→A', fr: 'Marque Z→A' },
  sortStatus: { en: 'Status (urgent)', fr: 'Statut (urgent)' },
  sortRecent: { en: 'Recent', fr: 'Récent' },

  // Categories
  category: { en: 'Category', fr: 'Catégorie' },
  selectCategory: { en: 'Select category', fr: 'Sélectionner une catégorie' },

  // Machine Form
  machineName: { en: 'Equipment Name', fr: "Nom de l'équipement" },
  customName: { en: 'Your custom name', fr: 'Votre nom personnalisé' },
  machineType: { en: 'Machine Type', fr: 'Type de machine' },
  serialNumber: { en: 'Serial Number', fr: 'Numéro de série' },
  location: { en: 'Location', fr: 'Emplacement' },
  brand: { en: 'Brand', fr: 'Marque' },
  selectBrand: { en: 'Select brand', fr: 'Sélectionner une marque' },
  addBrand: { en: 'Add brand', fr: 'Ajouter une marque' },
  brandName: { en: 'Brand name', fr: 'Nom de la marque' },
  customBrandNote: { en: 'This brand will only be available in your workspace.', fr: 'Cette marque sera disponible uniquement dans votre espace de travail.' },
  model: { en: 'Model', fr: 'Modèle' },
  notes: { en: 'Notes', fr: 'Notes' },
  additionalNotes: { en: 'Additional notes…', fr: 'Notes additionnelles…' },
  save: { en: 'Save', fr: 'Enregistrer' },
  saving: { en: 'Saving…', fr: 'Enregistrement…' },
  cancel: { en: 'Cancel', fr: 'Annuler' },
  add: { en: 'Add', fr: 'Ajouter' },
  adding: { en: 'Adding…', fr: 'Ajout…' },
  custom: { en: 'Custom', fr: 'Perso' },
  requiredFields: { en: 'Please fill in required fields', fr: 'Veuillez remplir les champs obligatoires' },
  equipmentAdded: { en: 'Equipment added', fr: 'Équipement ajouté' },
  addError: { en: 'Error adding equipment', fr: "Erreur lors de l'ajout" },
  duplicateSerial: { en: 'An equipment with this serial number already exists', fr: 'Un équipement avec ce numéro de série existe déjà' },

  // Bulk add
  bulkEquipmentDetails: { en: 'Equipment details', fr: 'Informations équipement' },
  bulkQuantitySerials: { en: 'Quantity & serial numbers', fr: 'Quantité & numéros de série' },
  quantity: { en: 'Quantity', fr: 'Quantité' },
  serialFormat: { en: 'Serial number format', fr: 'Format du numéro de série' },
  prefixOptional: { en: 'Prefix (optional)', fr: 'Préfixe (optionnel)' },
  startNumber: { en: 'Start number', fr: 'Numéro de départ' },
  zeroPadding: { en: 'Zero padding', fr: 'Zéros de remplissage' },
  preview: { en: 'Preview', fr: 'Aperçu' },
  showAll: { en: 'Show all', fr: 'Voir tout' },
  hide: { en: 'Hide', fr: 'Masquer' },
  importing: { en: 'Importing…', fr: 'Import en cours…' },
  importComplete: { en: 'Import complete', fr: 'Import terminé' },
  newBatch: { en: 'New batch', fr: 'Nouveau lot' },
  viewStock: { en: 'View stock', fr: 'Voir le stock' },
  added: { en: 'Added', fr: 'Ajoutés' },
  skippedDuplicates: { en: 'Skipped duplicates', fr: 'Doublons ignorés' },
  errors: { en: 'Errors', fr: 'Erreurs' },

  // Diagnostic / entries
  diagnostic: { en: 'Diagnostic', fr: 'Diagnostic' },
  addDiagnostic: { en: 'Add Diagnostic', fr: 'Ajouter un diagnostic' },
  repair: { en: 'Repair', fr: 'Réparation' },
  replacement: { en: 'Replacement', fr: 'Remplacement' },
  change: { en: 'Change', fr: 'Modification' },
  description: { en: 'Description', fr: 'Description' },
  date: { en: 'Date', fr: 'Date' },
  technician: { en: 'Technician', fr: 'Technicien' },
  status: { en: 'Status', fr: 'Statut' },
  entryAdded: { en: 'Entry added', fr: 'Entrée ajoutée' },
  entryError: { en: 'Error saving entry', fr: "Erreur lors de l'enregistrement" },
  describeIssue: { en: 'Describe the issue or work done…', fr: "Décrivez le problème ou l'intervention…" },
  workDone: { en: 'Work performed…', fr: 'Travaux effectués…' },
  lastService: { en: 'Last service', fr: 'Dernière intervention' },
  today: { en: 'Today', fr: "Aujourd'hui" },
  dayAgo: { en: '1 day ago', fr: 'Il y a 1 jour' },
  daysAgo: { en: 'days ago', fr: 'jours' },

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
  home: { en: 'Home', fr: 'Accueil' },
  addEntry: { en: 'Add Entry', fr: 'Ajouter une entrée' },
  confirm: { en: 'Confirm', fr: 'Confirmer' },
  close: { en: 'Close', fr: 'Fermer' },
  retry: { en: 'Retry', fr: 'Réessayer' },

  // Machine detail
  presentationPhotos: { en: 'Presentation photos', fr: 'Photos de présentation' },
  noPhotos: { en: 'No photos yet.', fr: 'Aucune photo pour le moment.' },
  loadingPhotos: { en: 'Loading photos…', fr: 'Chargement des photos…' },
  photosSaved: { en: 'Photos saved', fr: 'Photos enregistrées' },
  duplicateEquipment: { en: 'Duplicate equipment', fr: "Dupliquer l'équipement" },
  newSerialNumber: { en: 'New serial number', fr: 'Nouveau numéro de série' },
  editStatus: { en: 'Edit status', fr: "Modifier l'état" },
  statusUpdated: { en: 'Status updated', fr: 'Statut mis à jour' },
  deleteEquipment: { en: 'Delete this equipment?', fr: 'Supprimer cet équipement ?' },
  deleteEquipmentDesc: { en: 'This will permanently delete the equipment and its full repair history. This action cannot be undone.', fr: "Cela supprimera définitivement l'équipement et tout son historique de réparations. Cette action est irréversible." },
  equipmentDeleted: { en: 'Equipment deleted', fr: 'Équipement supprimé' },
  adminsOnly: { en: 'Only admins can delete', fr: 'Seuls les admins peuvent supprimer' },
  equipmentNotFound: { en: 'Equipment not found', fr: 'Équipement non trouvé' },
  manual: { en: 'Manual', fr: 'Manuel' },

  // History
  history: { en: 'History', fr: 'Historique' },
  noHistory: { en: 'No history yet', fr: 'Aucun historique' },
  fullHistory: { en: 'Full History', fr: 'Historique complet' },
  viewFullHistory: { en: 'View full history', fr: "Voir l'historique complet" },
  viewMachineDetails: { en: 'View machine details', fr: 'Voir la fiche machine' },
  interventions: { en: 'interventions', fr: 'interventions' },
  noInterventions: { en: 'No interventions recorded', fr: 'Aucune intervention enregistrée' },
  lastIntervention: { en: 'Last intervention', fr: 'Dernière intervention' },
  mostCommonInterventions: { en: 'Most common interventions', fr: 'Interventions les plus courantes' },
  repairSuggestions: { en: 'Repair Suggestions', fr: 'Suggestions de réparations' },
  by: { en: 'By', fr: 'Par' },

  // Team
  teamMembers: { en: 'Team Members', fr: "Membres de l'équipe" },
  addMember: { en: 'Add Member', fr: 'Ajouter un membre' },
  memberName: { en: 'Name', fr: 'Nom' },
  memberRole: { en: 'Role (optional)', fr: 'Rôle (optionnel)' },
  noTeamMembers: { en: 'No team members yet', fr: 'Aucun membre' },
  selectTechnician: { en: 'Select technician', fr: 'Sélectionner un technicien' },
  currentUser: { en: 'Logged in as', fr: 'Connecté en tant que' },
  switchUser: { en: 'Switch', fr: 'Changer' },
  selectYourself: { en: 'Who are you?', fr: 'Qui êtes-vous ?' },
  addTeamFirst: { en: 'Add team members in the Team tab to log entries', fr: "Ajoutez des membres dans l'onglet Équipe pour enregistrer des entrées" },

  // Language
  language: { en: 'Language', fr: 'Langue' },
  english: { en: 'English', fr: 'Anglais' },
  french: { en: 'French', fr: 'Français' },

  // Stats
  totalEquipment: { en: 'Total Equipment', fr: 'Total équipements' },
  inService: { en: 'In Service', fr: 'En service' },
  needsWork: { en: 'Needs Work', fr: 'À réparer' },
  resources: { en: 'Resources', fr: 'Ressources' },
  rentalSale: { en: 'Rental', fr: 'Location' },

  // Auth
  signIn: { en: 'Sign in', fr: 'Se connecter' },
  signUp: { en: 'Sign up', fr: "S'inscrire" },
  signOut: { en: 'Sign out', fr: 'Déconnexion' },
  email: { en: 'Email', fr: 'Email' },
  password: { en: 'Password', fr: 'Mot de passe' },
  confirmPassword: { en: 'Confirm', fr: 'Confirmer' },
  createAccount: { en: 'Create account', fr: 'Créer un compte' },
  loginTitle: { en: 'Sign in', fr: 'Connexion' },
  alreadyAccount: { en: 'Already have an account?', fr: 'Déjà un compte ?' },
  noAccount: { en: 'No account?', fr: 'Pas de compte ?' },
  invalidEmail: { en: 'Invalid email', fr: 'Email invalide' },
  passwordMin: { en: 'Password must be at least 6 characters', fr: 'Mot de passe minimum 6 caractères' },
  passwordMismatch: { en: 'Passwords do not match', fr: 'Les mots de passe ne correspondent pas' },
  emailInUse: { en: 'This email is already in use', fr: 'Cet email est déjà utilisé' },
  invalidCredentials: { en: 'Incorrect email or password', fr: 'Email ou mot de passe incorrect' },
  accountCreated: { en: 'Account created successfully!', fr: 'Compte créé avec succès !' },
  genericError: { en: 'An error occurred', fr: 'Une erreur est survenue' },
  signOutError: { en: 'Error signing out', fr: 'Erreur lors de la déconnexion' },
  authFooter: { en: 'Manage your equipment with ease', fr: 'Gérez vos équipements en toute simplicité' },

  // Loading states
  loading: { en: 'Loading…', fr: 'Chargement…' },
  checkingSession: { en: 'Checking session…', fr: 'Vérification de la session…' },
  loadingWorkspaces: { en: 'Loading workspaces…', fr: 'Chargement des espaces…' },

  // Settings
  account: { en: 'Account', fr: 'Compte' },
  currentWorkspace: { en: 'Current workspace', fr: 'Espace actuel' },
  quickSettings: { en: 'Quick settings', fr: 'Paramètres rapides' },
  notifications: { en: 'Notifications', fr: 'Notifications' },
  customization: { en: 'Branding', fr: 'Personnalisation' },
  workspaceSettings: { en: 'Workspace settings', fr: "Paramètres de l'espace" },
  businessManagement: { en: 'Business management', fr: 'Gestion commerciale' },
  quoteRequests: { en: 'Quote requests', fr: 'Demandes de devis' },
  repairRequests: { en: 'Repair requests', fr: 'Demandes de réparation' },
  version: { en: 'Version', fr: 'Version' },
  legal: { en: 'Legal', fr: 'Mentions légales' },

  // Workspace
  switchWorkspace: { en: 'Switch', fr: 'Changer' },
  selectWorkspace: { en: 'Select a workspace', fr: 'Sélectionnez un espace de travail' },

  // 404
  pageNotFound: { en: 'Page not found', fr: 'Page introuvable' },
  pageNotFoundDesc: { en: "This page doesn't exist or has been moved.", fr: "Cette page n'existe pas ou a été déplacée." },
  backToHome: { en: 'Back to home', fr: "Retour à l'accueil" },

  // Offline
  offline: { en: 'Offline — changes will sync when reconnected', fr: 'Hors ligne — synchronisation à la reconnexion' },

  // Errors
  errorOccurred: { en: 'Something went wrong', fr: 'Une erreur est survenue' },
  errorReload: { en: 'Reload the app', fr: "Recharger l'application" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectInitialLanguage = (): Language => {
  const saved = localStorage.getItem('app_language');
  if (saved === 'en' || saved === 'fr') return saved;
  // Fall back to browser language (Belgian/French users get FR by default)
  const browserLang = navigator.language?.toLowerCase() ?? '';
  return browserLang.startsWith('fr') ? 'fr' : 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(detectInitialLanguage);

  const updateLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      if (import.meta.env.DEV) console.warn(`[i18n] Missing translation key: ${key}`);
      return key;
    }
    return translation[language];
  }, [language]);

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
