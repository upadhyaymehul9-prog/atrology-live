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
  'pitru-dosh',
  'grahan-dosh',
  'chandal-yog',
  'mangal-dosh',
  'kemadruma',
  'vish-yog',
  'shrapit-yog',
  'angarak-yog',
  'guru-chandal',
  'sarp-dosh',
  'chandra-dosh',
  'surya-dosh',
  'paap-kartari',
  'gand-mool',
] as const;

export type YogaId = (typeof YOGA_IDS)[number];
