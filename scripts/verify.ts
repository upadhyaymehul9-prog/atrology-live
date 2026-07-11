/**
 * Smoke test — run after changes: npm run verify
 */
import { computeBirthChart } from '../src/lib/ephemeris';
import { detectYogas } from '../src/lib/yogas';

const chart = computeBirthChart('1985-03-04', '03:40', 21.6267, 72.9906);
const yogas = detectYogas(chart);
const active = yogas.filter((y) => y.present);

console.log('✓ Chart computed — Lagna:', chart.ascendantSignName);
console.log('✓ Planets:', chart.planets.length);
console.log('✓ Yoga rules loaded:', yogas.length);
console.log('✓ Sample active yogas:', active.map((y) => y.name).join(', ') || 'none');

const required = ['kalsarpa', 'ardh-kalsarpa', 'mangal-dosh', 'gaj-kesari-yog'];
for (const id of required) {
  if (!yogas.find((y) => y.id === id)) throw new Error(`Missing yoga rule: ${id}`);
}
console.log('✓ All required yoga IDs present');
console.log('\nLocal verification passed.');
