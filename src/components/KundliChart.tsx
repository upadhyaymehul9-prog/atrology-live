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

/**
 * North Indian fixed house centres — geometric centroids inside each region
 * (viewBox 420×420, grid x=36 y=36 size=348, center=210).
 * Keeps sign numbers and planets off the red grid lines.
 */
const HOUSE_CENTERS: Record<number, { x: number; y: number }> = {
  1: { x: 210, y: 123 }, // top centre diamond
  2: { x: 123, y: 65 }, // top-left corner triangle
  3: { x: 65, y: 123 }, // left upper triangle
  4: { x: 123, y: 210 }, // left centre diamond
  5: { x: 65, y: 297 }, // left lower triangle
  6: { x: 123, y: 355 }, // bottom-left corner triangle
  7: { x: 210, y: 297 }, // bottom centre diamond
  8: { x: 297, y: 355 }, // bottom-right corner triangle
  9: { x: 355, y: 297 }, // right lower triangle
  10: { x: 297, y: 210 }, // right centre diamond
  11: { x: 355, y: 123 }, // right upper triangle
  12: { x: 297, y: 65 }, // top-right corner triangle
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

function HousePlanets({ x, y, planets }: { x: number; y: number; planets: PlanetName[] }) {
  if (planets.length === 0) return null;
  const lineHeight = planets.length > 2 ? 13 : 15;
  return (
    <text x={x} y={y} textAnchor="middle" className="k-planets">
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

          {/* Red North Indian lines: outer square + diagonals + rhombus joining side midpoints */}
          <rect x={gx} y={gy} width={gs} height={gs} fill="#fff9f0" stroke="#b91c1c" strokeWidth="2" />
          <line x1={gx} y1={gy} x2={gx + gs} y2={gy + gs} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gx + gs} y1={gy} x2={gx} y2={gy + gs} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gm} y1={gy} x2={gx} y2={gm} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gm} y1={gy} x2={gx + gs} y2={gm} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gm} y1={gy + gs} x2={gx} y2={gm} stroke="#b91c1c" strokeWidth="1.4" />
          <line x1={gm} y1={gy + gs} x2={gx + gs} y2={gm} stroke="#b91c1c" strokeWidth="1.4" />

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
                  x={pos.x - 30}
                  y={pos.y - 26}
                  width="60"
                  height="52"
                  rx="4"
                  className="k-hit-area"
                />
                <text x={pos.x} y={pos.y - 10} textAnchor="middle" className="k-sign-num">
                  {h.signNum}
                </text>
                <text x={pos.x} y={pos.y + 6} textAnchor="middle" className="k-sign-name">
                  {SIGN_GU[h.sign]}
                </text>
                <HousePlanets x={pos.x} y={pos.y + 20} planets={h.planets} />
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
