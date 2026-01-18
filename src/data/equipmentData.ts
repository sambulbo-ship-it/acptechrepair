export type EquipmentCategory = 
  | 'mixing-console'
  | 'amplifier'
  | 'lighting'
  | 'computer'
  | 'speaker'
  | 'microphone'
  | 'video'
  | 'controller'
  | 'other';

export interface CategoryInfo {
  id: EquipmentCategory;
  labelEn: string;
  labelFr: string;
  icon: string;
  brands: string[];
}

export const equipmentCategories: CategoryInfo[] = [
  {
    id: 'mixing-console',
    labelEn: 'Mixing Console',
    labelFr: 'Console de mixage',
    icon: 'SlidersHorizontal',
    brands: [
      'Yamaha',
      'Soundcraft',
      'Midas',
      'Allen & Heath',
      'DiGiCo',
      'SSL',
      'Behringer',
      'Mackie',
      'PreSonus',
      'Avid',
      'Other',
    ],
  },
  {
    id: 'amplifier',
    labelEn: 'Amplifier',
    labelFr: 'Amplificateur',
    icon: 'Volume2',
    brands: [
      'Nexo',
      "L'Acoustics",
      'Crown',
      'QSC',
      'Powersoft',
      'Lab Gruppen',
      'Camco',
      'd&b audiotechnik',
      'Yamaha',
      'Other',
    ],
  },
  {
    id: 'speaker',
    labelEn: 'Speaker',
    labelFr: 'Enceinte',
    icon: 'Speaker',
    brands: [
      "L'Acoustics",
      'Nexo',
      'd&b audiotechnik',
      'Meyer Sound',
      'JBL',
      'EAW',
      'Martin Audio',
      'Adamson',
      'RCF',
      'Other',
    ],
  },
  {
    id: 'lighting',
    labelEn: 'Lighting',
    labelFr: 'Éclairage',
    icon: 'Lightbulb',
    brands: [
      'Martin',
      'Clay Paky',
      'Robe',
      'GrandMA',
      'Ayrton',
      'Vari-Lite',
      'Chauvet',
      'ETC',
      'High End Systems',
      'Chamsys',
      'Other',
    ],
  },
  {
    id: 'controller',
    labelEn: 'Controller / Console',
    labelFr: 'Contrôleur / Régie',
    icon: 'Gamepad2',
    brands: [
      'GrandMA',
      'Chamsys',
      'Avolites',
      'ETC',
      'Hog',
      'Zero 88',
      'Obsidian',
      'Other',
    ],
  },
  {
    id: 'computer',
    labelEn: 'Computer',
    labelFr: 'Ordinateur',
    icon: 'Monitor',
    brands: [
      'Apple Mac',
      'Dell',
      'HP',
      'Lenovo',
      'Custom PC',
      'ASUS',
      'Microsoft Surface',
      'Other',
    ],
  },
  {
    id: 'video',
    labelEn: 'Video',
    labelFr: 'Vidéo',
    icon: 'Video',
    brands: [
      'Blackmagic',
      'Barco',
      'Christie',
      'Panasonic',
      'Sony',
      'Roland',
      'Dataton',
      'Disguise',
      'Other',
    ],
  },
  {
    id: 'microphone',
    labelEn: 'Microphone / Wireless',
    labelFr: 'Microphone / HF',
    icon: 'Mic',
    brands: [
      'Shure',
      'Sennheiser',
      'Audio-Technica',
      'DPA',
      'Neumann',
      'AKG',
      'Rode',
      'Wisycom',
      'Other',
    ],
  },
  {
    id: 'other',
    labelEn: 'Other',
    labelFr: 'Autre',
    icon: 'Box',
    brands: ['Other'],
  },
];

export const getCategoryById = (id: EquipmentCategory): CategoryInfo | undefined => {
  return equipmentCategories.find((cat) => cat.id === id);
};

export const getCategoryLabel = (id: EquipmentCategory, language: 'en' | 'fr'): string => {
  const category = getCategoryById(id);
  if (!category) return id;
  return language === 'fr' ? category.labelFr : category.labelEn;
};
