import { useState } from 'react';
import type { BirthChart, PlanetName } from '../types';
import {
  getNakshatra,
  PLANET_GU,
  PLANET_SHORT_GU,
  SIGN_GU,
  SIGN_GU_FULL,
} from '../data/kundliGu';
import { HouseInfoModal } from './HouseInfoModal';

/** North Indian fixed house centres (viewBox 420×420) */
const HOUSE_CENTERS: Record<number, { x: number; y: number; anchor: 'start' | 'middle' | 'end' }> = {
  1: { x: 210, y: 98, anchor: 'middle' },
  2: { x: 98, y: 98, anchor: 'middle' },
  3: { x: 48, y: 210, anchor: 'middle' },
  4: { x: 98, y: 322, anchor: 'middle' },
  5: { x: 98, y: 368, anchor: 'middle' },
  6: { x: 210, y: 368, anchor: 'middle' },
  7: { x: 210, y: 322, anchor: 'middle' },
  8: { x: 322, y: 368, anchor: 'middle' },
  9: { x: 372, y: 210, anchor: 'middle' },
  10: { x: 322, y: 322, anchor: 'middle' },
  11: { x: 322, y: 98, anchor: 'middle' },
  12: { x: 372, y: 98, anchor: 'middle' },
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

function HousePlanets({
  x,
  y,
  planets,
  anchor,
}: {
  x: number;
  y: number;
  planets: PlanetName[];
  anchor: string;
}) {
  if (planets.length === 0) return null;
  const lineHeight = planets.length > 2 ? 13 : 15;
  return (
    <text x={x} y={y} textAnchor={anchor as 'middle'} className="k-planets">
      {planets.map((p, i) => (
        <tspan key={p} x={x} dy={i === 0 ? 0 : lineHeight}>
          {PLANET_SHORT_GU[p]}
        </tspan>
      ))}
    </text>
  );
}

interface KundliChartProps {
  chart: BirthChart;
  name?: string;
}

export function KundliChart({ chart, name }: KundliChartProps) {
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const houses = buildHouses(chart);
  const moonNak = getNakshatra(chart.planets.find((p) => p.name === 'Moon')!.longitude);

  const grid = { x: 36, y: 36, size: 348, mid: 210 };
  const { x: gx, y: gy, size: gs, mid: gm } = grid;

  return (
    <div className="kundli-wrap">
      {name && <p className="kundli-title">જન્મ કુંડળી — {name}</p>}

      <div className="kundli-card">
        <svg viewBox="0 0 420 420" className="kundli-svg" aria-label="North Indian Kundli">
          <defs>
            <filter id="kundli-shadow" x="-4%" y="-4%" width="108%" height="108%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Chart paper */}
          <rect
            x={gx - 4}
            y={gy - 4}
            width={gs + 8}
            height={gs + 8}
            fill="#fff9f0"
            rx="6"
            filter="url(#kundli-shadow)"
          />

          {/* Red North Indian lines */}
          <rect x={gx} y={gy} width={gs} height={gs} fill="#fff9f0" stroke="#b91c1c" strokeWidth="2" />
          <line x1={gx} y1={gy} x2={gx + gs} y2={gy + gs} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gx + gs} y1={gy} x2={gx} y2={gy + gs} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gm} y1={gy} x2={gm} y2={gm} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gx + gs} y1={gm} x2={gm} y2={gm} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gm} y1={gy + gs} x2={gm} y2={gm} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gx} y1={gm} x2={gm} y2={gm} stroke="#b91c1c" strokeWidth="1.4" />

          {/* Lagna */}
          <text x={gm} y={gy - 10} textAnchor="middle" className="k-lagna-mark">
            લ
          </text>

          {Array.from({ length: 12 }, (_, i) => i + 1).map((houseNum) => {
            const h = houses.get(houseNum)!;
            const pos = HOUSE_CENTERS[houseNum];
            const isLagna = houseNum === 1;
            return (
              <g
                key={houseNum}
                className={`k-house-group ${isLagna ? 'is-lagna' : ''}`}
                onClick={() => setSelectedHouse(houseNum)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedHouse(houseNum)}
              >
                <rect
                  x={pos.x - 34}
                  y={pos.y - 28}
                  width="68"
                  height="56"
                  rx="4"
                  className="k-hit-area"
                />
                <text x={pos.x} y={pos.y - 4} textAnchor={pos.anchor} className="k-sign-num">
                  {h.signNum}
                </text>
                <text x={pos.x} y={pos.y + 10} textAnchor={pos.anchor} className="k-sign-name">
                  {SIGN_GU[h.sign]}
                </text>
                <HousePlanets
                  x={pos.x}
                  y={pos.y + 18}
                  planets={h.planets}
                  anchor={pos.anchor}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <p className="kundli-tap-hint">ભાવ પર ટેપ કરો · Tap house for details</p>

      <div className="kundli-summary simple">
        <span><strong>લગ્ન:</strong> {SIGN_GU_FULL[chart.ascendantSign]}</span>
        <span><strong>નક્ષત્ર:</strong> {moonNak.nameGu} · પાદ {moonNak.pada}</span>
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
      </div>
    </div>
  );
}
