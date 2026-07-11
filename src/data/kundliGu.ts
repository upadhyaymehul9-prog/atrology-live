/** Gujarati astrology labels for kundli */
export const SIGN_GU = [
  'મેષ', // Aries
  'વૃષભ',
  'મિથુન',
  'કર્ક',
  'સિંહ',
  'કન્યા',
  'તુલા',
  'વૃશ્ચિક',
  'ધનુ',
  'મકર',
  'કુંભ',
  'મીન',
] as const;

export const SIGN_GU_FULL = [
  'મેષ (એરીઝ)',
  'વૃષભ (ટૉરસ)',
  'મિથુન (જેમિની)',
  'કર્ક (કેન્સર)',
  'સિંહ (લીઓ)',
  'કન્યા (વર્ગો)',
  'તુલા (લિબ્રા)',
  'વૃશ્ચિક (સ્કોર્પિયો)',
  'ધનુ (સેજિટેરિયસ)',
  'મકર (કેપ્રિકોર્ન)',
  'કુંભ (એક્વેરિયસ)',
  'મીન (પિસીસ)',
] as const;

export const PLANET_GU: Record<string, string> = {
  Sun: 'રવિ',
  Moon: 'ચંદ્ર',
  Mars: 'મંગળ',
  Mercury: 'બુધ',
  Jupiter: 'ગુરુ',
  Venus: 'શુક્ર',
  Saturn: 'શનિ',
  Rahu: 'રાહુ',
  Ketu: 'કેતુ',
};

export const PLANET_SHORT_GU: Record<string, string> = {
  Sun: 'સૂ.',
  Moon: 'ચં.',
  Mars: 'મં.',
  Mercury: 'બુ.',
  Jupiter: 'ગુ.',
  Venus: 'શુ.',
  Saturn: 'શ.',
  Rahu: 'રા.',
  Ketu: 'કે.',
};

export const NAKSHATRA_GU = [
  'અશ્વિની', 'ભરણી', 'કૃત્તિકા', 'રોહિણી', 'મૃગશિરા', 'આર્દ્રા', 'પુનર્વસુ',
  'પુષ્ય', 'અશ્લેષા', 'મઘા', 'પૂર્વાફાલ્ગુની', 'ઉત્તરાફાલ્ગુની', 'હસ્ત',
  'ચિત્રા', 'સ્વાતિ', 'વિશાખા', 'અનુરાધા', 'જ્યેષ્ઠા', 'મૂળ', 'પૂર્વાષાઢા',
  'ઉત્તરાષાઢા', 'શ્રવણ', 'ધનિષ્ઠા', 'શતભિષા', 'પૂર્વાભાદ્ર', 'ઉત્તરાભાદ્ર', 'રેવતી',
] as const;

export interface HouseInfo {
  house: number;
  titleGu: string;
  keywordsGu: string[];
  meaningGu: string;
  meaningEn: string;
}

/** 12 bhava significations — Gujarati keywords inside kundli houses */
export const HOUSE_INFO: HouseInfo[] = [
  {
    house: 1,
    titleGu: 'લગ્ન — પહેલું ભાવ',
    keywordsGu: ['શરીર', 'સ્વભાવ', 'વ્યક્તિત્વ'],
    meaningGu: 'લગ્ન ભાવ તમારું શરીર, સ્વભાવ, વ્યક્તિત્વ, આરોગ્ય અને જીવનની દિશા દર્શાવે છે.',
    meaningEn: '1st house — self, body, personality, health, and overall life direction (Lagna).',
  },
  {
    house: 2,
    titleGu: 'બીજું ભાવ',
    keywordsGu: ['પરિવાર', 'નોકરી', 'ધન'],
    meaningGu: 'પરિવાર, વાણી, ધન, સંપત્તિ, ભોજન અને વડીલ ભાઈ-બહેનનું ભાવ છે.',
    meaningEn: '2nd house — family, speech, wealth, assets, food, and elder siblings.',
  },
  {
    house: 3,
    titleGu: 'ત્રીજું ભાવ',
    keywordsGu: ['ભાઈ', 'બહેન', 'સાહસ'],
    meaningGu: 'યુવા ભાઈ-બહેન, સાહસ, લેખન, ટૂંકી યાત્રા અને કૌશલ્ય.',
    meaningEn: '3rd house — younger siblings, courage, communication, short travels, skills.',
  },
  {
    house: 4,
    titleGu: 'ચોથું ભાવ',
    keywordsGu: ['માતા', 'ઘર', 'વાહન', 'મિલકત'],
    meaningGu: 'માતા, ઘર, સુખ, જમીન, વાહન, શિક્ષા અને મનની શાંતિ.',
    meaningEn: '4th house — mother, home, happiness, property, vehicles, inner peace.',
  },
  {
    house: 5,
    titleGu: 'પાંચમું ભાવ',
    keywordsGu: ['અભ્યાસ', 'સંતાન', 'બુદ્ધિ'],
    meaningGu: 'સંતાન, શિક્ષા, બુદ્ધિ, પ્રેમ, પૂર્વ પુણ્ય અને રચનાત્મકતા.',
    meaningEn: '5th house — children, education, intelligence, romance, past merit, creativity.',
  },
  {
    house: 6,
    titleGu: 'છઠ્ઠું ભાવ',
    keywordsGu: ['શત્રુ', 'રોગ', 'ઋણ'],
    meaningGu: 'રોગ, શત્રુ, ઋણ, સેવા, મહેનત અને કાનૂની વિવાદ.',
    meaningEn: '6th house — diseases, enemies, debts, service, daily work, litigation.',
  },
  {
    house: 7,
    titleGu: 'સાતમું ભાવ',
    keywordsGu: ['પતિ', 'પત્ની', 'મિત્ર', 'ભાગીદારી'],
    meaningGu: 'વિવાહ, જીવનસાથી, વ્યવસાયિક ભાગીદારી, મિત્રતા અને જાહેર સંબંધ.',
    meaningEn: '7th house — marriage, spouse, business partnership, public relations.',
  },
  {
    house: 8,
    titleGu: 'આઠમું ભાવ',
    keywordsGu: ['આયુષ્ય', 'રહસ્ય', 'વારસો'],
    meaningGu: 'આयુષ્ય, રહસ્ય, વારસો, અચાનક ઘટનાઓ, આત્મિક રૂપાંતર.',
    meaningEn: '8th house — longevity, mysteries, inheritance, sudden events, transformation.',
  },
  {
    house: 9,
    titleGu: 'નવમું ભાવ',
    keywordsGu: ['ભાગ્ય', 'ધર્મ', 'ગુરુ'],
    meaningGu: 'ભાગ્ય, ધર્મ, પિતા, ગુરુ, ઉચ્ચ શિક્ષા અને લાંબી યાત્રા.',
    meaningEn: '9th house — fortune, dharma, father, guru, higher learning, long journeys.',
  },
  {
    house: 10,
    titleGu: 'દસમું ભાવ',
    keywordsGu: ['કર્મ', 'પિતા', 'વ્યવસાય'],
    meaningGu: 'કર્મ, વ્યવસાય, પ્રતિષ્ઠા, સરકારી ક્ષેત્ર અને જીવનની ઉંચાઈ.',
    meaningEn: '10th house — career, profession, status, authority, public life.',
  },
  {
    house: 11,
    titleGu: 'અગિયારમું ભાવ',
    keywordsGu: ['લાભ', 'સિદ્ધિ', 'મિત્ર'],
    meaningGu: 'લાભ, આવક, મitrો, aspiration fulfillment અને elder network.',
    meaningEn: '11th house — gains, income, friends, fulfillment of desires.',
  },
  {
    house: 12,
    titleGu: 'બારમું ભાવ',
    keywordsGu: ['ખર્ચ', 'વિદેશ', 'મોક્ષ'],
    meaningGu: 'ખર્ચ, વિદેશ, એકાંત, ધ્યાન, મોક્ષ અને છુપા adversaries.',
    meaningEn: '12th house — expenses, foreign lands, solitude, spirituality, liberation.',
  },
];

export function getNakshatra(longitude: number): { index: number; name: string; nameGu: string; pada: number } {
  const span = 360 / 27;
  const index = Math.floor(longitude / span) % 27;
  const pada = Math.floor((longitude % span) / (span / 4)) + 1;
  return {
    index,
    name: ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Moola','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'][index],
    nameGu: NAKSHATRA_GU[index],
    pada,
  };
}
