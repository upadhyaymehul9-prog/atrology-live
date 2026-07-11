import type { YogaResult } from '../types';

interface YogaInfoModalProps {
  yoga: YogaResult | null;
  onClose: () => void;
}

export function YogaInfoModal({ yoga, onClose }: YogaInfoModalProps) {
  if (!yoga) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="yoga-modal-title"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="modal-header">
          <span className={`badge ${yoga.category}`}>{yoga.category === 'dosha' ? 'દોષ' : 'યોગ'}</span>
          <span className={`severity-badge severity-${yoga.severity}`}>{yoga.severity}</span>
        </div>
        <h3 id="yoga-modal-title">{yoga.name}</h3>
        <p className="modal-hi">{yoga.nameHi}</p>
        <div className="modal-section">
          <h4>શું અર્થ થાય? / What does it mean?</h4>
          <p>{yoga.description}</p>
        </div>
        {yoga.remedy && (
          <div className="modal-section remedy">
            <h4>ઉપાય / Remedy</h4>
            <p>{yoga.remedy}</p>
          </div>
        )}
        <button type="button" className="btn primary modal-ok" onClick={onClose}>
          સમજાયું / OK
        </button>
      </div>
    </div>
  );
}
