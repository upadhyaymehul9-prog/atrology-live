import type { BirthChart } from '../types';
import { HOUSE_INFO, PLANET_GU, SIGN_GU_FULL } from '../data/kundliGu';
import { getHouseLord } from '../lib/ephemeris';

interface HouseInfoModalProps {
  house: number | null;
  chart: BirthChart;
  onClose: () => void;
}

export function HouseInfoModal({ house, chart, onClose }: HouseInfoModalProps) {
  if (!house) return null;

  const info = HOUSE_INFO.find((h) => h.house === house)!;
  const sign = (chart.ascendantSign + house - 1) % 12;
  const planets = chart.planets.filter((p) => p.house === house);
  const lord = getHouseLord(chart, house);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3>{info.titleGu}</h3>
        <p className="modal-keywords">{info.keywordsGu.join(' · ')}</p>
        <div className="modal-section">
          <h4>ભાવનો અર્થ</h4>
          <p>{info.meaningGu}</p>
          <p className="hint">{info.meaningEn}</p>
        </div>
        <div className="modal-section chart-detail">
          <h4>આ કુંડળીમાં / In this chart</h4>
          <ul>
            <li><strong>રાશિ:</strong> {SIGN_GU_FULL[sign]}</li>
            <li><strong>સ્વામી:</strong> {PLANET_GU[lord] ?? lord}</li>
            <li>
              <strong>ગ્રહ:</strong>{' '}
              {planets.length > 0
                ? planets.map((p) => `${PLANET_GU[p.name]} (${p.degreeInSign.toFixed(1)}°)`).join(', ')
                : 'ખાલી — no planets'}
            </li>
          </ul>
        </div>
        <button type="button" className="btn primary modal-ok" onClick={onClose}>
          બંધ કરો
        </button>
      </div>
    </div>
  );
}
