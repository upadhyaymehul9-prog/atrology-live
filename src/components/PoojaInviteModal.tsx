import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildPoojaInviteMessage,
  generateInviteCard,
  inviteFileName,
  type InviteDetails,
} from '../lib/inviteCard';
import { buildWhatsAppUrl, displayPhone } from '../lib/storage';
import { getYogaCatalog } from '../lib/yogas';
import type { PersonWithYogas, YogaId, YogaResult } from '../types';

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface PoojaInviteModalProps {
  persons: PersonWithYogas[];
  /** Preferred dosha from current filter, if any */
  preferredYogaId?: YogaId | null;
  onClose: () => void;
}

function defaultYoga(
  persons: PersonWithYogas[],
  preferred?: YogaId | null,
): Pick<YogaResult, 'id' | 'name' | 'nameHi' | 'category' | 'severity' | 'remedy'> | null {
  if (preferred) {
    const fromCatalog = getYogaCatalog().find((y) => y.id === preferred);
    if (fromCatalog) {
      const rule = persons
        .flatMap((p) => p.activeYogas)
        .find((y) => y.id === preferred);
      return {
        id: fromCatalog.id as YogaId,
        name: fromCatalog.name,
        nameHi: fromCatalog.nameHi,
        category: fromCatalog.category,
        severity: fromCatalog.severity,
        remedy: rule?.remedy,
      };
    }
  }
  const first = persons[0]?.activeYogas.find((y) => y.category === 'dosha') ?? persons[0]?.activeYogas[0];
  return first
    ? {
        id: first.id as YogaId,
        name: first.name,
        nameHi: first.nameHi,
        category: first.category,
        severity: first.severity,
        remedy: first.remedy,
      }
    : null;
}

export function PoojaInviteModal({ persons, preferredYogaId, onClose }: PoojaInviteModalProps) {
  const catalog = useMemo(() => getYogaCatalog(), []);
  const initial = defaultYoga(persons, preferredYogaId);

  const [yogaId, setYogaId] = useState<string>(initial?.id ?? catalog[0]?.id ?? 'kalsarpa');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [place, setPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [hostName, setHostName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'form' | 'send'>('form');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const selectedYoga = useMemo(() => {
    const c = catalog.find((y) => y.id === yogaId);
    if (!c) return initial;
    const fromPerson = persons.flatMap((p) => p.activeYogas).find((y) => y.id === yogaId);
    return {
      id: c.id as YogaId,
      name: c.name,
      nameHi: c.nameHi,
      category: c.category,
      severity: c.severity,
      remedy: fromPerson?.remedy,
    };
  }, [catalog, yogaId, persons, initial]);

  const previewPerson = persons[0];

  const detailsFor = (person: PersonWithYogas): InviteDetails | null => {
    if (!selectedYoga) return null;
    return {
      yajmaanName: person.name,
      yoga: selectedYoga,
      date,
      time,
      place: place.trim(),
      notes: notes.trim() || undefined,
      hostName: hostName.trim() || undefined,
    };
  };

  // Live preview for first yajmaan when form fields are ready
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!previewPerson || !selectedYoga || !date || !time || !place.trim()) {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setBlob(null);
        return;
      }
      setGenerating(true);
      setError('');
      try {
        const details = detailsFor(previewPerson)!;
        const b = await generateInviteCard(details);
        if (cancelled) return;
        setBlob(b);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(b);
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setGenerating(false);
      }
    };
    const t = setTimeout(() => void run(), 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPerson?.id, selectedYoga?.id, date, time, place, notes, hostName]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canGenerate = Boolean(selectedYoga && date && time && place.trim());

  const saveCardFile = async (person: PersonWithYogas) => {
    const details = detailsFor(person);
    if (!details) return;
    const b = person.id === previewPerson?.id && blob ? blob : await generateInviteCard(details);
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url;
    a.download = inviteFileName(details.yoga.id, person.name);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  /**
   * Open WhatsApp in the same click (avoids popup blockers).
   * Card image downloads in the background so it can be attached in the chat.
   */
  const sendWhatsAppCard = (person: PersonWithYogas) => {
    const details = detailsFor(person);
    if (!details) {
      setError('તારીખ, સમય અને સ્થળ ભરો');
      return;
    }
    setError('');
    const message = buildPoojaInviteMessage(details);
    const waUrl = buildWhatsAppUrl(person, message);

    // Synchronous open — must stay in the user-gesture call stack
    const opened = window.open(waUrl, '_blank');
    if (!opened) {
      // Popup blocked — navigate current tab as last resort
      window.location.href = waUrl;
      return;
    }

    setSentIds((prev) => new Set(prev).add(person.id));
    void saveCardFile(person).catch((err) => {
      console.warn('Card download failed:', err);
    });
  };

  const goSend = () => {
    if (!canGenerate) {
      setError('તારીખ, સમય અને સ્થળ ભરો / Fill date, time and place');
      return;
    }
    if (persons.length === 1) {
      sendWhatsAppCard(persons[0]);
      return;
    }
    setStep('send');
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };

  const openTimePicker = () => {
    const el = timeInputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card pooja-invite-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3>🙏 પૂજા / વિધિ આમંત્રણ</h3>
        <p className="hint">
          દોષ કાર્ડ બનાવો → તારીખ · સમય · સ્થળ ભરો → ફક્ત WhatsApp થી મોકલો
        </p>

        {step === 'form' ? (
          <form
            className="event-form"
            onSubmit={(e) => {
              e.preventDefault();
              goSend();
            }}
          >
            <label>
              દોષ / યોગ (template)
              <select value={yogaId} onChange={(e) => setYogaId(e.target.value)}>
                {catalog.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.nameHi || y.name} — {y.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row invite-datetime-row">
              <label>
                તારીખ / Date *
                <div className="picker-row">
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="date-input"
                  />
                  <button type="button" className="btn secondary small picker-btn" onClick={openDatePicker}>
                    📅 Calendar
                  </button>
                </div>
                {date ? (
                  <small className="picker-selected">Selected: {formatDateLabel(date)}</small>
                ) : (
                  <small className="picker-selected muted">📅 Calendar બટન દબાવો — તારીખ પસંદ કરો</small>
                )}
              </label>
              <label>
                સમય / Time *
                <div className="picker-row">
                  <input
                    ref={timeInputRef}
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="time-input"
                  />
                  <button type="button" className="btn secondary small picker-btn" onClick={openTimePicker}>
                    ⏰ Time
                  </button>
                </div>
              </label>
            </div>

            <label>
              સ્થળ / Place *
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="મંદિર / ઘરનું સરનામું"
                required
              />
            </label>

            <label>
              નોંધ (optional)
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="પૂજા સામગ્રી લાવો, વગેરે"
              />
            </label>

            <label>
              આયોજકનું નામ (optional)
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Your name / family name"
              />
            </label>

            <div className="invite-preview-wrap">
              <p className="hint">
                Preview {persons.length > 1 ? `(sample: ${previewPerson?.name})` : ''}
              </p>
              {generating && <p className="geo-status loading">🎨 કાર્ડ બની રહ્યું છે…</p>}
              {previewUrl ? (
                <img src={previewUrl} alt="Pooja invitation preview" className="invite-preview" />
              ) : (
                <div className="invite-preview placeholder">
                  તારીખ · સમય · સ્થળ ભરો — કાર્ડ અહીં દેખાશે
                </div>
              )}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="form-actions">
              <button type="button" className="btn secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn whatsapp" disabled={!canGenerate || generating}>
                {persons.length === 1
                  ? 'WhatsApp પર મોકલો'
                  : `આગળ · WhatsApp (${persons.length})`}
              </button>
            </div>
          </form>
        ) : (
          <div className="invite-send-step">
            <button type="button" className="btn secondary small" onClick={() => setStep('form')}>
              ← Edit details
            </button>
            <p className="hint">
              દરેક યજમાન માટે <strong>WhatsApp</strong> દબાવો — WhatsApp ચેટ સીધી ખુલશે (message તૈયાર).
              કાર્ડ image પણ download થશે — ચેટમાં 📎 attach કરીને Send દબાવો.
            </p>
            {previewUrl && (
              <img src={previewUrl} alt="Invite card" className="invite-preview small" />
            )}
            {error && <p className="error">{error}</p>}
            <ul className="bulk-send-list">
              {persons.map((person) => {
                const sent = sentIds.has(person.id);
                return (
                  <li key={person.id} className={`bulk-send-row ${sent ? 'sent' : ''}`}>
                    <div className="bulk-send-info">
                      <strong>{person.name}</strong>
                      <span className="meta">📱 {displayPhone(person)}</span>
                    </div>
                    <button
                      type="button"
                      className={`btn small ${sent ? 'secondary' : 'whatsapp'}`}
                      onClick={() => sendWhatsAppCard(person)}
                    >
                      {sent ? '✓ WhatsApp ફરી' : 'WhatsApp ➤'}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="form-actions">
              <button type="button" className="btn secondary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
