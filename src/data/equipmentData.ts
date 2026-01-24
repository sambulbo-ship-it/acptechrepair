export type EquipmentCategory = 
  | 'mixing-console'
  | 'amplifier'
  | 'lighting'
  | 'computer'
  | 'speaker'
  | 'microphone'
  | 'video'
  | 'controller'
  | 'peripheral'
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
      'Allen & Heath',
      'Avid',
      'Behringer',
      'Cadac',
      'DiGiCo',
      'Lawo',
      'Mackie',
      'Midas',
      'Neve',
      'PreSonus',
      'Solid State Logic (SSL)',
      'Soundcraft',
      'Studer',
      'Tascam',
      'Yamaha',
      'Other',
    ],
  },
  {
    id: 'amplifier',
    labelEn: 'Amplifier',
    labelFr: 'Amplificateur',
    icon: 'Volume2',
    brands: [
      'Camco',
      'Crown',
      'd&b audiotechnik',
      'Lab Gruppen',
      "L-Acoustics",
      'MC2 Audio',
      'Nexo',
      'Powersoft',
      'QSC',
      'RAM Audio',
      'Void Acoustics',
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
      'Adamson',
      'd&b audiotechnik',
      'DAS Audio',
      'EAW',
      'Electro-Voice',
      'Funktion-One',
      'JBL Professional',
      'KV2 Audio',
      "L-Acoustics",
      'Martin Audio',
      'Meyer Sound',
      'Nexo',
      'RCF',
      'Turbosound',
      'Void Acoustics',
      'Other',
    ],
  },
  {
    id: 'lighting',
    labelEn: 'Lighting',
    labelFr: 'Éclairage',
    icon: 'Lightbulb',
    brands: [
      'Ayrton',
      'Chauvet Professional',
      'Clay Paky',
      'Elation',
      'ETC',
      'GLP',
      'High End Systems',
      'JB Lighting',
      'Martin Professional',
      'Robe',
      'SGM',
      'Vari-Lite',
      'Other',
    ],
  },
  {
    id: 'controller',
    labelEn: 'Controller / Console',
    labelFr: 'Contrôleur / Régie',
    icon: 'Gamepad2',
    brands: [
      'Avolites',
      'ChamSys',
      'Compulite',
      'dot2',
      'ETC',
      'grandMA (MA Lighting)',
      'High End Systems (Hog)',
      'Obsidian Control',
      'Zero 88',
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
      'ASUS',
      'Custom PC',
      'Dell',
      'HP',
      'Lenovo',
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
      'AJA',
      'Analog Way',
      'Barco',
      'Blackmagic Design',
      'Christie',
      'Dataton',
      'disguise',
      'Epson',
      'Grass Valley',
      'NewTek',
      'Panasonic',
      'Roland',
      'Ross Video',
      'Sony',
      'Other',
    ],
  },
  {
    id: 'microphone',
    labelEn: 'Microphone / Wireless',
    labelFr: 'Microphone / HF',
    icon: 'Mic',
    brands: [
      'AKG',
      'Audio-Technica',
      'Audix',
      'Beyerdynamic',
      'DPA Microphones',
      'Electro-Voice',
      'Heil Sound',
      'Lectrosonics',
      'Neumann',
      'Rode',
      'Schoeps',
      'Sennheiser',
      'Shure',
      'Sony',
      'Wisycom',
      'Zaxcom',
      'Other',
    ],
  },
  {
    id: 'peripheral',
    labelEn: 'Peripheral / Outboard',
    labelFr: 'Périphérique / Outboard',
    icon: 'Sliders',
    brands: [
      'Antelope Audio',
      'API',
      'Apogee',
      'Avalon',
      'Bricasti Design',
      'BSS Audio',
      'Chandler Limited',
      'dbx',
      'Drawmer',
      'Empirical Labs',
      'Eventide',
      'Focusrite',
      'Grace Design',
      'Great River',
      'Klark Teknik',
      'Lake',
      'Lexicon',
      'Manley Labs',
      'Millennia',
      'Motu',
      'Neve',
      'PreSonus',
      'RME',
      'Rupert Neve Designs',
      'Shadow Hills',
      'Solid State Logic (SSL)',
      'Summit Audio',
      'TC Electronic',
      'Tube-Tech',
      'Universal Audio',
      'Warm Audio',
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
