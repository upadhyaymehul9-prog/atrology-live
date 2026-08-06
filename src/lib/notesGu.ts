/**
 * Convert common romanized Gujarati puja-note phrases to Gujarati script
 * for cards & WhatsApp (e.g. "Thadi, Vadki, Chamchi lavani").
 */
const PHRASE_MAP: [RegExp, string][] = [
  [/thadi\s*,\s*vadki\s*,\s*chamchi\s+lavani/gi, 'થાળી, વાટકી, ચમચી લાવવાની'],
  [/thadi\s*,\s*vadki\s*,\s*chamchi\s+lavavani/gi, 'થાળી, વાટકી, ચમચી લાવવાની'],
  [/thali\s*,\s*vatki\s*,\s*chamchi\s+lavani/gi, 'થાળી, વાટકી, ચમચી લાવવાની'],
];

/** Longer / multi-word first, then single words */
const WORD_MAP: [RegExp, string][] = [
  [/lavavani/gi, 'લાવવાની'],
  [/lavani/gi, 'લાવવાની'],
  [/lavisu/gi, 'લાવીશું'],
  [/lavjo/gi, 'લાવજો'],
  [/rehse/gi, 'રહેશે'],
  [/rahese/gi, 'રહેશે'],
  [/aavjo/gi, 'આવજો'],
  [/avjo/gi, 'આવજો'],
  [/thadi/gi, 'થાળી'],
  [/thali/gi, 'થાળી'],
  [/vadki/gi, 'વાટકી'],
  [/vatki/gi, 'વાટકી'],
  [/vaatki/gi, 'વાટકી'],
  [/chamchi/gi, 'ચમચી'],
  [/chamach/gi, 'ચમચ'],
  [/kalash/gi, 'કળશ'],
  [/nariyal/gi, 'નારિયેળ'],
  [/coconut/gi, 'નારિયેળ'],
  [/supari/gi, 'સોપારી'],
  [/agarbatti/gi, 'અગરબત્તી'],
  [/diyo/gi, 'દીવો'],
  [/diya/gi, 'દીવો'],
  [/phool/gi, 'ફૂલ'],
  [/flowers?/gi, 'ફૂલ'],
  [/prasad/gi, 'પ્રસાદ'],
  [/mandir/gi, 'મંદિર'],
  [/pase/gi, 'પાસે'],
  [/ni\b/gi, 'ની'],
  [/puja/gi, 'પૂજા'],
  [/pooja/gi, 'પૂજા'],
  [/samagri/gi, 'સામગ્રી'],
  [/saamagri/gi, 'સામગ્રી'],
];

export function notesToGujarati(input: string): string {
  let text = input.trim();
  if (!text) return text;

  for (const [re, gu] of PHRASE_MAP) {
    text = text.replace(re, gu);
  }
  for (const [re, gu] of WORD_MAP) {
    text = text.replace(re, gu);
  }

  // Tidy leftover English commas/spaces
  return text.replace(/\s+,/g, ',').replace(/,\s*/g, ', ').replace(/\s+/g, ' ').trim();
}
