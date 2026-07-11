import type { Person, PersonWithYogas } from '../types';
import { computeBirthChart } from './ephemeris';
import { detectYogas } from './yogas';

const STORAGE_KEY = 'yoga-jyotish-persons-v1';

export function loadPersons(): Person[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Person[];
    return Array.isArray(parsed) ? parsed : [];
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
  persons[index] = { ...persons[index], ...updates, id };
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
  const parsed = JSON.parse(json) as Person[];
  if (!Array.isArray(parsed)) throw new Error('Invalid backup file');
  savePersons(parsed);
  return parsed.length;
}

export function formatWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const num = formatWhatsAppNumber(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
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
