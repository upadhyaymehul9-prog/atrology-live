import { useState } from 'react';
import type { BirthChart, PlanetName } from '../types';
import {
  getNakshatra,
  HOUSE_INFO,
  PLANET_GU,
  PLANET_SHORT_GU,
  SIGN_GU,
  SIGN_GU_FULL,
} from '../data/kundliGu';
import { getHouseLord } from '../lib/ephemeris';
import { HouseInfoModal } from './HouseInfoModal';

/** North Indian diamond — house positions (x%, y%) in SVG viewBox */
const HOUSE_POSITIONS: Record<number, { x: number; y: number; w: number }> = {
  1: { x: 50, y: 11, w: 88 },
  2: { x: 22, y: 22, w: 78 },
  3: { x: 10, y: 50, w: 78 },
  4: { x: 22, y: 78, w: 78 },
  5: { x: 50, y: 89, w: 88 },
  6: { x: 78, y: 78, w: 78 },
  7: { x: 90, y: 50, w: 78 },
  8: { x: 78, y: 22, w: 78 },
  9: { x: 38, y: 62, w: 72 },
  10: { x: 62, y: 62, w: 72 },
  11: { x: 38, y: 38, w: 72 },
  12: { x: 62, y: 38, w: 72 },
};

interface HouseData {
  house: number;
  sign: number;
  planets: { name: PlanetName; degree: string }[];
  keywords: string[];
}

function buildHouses(chart: BirthChart): Map<number, HouseData> {
  const map = new Map<number, HouseData>();
  for (let h = 1; h <= 12; h++) {
    const sign = (chart.ascendantSign + h - 1) % 12;
    const info = HOUSE_INFO.find((x) => x.house === h)!;
    map.set(h, {
      house: h,
      sign,
      keywords: info.keywordsGu,
      planets: chart.planets
        .filter((p) => p.house === h)
        .map((p) => ({ name: p.name, degree: p.degreeInSign.toFixed(0) })),
    });
  }
  return map;
}

interface KundliChartProps {
  chart: BirthChart;
  name?: string;
}

export function KundliChart({ chart, name }: KundliChartProps) {
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const houses = buildHouses(chart);
  const moonNak = getNakshatra(getPlanetLon(chart, 'Moon'));

  return (
    <div className="kundli-wrap">
      {name && <p className="kundli-title">જન્મ કુંડળી — {name}</p>}

      <div className="kundli-diamond-frame">
        <div className="kundli-lagna-badge">લ</div>
        <svg viewBox="0 0 100 100" className="kundli-diamond-svg" aria-label="North Indian Kundli">
          {/* Outer diamond border */}
          <polygon
            points="50,2 98,50 50,98 2,50"
            fill="none"
            stroke="#e8a020"
            strokeWidth="0.8"
          />
          {/* Inner cross diagonals */}
          <line x1="2" y1="50" x2="98" y2="50" stroke="#c9a227" strokeWidth="0.35" opacity="0.7" />
          <line x1="50" y1="2" x2="50" y2="98" stroke="#c9a227" strokeWidth="0.35" opacity="0.7" />
          <line x1="2" y1="2" x2="98" y2="98" stroke="#c9a227" strokeWidth="0.35" opacity="0.7" />
          <line x1="98" y1="2" x2="2" y2="98" stroke="#c9a227" strokeWidth="0.35" opacity="0.7" />
          {/* Center */}
          <circle cx="50" cy="50" r="3" fill="rgba(201,162,39,0.3)" stroke="#c9a227" strokeWidth="0.3" />
        </svg>

        {/* Clickable house overlays */}
        {Object.entries(HOUSE_POSITIONS).map(([num, pos]) => {
          const h = houses.get(Number(num))!;
          const isLagna = Number(num) === 1;
          return (
            <button
              key={num}
              type="button"
              className={`kundli-house-btn ${isLagna ? 'lagna-house' : ''}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${pos.w}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => setSelectedHouse(Number(num))}
              title={h.keywords.join(', ')}
            >
              <span className="k-house-num">{num}</span>
              <span className="k-sign">{SIGN_GU[h.sign]}</span>
              <span className="k-keywords">{h.keywords.slice(0, 2).join(' · ')}</span>
              <span className="k-planets">
                {h.planets.map((p) => (
                  <span key={p.name} className="k-planet">
                    {PLANET_SHORT_GU[p.name]}
                    <sub>{p.degree}°</sub>
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <p className="kundli-tap-hint">👆 ભાવ પર ટેપ કરો — વિગતવાર માહિતી / Tap any house for details</p>

      <div className="kundli-summary">
        <div className="summary-row">
          <span><strong>લગ્ન:</strong> {SIGN_GU_FULL[chart.ascendantSign]}</span>
          <span><strong>ચંદ્ર નક્ષત્ર:</strong> {moonNak.nameGu} (પાદ {moonNak.pada})</span>
        </div>
      </div>

      <HouseInfoModal house={selectedHouse} chart={chart} onClose={() => setSelectedHouse(null)} />
    </div>
  );
}

function getPlanetLon(chart: BirthChart, name: PlanetName): number {
  return chart.planets.find((p) => p.name === name)!.longitude;
}

export function PlanetTable({ chart }: { chart: BirthChart }) {
  const moonNak = getNakshatra(chart.planets.find((p) => p.name === 'Moon')!.longitude);

  return (
    <div className="planet-table-wrap">
      <h4 className="table-title">ગ્રહ સ્થિતિ / Graha Details</h4>
      <table className="planet-table">
        <thead>
          <tr>
            <th>ગ્રહ</th>
            <th>રાશિ</th>
            <th>ભાવ</th>
            <th>અંશ</th>
            <th>સ્વામી</th>
          </tr>
        </thead>
        <tbody>
          {chart.planets.map((p) => {
            const lord = getHouseLord(chart, p.house);
            return (
              <tr key={p.name}>
                <td>{PLANET_GU[p.name]}</td>
                <td>{SIGN_GU_FULL[p.sign]}</td>
                <td>{p.house}</td>
                <td>{p.degreeInSign.toFixed(2)}°</td>
                <td>{PLANET_GU[lord]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="astro-depth">
        <h4>વિસ્તૃત માહિતી / In-depth</h4>
        <ul>
          <li><strong>જન્મ નક્ષત્ર:</strong> {moonNak.nameGu} ({moonNak.name}) — પાદ {moonNak.pada}</li>
          <li><strong>લગ્ન રાશિ:</strong> {SIGN_GU_FULL[chart.ascendantSign]}</li>
          {HOUSE_INFO.slice(0, 4).map((h) => {
            const lord = getHouseLord(chart, h.house);
            const sign = (chart.ascendantSign + h.house - 1) % 12;
            return (
              <li key={h.house}>
                <strong>{h.house} ભાવ ({h.keywordsGu[0]}):</strong>{' '}
                {SIGN_GU[sign]} — સ્વામી {PLANET_GU[lord]}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
