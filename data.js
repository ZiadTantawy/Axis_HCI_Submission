'use strict';
/* Mock data for the Axis prototype. All AI output (OCR readings, confidences,
   suggested marks, learning gaps) is hard-coded, as the course brief allows. */

/* Ink strings: what the child actually wrote. [[...]] marks the region the OCR is unsure about. */
const QS = [
  {
    id: 'q1', n: 1, conf: 96,
    prompt: { en: 'Calculate 3 × 4.', de: 'Berechne 3 · 4.' },
    ink: { en: '3 × 4 = [[12]]', de: '3 · 4 = [[12]]' },
    cands: [{ v: '12', full: { en: '3 × 4 = 12', de: '3 · 4 = 12' }, met: [0], p: 96 }],
    crit: [{ t: 'Correct product', m: 1 }]
  },
  {
    id: 'q2', n: 2, conf: 68,
    prompt: {
      en: 'Mia packs 30 pencils into boxes of 5. How many boxes does she need?',
      de: 'Mia packt 30 Stifte in Schachteln zu je 5. Wie viele Schachteln braucht sie?'
    },
    ink: { en: '[[6 boxes]]', de: '[[6 Schachteln]]' },
    cands: [
      { v: { en: '6 boxes', de: '6 Schachteln' }, full: { en: '6 boxes', de: '6 Schachteln' }, met: [0], p: 68 },
      { v: { en: '6 Boxes', de: '6 Schachtel' }, full: { en: '6 Boxes', de: '6 Schachtel' }, met: [0], p: 21 },
      { v: { en: '6 box', de: '6 Schachtein' }, full: { en: '6 box', de: '6 Schachtein' }, met: [0], p: 11 }
    ],
    crit: [{ t: 'Correct number of boxes (6)', m: 1 }]
  },
  {
    id: 'q3', n: 3, conf: 94,
    prompt: { en: 'Add: 1/2 + 1/4', de: 'Addiere: 1/2 + 1/4' },
    ink: { en: '1/2 + 1/4 = [[3/4]]', de: '1/2 + 1/4 = [[3/4]]' },
    cands: [{ v: '3/4', full: { en: '1/2 + 1/4 = 3/4', de: '1/2 + 1/4 = 3/4' }, met: [0], p: 94 }],
    crit: [{ t: 'Correct sum (3/4)', m: 1 }]
  },
  {
    id: 'q4', n: 4, conf: 61,
    prompt: { en: 'What is the denominator of 7/12?', de: 'Was ist der Nenner von 7/12?' },
    ink: { en: 'The denominator is [[12]]', de: 'Der Nenner ist [[12]]' },
    cands: [
      { v: '12', note: { en: 'twelve', de: 'zwölf' }, full: { en: 'The denominator is 12', de: 'Der Nenner ist 12' }, met: [0], p: 61 },
      { v: '17', note: { en: 'seventeen', de: 'siebzehn' }, full: { en: 'The denominator is 17', de: 'Der Nenner ist 17' }, met: [], p: 24 },
      { v: '72', note: { en: 'seventy-two', de: 'zweiundsiebzig' }, full: { en: 'The denominator is 72', de: 'Der Nenner ist 72' }, met: [], p: 15 }
    ],
    crit: [{ t: 'Names 12 as the denominator', m: 2 }]
  },
  {
    id: 'q5', n: 5, conf: 83,
    prompt: {
      en: 'Which fraction is larger, 2/5 or 3/5? Write < or >.',
      de: 'Welcher Bruch ist größer, 2/5 oder 3/5? Schreibe < oder >.'
    },
    ink: { en: '2/5 [[<]] 3/5', de: '2/5 [[<]] 3/5' },
    cands: [
      { v: '<', full: { en: '2/5 < 3/5', de: '2/5 < 3/5' }, met: [0], p: 83 },
      { v: '>', full: { en: '2/5 > 3/5', de: '2/5 > 3/5' }, met: [], p: 17 }
    ],
    crit: [{ t: 'Correct comparison sign', m: 1 }]
  },
  {
    id: 'q6', n: 6, conf: 92,
    prompt: { en: 'Compare 2/3 and 5/8. Explain your answer.', de: 'Vergleiche 2/3 und 5/8. Erkläre deine Antwort.' },
    ink: {
      en: '5/8 > 2/3 because [[5 is bigger than 2]]',
      de: '5/8 > 2/3, weil [[5 größer als 2 ist]]'
    },
    cands: [{
      v: '5/8 > 2/3',
      full: { en: '5/8 > 2/3 because 5 is bigger than 2', de: '5/8 > 2/3, weil 5 größer als 2 ist' },
      met: [], p: 92
    }],
    crit: [
      { t: 'States the correct relation (2/3 > 5/8)', m: 1 },
      { t: 'Valid method (common denominator or decimals)', m: 1 }
    ]
  }
];

const STUDENT = { name: 'Lina', grade: 'Grade 4', cls: '4A' };
const PARENT_NAME = "Lina's parent";

const PRIOR = [
  { label: 'Exam 1', name: 'Fractions Intro', pct: 62 },
  { label: 'Exam 2', name: 'Mixed Fractions', pct: 68 }
];

/* Verified error history for Lina from earlier exams (mock). */
const HISTORY = [
  { exam: 'Exam 1 · Q3', text: 'Compared only the numerators', verified: true },
  { exam: 'Exam 2 · Q5', text: 'Compared only the numerators', verified: true }
];

const MOCK_CLASS = [
  { name: 'Omar', status: 'Published', tone: 'green' },
  { name: 'Salma', status: 'Verified · ready to finalize', tone: 'teal' },
  { name: 'Youssef', status: 'Needs OCR review', tone: 'amber' },
  { name: 'Nour', status: 'Not submitted yet', tone: 'grey' }
];

/* Anonymous class mistake patterns: teacher wording, student wording. No names, no counts for students. */
const PATTERNS = [
  {
    id: 'p1',
    teacher: 'Comparing only the top numbers',
    count: '7 students',
    title: 'Comparing only the top numbers',
    explain: 'Look at the bottom numbers too. 3/4 and 3/8 have the same top number, but they are not the same size.'
  },
  {
    id: 'p2',
    teacher: 'Mixing numerator and denominator',
    count: '5 students',
    title: 'Mixing the top and bottom numbers',
    explain: 'The bottom number (denominator) says how many equal parts there are. The top number (numerator) says how many parts we count.'
  }
];

const REASONS = ['Tired day', 'Topic not taught yet', 'Other'];

const DEFAULT_FEEDBACK = 'You worked well on multiplication and on adding fractions.';
const DEFAULT_SUPPORT = 'Let us practise fractions together.';
const DEFAULT_PRACTICE = ['Compare fractions', 'Check denominators'];
