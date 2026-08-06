import { useState } from 'react';
import {
  buildWhatsAppUrl,
  buildYogaReminderMessage,
  displayPhone,
} from '../lib/storage';
import type { PersonWithYogas, YogaId, YogaResult } from '../types';

interface BulkSendModalProps {
  persons: PersonWithYogas[];
  yogaFilter: YogaId | 'all' | 'any-dosha';
  onClose: () => void;
}

function yogasForFilter(
  person: PersonWithYogas,
  filter: YogaId | 'all' | 'any-dosha',
): YogaResult[] {
  if (filter === 'all') return person.activeYogas;
  if (filter === 'any-dosha') return person.activeYogas.filter((y) => y.category === 'dosha');
  return person.activeYogas.filter((y) => y.id === filter);
}

/**
 * Browsers block opening many WhatsApp windows at once, so bulk send works
 * one tap per yajmaan: each row opens WhatsApp with the message pre-filled
 * and gets marked as sent.
 */
export function BulkSendModal({ persons, yogaFilter, onClose }: BulkSendModalProps) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const rows = persons.map((p) => ({ person: p, yogas: yogasForFilter(p, yogaFilter) }));
  const sendable = rows.filter((r) => r.yogas.length > 0);
  const skipped = rows.length - sendable.length;

  const send = (person: PersonWithYogas, yogas: YogaResult[]) => {
    const message = buildYogaReminderMessage(person.name, yogas);
    window.open(buildWhatsAppUrl(person, message), '_blank');
    setSentIds((prev) => new Set(prev).add(person.id));
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card bulk-send-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3>📤 WhatsApp — Bulk Send</h3>
        <p className="hint">
          દરેક યજમાન માટે <strong>Send</strong> દબાવો — WhatsApp ખુલશે, message તૈયાર હશે, ફક્ત
          મોકલો અને પાછા આવો. ({sentIds.size}/{sendable.length} sent)
        </p>

        {skipped > 0 && (
          <p className="hint bulk-skip-note">
            ⚠ {skipped} yajmaan skipped — no matching dosha/yoga for current filter.
          </p>
        )}

        <ul className="bulk-send-list">
          {sendable.map(({ person, yogas }) => {
            const sent = sentIds.has(person.id);
            return (
              <li key={person.id} className={`bulk-send-row ${sent ? 'sent' : ''}`}>
                <div className="bulk-send-info">
                  <strong>{person.name}</strong>
                  <span className="meta">📱 {displayPhone(person)}</span>
                  <span className="meta bulk-yogas">
                    {yogas.map((y) => y.nameHi || y.name).join(', ')}
                  </span>
                </div>
                <button
                  type="button"
                  className={`btn small ${sent ? 'secondary' : 'whatsapp'}`}
                  onClick={() => send(person, yogas)}
                >
                  {sent ? '✓ Sent · ફરી મોકલો' : 'Send ➤'}
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
    </div>
  );
}
