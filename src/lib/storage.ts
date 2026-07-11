import {
  DEFAULT_COUNTRY_CODE,
  formatDisplayPhone,
  fullPhoneNumber,
  splitLegacyPhone,
} from '../data/countryCodes';
import type { Person, PersonWithYogas } from '../types';
import { computeBirthChart } from './ephemeris';
import { detectYogas } from './yogas';

const STORAGE_KEY = 'yoga-jyotish-persons-v1';

type StoredPerson = Person & { countryCode?: string };

function normalizePerson(raw: StoredPerson): Person {
  if (raw.countryCode) {
    return {
      ...raw,
      countryCode: raw.countryCode.replace(/\D/g, ''),
      phone: raw.phone.replace(/\D/g, ''),
    };
  }
  const split = splitLegacyPhone(raw.phone ?? '');
  return {
    ...raw,
    countryCode: split.countryCode,
    phone: split.phone,
  };
}

export function loadPersons(): Person[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredPerson[];
    return Array.isArray(parsed) ? parsed.map(normalizePerson) : [];
  } catch {
    return [];
  }
}

export function savePersons(persons: Person[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persons));
}

export function addPerson(person: Omit<Person, 'id' | 'createdAt'>): Person {
  const persons = loadPersons();
  const newPerson: Person = {
    ...person,
    countryCode: person.countryCode || DEFAULT_COUNTRY_CODE,
    phone: person.phone.replace(/\D/g, ''),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  persons.unshift(newPerson);
  savePersons(persons);
  return newPerson;
}

export function updatePerson(id: string, updates: Partial<Person>): Person | null {
  const persons = loadPersons();
  const index = persons.findIndex((p) => p.id === id);
  if (index === -1) return null;
  persons[index] = {
    ...persons[index],
    ...updates,
    id,
    countryCode: (updates.countryCode ?? persons[index].countryCode).replace(/\D/g, ''),
    phone: (updates.phone ?? persons[index].phone).replace(/\D/g, ''),
  };
  savePersons(persons);
  return persons[index];
}

export function deletePerson(id: string): void {
  savePersons(loadPersons().filter((p) => p.id !== id));
}

export function enrichPerson(person: Person): PersonWithYogas {
  const chart = computeBirthChart(
    person.birthDate,
    person.birthTime,
    person.latitude,
    person.longitude,
  );
  const yogas = detectYogas(chart);
  const activeYogas = yogas.filter((y) => y.present);
  return { ...person, chart, yogas, activeYogas };
}

export function enrichAll(persons: Person[]): PersonWithYogas[] {
  return persons.map(enrichPerson);
}

export function exportData(): string {
  return JSON.stringify(loadPersons(), null, 2);
}

export function importData(json: string): number {
  const parsed = JSON.parse(json) as StoredPerson[];
  if (!Array.isArray(parsed)) throw new Error('Invalid backup file');
  savePersons(parsed.map(normalizePerson));
  return parsed.length;
}

export function getWhatsAppNumber(person: Person): string {
  return fullPhoneNumber(person.countryCode, person.phone);
}

export function formatWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildWhatsAppUrl(person: Person, message: string): string {
  return `https://wa.me/${getWhatsAppNumber(person)}?text=${encodeURIComponent(message)}`;
}

export function displayPhone(person: Person): string {
  return formatDisplayPhone(person.countryCode, person.phone);
}

export function buildYogaReminderMessage(
  personName: string,
  yogas: { name: string; nameHi: string; remedy?: string }[],
): string {
  const lines = [
    `🙏 Namaste ${personName},`,
    '',
    'According to your Vedic birth chart, the following yogas/doshas are present:',
    '',
    ...yogas.map(
      (y, i) =>
        `${i + 1}. ${y.name} (${y.nameHi})${y.remedy ? `\n   Remedy: ${y.remedy}` : ''}`,
    ),
    '',
    'This is for spiritual awareness. Consult a qualified Jyotishi for personalized guidance.',
    '',
    '— Sent via Yoga Jyotish App',
  ];
  return lines.join('\n');
}
