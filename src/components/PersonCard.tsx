import { useState } from 'react';
import { KundliChart, PlanetTable } from './KundliChart';
import {
  buildWhatsAppUrl,
  buildYogaReminderMessage,
  deletePerson,
  displayPhone,
} from '../lib/storage';
import type { PersonWithYogas, YogaId } from '../types';

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
  const [showKundli, setShowKundli] = useState(true);

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
          {showKundli ? '▼ Hide Kundli' : '▶ Show Full Kundli'}
        </button>
        {showKundli && (
          <>
            <KundliChart chart={person.chart} compact />
            <PlanetTable chart={person.chart} />
          </>
        )}
      </div>

      {visibleYogas.length > 0 ? (
        <ul className="yoga-tags">
          {visibleYogas.map((y) => (
            <li key={y.id} className={`tag severity-${y.severity}`} title={y.description}>
              {y.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-yoga">No matching yogas for current filter</p>
      )}

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
