import type { BirthChart, PlanetName } from '../types';
import { SIGN_NAMES } from '../types';

const PLANET_SHORT: Record<PlanetName, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

const SIGN_SHORT = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

/** North Indian kundli — fixed house positions */
const KUNDLI_LAYOUT: (number | null)[][] = [
  [12, 1, 2, 3],
  [11, null, null, 4],
  [10, null, null, 5],
  [9, 8, 7, 6],
];

interface HouseData {
  house: number;
  sign: number;
  signName: string;
  signShort: string;
  planets: { name: PlanetName; short: string; degree: string }[];
}

function buildHouses(chart: BirthChart): Map<number, HouseData> {
  const map = new Map<number, HouseData>();
  for (let h = 1; h <= 12; h++) {
    const sign = (chart.ascendantSign + h - 1) % 12;
    const planets = chart.planets
      .filter((p) => p.house === h)
      .map((p) => ({
        name: p.name,
        short: PLANET_SHORT[p.name],
        degree: p.degreeInSign.toFixed(1),
      }));
    map.set(h, {
      house: h,
      sign,
      signName: SIGN_NAMES[sign],
      signShort: SIGN_SHORT[sign],
      planets,
    });
  }
  return map;
}

interface KundliChartProps {
  chart: BirthChart;
  name?: string;
  compact?: boolean;
}

export function KundliChart({ chart, name, compact = false }: KundliChartProps) {
  const houses = buildHouses(chart);

  return (
    <div className={`kundli-wrap ${compact ? 'compact' : ''}`}>
      {name && <p className="kundli-title">Kundli — {name}</p>}
      <div className="kundli-grid">
        {KUNDLI_LAYOUT.map((row, ri) =>
          row.map((houseNum, ci) => {
            if (houseNum === null) {
              return (
                <div
                  key={`empty-${ri}-${ci}`}
                  className="kundli-cell empty"
                  aria-hidden
                />
              );
            }
            const h = houses.get(houseNum)!;
            return (
              <div key={houseNum} className={`kundli-cell ${houseNum === 1 ? 'lagna-cell' : ''}`}>
                <span className="house-num">{houseNum}</span>
                <span className="sign-label">{h.signShort}</span>
                <div className="planet-list">
                  {h.planets.map((p) => (
                    <span key={p.name} className="planet-tag" title={`${p.name} ${p.degree}°`}>
                      {p.short}
                      {!compact && <sub>{p.degree}°</sub>}
                    </span>
                  ))}
                </div>
              </div>
            );
          }),
        )}
      </div>
      <div className="kundli-legend">
        <span>Lagna: {chart.ascendantSignName}</span>
        <span>Su Sun · Mo Moon · Ma Mars · Me Mercury · Ju Jupiter · Ve Venus · Sa Saturn · Ra Rahu · Ke Ketu</span>
      </div>
    </div>
  );
}

export function PlanetTable({ chart }: { chart: BirthChart }) {
  return (
    <table className="planet-table">
      <thead>
        <tr>
          <th>Graha</th>
          <th>Rashi</th>
          <th>House</th>
          <th>Degree</th>
        </tr>
      </thead>
      <tbody>
        {chart.planets.map((p) => (
          <tr key={p.name}>
            <td>{p.name}</td>
            <td>{p.signName}</td>
            <td>{p.house}</td>
            <td>{p.degreeInSign.toFixed(2)}°</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
