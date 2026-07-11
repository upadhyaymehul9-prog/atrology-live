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

/** Fixed North Indian house label positions (viewBox 400×400) */
const HOUSE_CENTERS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 108 },
  2: { x: 108, y: 108 },
  3: { x: 52, y: 200 },
  4: { x: 108, y: 292 },
  5: { x: 108, y: 352 },
  6: { x: 200, y: 352 },
  7: { x: 200, y: 292 },
  8: { x: 292, y: 352 },
  9: { x: 348, y: 200 },
  10: { x: 292, y: 292 },
  11: { x: 292, y: 108 },
  12: { x: 348, y: 108 },
};

interface HouseData {
  house: number;
  sign: number;
  signNum: number;
  planets: PlanetName[];
}

function buildHouses(chart: BirthChart): Map<number, HouseData> {
  const map = new Map<number, HouseData>();
  for (let h = 1; h <= 12; h++) {
    const sign = (chart.ascendantSign + h - 1) % 12;
    map.set(h, {
      house: h,
      sign,
      signNum: sign + 1,
      planets: chart.planets.filter((p) => p.house === h).map((p) => p.name),
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
  const moonNak = getNakshatra(chart.planets.find((p) => p.name === 'Moon')!.longitude);

  return (
    <div className="kundli-wrap">
      {name && <p className="kundli-title">જન્મ કુંડળી — {name}</p>}

      <div className="kundli-scroll">
        <svg viewBox="0 0 400 400" className="kundli-svg" aria-label="North Indian Kundli">
          {/* Parchment background */}
          <rect x="8" y="8" width="384" height="384" fill="#f5e6c8" rx="4" />

          {/* Red grid lines — classic North Indian diamond */}
          <rect x="20" y="20" width="360" height="360" fill="none" stroke="#a01818" strokeWidth="2.5" />
          <line x1="20" y1="20" x2="380" y2="380" stroke="#a01818" strokeWidth="1.8" />
          <line x1="380" y1="20" x2="20" y2="380" stroke="#a01818" strokeWidth="1.8" />
          <line x1="200" y1="20" x2="200" y2="200" stroke="#a01818" strokeWidth="1.8" />
          <line x1="380" y1="200" x2="200" y2="200" stroke="#a01818" strokeWidth="1.8" />
          <line x1="200" y1="380" x2="200" y2="200" stroke="#a01818" strokeWidth="1.8" />
          <line x1="20" y1="200" x2="200" y2="200" stroke="#a01818" strokeWidth="1.8" />

          {/* Lagna marker at top */}
          <text x="200" y="14" textAnchor="middle" className="k-lagna-mark">
            લ
          </text>

          {/* House content */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map((houseNum) => {
            const h = houses.get(houseNum)!;
            const pos = HOUSE_CENTERS[houseNum];
            const planetLine = h.planets.map((p) => PLANET_SHORT_GU[p]).join(' ');
            return (
              <g
                key={houseNum}
                className="k-house-group"
                onClick={() => setSelectedHouse(houseNum)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedHouse(houseNum)}
              >
                {/* Invisible click area */}
                <circle cx={pos.x} cy={pos.y} r="36" fill="transparent" />
                {/* Sign number — orange like traditional chart */}
                <text x={pos.x} y={pos.y - 6} textAnchor="middle" className="k-sign-num">
                  {h.signNum}
                </text>
                {/* Planets in Gujarati */}
                {planetLine && (
                  <text x={pos.x} y={pos.y + 14} textAnchor="middle" className="k-planets">
                    {planetLine}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="kundli-tap-hint">👆 ભાવ પર ટેપ કરો — વિગત / Tap house for details</p>

      <div className="kundli-summary simple">
        <span><strong>લગ્ન:</strong> {SIGN_GU_FULL[chart.ascendantSign]}</span>
        <span><strong>નક્ષત્ર:</strong> {moonNak.nameGu} (પાદ {moonNak.pada})</span>
      </div>

      <HouseInfoModal house={selectedHouse} chart={chart} onClose={() => setSelectedHouse(null)} />
    </div>
  );
}

export function PlanetTable({ chart }: { chart: BirthChart }) {
  const moonNak = getNakshatra(chart.planets.find((p) => p.name === 'Moon')!.longitude);

  return (
    <div className="planet-table-wrap">
      <h4 className="table-title">ગ્રહ સ્થિતિ</h4>
      <table className="planet-table">
        <thead>
          <tr>
            <th>ગ્રહ</th>
            <th>રાશિ</th>
            <th>ભાવ</th>
            <th>અંશ</th>
          </tr>
        </thead>
        <tbody>
          {chart.planets.map((p) => (
            <tr key={p.name}>
              <td>{PLANET_GU[p.name]}</td>
              <td>{SIGN_GU[p.sign]}</td>
              <td>{p.house}</td>
              <td>{p.degreeInSign.toFixed(1)}°</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="astro-depth simple">
        <p><strong>લગ્ન:</strong> {SIGN_GU_FULL[chart.ascendantSign]}</p>
        <p><strong>ચંદ્ર નક્ષત્ર:</strong> {moonNak.nameGu} — પાદ {moonNak.pada}</p>
        {HOUSE_INFO.slice(1, 3).map((info) => {
          const sign = (chart.ascendantSign + info.house - 1) % 12;
          const lord = getHouseLord(chart, info.house);
          return (
            <p key={info.house}>
              <strong>{info.house} ભાવ ({info.keywordsGu.join(', ')}):</strong>{' '}
              {SIGN_GU[sign]} · {PLANET_GU[lord]}
            </p>
          );
        })}
      </div>
    </div>
  );
}
