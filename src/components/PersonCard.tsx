import { useState } from 'react';
import { KundliChart, PlanetTable } from './KundliChart';
import { YogaInfoModal } from './YogaInfoModal';
import {
  buildWhatsAppUrl,
  buildYogaReminderMessage,
  deletePerson,
  displayPhone,
} from '../lib/storage';
import type { PersonWithYogas, YogaId, YogaResult } from '../types';

interface PersonCardProps {
  person: PersonWithYogas;
  selectedYogaFilter: YogaId | 'all' | 'any-dosha';
  onEdit: (id: string) => void;
  onDelete: () => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export function PersonCard({
  person,
  selectedYogaFilter,
  onEdit,
  onDelete,
  isSelected,
  onToggleSelect,
}: PersonCardProps) {
  const [showKundli, setShowKundli] = useState(false);
  const [selectedYoga, setSelectedYoga] = useState<YogaResult | null>(null);

  const visibleYogas =
    selectedYogaFilter === 'all'
      ? person.activeYogas
      : selectedYogaFilter === 'any-dosha'
        ? person.activeYogas.filter((y) => y.category === 'dosha')
        : person.activeYogas.filter((y) => y.id === selectedYogaFilter);

  const sendWhatsApp = () => {
    if (visibleYogas.length === 0) {
      alert(`${person.name} has no matching yogas for this filter.`);
      return;
    }
    const message = buildYogaReminderMessage(person.name, visibleYogas);
    window.open(buildWhatsAppUrl(person, message), '_blank');
  };

  const confirmDelete = () => {
    if (window.confirm(`Delete ${person.name}? This cannot be undone.`)) {
      deletePerson(person.id);
      onDelete();
    }
  };

  return (
    <article className={`person-card ${visibleYogas.length === 0 ? 'dimmed' : ''}`}>
      <div className="card-header">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(person.id)}
          />
          <div>
            <h3>{person.name}</h3>
            <p className="meta">
              {person.birthDate} · {person.birthTime} · {person.placeName}
            </p>
            <p className="meta phone">📱 {displayPhone(person)}</p>
          </div>
        </label>
        <span className="lagna">Lagna: {person.chart.ascendantSignName}</span>
      </div>

      <div className="kundli-section">
        <button
          type="button"
          className="kundli-toggle"
          onClick={() => setShowKundli((v) => !v)}
        >
          {showKundli ? '▼ કુંડળી છુપાવો' : '▶ પૂર્ણ કુંડળી જુઓ'}
        </button>
        {showKundli && (
          <>
            <KundliChart chart={person.chart} name={person.name} />
            <PlanetTable chart={person.chart} />
          </>
        )}
      </div>

      {visibleYogas.length > 0 ? (
        <>
          <p className="yoga-tap-hint">👆 દોષ/યોગ પર ટેપ કરો — અર્થ જાણો</p>
          <ul className="yoga-tags">
            {visibleYogas.map((y) => (
              <li key={y.id}>
                <button
                  type="button"
                  className={`tag tag-btn severity-${y.severity}`}
                  onClick={() => setSelectedYoga(y)}
                >
                  {y.nameHi || y.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="no-yoga">No matching yogas for current filter</p>
      )}

      <YogaInfoModal yoga={selectedYoga} onClose={() => setSelectedYoga(null)} />

      <div className="card-actions">
        <button type="button" className="btn whatsapp" onClick={sendWhatsApp}>
          WhatsApp Remind
        </button>
        <button type="button" className="btn secondary small" onClick={() => onEdit(person.id)}>
          Edit
        </button>
        <button type="button" className="btn danger small" onClick={confirmDelete}>
          Delete
        </button>
      </div>
    </article>
  );
}
