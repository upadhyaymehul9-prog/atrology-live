import { getPlanet, isKalSarpa, sameSign } from './ephemeris';
import type { BirthChart, YogaId, YogaResult } from '../types';

interface YogaRule {
  id: YogaId;
  name: string;
  nameHi: string;
  category: 'dosha' | 'yoga';
  severity: 'high' | 'medium' | 'low';
  description: string;
  remedy: string;
  check: (chart: BirthChart) => boolean;
}

const YOGA_RULES: YogaRule[] = [
  {
    id: 'kalsarpa',
    name: 'Kaal Sarp Dosh (Kal Sarpa Yoga)',
    nameHi: 'काल सर्प दोष',
    category: 'dosha',
    severity: 'high',
    description:
      'All seven planets (Sun to Saturn) lie on one side of the Rahu–Ketu axis. This is the full Kaal Sarp Dosh — not the same as partial Naga Dosh.',
    remedy: 'Kal Sarpa puja, Nag devata worship, Rahu-Ketu shanti.',
    check: isKalSarpa,
  },
  {
    id: 'pitru-dosh',
    name: 'Pitru Dosh',
    nameHi: 'पितृ दोष',
    category: 'dosha',
    severity: 'high',
    description:
      'Sun with Rahu, Rahu in 9th house, or afflicted 9th house — ancestral karmic debt.',
    remedy: 'Pitru tarpan, Shraddha, charity on Amavasya.',
    check: (chart) => {
      const sun = getPlanet(chart, 'Sun');
      const rahu = getPlanet(chart, 'Rahu');
      const saturn = getPlanet(chart, 'Saturn');
      if (sameSign(sun, rahu)) return true;
      if (rahu.house === 9) return true;
      if (sun.house === 9 && (sameSign(sun, rahu) || sameSign(sun, saturn))) return true;
      if (saturn.house === 9 && sameSign(saturn, rahu)) return true;
      return false;
    },
  },
  {
    id: 'grahan-dosh',
    name: 'Grahan Dosh',
    nameHi: 'ग्रहण दोष',
    category: 'dosha',
    severity: 'high',
    description: 'Sun or Moon conjoined with Rahu or Ketu — eclipse combination in the chart.',
    remedy: 'Surya/Chandra grahan shanti, Mahamrityunjaya jaap.',
    check: (chart) => {
      const sun = getPlanet(chart, 'Sun');
      const moon = getPlanet(chart, 'Moon');
      const rahu = getPlanet(chart, 'Rahu');
      const ketu = getPlanet(chart, 'Ketu');
      return (
        sameSign(sun, rahu) ||
        sameSign(sun, ketu) ||
        sameSign(moon, rahu) ||
        sameSign(moon, ketu)
      );
    },
  },
  {
    id: 'chandal-yog',
    name: 'Chandal Yoga',
    nameHi: 'चांडाल योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Jupiter afflicted by Rahu or Ketu — wisdom and fortune may face hurdles.',
    remedy: 'Guru vandana, yellow sapphire consultation, Ganesh puja.',
    check: (chart) => {
      const jupiter = getPlanet(chart, 'Jupiter');
      const rahu = getPlanet(chart, 'Rahu');
      const ketu = getPlanet(chart, 'Ketu');
      return sameSign(jupiter, rahu) || sameSign(jupiter, ketu);
    },
  },
  {
    id: 'guru-chandal',
    name: 'Guru Chandal Yoga',
    nameHi: 'गुरु चांडाल योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Jupiter with Rahu — mix of wisdom and unorthodox tendencies.',
    remedy: 'Thursday fasting, Guru charity, education-related seva.',
    check: (chart) => sameSign(getPlanet(chart, 'Jupiter'), getPlanet(chart, 'Rahu')),
  },
  {
    id: 'mangal-dosh',
    name: 'Mangal Dosh (Kuja Dosha)',
    nameHi: 'मंगल दोष',
    category: 'dosha',
    severity: 'high',
    description: 'Mars placed in 1st, 2nd, 4th, 7th, 8th, or 12th house — affects marriage.',
    remedy: 'Mangal shanti puja, Hanuman worship, Kumbh vivah rituals.',
    check: (chart) => {
      const mars = getPlanet(chart, 'Mars');
      return [1, 2, 4, 7, 8, 12].includes(mars.house);
    },
  },
  {
    id: 'kemadruma',
    name: 'Kemadruma Yoga',
    nameHi: 'केमद्रुम योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Moon without supporting planets in adjacent signs — emotional isolation.',
    remedy: 'Chandra shanti, pearl consultation, Monday fasting.',
    check: (chart) => {
      const moon = getPlanet(chart, 'Moon');
      const sign2 = (moon.sign + 1) % 12;
      const sign12 = (moon.sign + 11) % 12;
      const classical = ['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
      const in2 = chart.planets.some((p) => classical.includes(p.name) && p.sign === sign2);
      const in12 = chart.planets.some((p) => classical.includes(p.name) && p.sign === sign12);
      return !in2 && !in12;
    },
  },
  {
    id: 'vish-yog',
    name: 'Vish Yoga',
    nameHi: 'विष योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Saturn and Moon in the same sign — mental stress and emotional heaviness.',
    remedy: 'Shani-Chandra shanti, Saturday-Monday charity.',
    check: (chart) => sameSign(getPlanet(chart, 'Saturn'), getPlanet(chart, 'Moon')),
  },
  {
    id: 'shrapit-yog',
    name: 'Shrapit Yoga',
    nameHi: 'श्रापित योग',
    category: 'yoga',
    severity: 'high',
    description: 'Saturn and Rahu together — karmic curse pattern from past lives.',
    remedy: 'Shani-Rahu shanti, ancestor healing rituals.',
    check: (chart) => sameSign(getPlanet(chart, 'Saturn'), getPlanet(chart, 'Rahu')),
  },
  {
    id: 'angarak-yog',
    name: 'Angarak Yoga',
    nameHi: 'अंगारक योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Mars with Rahu — fiery aggression, accidents, impulsive actions.',
    remedy: 'Hanuman Chalisa, Mangal-Rahu shanti puja.',
    check: (chart) => sameSign(getPlanet(chart, 'Mars'), getPlanet(chart, 'Rahu')),
  },
  {
    id: 'sarp-dosh',
    name: 'Naga Dosh (Partial — not Kaal Sarp)',
    nameHi: 'नाग दोष',
    category: 'dosha',
    severity: 'medium',
    description:
      'Partial snake affliction: Rahu in 1st/2nd house, or 3+ planets in Rahu/Ketu signs. This is NOT the same as full Kaal Sarp Dosh (Kal Sarpa Yoga).',
    remedy: 'Nag puja, Rahu shanti. If Kaal Sarp Dosh is also present, do full Kal Sarpa puja.',
    check: (chart) => {
      const rahu = getPlanet(chart, 'Rahu');
      if (rahu.house === 1 || rahu.house === 2) return true;
      const rahuSign = rahu.sign;
      const ketuSign = getPlanet(chart, 'Ketu').sign;
      const count = chart.planets.filter(
        (p) =>
          !['Rahu', 'Ketu'].includes(p.name) &&
          (p.sign === rahuSign || p.sign === ketuSign),
      ).length;
      return count >= 3;
    },
  },
  {
    id: 'chandra-dosh',
    name: 'Chandra Dosh',
    nameHi: 'चंद्र दोष',
    category: 'dosha',
    severity: 'medium',
    description: 'Afflicted Moon — with Saturn, Rahu, Ketu, or in 6th/8th/12th house.',
    remedy: 'Chandra graha shanti, pearl, Monday rituals.',
    check: (chart) => {
      const moon = getPlanet(chart, 'Moon');
      const saturn = getPlanet(chart, 'Saturn');
      const rahu = getPlanet(chart, 'Rahu');
      const ketu = getPlanet(chart, 'Ketu');
      return (
        sameSign(moon, saturn) ||
        sameSign(moon, rahu) ||
        sameSign(moon, ketu) ||
        [6, 8, 12].includes(moon.house)
      );
    },
  },
  {
    id: 'surya-dosh',
    name: 'Surya Dosh',
    nameHi: 'सूर्य दोष',
    category: 'dosha',
    severity: 'medium',
    description: 'Afflicted Sun — with Saturn, Rahu, Ketu, or in 6th/8th/12th house.',
    remedy: 'Surya graha shanti, Surya namaskar, ruby consultation.',
    check: (chart) => {
      const sun = getPlanet(chart, 'Sun');
      const saturn = getPlanet(chart, 'Saturn');
      const rahu = getPlanet(chart, 'Rahu');
      const ketu = getPlanet(chart, 'Ketu');
      return (
        sameSign(sun, saturn) ||
        sameSign(sun, rahu) ||
        sameSign(sun, ketu) ||
        [6, 8, 12].includes(sun.house)
      );
    },
  },
  {
    id: 'paap-kartari',
    name: 'Paap Kartari Yoga',
    nameHi: 'पाप कर्तरी योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Lagna hemmed by malefics (Saturn, Mars, Rahu, Ketu) in adjacent houses.',
    remedy: 'Lagna shuddhi puja, strengthen ascendant lord.',
    check: (chart) => {
      const malefics = ['Saturn', 'Mars', 'Rahu', 'Ketu'] as const;
      const house12 = chart.ascendantSign === 0 ? 11 : chart.ascendantSign - 1;
      const house2 = (chart.ascendantSign + 1) % 12;
      const in12 = chart.planets.some(
        (p) => malefics.includes(p.name as (typeof malefics)[number]) && p.sign === house12,
      );
      const in2 = chart.planets.some(
        (p) => malefics.includes(p.name as (typeof malefics)[number]) && p.sign === house2,
      );
      return in12 && in2;
    },
  },
  {
    id: 'gand-mool',
    name: 'Gand Mool Nakshatra',
    nameHi: 'गंड मूल',
    category: 'dosha',
    severity: 'high',
    description:
      'Moon in Ashwini, Ashlesha, Magha, Jyeshtha, Moola, or Revati nakshatra ranges.',
    remedy: 'Gand Mool shanti puja within 27 days of birth (or remedial puja now).',
    check: (chart) => {
      const moonLon = getPlanet(chart, 'Moon').longitude;
      const nakshatraIndex = Math.floor(moonLon / (360 / 27));
      const gandMoolNakshatras = [0, 8, 9, 17, 18, 26];
      return gandMoolNakshatras.includes(nakshatraIndex);
    },
  },
];

export function detectYogas(chart: BirthChart): YogaResult[] {
  return YOGA_RULES.map((rule) => ({
    id: rule.id,
    name: rule.name,
    nameHi: rule.nameHi,
    category: rule.category,
    severity: rule.severity,
    present: rule.check(chart),
    description: rule.description,
    remedy: rule.remedy,
  }));
}

export function getYogaCatalog(): Pick<
  YogaResult,
  'id' | 'name' | 'nameHi' | 'category' | 'severity' | 'description'
>[] {
  return YOGA_RULES.map(({ id, name, nameHi, category, severity, description }) => ({
    id,
    name,
    nameHi,
    category,
    severity,
    description,
  }));
}

export { YOGA_RULES };
