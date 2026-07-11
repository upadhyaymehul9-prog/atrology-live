import type { ScheduleEvent } from '../types/schedule';

const EVENTS_KEY = 'yoga-jyotish-schedule-v1';

export function loadEvents(): ScheduleEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScheduleEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: ScheduleEvent[]): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function addEvent(event: Omit<ScheduleEvent, 'id' | 'createdAt'>): ScheduleEvent {
  const events = loadEvents();
  const newEvent: ScheduleEvent = {
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  events.push(newEvent);
  saveEvents(events);
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<ScheduleEvent>): ScheduleEvent | null {
  const events = loadEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  events[index] = { ...events[index], ...updates, id };
  saveEvents(events);
  return events[index];
}

export function deleteEvent(id: string): void {
  saveEvents(loadEvents().filter((e) => e.id !== id));
}

export function getEventsForDate(date: string): ScheduleEvent[] {
  return loadEvents()
    .filter((e) => e.date === date)
    .sort((a, b) => {
      if (a.type === 'all-day' && b.type !== 'all-day') return -1;
      if (b.type === 'all-day' && a.type !== 'all-day') return 1;
      return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
    });
}

export function getDatesWithEvents(year: number, month: number): Set<string> {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const dates = new Set<string>();
  for (const e of loadEvents()) {
    if (e.date.startsWith(prefix)) dates.add(e.date);
  }
  return dates;
}

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTimeRange(event: ScheduleEvent): string {
  if (event.type === 'all-day') return 'All day / આખો દિવસ';
  if (event.startTime && event.endTime) return `${event.startTime} – ${event.endTime}`;
  if (event.startTime) return event.startTime;
  return '';
}
