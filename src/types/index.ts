export type PlanetName =
  | 'Sun'
  | 'Moon'
  | 'Mars'
  | 'Mercury'
  | 'Jupiter'
  | 'Venus'
  | 'Saturn'
  | 'Rahu'
  | 'Ketu';

export interface PlanetPosition {
  name: PlanetName;
  longitude: number;
  sign: number;
  signName: string;
  house: number;
  degreeInSign: number;
}

export interface BirthChart {
  ascendantSign: number;
  ascendantSignName: string;
  planets: PlanetPosition[];
  birthDateTime: Date;
}

export interface YogaResult {
  id: string;
  name: string;
  nameHi: string;
  category: 'dosha' | 'yoga';
  severity: 'high' | 'medium' | 'low';
  present: boolean;
  description: string;
  remedy?: string;
}

export interface Person {
  id: string;
  name: string;
  countryCode: string;
  phone: string;
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  placeName: string;
  notes?: string;
  createdAt: string;
}

export interface PersonWithYogas extends Person {
  chart: BirthChart;
  yogas: YogaResult[];
  activeYogas: YogaResult[];
}

export const SIGN_NAMES = [
  'Mesha (Aries)',
  'Vrishabha (Taurus)',
  'Mithuna (Gemini)',
  'Karka (Cancer)',
  'Simha (Leo)',
  'Kanya (Virgo)',
  'Tula (Libra)',
  'Vrishchika (Scorpio)',
  'Dhanu (Sagittarius)',
  'Makara (Capricorn)',
  'Kumbha (Aquarius)',
  'Meena (Pisces)',
] as const;

export const YOGA_IDS = [
  'kalsarpa',
  'ardh-kalsarpa',
  'pitru-dosh',
  'matru-dosh',
  'putra-dosh',
  'grahan-dosh',
  'amavasya-dosh',
  'chandal-yog',
  'guru-chandal',
  'mangal-dosh',
  'kemadruma',
  'vish-yog',
  'shrapit-yog',
  'angarak-yog',
  'sarp-dosh',
  'chandra-dosh',
  'surya-dosh',
  'shani-dosh',
  'budh-dosh',
  'shukra-dosh',
  'rahu-dosh',
  'ketu-dosh',
  'paap-kartari',
  'papa-kartari-moon',
  'papa-kartari-sun',
  'gand-mool',
  'pishacha-yog',
  'shakat-yog',
  'daridra-yog',
  'bhandan-yog',
  'gaj-kesari-yog',
  'chandra-mangal-yog',
  'guru-mangal-yog',
  'ruchaka-yog',
  'bhadra-yog',
  'hamsa-yog',
  'malavya-yog',
  'shasha-yog',
  'sunfa-yog',
  'anafa-yog',
  'durudhara-yog',
  'neecha-bhanga-yog',
  'dhana-yog',
] as const;

export type YogaId = (typeof YOGA_IDS)[number];
