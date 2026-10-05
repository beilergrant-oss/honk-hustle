// loadingThemes.js - which look the loading screen wears today, plus the data that describes each look.
// Priority: holiday > season > regular. Dates come from themes.js so the shop and the loading screen always agree.
import { SETS, activeWindow, easterSunday } from './themes.js';

export const APP_NAME = 'Honk Hustle';
export const APP_TAGLINE = 'Unjam the traffic. Fill the buses.';

const DAY = 86400000;
const PASSENGER_COLORS = ['#ff4d4d', '#9b5de5', '#3ddc84', '#ff9f1c', '#ff5fa8', '#2f9bff'];

// ---- Visual description of every theme (the renderer in loadingScreen.js reads these) ----
//   sky: [top, bottom]   celestial: 'sun' | 'sunset' | 'moon' | 'none'   stars: night sky
//   trees: palm | blossom | round | pine | bare   treeColors: [leaf, accent]   hills: [back, front]   skyline: bool
//   ground/sidewalk/road colors   particles: {type, colors, count}
//   bus: body, trim, pattern {id, colors}, roof [...items], hats [...per passenger], grille extras
export const THEMES = {
  regular: {
    id: 'regular', name: 'Sunny Streets', sky: ['#35b6ff', '#d2f3ff'], celestial: 'sun', stars: false, sea: '#19c6d9',
    trees: 'palm', treeColors: ['#3fc24b', '#8a5a2b'], hills: null, skyline: ['#ffd3a8', '#ffb3c7', '#b9e4ff', '#ffe28a'],
    ground: '#7f8cab', sidewalk: '#f5dca6', particles: { type: 'none', colors: [], count: 0 },
    bus: { body: '#ffb81c', trim: '#ff8a1f', pattern: { id: 'flowers', colors: ['#ff4d4d', '#3ddc84'] }, roof: ['surfboard', 'lifebuoy', 'luggage'], hats: ['sunhat', 'shades', 'none', 'shades', 'sunhat'], extras: [] },
    sign: ['BEACH', 'CITY', 'FUN'], title: ['#ffd23f', '#ff8a1f'], title2: ['#5fd4ff', '#2f7bff'],
  },
  spring: {
    id: 'spring', name: 'Spring Bloom', sky: ['#8fdcff', '#effcff'], celestial: 'sun', stars: false, sea: null,
    trees: 'blossom', treeColors: ['#ffb3d1', '#7a4a2b'], hills: ['#a8e6a0', '#7fd68a'], skyline: null,
    ground: '#8fa0b8', sidewalk: '#c8f0b0', particles: { type: 'petal', colors: ['#ffc2dd', '#ffffff', '#ffe08a'], count: 16 },
    bus: { body: '#7fe0a8', trim: '#ff9ec6', pattern: { id: 'petals', colors: ['#ffffff', '#ffd23f'] }, roof: ['flowerPot', 'luggage', 'flowerPot'], hats: ['flowerCrown', 'flowerCrown', 'none', 'flowerCrown', 'sunhat'], extras: [] },
    sign: ['BLOOM', 'PICNIC', 'PETALS'], title: ['#ffe27a', '#ff9ec6'], title2: ['#8fe8b5', '#2fae7a'],
  },
  summer: {
    id: 'summer', name: 'Summer Beach', sky: ['#ff8f5a', '#ffe7a8'], celestial: 'sunset', stars: false, sea: '#17b8d6',
    trees: 'palm', treeColors: ['#2fbf5a', '#8a5a2b'], hills: null, skyline: null,
    ground: '#8d8fb0', sidewalk: '#ffe0a0', particles: { type: 'sparkle', colors: ['#ffffff', '#fff3a0'], count: 12 },
    bus: { body: '#22c1c3', trim: '#ff7a59', pattern: { id: 'sun', colors: ['#fff3b0'] }, roof: ['umbrella', 'surfboard', 'luggage'], hats: ['shades', 'sunhat', 'shades', 'none', 'sunhat'], extras: [] },
    sign: ['SURF', 'SAND', 'SUN'], title: ['#fff08a', '#ff9f1c'], title2: ['#6fe3ff', '#1f8fe0'],
  },
  autumn: {
    id: 'autumn', name: 'Autumn Harvest', sky: ['#ffb067', '#ffe8c4'], celestial: 'sunset', stars: false, sea: null,
    trees: 'round', treeColors: ['#e8782a', '#b5381f'], hills: ['#e0a95a', '#c98a3a'], skyline: null,
    ground: '#8a7c8c', sidewalk: '#e6c28a', particles: { type: 'leaf', colors: ['#e8782a', '#b5381f', '#ffb21f', '#c4552a'], count: 16 },
    bus: { body: '#d9731f', trim: '#8a3d1e', pattern: { id: 'leaves', colors: ['#ffd27a'] }, roof: ['leafPile', 'pumpkin', 'luggage'], hats: ['acorn', 'none', 'acorn', 'beanie', 'none'], extras: [] },
    sign: ['LEAVES', 'CIDER', 'COZY'], title: ['#ffd27a', '#e8782a'], title2: ['#ffb067', '#c4552a'],
  },
  winter: {
    id: 'winter', name: 'Winter Snow', sky: ['#a6d3ff', '#f4faff'], celestial: 'none', stars: false, sea: null,
    trees: 'pine', treeColors: ['#2f8f6a', '#ffffff'], hills: ['#ffffff', '#e4f1ff'], skyline: null,
    ground: '#9aa8c4', sidewalk: '#ffffff', particles: { type: 'snow', colors: ['#ffffff'], count: 26 },
    bus: { body: '#7cc8ff', trim: '#2f7bff', pattern: { id: 'snow', colors: ['#ffffff'] }, roof: ['snowman', 'snowCap', 'luggage'], hats: ['beanie', 'earmuffs', 'none', 'beanie', 'earmuffs'], extras: ['snowRoof'] },
    sign: ['SNOW', 'SLEDS', 'COCOA'], title: ['#ffffff', '#9fd4ff'], title2: ['#7cc8ff', '#2f7bff'],
  },
  christmas: {
    id: 'christmas', name: 'Holiday Christmas', sky: ['#0f1f4d', '#3a5aa0'], celestial: 'moon', stars: true, sea: null,
    trees: 'pine', treeColors: ['#1f8f4a', '#ffd23f'], hills: ['#e8f1ff', '#ffffff'], skyline: null,
    ground: '#6f7da0', sidewalk: '#ffffff', particles: { type: 'snow', colors: ['#ffffff'], count: 26 },
    bus: { body: '#e03a3e', trim: '#1f8f4a', pattern: { id: 'stripes', colors: ['#ffffff'] }, roof: ['gifts', 'tree', 'gifts'], hats: ['santa', 'santa', 'none', 'santa', 'earmuffs'], extras: ['wreath', 'lights'] },
    sign: ['NORTH', 'COCOA', 'JOY'], title: ['#ff6b6b', '#d62d2d'], title2: ['#6be08a', '#1f8f4a'],
  },
  halloween: {
    id: 'halloween', name: 'Halloween', sky: ['#24104a', '#9a431e'], celestial: 'moon', stars: true, sea: null,
    trees: 'bare', treeColors: ['#2b1a3a', '#2b1a3a'], hills: ['#3a2358', '#2b1a44'], skyline: null,
    ground: '#4e4466', sidewalk: '#6b5a8a', particles: { type: 'bat', colors: ['#1b1b1b', '#3a2358'], count: 9 },
    bus: { body: '#5b3a94', trim: '#ff8a1f', pattern: { id: 'bats', colors: ['#1b1b1b'] }, roof: ['pumpkin', 'cauldron', 'pumpkin'], hats: ['pumpkinHat', 'witch', 'none', 'pumpkinHat', 'witch'], extras: ['cobweb'] },
    sign: ['BOO', 'TRICK', 'TREAT'], title: ['#ffb02e', '#ff6a00'], title2: ['#c58cff', '#7a3fd0'],
  },
  valentine: {
    id: 'valentine', name: "Valentine's Day", sky: ['#ffb0d0', '#ffeaf3'], celestial: 'sun', stars: false, sea: null,
    trees: 'blossom', treeColors: ['#ff8fb8', '#8a4a5a'], hills: ['#ffc7dd', '#ffa9c8'], skyline: null,
    ground: '#a08aa8', sidewalk: '#ffd6e6', particles: { type: 'heart', colors: ['#ff5f8f', '#ff9ac2', '#ffffff'], count: 14 },
    bus: { body: '#ff7fae', trim: '#d62d6a', pattern: { id: 'hearts', colors: ['#ffffff'] }, roof: ['balloons', 'heartSign', 'luggage'], hats: ['heartBand', 'heartBand', 'none', 'heartBand', 'none'], extras: [] },
    sign: ['LOVE', 'HUGS', 'XOXO'], title: ['#ff9ac2', '#e0306a'], title2: ['#ffd6e6', '#ff5f8f'],
  },
  stpatrick: {
    id: 'stpatrick', name: "St. Patrick's Day", sky: ['#8fe3ff', '#ecffea'], celestial: 'sun', stars: false, sea: null,
    trees: 'round', treeColors: ['#2fae5a', '#7a4a2b'], hills: ['#7fd68a', '#3fb868'], skyline: null, rainbow: true,
    ground: '#7f9a96', sidewalk: '#b8f0b0', particles: { type: 'clover', colors: ['#2fae5a', '#7fe08a', '#ffd23f'], count: 14 },
    bus: { body: '#2fae5a', trim: '#ffd23f', pattern: { id: 'clover', colors: ['#ffffff'] }, roof: ['potOfGold', 'luggage', 'potOfGold'], hats: ['leprechaun', 'leprechaun', 'none', 'leprechaun', 'none'], extras: [] },
    sign: ['LUCKY', 'CLOVER', 'GOLD'], title: ['#ffe27a', '#ffb21f'], title2: ['#7fe08a', '#1f8f4a'],
  },
  easter: {
    id: 'easter', name: 'Easter', sky: ['#bfe4ff', '#fff4fb'], celestial: 'sun', stars: false, sea: null,
    trees: 'blossom', treeColors: ['#ffc2dd', '#7a4a2b'], hills: ['#c9f0b8', '#a8e6a0'], skyline: null,
    ground: '#9aa0c0', sidewalk: '#e8d8ff', particles: { type: 'confetti', colors: ['#ff9ad5', '#6ec6ff', '#ffe14d', '#b9a4ff'], count: 14 },
    bus: { body: '#b69cff', trim: '#ff9ad5', pattern: { id: 'eggs', colors: ['#ffffff', '#ffd23f', '#6ec6ff'] }, roof: ['eggs', 'flowerPot', 'eggs'], hats: ['bunnyEars', 'bunnyEars', 'none', 'bunnyEars', 'flowerCrown'], extras: [] },
    sign: ['HOP', 'EGGS', 'SPRING'], title: ['#ffe27a', '#ff9ad5'], title2: ['#b9a4ff', '#7a5af0'],
  },
  pride: {
    id: 'pride', name: 'Rainbow Pride', sky: ['#74c7ff', '#fff1fb'], celestial: 'sun', stars: false, sea: null,
    trees: 'palm', treeColors: ['#3fc24b', '#8a5a2b'], hills: null, skyline: ['#ffd3a8', '#ffb3c7', '#b9e4ff', '#d9c2ff'], rainbow: true,
    ground: '#8591ad', sidewalk: '#f5e6ff', particles: { type: 'confetti', colors: ['#ff3b3b', '#ff9f1c', '#ffe14d', '#3ddc84', '#3b82f6', '#9b5de5'], count: 18 },
    bus: { body: '#ffc72c', trim: '#ff4d4d', pattern: { id: 'rainbow', colors: ['#ff3b3b', '#ff9f1c', '#ffe14d', '#3ddc84', '#3b82f6', '#9b5de5'] }, roof: ['rainbowArch', 'balloons', 'luggage'], hats: ['rainbowBand', 'rainbowBand', 'none', 'rainbowBand', 'sunhat'], extras: [] },
    sign: ['LOVE', 'PRIDE', 'JOY'], title: ['#ffe14d', '#ff9f1c'], title2: ['#6ec6ff', '#9b5de5'],
  },
};
export const THEME_IDS = Object.keys(THEMES);

// ---- Special events (loading screen only: they take priority over holidays and seasons while they last) ----
THEMES.newyear = {
  id: 'newyear', name: "New Year's Eve", sky: ['#070b2e', '#2b2f87'], celestial: 'moon', stars: true, sea: null,
  trees: 'pine', treeColors: ['#1f5f7a', '#ffd23f'], hills: ['#2a2f6e', '#1d2158'], skyline: ['#3a3f9a', '#5a4fc0', '#2f6fd0', '#7a5ae0'],
  ground: '#4a4f80', sidewalk: '#7f86c8', particles: { type: 'confetti', colors: ['#ffd23f', '#ff5fa8', '#6ec6ff', '#ffffff', '#9b5de5'], count: 22 },
  bus: { body: '#2f3ca8', trim: '#ffd23f', pattern: { id: 'sun', colors: ['#ffd23f'] }, roof: ['balloons', 'gifts', 'balloons'], hats: ['crown', 'jester', 'none', 'crown', 'jester'], extras: ['lights'] },
  sign: ['2027', 'PARTY', 'CHEERS'], title: ['#fff08a', '#ffb21f'], title2: ['#c58cff', '#6a3fe0'],
};
THEMES.july4 = {
  id: 'july4', name: 'Independence Day', sky: ['#1b2f7a', '#7fb0ff'], celestial: 'sunset', stars: false, sea: null,
  trees: 'round', treeColors: ['#2fae5a', '#7a4a2b'], hills: ['#7fd68a', '#3fb868'], skyline: null,
  ground: '#7f8cab', sidewalk: '#ffffff', particles: { type: 'confetti', colors: ['#e63946', '#ffffff', '#3b82f6'], count: 20 },
  bus: { body: '#2f5fd0', trim: '#e63946', pattern: { id: 'stripes', colors: ['#ffffff'] }, roof: ['pennant', 'balloons', 'pennant'], hats: ['sportcap', 'sportcap', 'none', 'sportcap', 'none'], extras: [] },
  sign: ['USA', 'PARADE', 'BBQ'], title: ['#ff6b6b', '#d62d2d'], title2: ['#ffffff', '#6ea0ff'],
};
THEMES.thanksgiving = {
  id: 'thanksgiving', name: 'Thanksgiving', sky: ['#e8934a', '#ffe2b8'], celestial: 'sunset', stars: false, sea: null,
  trees: 'round', treeColors: ['#d9731f', '#a8321f'], hills: ['#d9a35a', '#b9772f'], skyline: null,
  ground: '#85758a', sidewalk: '#e6c28a', particles: { type: 'leaf', colors: ['#d9731f', '#a8321f', '#ffb21f', '#8a4a1f'], count: 20 },
  bus: { body: '#b8581e', trim: '#ffd27a', pattern: { id: 'leaves', colors: ['#ffd27a'] }, roof: ['pumpkin', 'leafPile', 'pumpkin'], hats: ['acorn', 'acorn', 'none', 'acorn', 'none'], extras: [] },
  sign: ['GIVE', 'THANKS', 'FEAST'], title: ['#ffd27a', '#e0801f'], title2: ['#ffb067', '#a8321f'],
};
THEMES.lunarnewyear = {
  id: 'lunarnewyear', name: 'Lunar New Year', sky: ['#7a0f1f', '#e8503a'], celestial: 'moon', stars: true, sea: null,
  trees: 'blossom', treeColors: ['#ff8fb8', '#6a3a2b'], hills: ['#a8202f', '#8a1626'], skyline: ['#c0303f', '#e05a3a', '#ffb02e', '#a8202f'],
  ground: '#6a3a4a', sidewalk: '#ffd27a', particles: { type: 'sparkle', colors: ['#ffd23f', '#fff3a0', '#ffffff'], count: 18 },
  bus: { body: '#d6232f', trim: '#ffd23f', pattern: { id: 'sun', colors: ['#ffd23f'] }, roof: ['gifts', 'heartSign', 'gifts'], hats: ['crown', 'crown', 'none', 'crown', 'none'], extras: ['lights'] },
  sign: ['LUCK', 'JOY', 'FORTUNE'], title: ['#ffe27a', '#ffb21f'], title2: ['#ff7a6a', '#d6232f'],
};
THEMES.diwali = {
  id: 'diwali', name: 'Diwali', sky: ['#1a0b3d', '#a8327a'], celestial: 'moon', stars: true, sea: null,
  trees: 'round', treeColors: ['#7a3fa8', '#ffd23f'], hills: ['#4a2370', '#38195a'], skyline: ['#7a3fa8', '#c94a9a', '#ffb02e', '#5a3fd0'],
  ground: '#5a4a7a', sidewalk: '#ffd27a', particles: { type: 'sparkle', colors: ['#ffd23f', '#ff9f1c', '#ffffff', '#ff5fa8'], count: 24 },
  bus: { body: '#c0308a', trim: '#ffb21f', pattern: { id: 'sun', colors: ['#ffd23f'] }, roof: ['balloons', 'gifts', 'balloons'], hats: ['crown', 'crown', 'none', 'crown', 'none'], extras: ['lights'] },
  sign: ['LIGHTS', 'JOY', 'SWEETS'], title: ['#ffe27a', '#ff9f1c'], title2: ['#ff8ad0', '#a8327a'],
};
THEME_IDS.push('newyear', 'july4', 'thanksgiving', 'lunarnewyear', 'diwali');

// Each event: [name, ms-range from a UTC-noon day] -> returns { start, end } when the date falls inside.
const LUNAR_NY = { 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19', 2035: '02-08' };
const DIWALI = { 2026: '11-08', 2027: '10-29', 2028: '10-17', 2029: '11-05', 2030: '10-26', 2031: '11-14', 2032: '11-02', 2033: '10-22', 2034: '11-10', 2035: '10-30' };
const dayOf = (y, md) => { const [m, d] = md.split('-').map(Number); return Date.UTC(y, m - 1, d, 12); };
function thanksgivingDay(y) { const first = new Date(Date.UTC(y, 10, 1)).getUTCDay(); return Date.UTC(y, 10, 1 + ((4 - first + 7) % 7) + 21, 12); }
export const EVENTS = [
  { id: 'newyear', windows: (y) => [[Date.UTC(y, 11, 29, 12), Date.UTC(y + 1, 0, 2, 12)], [Date.UTC(y - 1, 11, 29, 12), Date.UTC(y, 0, 2, 12)]] },
  { id: 'july4', windows: (y) => [[Date.UTC(y, 5, 30, 12), Date.UTC(y, 6, 5, 12)]] },
  { id: 'thanksgiving', windows: (y) => [[thanksgivingDay(y) - 6 * DAY, thanksgivingDay(y) + DAY]] },
  { id: 'lunarnewyear', windows: (y) => (LUNAR_NY[y] ? [[dayOf(y, LUNAR_NY[y]) - 2 * DAY, dayOf(y, LUNAR_NY[y]) + 7 * DAY]] : []) },
  { id: 'diwali', windows: (y) => (DIWALI[y] ? [[dayOf(y, DIWALI[y]) - 3 * DAY, dayOf(y, DIWALI[y]) + 2 * DAY]] : []) },
];
export function activeEvent(t) {
  const y = new Date(t).getUTCFullYear();
  for (const e of EVENTS) for (const [a, b] of e.windows(y)) if (t >= a && t <= b) return { id: e.id, end: b };
  return null;
}
export const PASSENGER_PALETTE = PASSENGER_COLORS;

// Day each holiday is "about" (used to break ties when two holiday windows overlap, e.g. St. Patrick's vs Easter)
const ANCHORS = {
  christmas: (y) => Date.UTC(y, 11, 25), halloween: (y) => Date.UTC(y, 9, 31), valentine: (y) => Date.UTC(y, 1, 14),
  stpatrick: (y) => Date.UTC(y, 2, 17), pride: (y) => Date.UTC(y, 5, 15), easter: (y) => easterSunday(y),
};
const distToAnchor = (id, t) => { const y = new Date(t).getUTCFullYear(); return Math.min(...[y - 1, y, y + 1].map((yy) => Math.abs(ANCHORS[id](yy) - t))); };

// Use the PLAYER'S calendar day (their local date), expressed as UTC noon so it lines up with themes.js windows.
export function localDayAsUtc(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}

// Seasons cover the whole year, so by default a season theme is always on (and 'regular' only shows when the player
// switches seasonal looks off). Set seasonMode: 'peak' to show a season theme only in the middle of its season
// (skipping the first and last 3 weeks) so the regular screen appears in between.
// opts: { hemisphere: 'north'|'south', seasonal: true|false (player setting), seasonMode: 'full'|'peak', force: themeId (testing / preview) }
export function pickTheme(now = new Date(), opts = {}) {
  const { hemisphere = 'north', seasonal = true, seasonMode = 'full', force = null } = opts;
  if (force && THEMES[force]) return { theme: THEMES[force], reason: 'forced', endsAt: null };
  if (globalThis.__HH_DATE) now = new Date(globalThis.__HH_DATE + 'T12:00:00');   // ?date=YYYY-MM-DD preview
  const t = localDayAsUtc(now);
  if (!seasonal || Number.isNaN(t)) return { theme: THEMES.regular, reason: 'regular', endsAt: null };
  const ev = activeEvent(t);
  if (ev) return { theme: THEMES[ev.id], reason: 'holiday', endsAt: new Date(ev.end) };
  const holidays = SETS.filter((s) => s.kind === 'holiday').map((s) => ({ s, w: activeWindow(s, t, hemisphere) })).filter((x) => x.w);
  if (holidays.length) {
    holidays.sort((a, b) => distToAnchor(a.s.id, t) - distToAnchor(b.s.id, t));
    return { theme: THEMES[holidays[0].s.id], reason: 'holiday', endsAt: new Date(holidays[0].w.end) };
  }
  const season = SETS.filter((s) => s.kind === 'season').map((s) => ({ s, w: activeWindow(s, t, hemisphere) })).find((x) => x.w);
  const peakOk = !season || seasonMode !== 'peak' || (t >= season.w.start + 21 * DAY && t <= season.w.end - 21 * DAY);
  if (season && peakOk) return { theme: THEMES[season.s.id], reason: 'season', endsAt: new Date(season.w.end) };
  return { theme: THEMES.regular, reason: 'regular', endsAt: null };
}
