import type { NodePosition, NodeDef, EdgeDef } from './types';

export const MICA_ORANGE = '#FF7A00';
export const MICA_ORANGE_DIM = 'rgba(255,122,0,0.18)';
export const MICA_ORANGE_GLOW = 'rgba(255,122,0,0.7)';
// Slightly warmer, more on-brand node background with subtle orange glow
export const NODE_BG =
  'radial-gradient(circle at 30% 15%, rgba(255,122,0,0.24), rgba(8,10,26,0.96))';
export const LABEL_COLOR = 'rgba(255,255,255,0.6)';

export const NODE_POSITIONS: Record<string, NodePosition> = {
  // Nudge the start node a bit to the right and slightly larger so its shape is fully visible
  start:        { x: 340,  y: 420, r: 82  },
  productName:  { x: 560,  y: 400, r: 130 },
  whatDoesItDo: { x: 560,  y: 700, r: 135 },
  whoIsItFor:   { x: 840,  y: 250, r: 125 },
  hasDate:      { x: 840,  y: 560, r: 115 },
  datePicker:   { x: 1100, y: 680, r: 115 },
  hasBudget:    { x: 1360, y: 460, r: 115 },
  howMuch:      { x: 1600, y: 320, r: 120 },
  location:     { x: 1840, y: 500, r: 115 },
  tone:         { x: 2080, y: 340, r: 145 },
  attachDoc:    { x: 2320, y: 500, r: 110 },
  letsGo:       { x: 2540, y: 400, r: 85  },
};

export const NODES: NodeDef[] = [
  { id: 'start',        label: 'Start',                   inputType: 'button' },
  { id: 'productName',  label: 'Campaign Name',            inputType: 'text',     placeholder: 'The Art of Living Happiness Programme - May 2026',           valueKey: 'name' },
  { id: 'whatDoesItDo', label: "What's this for?",        inputType: 'textarea', placeholder: 'Meditation Classes',  valueKey: 'desc' },
  { id: 'whoIsItFor',   label: 'Who is it for?',          inputType: 'text',     placeholder: 'IT folks, age 25-55',  valueKey: 'audience' },
  { id: 'hasDate',      label: 'Does it have a date?',    inputType: 'yesno' },
  { id: 'datePicker',   label: 'Select Date',             inputType: 'date',     valueKey: 'date' },
  { id: 'hasBudget',    label: 'Have a budget in mind?',  inputType: 'yesno' },
  { id: 'howMuch',      label: 'How much?',               inputType: 'text',     placeholder: 'e.g. 50000',                   valueKey: 'budgetAmount' },
  { id: 'location',     label: 'Location',                inputType: 'choice',   choices: ['City', 'Online'],                 valueKey: 'location' },
  { id: 'tone',         label: 'Tone',                    inputType: 'choice',   choices: ['Casual', 'Professional', 'Warm & Inspirational', 'Urgent & Scarcity', 'Authority', 'Witty & Irreverent'], valueKey: 'tone' },
  { id: 'attachDoc',    label: 'Want to attach a doc?',   inputType: 'yesno' },
  { id: 'letsGo',       label: "LET'S GO!",               inputType: 'button' },
];

export const EDGES: EdgeDef[] = [
  { id: 'e1',  from: 'start',       to: 'productName' },
  { id: 'e2',  from: 'productName', to: 'whatDoesItDo' },
  { id: 'e3',  from: 'productName', to: 'whoIsItFor' },
  { id: 'e4',  from: 'productName', to: 'hasDate' },
  { id: 'e5',  from: 'hasDate',     to: 'datePicker',  condNode: 'hasDate',   condValue: true },
  { id: 'e6',  from: 'datePicker',  to: 'hasBudget',   condNode: 'hasDate',   condValue: true },
  { id: 'e7',  from: 'hasDate',     to: 'hasBudget',   condNode: 'hasDate',   condValue: false },
  { id: 'e8',  from: 'hasBudget',   to: 'howMuch',     condNode: 'hasBudget', condValue: true },
  { id: 'e9',  from: 'howMuch',     to: 'location',    condNode: 'hasBudget', condValue: true },
  { id: 'e10', from: 'hasBudget',   to: 'location',    condNode: 'hasBudget', condValue: false },
  { id: 'e11', from: 'location',    to: 'tone' },
  { id: 'e12', from: 'tone',        to: 'attachDoc' },
  { id: 'e13', from: 'attachDoc',   to: 'letsGo' },
];

export const STEP_TOTAL = 11;

export const SPRING_PAN = { stiffness: 50, damping: 25 };
export const SPRING_SCALE = { stiffness: 80, damping: 20 };
export const DRIFT_FACTOR = 0.02;
export const DRIFT_MAX = 20;
export const DRAG_ELASTIC = 0.15;
