/**
 * Optional family sync via Firebase Firestore.
 * When enabled, calendar events are mirrored to a shared family collection
 * so every phone with the same family code sees updates in real time.
 * When disabled (default), the app stays 100% local.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import type { ScheduleEvent } from '../types/schedule';

const SETTINGS_KEY = 'yoga-jyotish-sync-v1';

export interface SyncSettings {
  firebaseConfig: Record<string, string>;
  familyCode: string;
  enabled: boolean;
}

export function loadSyncSettings(): SyncSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncSettings;
    if (!parsed.firebaseConfig?.apiKey || !parsed.familyCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSyncSettings(settings: SyncSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function disableSync(): void {
  const s = loadSyncSettings();
  if (s) saveSyncSettings({ ...s, enabled: false });
}

export function isSyncEnabled(): boolean {
  return loadSyncSettings()?.enabled === true;
}

/**
 * Parse the config pasted from the Firebase console. Accepts strict JSON or
 * the JS snippet shown in the console (`const firebaseConfig = { apiKey: "..", ... };`).
 */
export function parseFirebaseConfig(text: string): Record<string, string> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  let body = text.slice(start, end + 1);

  try {
    return validateConfig(JSON.parse(body));
  } catch {
    // Convert JS object syntax to JSON: quote keys, normalize quotes, drop trailing commas
    body = body
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,\s*}/g, '}');
    try {
      return validateConfig(JSON.parse(body));
    } catch {
      return null;
    }
  }
}

function validateConfig(obj: unknown): Record<string, string> | null {
  if (!obj || typeof obj !== 'object') return null;
  const cfg = obj as Record<string, string>;
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) return null;
  return cfg;
}

function normalizeFamilyCode(code: string): string {
  return code.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

let cachedDb: Firestore | null = null;

function getDb(settings: SyncSettings): Firestore {
  if (cachedDb) return cachedDb;
  const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(settings.firebaseConfig);
  cachedDb = getFirestore(app);
  return cachedDb;
}

function calendarCollection(settings: SyncSettings) {
  return collection(getDb(settings), 'families', normalizeFamilyCode(settings.familyCode), 'calendar');
}

/** Upload all local events (used when enabling sync the first time). */
export async function pushAllEventsRemote(events: ScheduleEvent[]): Promise<void> {
  const settings = loadSyncSettings();
  if (!settings?.enabled) return;
  const col = calendarCollection(settings);
  const batch = writeBatch(getDb(settings));
  for (const e of events) {
    batch.set(doc(col, e.id), e, { merge: true });
  }
  await batch.commit();
}

export function pushEventRemote(event: ScheduleEvent): void {
  const settings = loadSyncSettings();
  if (!settings?.enabled) return;
  setDoc(doc(calendarCollection(settings), event.id), event, { merge: true }).catch((err) =>
    console.warn('Sync push failed (will retry when online):', err),
  );
}

export function deleteEventRemote(id: string): void {
  const settings = loadSyncSettings();
  if (!settings?.enabled) return;
  deleteDoc(doc(calendarCollection(settings), id)).catch((err) =>
    console.warn('Sync delete failed:', err),
  );
}

/**
 * Listen for calendar changes from other family phones.
 * Calls back with the full remote event list on every change.
 * Returns an unsubscribe function.
 */
export function subscribeToCalendar(
  onEvents: (events: ScheduleEvent[]) => void,
  onError?: (message: string) => void,
): () => void {
  const settings = loadSyncSettings();
  if (!settings?.enabled) return () => {};
  try {
    return onSnapshot(
      calendarCollection(settings),
      (snap) => {
        const events = snap.docs.map((d) => d.data() as ScheduleEvent);
        onEvents(events);
      },
      (err) => {
        console.warn('Sync listener error:', err);
        onError?.(err.message);
      },
    );
  } catch (err) {
    console.warn('Sync subscribe failed:', err);
    onError?.(err instanceof Error ? err.message : String(err));
    return () => {};
  }
}
