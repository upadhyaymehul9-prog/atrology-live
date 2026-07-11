import { useState } from 'react';
import {
  loadSyncSettings,
  parseFirebaseConfig,
  pushAllEventsRemote,
  saveSyncSettings,
} from '../lib/familySync';
import { loadEvents } from '../lib/calendarStorage';

interface SyncSettingsModalProps {
  onClose: () => void;
  onChanged: () => void;
}

export function SyncSettingsModal({ onClose, onChanged }: SyncSettingsModalProps) {
  const existing = loadSyncSettings();
  const [configText, setConfigText] = useState(
    existing ? JSON.stringify(existing.firebaseConfig, null, 2) : '',
  );
  const [familyCode, setFamilyCode] = useState(existing?.familyCode ?? '');
  const [enabled, setEnabled] = useState(existing?.enabled ?? false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!enabled) {
      if (existing) saveSyncSettings({ ...existing, enabled: false });
      onChanged();
      onClose();
      return;
    }

    const config = parseFirebaseConfig(configText);
    if (!config) {
      setError('Firebase config ખોટો છે — Firebase console માંથી આખો config paste કરો (apiKey, projectId, appId જરૂરી છે)');
      return;
    }
    if (!familyCode.trim() || familyCode.trim().length < 4) {
      setError('Family code ઓછામાં ઓછો 4 અક્ષરનો રાખો (દા.ત. upadhyay-family-1985)');
      return;
    }

    setSaving(true);
    try {
      saveSyncSettings({ firebaseConfig: config, familyCode: familyCode.trim(), enabled: true });
      await pushAllEventsRemote(loadEvents());
      onChanged();
      onClose();
    } catch (err) {
      setError(
        `Sync ચાલુ ન થયો: ${err instanceof Error ? err.message : String(err)}. Firestore rules તપાસો.`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card sync-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3>👨‍👩‍👦 Family Sync</h3>
        <p className="hint">
          એક જ family code વાળા બધા ફોન પર કેલેન્ડર આપોઆપ સિંક થશે.
          All phones with the same family code share one calendar in real time.
        </p>

        <form className="event-form" onSubmit={handleSave}>
          <label className="checkbox-label sync-toggle">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>Sync ચાલુ કરો / Enable family sync</span>
          </label>

          {enabled && (
            <>
              <label>
                Firebase Config *
                <textarea
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  placeholder={'Firebase console માંથી paste કરો:\n{\n  "apiKey": "...",\n  "projectId": "...",\n  "appId": "..."\n}'}
                  rows={7}
                  spellCheck={false}
                />
              </label>

              <label>
                Family Code * <span className="hint-inline">(બધા ફોન પર એક જ કોડ)</span>
                <input
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value)}
                  placeholder="upadhyay-family-1985"
                />
              </label>

              <details className="sync-help">
                <summary>Firebase config ક્યાંથી મળશે? (એક વાર setup)</summary>
                <ol>
                  <li>
                    <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
                      console.firebase.google.com
                    </a>{' '}
                    ખોલો → <strong>Add project</strong> (નામ: yoga-jyotish)
                  </li>
                  <li>Project માં → <strong>Build → Firestore Database → Create database</strong> → Start in <strong>test mode</strong></li>
                  <li>Project overview → <strong>Web app</strong> (&lt;/&gt; icon) → Register app</li>
                  <li>જે <code>firebaseConfig</code> દેખાય તે આખો copy કરી ઉપર paste કરો</li>
                  <li>બીજા ફોન પર પણ આ જ config + આ જ family code નાખો</li>
                </ol>
              </details>
            </>
          )}

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Connecting…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
