import {
  degreeDistance,
  getHouseLord,
  getKalSarpTypeName,
  getPlanet,
  hasMaleficInHouse,
  isArdhKalSarpa,
  isDusthana,
  isKalSarpa,
  isKendraFrom,
  isLordInHouses,
  sameSign,
} from './ephemeris';
import type { BirthChart, PlanetName, YogaId, YogaResult } from '../types';

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

const CLASSICAL: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const MALEFICS: PlanetName[] = ['Saturn', 'Mars', 'Rahu', 'Ketu'];

const OWN_SIGNS: Partial<Record<PlanetName, number[]>> = {
  Mars: [0, 7],
  Venus: [1, 6],
  Mercury: [2, 5],
  Moon: [3],
  Sun: [4],
  Jupiter: [8, 11],
  Saturn: [9, 10],
};

const YOGA_RULES: YogaRule[] = [
  // ── Kaal Sarp family ──
  {
    id: 'kalsarpa',
    name: 'Kaal Sarp Dosh (Full Kal Sarpa Yoga)',
    nameHi: 'काल सर्प दोष',
    category: 'dosha',
    severity: 'high',
    description:
      'All seven planets lie on one side of the Rahu–Ketu axis — full Kaal Sarp Dosh. Type depends on Rahu house (Anant, Kulik, Vasuki, etc.).',
    remedy: 'Kal Sarpa puja, Nag devata worship, Rahu-Ketu shanti.',
    check: isKalSarpa,
  },
  {
    id: 'ardh-kalsarpa',
    name: 'Ardh Kal Sarp Dosh (Partial Kaal Sarp)',
    nameHi: 'अर्ध कालसर्प दोष',
    category: 'dosha',
    severity: 'medium',
    description:
      '5 or 6 of 7 planets lie between Rahu and Ketu — partial/half Kaal Sarp. Not as severe as full Kaal Sarp, but still significant.',
    remedy: 'Ardh Kal Sarpa shanti, Rahu-Ketu puja, Nag dosh nivaran.',
    check: isArdhKalSarpa,
  },
  {
    id: 'sarp-dosh',
    name: 'Naga Dosh (Partial — not Kaal Sarp)',
    nameHi: 'नाग दोष',
    category: 'dosha',
    severity: 'medium',
    description:
      'Rahu in 1st/2nd house, or 3+ planets in Rahu/Ketu signs. Different from Ardh or full Kaal Sarp.',
    remedy: 'Nag puja, Rahu shanti.',
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

  // ── Ancestral & family doshas ──
  {
    id: 'pitru-dosh',
    name: 'Pitru Dosh',
    nameHi: 'पितृ दोष',
    category: 'dosha',
    severity: 'high',
    description: 'Sun with Rahu, Rahu in 9th house, or afflicted 9th — ancestral karmic debt from father\'s line.',
    remedy: 'Pitru tarpan, Shraddha, charity on Amavasya.',
    check: (chart) => {
      const sun = getPlanet(chart, 'Sun');
      const rahu = getPlanet(chart, 'Rahu');
      const saturn = getPlanet(chart, 'Saturn');
      if (sameSign(sun, rahu)) return true;
      if (rahu.house === 9) return true;
      if (sun.house === 9) return true;
      if (saturn.house === 9 && sameSign(saturn, rahu)) return true;
      if (hasMaleficInHouse(chart, 9)) return true;
      return false;
    },
  },
  {
    id: 'matru-dosh',
    name: 'Matru Dosh',
    nameHi: 'मातृ दोष',
    category: 'dosha',
    severity: 'high',
    description: 'Moon afflicted in 4th house or with Rahu/Saturn/Mars — karmic issues from mother\'s line.',
    remedy: 'Matru puja, Chandra shanti, charity to mothers.',
    check: (chart) => {
      const moon = getPlanet(chart, 'Moon');
      const rahu = getPlanet(chart, 'Rahu');
      const saturn = getPlanet(chart, 'Saturn');
      const mars = getPlanet(chart, 'Mars');
      if (moon.house === 4 && (sameSign(moon, rahu) || sameSign(moon, saturn) || sameSign(moon, mars)))
        return true;
      if (sameSign(moon, rahu) || sameSign(moon, saturn)) return true;
      if (rahu.house === 4 || saturn.house === 4) return true;
      return false;
    },
  },
  {
    id: 'putra-dosh',
    name: 'Putra Dosh',
    nameHi: 'पुत्र दोष',
    category: 'dosha',
    severity: 'medium',
    description: '5th house or its lord afflicted by Rahu, Ketu, or Saturn — obstacles related to children/progeny.',
    remedy: 'Santan Gopal mantra, 5th house lord puja, Jupiter remedies.',
    check: (chart) => {
      if (hasMaleficInHouse(chart, 5)) return true;
      return isLordInHouses(chart, 5, [6, 8, 12]);
    },
  },

  // ── Eclipse & lunar doshas ──
  {
    id: 'grahan-dosh',
    name: 'Grahan Dosh',
    nameHi: 'ग्रहण दोष',
    category: 'dosha',
    severity: 'high',
    description: 'Sun or Moon conjoined with Rahu or Ketu — eclipse yoga in the chart.',
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
    id: 'amavasya-dosh',
    name: 'Amavasya Dosh',
    nameHi: 'अमावस्या दोष',
    category: 'dosha',
    severity: 'medium',
    description: 'Sun and Moon in same sign within 12° — born near new moon, Pitru/ ancestral implications.',
    remedy: 'Pitru tarpan on Amavasya, Surya-Chandra shanti.',
    check: (chart) => {
      const sun = getPlanet(chart, 'Sun');
      const moon = getPlanet(chart, 'Moon');
      return sameSign(sun, moon) && degreeDistance(sun.longitude, moon.longitude) <= 12;
    },
  },
  {
    id: 'gand-mool',
    name: 'Gand Mool Nakshatra',
    nameHi: 'गंड मूल',
    category: 'dosha',
    severity: 'high',
    description: 'Moon in Ashwini, Ashlesha, Magha, Jyeshtha, Moola, or Revati nakshatra.',
    remedy: 'Gand Mool shanti puja within 27 days of birth (or remedial puja now).',
    check: (chart) => {
      const moonLon = getPlanet(chart, 'Moon').longitude;
      const nakshatraIndex = Math.floor(moonLon / (360 / 27));
      return [0, 8, 9, 17, 18, 26].includes(nakshatraIndex);
    },
  },

  // ── Graha doshas ──
  {
    id: 'mangal-dosh',
    name: 'Mangal Dosh (Kuja Dosha)',
    nameHi: 'मंगल दोष',
    category: 'dosha',
    severity: 'high',
    description: 'Mars in 1st, 2nd, 4th, 7th, 8th, or 12th house — affects marriage and temperament.',
    remedy: 'Mangal shanti puja, Hanuman worship, Kumbh vivah.',
    check: (chart) => [1, 2, 4, 7, 8, 12].includes(getPlanet(chart, 'Mars').house),
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
      return (
        sameSign(moon, getPlanet(chart, 'Saturn')) ||
        sameSign(moon, getPlanet(chart, 'Rahu')) ||
        sameSign(moon, getPlanet(chart, 'Ketu')) ||
        isDusthana(moon.house)
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
      return (
        sameSign(sun, getPlanet(chart, 'Saturn')) ||
        sameSign(sun, getPlanet(chart, 'Rahu')) ||
        sameSign(sun, getPlanet(chart, 'Ketu')) ||
        isDusthana(sun.house)
      );
    },
  },
  {
    id: 'shani-dosh',
    name: 'Shani Dosh',
    nameHi: 'शनि दोष',
    category: 'dosha',
    severity: 'high',
    description: 'Saturn in 1st, 4th, 7th, 8th, 12th or conjunct Moon/Sun — delays and hardships.',
    remedy: 'Shani shanti puja, Hanuman worship, Saturday charity.',
    check: (chart) => {
      const saturn = getPlanet(chart, 'Saturn');
      return (
        [1, 4, 7, 8, 12].includes(saturn.house) ||
        sameSign(saturn, getPlanet(chart, 'Moon')) ||
        sameSign(saturn, getPlanet(chart, 'Sun'))
      );
    },
  },
  {
    id: 'budh-dosh',
    name: 'Budh Dosh',
    nameHi: 'बुध दोष',
    category: 'dosha',
    severity: 'medium',
    description: 'Mercury with Mars, Saturn, or Rahu, or Mercury in 6th/8th/12th — speech, business, intellect afflicted.',
    remedy: 'Budh graha shanti, emerald consultation, Vishnu worship.',
    check: (chart) => {
      const mercury = getPlanet(chart, 'Mercury');
      return (
        sameSign(mercury, getPlanet(chart, 'Mars')) ||
        sameSign(mercury, getPlanet(chart, 'Saturn')) ||
        sameSign(mercury, getPlanet(chart, 'Rahu')) ||
        isDusthana(mercury.house)
      );
    },
  },
  {
    id: 'shukra-dosh',
    name: 'Shukra Dosh',
    nameHi: 'शुक्र दोष',
    category: 'dosha',
    severity: 'medium',
    description: 'Venus with Sun, Saturn, or Rahu, or Venus in 6th/8th/12th — relationships and comforts affected.',
    remedy: 'Shukra graha shanti, diamond/white sapphire, Friday fasting.',
    check: (chart) => {
      const venus = getPlanet(chart, 'Venus');
      return (
        sameSign(venus, getPlanet(chart, 'Sun')) ||
        sameSign(venus, getPlanet(chart, 'Saturn')) ||
        sameSign(venus, getPlanet(chart, 'Rahu')) ||
        isDusthana(venus.house)
      );
    },
  },
  {
    id: 'rahu-dosh',
    name: 'Rahu Dosh',
    nameHi: 'राहु दोष',
    category: 'dosha',
    severity: 'high',
    description: 'Rahu in 6th, 8th, 12th house or with Sun/Moon — confusion, sudden ups and downs.',
    remedy: 'Rahu shanti, Durga/Chandi paath, hessonite garnet consultation.',
    check: (chart) => {
      const rahu = getPlanet(chart, 'Rahu');
      return (
        isDusthana(rahu.house) ||
        sameSign(rahu, getPlanet(chart, 'Sun')) ||
        sameSign(rahu, getPlanet(chart, 'Moon'))
      );
    },
  },
  {
    id: 'ketu-dosh',
    name: 'Ketu Dosh',
    nameHi: 'केतु दोष',
    category: 'dosha',
    severity: 'medium',
    description: 'Ketu in 1st, 2nd, 7th, or 8th house — detachment, health or partnership challenges.',
    remedy: 'Ketu shanti, Ganesha worship, cat\'s eye consultation.',
    check: (chart) => [1, 2, 7, 8].includes(getPlanet(chart, 'Ketu').house),
  },

  // ── Combined / affliction yogas ──
  {
    id: 'chandal-yog',
    name: 'Chandal Yoga',
    nameHi: 'चांडाल योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Jupiter with Rahu or Ketu — wisdom and dharma face obstacles.',
    remedy: 'Guru vandana, yellow sapphire consultation, Ganesh puja.',
    check: (chart) => {
      const jupiter = getPlanet(chart, 'Jupiter');
      return sameSign(jupiter, getPlanet(chart, 'Rahu')) || sameSign(jupiter, getPlanet(chart, 'Ketu'));
    },
  },
  {
    id: 'guru-chandal',
    name: 'Guru Chandal Yoga',
    nameHi: 'गुरु चांडाल योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Jupiter conjoined Rahu — unorthodox knowledge, guru-related challenges.',
    remedy: 'Thursday fasting, Guru charity, education seva.',
    check: (chart) => sameSign(getPlanet(chart, 'Jupiter'), getPlanet(chart, 'Rahu')),
  },
  {
    id: 'kemadruma',
    name: 'Kemadruma Yoga',
    nameHi: 'केमद्रुम योग',
    category: 'yoga',
    severity: 'medium',
    description: 'No planets (except nodes) in signs adjacent to Moon — poverty of support, loneliness.',
    remedy: 'Chandra shanti, pearl, Monday fasting.',
    check: (chart) => {
      const moon = getPlanet(chart, 'Moon');
      const sign2 = (moon.sign + 1) % 12;
      const sign12 = (moon.sign + 11) % 12;
      const in2 = chart.planets.some((p) => CLASSICAL.includes(p.name) && p.sign === sign2);
      const in12 = chart.planets.some((p) => CLASSICAL.includes(p.name) && p.sign === sign12);
      return !in2 && !in12;
    },
  },
  {
    id: 'vish-yog',
    name: 'Vish Yoga',
    nameHi: 'विष योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Saturn and Moon in same sign — mental stress, emotional burden.',
    remedy: 'Shani-Chandra shanti, Saturday-Monday charity.',
    check: (chart) => sameSign(getPlanet(chart, 'Saturn'), getPlanet(chart, 'Moon')),
  },
  {
    id: 'shrapit-yog',
    name: 'Shrapit Yoga',
    nameHi: 'श्रापित योग',
    category: 'yoga',
    severity: 'high',
    description: 'Saturn and Rahu together — karmic curse from past lives.',
    remedy: 'Shani-Rahu shanti, ancestor healing rituals.',
    check: (chart) => sameSign(getPlanet(chart, 'Saturn'), getPlanet(chart, 'Rahu')),
  },
  {
    id: 'angarak-yog',
    name: 'Angarak Yoga',
    nameHi: 'अंगारक योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Mars with Rahu — aggression, accidents, fiery temperament.',
    remedy: 'Hanuman Chalisa, Mangal-Rahu shanti puja.',
    check: (chart) => sameSign(getPlanet(chart, 'Mars'), getPlanet(chart, 'Rahu')),
  },
  {
    id: 'pishacha-yog',
    name: 'Pishacha / Pret Badha Yoga',
    nameHi: 'पिशाच / प्रेत बाधा',
    category: 'yoga',
    severity: 'high',
    description: 'Rahu in 12th with Moon in 8th, or Rahu-Moon in dusthana houses — spirit obstruction.',
    remedy: 'Hanuman Chalisa, Mahamrityunjaya jaap, spiritual cleansing puja.',
    check: (chart) => {
      const rahu = getPlanet(chart, 'Rahu');
      const moon = getPlanet(chart, 'Moon');
      if (rahu.house === 12 && moon.house === 8) return true;
      if (sameSign(rahu, moon) && (isDusthana(rahu.house) || isDusthana(moon.house))) return true;
      return rahu.house === 8 && moon.house === 12;
    },
  },
  {
    id: 'shakat-yog',
    name: 'Shakat Yoga',
    nameHi: 'शकट योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Jupiter in 6th, 8th, or 12th from Moon — obstacles despite talent (cart yoga).',
    remedy: 'Jupiter remedies, Guru puja, Thursday charity.',
    check: (chart) => {
      const moon = getPlanet(chart, 'Moon');
      const jupiter = getPlanet(chart, 'Jupiter');
      const dist = (jupiter.sign - moon.sign + 12) % 12;
      return dist === 5 || dist === 7 || dist === 11;
    },
  },
  {
    id: 'daridra-yog',
    name: 'Daridra Yoga',
    nameHi: 'दरिद्र योग',
    category: 'yoga',
    severity: 'medium',
    description: '2nd or 11th lord in 6th, 8th, or 12th — financial struggles indicated.',
    remedy: 'Lakshmi puja, strengthen 2nd/11th lords, charity.',
    check: (chart) =>
      isLordInHouses(chart, 2, [6, 8, 12]) || isLordInHouses(chart, 11, [6, 8, 12]),
  },
  {
    id: 'bhandan-yog',
    name: 'Bhandan Yoga',
    nameHi: 'बंधन योग',
    category: 'yoga',
    severity: 'medium',
    description: 'Saturn and Rahu in mutual kendras, or Rahu in 12th with Saturn in 2nd — bondage/restriction.',
    remedy: 'Rahu-Saturn shanti, Hanuman worship, release rituals.',
    check: (chart) => {
      const rahu = getPlanet(chart, 'Rahu');
      const saturn = getPlanet(chart, 'Saturn');
      if (rahu.house === 12 && saturn.house === 2) return true;
      if (sameSign(rahu, saturn)) return true;
      return isKendraFrom(rahu.sign, saturn.sign);
    },
  },

  // ── Paap Kartari ──
  {
    id: 'paap-kartari',
    name: 'Paap Kartari Yoga (Lagna)',
    nameHi: 'पाप कर्तरी (लग्न)',
    category: 'yoga',
    severity: 'medium',
    description: 'Lagna hemmed by malefics in 2nd and 12th houses from ascendant.',
    remedy: 'Lagna shuddhi puja, strengthen ascendant lord.',
    check: (chart) => {
      const house12 = (chart.ascendantSign + 11) % 12;
      const house2 = (chart.ascendantSign + 1) % 12;
      const in12 = chart.planets.some((p) => MALEFICS.includes(p.name) && p.sign === house12);
      const in2 = chart.planets.some((p) => MALEFICS.includes(p.name) && p.sign === house2);
      return in12 && in2;
    },
  },
  {
    id: 'papa-kartari-moon',
    name: 'Paap Kartari Yoga (Moon)',
    nameHi: 'पाप कर्तरी (चंद्र)',
    category: 'yoga',
    severity: 'medium',
    description: 'Moon hemmed by malefics in adjacent signs — mental/emotional pressure.',
    remedy: 'Chandra shanti, Monday fasting.',
    check: (chart) => {
      const moon = getPlanet(chart, 'Moon');
      const sign2 = (moon.sign + 1) % 12;
      const sign12 = (moon.sign + 11) % 12;
      const in2 = chart.planets.some((p) => MALEFICS.includes(p.name) && p.sign === sign2);
      const in12 = chart.planets.some((p) => MALEFICS.includes(p.name) && p.sign === sign12);
      return in2 && in12;
    },
  },
  {
    id: 'papa-kartari-sun',
    name: 'Paap Kartari Yoga (Sun)',
    nameHi: 'पाप कर्तरी (सूर्य)',
    category: 'yoga',
    severity: 'medium',
    description: 'Sun hemmed by malefics in adjacent signs — authority and vitality blocked.',
    remedy: 'Surya shanti, Sunday charity.',
    check: (chart) => {
      const sun = getPlanet(chart, 'Sun');
      const sign2 = (sun.sign + 1) % 12;
      const sign12 = (sun.sign + 11) % 12;
      const in2 = chart.planets.some((p) => MALEFICS.includes(p.name) && p.sign === sign2);
      const in12 = chart.planets.some((p) => MALEFICS.includes(p.name) && p.sign === sign12);
      return in2 && in12;
    },
  },

  // ── Benefic yogas ──
  {
    id: 'gaj-kesari-yog',
    name: 'Gaj Kesari Yoga',
    nameHi: 'गज केसरी योग',
    category: 'yoga',
    severity: 'low',
    description: 'Jupiter in kendra (1,4,7,10) from Moon — wisdom, fame, and prosperity.',
    remedy: 'Maintain Guru bhakti — this is a benefic yoga.',
    check: (chart) => {
      const moon = getPlanet(chart, 'Moon');
      const jupiter = getPlanet(chart, 'Jupiter');
      const dist = (jupiter.sign - moon.sign + 12) % 12;
      return dist === 0 || dist === 3 || dist === 6 || dist === 9;
    },
  },
  {
    id: 'chandra-mangal-yog',
    name: 'Chandra Mangal Yoga',
    nameHi: 'चंद्र मंगल योग',
    category: 'yoga',
    severity: 'low',
    description: 'Moon and Mars together — wealth through enterprise; can also bring impulsiveness.',
    remedy: 'Balance with Hanuman/Chandra puja if overly aggressive.',
    check: (chart) => sameSign(getPlanet(chart, 'Moon'), getPlanet(chart, 'Mars')),
  },
  {
    id: 'guru-mangal-yog',
    name: 'Guru Mangal Yoga',
    nameHi: 'गुरु मंगल योग',
    category: 'yoga',
    severity: 'low',
    description: 'Jupiter and Mars together — technical skill, courage with wisdom.',
    remedy: 'Benefic — strengthen with Guru and Hanuman worship.',
    check: (chart) => sameSign(getPlanet(chart, 'Jupiter'), getPlanet(chart, 'Mars')),
  },
  {
    id: 'sunfa-yog',
    name: 'Sunfa Yoga',
    nameHi: 'सुनफा योग',
    category: 'yoga',
    severity: 'low',
    description: 'Planet (except Sun) in 2nd house from Moon — self-made prosperity.',
    remedy: 'Benefic yoga — maintain dharmic conduct.',
    check: (chart) => {
      const sign2 = (getPlanet(chart, 'Moon').sign + 1) % 12;
      return chart.planets.some((p) => p.name !== 'Sun' && p.name !== 'Rahu' && p.name !== 'Ketu' && p.sign === sign2);
    },
  },
  {
    id: 'anafa-yog',
    name: 'Anafa Yoga',
    nameHi: 'अनफा योग',
    category: 'yoga',
    severity: 'low',
    description: 'Planet (except Sun) in 12th house from Moon — spiritual inclination and hidden gains.',
    remedy: 'Benefic — good for meditation and charity.',
    check: (chart) => {
      const sign12 = (getPlanet(chart, 'Moon').sign + 11) % 12;
      return chart.planets.some((p) => p.name !== 'Sun' && p.name !== 'Rahu' && p.name !== 'Ketu' && p.sign === sign12);
    },
  },
  {
    id: 'durudhara-yog',
    name: 'Durudhara Yoga',
    nameHi: 'दुरुधरा योग',
    category: 'yoga',
    severity: 'low',
    description: 'Planets in both 2nd and 12th from Moon — wealth, vehicles, and comforts.',
    remedy: 'Benefic — share prosperity through charity.',
    check: (chart) => {
      const moon = getPlanet(chart, 'Moon');
      const sign2 = (moon.sign + 1) % 12;
      const sign12 = (moon.sign + 11) % 12;
      const in2 = chart.planets.some((p) => CLASSICAL.includes(p.name) && p.name !== 'Moon' && p.sign === sign2);
      const in12 = chart.planets.some((p) => CLASSICAL.includes(p.name) && p.name !== 'Moon' && p.sign === sign12);
      return in2 && in12;
    },
  },
  {
    id: 'dhana-yog',
    name: 'Dhana Yoga',
    nameHi: 'धन योग',
    category: 'yoga',
    severity: 'low',
    description: '2nd and 11th lords connected (same sign or mutual kendras) — wealth accumulation.',
    remedy: 'Benefic — Lakshmi worship enhances results.',
    check: (chart) => {
      const lord2 = getPlanet(chart, getHouseLord(chart, 2));
      const lord11 = getPlanet(chart, getHouseLord(chart, 11));
      if (lord2.sign === lord11.sign) return true;
      return isKendraFrom(lord2.sign, lord11.sign);
    },
  },

  // ── Panch Mahapurusha Yogas ──
  {
    id: 'ruchaka-yog',
    name: 'Ruchaka Yoga (Mars)',
    nameHi: 'रुचक महापुरुष',
    category: 'yoga',
    severity: 'low',
    description: 'Mars in own sign (Aries/Scorpio) in kendra — courage, leadership, warrior qualities.',
    remedy: 'Benefic — Hanuman worship.',
    check: (chart) => {
      const mars = getPlanet(chart, 'Mars');
      return OWN_SIGNS.Mars!.includes(mars.sign) && [1, 4, 7, 10].includes(mars.house);
    },
  },
  {
    id: 'bhadra-yog',
    name: 'Bhadra Yoga (Mercury)',
    nameHi: 'भद्र महापुरुष',
    category: 'yoga',
    severity: 'low',
    description: 'Mercury in own sign (Gemini/Virgo) in kendra — intelligence, eloquence.',
    remedy: 'Benefic — Vishnu worship.',
    check: (chart) => {
      const mercury = getPlanet(chart, 'Mercury');
      return OWN_SIGNS.Mercury!.includes(mercury.sign) && [1, 4, 7, 10].includes(mercury.house);
    },
  },
  {
    id: 'hamsa-yog',
    name: 'Hamsa Yoga (Jupiter)',
    nameHi: 'हंस महापुरुष',
    category: 'yoga',
    severity: 'low',
    description: 'Jupiter in own sign (Sagittarius/Pisces) in kendra — wisdom, spirituality, prosperity.',
    remedy: 'Benefic — Guru puja.',
    check: (chart) => {
      const jupiter = getPlanet(chart, 'Jupiter');
      return OWN_SIGNS.Jupiter!.includes(jupiter.sign) && [1, 4, 7, 10].includes(jupiter.house);
    },
  },
  {
    id: 'malavya-yog',
    name: 'Malavya Yoga (Venus)',
    nameHi: 'मालव्य महापुरुष',
    category: 'yoga',
    severity: 'low',
    description: 'Venus in own sign (Taurus/Libra) in kendra — beauty, luxury, artistic talent.',
    remedy: 'Benefic — Lakshmi/Friday worship.',
    check: (chart) => {
      const venus = getPlanet(chart, 'Venus');
      return OWN_SIGNS.Venus!.includes(venus.sign) && [1, 4, 7, 10].includes(venus.house);
    },
  },
  {
    id: 'shasha-yog',
    name: 'Shasha Yoga (Saturn)',
    nameHi: 'शश महापुरुष',
    category: 'yoga',
    severity: 'low',
    description: 'Saturn in own sign (Capricorn/Aquarius) in kendra — authority through discipline.',
    remedy: 'Benefic — Shani worship with discipline.',
    check: (chart) => {
      const saturn = getPlanet(chart, 'Saturn');
      return OWN_SIGNS.Saturn!.includes(saturn.sign) && [1, 4, 7, 10].includes(saturn.house);
    },
  },
  {
    id: 'neecha-bhanga-yog',
    name: 'Neecha Bhanga Raja Yoga',
    nameHi: 'नीच भंग राज योग',
    category: 'yoga',
    severity: 'low',
    description: 'Debilitated planet\'s weakness cancelled — adversity transforms into rise.',
    remedy: 'Strengthen the debilitated planet\'s remedies.',
    check: (chart) => {
      const debilitations: Partial<Record<PlanetName, number>> = {
        Sun: 6,
        Moon: 7,
        Mars: 3,
        Mercury: 11,
        Jupiter: 9,
        Venus: 5,
        Saturn: 0,
      };
      for (const [name, debSign] of Object.entries(debilitations)) {
        const p = getPlanet(chart, name as PlanetName);
        if (p.sign !== debSign) continue;
        const exaltSign = (debSign + 6) % 12;
        const inExaltSign = chart.planets.some((pl) => pl.sign === exaltSign);
        if (inExaltSign || p.house === 1) return true;
      }
      return false;
    },
  },
];

export function detectYogas(chart: BirthChart): YogaResult[] {
  const results = YOGA_RULES.map((rule) => ({
    id: rule.id,
    name: rule.name,
    nameHi: rule.nameHi,
    category: rule.category,
    severity: rule.severity,
    present: rule.check(chart),
    description: rule.description,
    remedy: rule.remedy,
  }));

  // Enrich full Kaal Sarp with its 12-type name
  const kalsarpa = results.find((y) => y.id === 'kalsarpa' && y.present);
  if (kalsarpa) {
    const rahuHouse = getPlanet(chart, 'Rahu').house;
    const type = getKalSarpTypeName(rahuHouse);
    kalsarpa.name = `${type.name} (Full Kaal Sarp)`;
    kalsarpa.nameHi = type.nameHi;
    kalsarpa.description = `${kalsarpa.description} Your type: ${type.name} — Rahu in house ${rahuHouse}.`;
  }

  return results;
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
