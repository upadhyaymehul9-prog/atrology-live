import {
  Body,
  Ecliptic,
  GeoVector,
  MakeTime,
  Rotation_EQJ_ECL,
  RotateVector,
} from 'astronomy-engine';
import { SIGN_NAMES, type BirthChart, type PlanetName, type PlanetPosition } from '../types';

const PLANET_BODIES: Record<Exclude<PlanetName, 'Rahu' | 'Ketu'>, Body> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mars: Body.Mars,
  Mercury: Body.Mercury,
  Jupiter: Body.Jupiter,
  Venus: Body.Venus,
  Saturn: Body.Saturn,
};

/** Lahiri ayanamsa in degrees for a given Julian centuries from J2000 */
function lahiriAyanamsa(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0;
  return 23.85675 + 0.01397 * t + 0.0000025 * t * t;
}

function julianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;

  let yr = y;
  let mo = m;
  if (mo <= 2) {
    yr -= 1;
    mo += 12;
  }

  const a = Math.floor(yr / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (yr + 4716)) + Math.floor(30.6001 * (mo + 1)) + d + b - 1524.5;
}

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function tropicalLongitude(body: Body, time: ReturnType<typeof MakeTime>): number {
  const vec = GeoVector(body, time, true);
  const rot = RotateVector(Rotation_EQJ_ECL(), vec);
  const ecliptic = Ecliptic(rot);
  return normalizeDegrees(ecliptic.elon);
}

/** Mean Rahu (north node) tropical longitude */
function meanRahuLongitude(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0;
  return normalizeDegrees(125.04452 - 1934.136261 * t);
}

function toSidereal(tropical: number, ayanamsa: number): number {
  return normalizeDegrees(tropical - ayanamsa);
}

function getSign(longitude: number): { sign: number; degreeInSign: number } {
  const sign = Math.floor(longitude / 30);
  const degreeInSign = longitude - sign * 30;
  return { sign: sign === 12 ? 11 : sign, degreeInSign };
}

function getHouse(planetSign: number, ascSign: number): number {
  return ((planetSign - ascSign + 12) % 12) + 1;
}

/** Compute ascendant sidereal longitude */
function computeAscendant(
  date: Date,
  latitude: number,
  longitude: number,
  ayanamsa: number,
): number {
  const jd = julianDay(date);
  const t = (jd - 2451545.0) / 36525.0;

  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  const lst = normalizeDegrees(gmst + longitude);
  const ramc = lst;
  const obliquity = 23.439291 - 0.0130042 * t;

  const ramcRad = (ramc * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;
  const oblRad = (obliquity * Math.PI) / 180;

  const y = Math.cos(ramcRad);
  const x = -Math.sin(ramcRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad);
  const ascTropical = normalizeDegrees((Math.atan2(y, x) * 180) / Math.PI);
  return toSidereal(ascTropical, ayanamsa);
}

function buildPlanetPosition(
  name: PlanetName,
  siderealLon: number,
  ascSign: number,
): PlanetPosition {
  const { sign, degreeInSign } = getSign(siderealLon);
  return {
    name,
    longitude: siderealLon,
    sign,
    signName: SIGN_NAMES[sign],
    house: getHouse(sign, ascSign),
    degreeInSign,
  };
}

export function computeBirthChart(
  birthDate: string,
  birthTime: string,
  latitude: number,
  longitude: number,
): BirthChart {
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);

  const localDate = new Date(year, month - 1, day, hour, minute, 0);
  const utcOffsetMs = localDate.getTimezoneOffset() * 60 * 1000;
  const utcDate = new Date(localDate.getTime() - utcOffsetMs);

  const jd = julianDay(utcDate);
  const ayanamsa = lahiriAyanamsa(jd);
  const astroTime = MakeTime(utcDate);

  const ascSidereal = computeAscendant(utcDate, latitude, longitude, ayanamsa);
  const { sign: ascSign } = getSign(ascSidereal);

  const planets: PlanetPosition[] = [];

  for (const [name, body] of Object.entries(PLANET_BODIES) as [
    Exclude<PlanetName, 'Rahu' | 'Ketu'>,
    Body,
  ][]) {
    const tropical = tropicalLongitude(body, astroTime);
    const sidereal = toSidereal(tropical, ayanamsa);
    planets.push(buildPlanetPosition(name, sidereal, ascSign));
  }

  const rahuTropical = meanRahuLongitude(jd);
  const rahuSidereal = toSidereal(rahuTropical, ayanamsa);
  const ketuSidereal = normalizeDegrees(rahuSidereal + 180);

  planets.push(buildPlanetPosition('Rahu', rahuSidereal, ascSign));
  planets.push(buildPlanetPosition('Ketu', ketuSidereal, ascSign));

  return {
    ascendantSign: ascSign,
    ascendantSignName: SIGN_NAMES[ascSign],
    planets,
    birthDateTime: localDate,
  };
}

export function getPlanet(chart: BirthChart, name: PlanetName): PlanetPosition {
  const p = chart.planets.find((pl) => pl.name === name);
  if (!p) throw new Error(`Planet ${name} not found`);
  return p;
}

export function sameSign(a: PlanetPosition, b: PlanetPosition): boolean {
  return a.sign === b.sign;
}

export function isBetween(long: number, start: number, end: number): boolean {
  if (start <= end) {
    return long >= start && long <= end;
  }
  return long >= start || long <= end;
}

/** All classical planets hemmed on one side of Rahu-Ketu axis */
export function isKalSarpa(chart: BirthChart): boolean {
  const classical = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
  const rahu = getPlanet(chart, 'Rahu').longitude;
  const ketu = getPlanet(chart, 'Ketu').longitude;

  const longs = classical.map((n) => getPlanet(chart, n).longitude);

  const allInRahuToKetu = longs.every((l) => isBetween(l, rahu, ketu));
  const allInKetuToRahu = longs.every((l) => isBetween(l, ketu, rahu));

  return allInRahuToKetu || allInKetuToRahu;
}

export function signDistance(from: number, to: number): number {
  return (to - from + 12) % 12;
}

export function hasPlanetInHouseFrom(
  chart: BirthChart,
  fromPlanet: PlanetName,
  houseOffset: number,
  exclude: PlanetName[] = ['Rahu', 'Ketu'],
): boolean {
  const from = getPlanet(chart, fromPlanet);
  const targetSign = (from.sign + houseOffset) % 12;
  return chart.planets.some(
    (p) => !exclude.includes(p.name) && p.name !== fromPlanet && p.sign === targetSign,
  );
}
