export type ScheduleEventType = 'meeting' | 'work' | 'personal' | 'puja' | 'all-day';

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm or empty for all-day
  endTime: string;
  type: ScheduleEventType;
  notes?: string;
  yajmaanId?: string;
  yajmaanName?: string;
  createdAt: string;
}

export const EVENT_TYPE_LABELS: Record<ScheduleEventType, { en: string; gu: string; icon: string }> = {
  meeting: { en: 'Meeting', gu: 'મીટિંગ', icon: '🤝' },
  work: { en: 'Work', gu: 'કામ', icon: '💼' },
  personal: { en: 'Personal', gu: 'વ્યક્તિગત', icon: '👤' },
  puja: { en: 'Puja / Remedy', gu: 'પૂજા / ઉપાય', icon: '🙏' },
  'all-day': { en: 'Full Day', gu: 'આખો દિવસ', icon: '📅' },
};
