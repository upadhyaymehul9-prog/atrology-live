import { useEffect, useMemo, useState } from 'react';
import {
  buildPoojaInviteMessage,
  generateInviteCard,
  inviteFileName,
  type InviteDetails,
} from '../lib/inviteCard';
import { buildWhatsAppUrl, displayPhone } from '../lib/storage';
import { getYogaCatalog } from '../lib/yogas';
import type { PersonWithYogas, YogaId, YogaResult } from '../types';

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

  const downloadFor = async (person: PersonWithYogas) => {
    const details = detailsFor(person);
    if (!details) return;
    const b = person.id === previewPerson?.id && blob ? blob : await generateInviteCard(details);
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url;
    a.download = inviteFileName(details.yoga.id, person.name);
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareImage = async (person: PersonWithYogas) => {
    const details = detailsFor(person);
    if (!details) return;
    const b = person.id === previewPerson?.id && blob ? blob : await generateInviteCard(details);
    const file = new File([b], inviteFileName(details.yoga.id, person.name), { type: 'image/png' });
    const message = buildPoojaInviteMessage(details);

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Pooja invite — ${details.yoga.nameHi || details.yoga.name}`,
          text: message,
        });
        setSentIds((prev) => new Set(prev).add(person.id));
        return;
      } catch {
        // user cancelled or share failed — fall through
      }
    }

    // Fallback: download image + open WhatsApp text
    await downloadFor(person);
    window.open(buildWhatsAppUrl(person, message), '_blank');
    setSentIds((prev) => new Set(prev).add(person.id));
  };

  const whatsappTextOnly = (person: PersonWithYogas) => {
    const details = detailsFor(person);
    if (!details) return;
    window.open(buildWhatsAppUrl(person, buildPoojaInviteMessage(details)), '_blank');
    setSentIds((prev) => new Set(prev).add(person.id));
  };

  const goSend = () => {
    if (!canGenerate) {
      setError('તારીખ, સમય અને સ્થળ ભરો / Fill date, time and place');
      return;
    }
    setStep('send');
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
          દોષનું કાર્ડ બનાવો — તારીખ, સમય, સ્થળ ભરો — image + WhatsApp મોકલો
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

            <div className="form-row">
              <label>
                તારીખ / Date *
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label>
                સમય / Time *
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
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
              <button type="submit" className="btn primary" disabled={!canGenerate || generating}>
                આગળ · Send to {persons.length} Yajmaan
              </button>
            </div>
          </form>
        ) : (
          <div className="invite-send-step">
            <button type="button" className="btn secondary small" onClick={() => setStep('form')}>
              ← Edit details
            </button>
            <p className="hint">
              Mobile પર <strong>Share image</strong> WhatsApp માં image સાથે ખુલે છે. Desktop પર image
              download થશે + WhatsApp text ખુલશે — image attach કરીને મોકલો.
            </p>
            {previewUrl && (
              <img src={previewUrl} alt="Invite card" className="invite-preview small" />
            )}
            <ul className="bulk-send-list">
              {persons.map((person) => {
                const sent = sentIds.has(person.id);
                return (
                  <li key={person.id} className={`bulk-send-row ${sent ? 'sent' : ''}`}>
                    <div className="bulk-send-info">
                      <strong>{person.name}</strong>
                      <span className="meta">📱 {displayPhone(person)}</span>
                    </div>
                    <div className="invite-row-actions">
                      <button
                        type="button"
                        className="btn secondary small"
                        onClick={() => void downloadFor(person)}
                      >
                        ⬇ Image
                      </button>
                      <button
                        type="button"
                        className={`btn small ${sent ? 'secondary' : 'whatsapp'}`}
                        onClick={() => void shareImage(person)}
                      >
                        {sent ? '✓ Share again' : 'Share image'}
                      </button>
                      <button
                        type="button"
                        className="btn secondary small"
                        onClick={() => whatsappTextOnly(person)}
                      >
                        Text
                      </button>
                    </div>
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
