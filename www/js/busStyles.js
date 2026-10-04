// busStyles.js - the 16 bus styles shown in the Garage, in the same order as the style sheet (4 x 4 grid).
// Pure data + helpers (no React, no network). Looks for 8 styles are new here; the other 8 reuse the loading-screen themes.
// Each style links to a themed set in themes.js (setId), so ownership, prices, the weekly rotation and the seasonal windows
// all keep working exactly as they do in the shop. 'classic' is the free default.
import { THEMES } from './loadingThemes.js';
import { SETS, setById, isOffered, weekIndex, vehicleSkinId, passengerSkinId } from './themes.js';

const DAY = 86400000;

// ---- new looks (bus art only; the scene around them comes from busArt.busCardSvg) ----
const LOOKS = {
  classic: { sky: ['#7fd0ff', '#eaf8ff'], ground: '#7f8cab', sign: ['SCHOOL', 'CITY', 'GO'],
    bus: { body: '#ffc41f', trim: '#f09a00', pattern: { id: 'none', colors: [] }, roof: [], hats: ['none', 'none', 'none', 'none', 'none'], driverHat: 'none', extras: [] } },
  ocean: { sky: ['#6fd8ff', '#e6fbff'], skyline: ['#bfe9ff', '#9fdcf5', '#d9f5ff'], ground: '#6f8fb0', sign: ['SURF', 'WAVES', 'SEA'],
    bus: { body: '#27c4ee', trim: '#0c8fc0', pattern: { id: 'waves', colors: ['#ffffff', '#bff4ff'] }, roof: ['lifebuoy', 'surfboard', 'luggage'], hats: ['snorkel', 'none', 'snorkel', 'none', 'sunhat'], driverHat: 'snorkel', extras: [] } },
  fire: { sky: ['#8fd3ff', '#fff0e6'], ground: '#7a8099', sign: ['RESCUE', '911', 'HOSE'],
    bus: { body: '#e32d2d', trim: '#ffd23f', pattern: { id: 'none', colors: [] }, roof: ['ladder', 'siren', 'luggage'], hats: ['firehat', 'firehat', 'none', 'firehat', 'firehat'], driverHat: 'firehat', extras: ['shield'] } },
  space: { sky: ['#1a1450', '#5a4bb0'], skyline: ['#3a2f86', '#4b3da0', '#2c2470'], ground: '#4a4a78', sign: ['ORBIT', 'MOON', 'STARS'],
    bus: { body: '#2c3a9c', trim: '#ffd23f', pattern: { id: 'stars', colors: ['#ffe58a', '#ffffff'] }, roof: ['planet', 'rocket', 'luggage'], hats: ['astronaut', 'astronaut', 'none', 'astronaut', 'none'], driverHat: 'astronaut', extras: [] } },
  cyber: { sky: ['#1b1040', '#6a2fb0'], skyline: ['#3a1f80', '#2b2a9a', '#7a2fb0'], ground: '#3d3a6a', sign: ['LEVEL UP', 'PLAY', 'GG'],
    bus: { body: '#4b2fb8', trim: '#ff4fd8', pattern: { id: 'grid', colors: ['#3df5ff', '#ff4fd8'] }, roof: ['controller', 'luggage', 'controller'], hats: ['visor', 'visor', 'none', 'visor', 'none'], driverHat: 'visor', extras: ['neon'] } },
  sports: { sky: ['#79c8ff', '#f2fbff'], ground: '#7b8aa8', sign: ['TEAM', 'GAME', 'WIN'],
    bus: { body: '#ff8a1f', trim: '#1d4ed8', pattern: { id: 'balls', colors: ['#ffffff'] }, roof: ['basketball', 'trophy', 'pennant'], hats: ['sportcap', 'sportcap', 'none', 'sportcap', 'none'], driverHat: 'sportcap', extras: ['sportStripe'] } },
  jungle: { sky: ['#9fe6a8', '#f2ffe8'], skyline: ['#7fd68a', '#5fc27a', '#a8e6a0'], ground: '#7f9a86', sign: ['SAFARI', 'WILD', 'VINES'],
    bus: { body: '#3fb04a', trim: '#8a5a2b', pattern: { id: 'leaves', colors: ['#1f7a33'] }, roof: ['palmTree', 'toucan', 'luggage'], hats: ['safari', 'none', 'safari', 'none', 'safari'], driverHat: 'safari', extras: [] } },
  royal: { sky: ['#9d8cff', '#fff0fb'], skyline: ['#c9b8ff', '#e0cfff', '#b7a4f5'], ground: '#7d78a8', sign: ['ROYAL', 'COURT', 'KING'],
    bus: { body: '#6a2fc4', trim: '#ffd23f', pattern: { id: 'diamonds', colors: ['#ffd23f'] }, roof: ['bigCrown', 'chest', 'luggage'], hats: ['crown', 'jester', 'none', 'crown', 'jester'], driverHat: 'crown', extras: ['crest'] } },
};

// pill = label colours, as on the style sheet. glyph is a plain emoji for the label.
const META = [
  { id: 'classic',   name: 'Classic Yellow',    setId: null,        kind: 'core',    glyph: '\u{1F68C}', pill: ['#ffd23a', '#ffb800'], ink: '#10246b' },
  { id: 'ocean',     name: 'Ocean Breeze',      setId: 'ocean',     kind: 'weekly',  glyph: '\u{1F30A}', pill: ['#38d0f2', '#14a9dd'], ink: '#ffffff' },
  { id: 'fire',      name: 'Fire & Rescue',     setId: 'fire',      kind: 'weekly',  glyph: '\u{1F525}', pill: ['#ff4a4a', '#d62222'], ink: '#ffffff' },
  { id: 'space',     name: 'Space Explorer',    setId: 'space',     kind: 'weekly',  glyph: '\u{1FA90}', pill: ['#9d5cf0', '#6d2fd0'], ink: '#ffffff' },
  { id: 'christmas', name: 'Holiday Christmas', setId: 'christmas', kind: 'holiday', glyph: '\u{1F384}', pill: ['#e8333b', '#b3121a'], ink: '#ffffff' },
  { id: 'halloween', name: 'Halloween',         setId: 'halloween', kind: 'holiday', glyph: '\u{1F383}', pill: ['#2a2230', '#14101a'], ink: '#ffb02e' },
  { id: 'valentine', name: "Valentine's Day",   setId: 'valentine', kind: 'holiday', glyph: '\u{1F496}', pill: ['#ff6fae', '#ee3d8a'], ink: '#ffffff' },
  { id: 'stpatrick', name: "St. Patrick's Day", setId: 'stpatrick', kind: 'holiday', glyph: '☘️', pill: ['#2fbf5a', '#168a3e'], ink: '#ffffff' },
  { id: 'easter',    name: 'Easter',            setId: 'easter',    kind: 'holiday', glyph: '\u{1F95A}', pill: ['#b58cff', '#8a5af0'], ink: '#ffffff' },
  { id: 'summer',    name: 'Summer Beach',      setId: 'summer',    kind: 'season',  glyph: '☀️', pill: ['#ffa53a', '#ff7a14'], ink: '#ffffff' },
  { id: 'cyber',     name: 'Neon / Cyber',      setId: 'cyber',     kind: 'weekly',  glyph: '\u{1F3AE}', pill: ['#3a8bff', '#1f5ee0'], ink: '#ffffff' },
  { id: 'sports',    name: 'Sports Champ',      setId: 'sports',    kind: 'weekly',  glyph: '\u{1F3C0}', pill: ['#2b4aa8', '#16307c'], ink: '#ffffff' },
  { id: 'pride',     name: 'Rainbow Pride',     setId: 'pride',     kind: 'holiday', glyph: '\u{1F308}', pill: ['#ff5a5a', '#ffb02e', '#ffe14d', '#3ddc84', '#3b82f6', '#9b5de5'], ink: '#ffffff', rainbow: true },
  { id: 'jungle',    name: 'Jungle Adventure',  setId: 'jungle',    kind: 'weekly',  glyph: '\u{1F33F}', pill: ['#2fa84a', '#14782e'], ink: '#ffffff' },
  { id: 'winter',    name: 'Winter Snow',       setId: 'winter',    kind: 'season',  glyph: '❄️', pill: ['#6ec6ff', '#3a9be8'], ink: '#ffffff' },
  { id: 'royal',     name: 'Royal Court',       setId: 'royal',     kind: 'weekly',  glyph: '\u{1F451}', pill: ['#8a4fe0', '#5a24b0'], ink: '#ffffff' },
];

// A style's bus art: new looks from LOOKS, the rest from the loading-screen themes.
export function lookFor(id) {
  if (LOOKS[id]) return { id, name: META.find((m) => m.id === id).name, ...LOOKS[id] };
  const t = THEMES[id];
  return { id, name: t.name, sky: t.sky, skyline: t.skyline || undefined, ground: t.ground, sign: t.sign, bus: t.bus };
}

export const BUS_STYLES = META.map((m) => ({ ...m, look: lookFor(m.id) }));
export const busStyleById = (id) => BUS_STYLES.find((s) => s.id === id);
export const busStyleBySkin = (skinId) => BUS_STYLES.find((s) => (s.setId ? vehicleSkinId(s.setId) : 'v_classic') === skinId) || BUS_STYLES[0];
export const vehicleSkinFor = (style) => (style.setId ? vehicleSkinId(style.setId) : 'v_classic');
export const passengerSkinFor = (style) => (style.setId ? passengerSkinId(style.setId) : 'p_classic');

// First day (as a Date) a limited style is back in the shop, or null if it is in the shop now / not limited.
export function nextBack(style, now = new Date(), hemisphere = 'north') {
  if (!style.setId || isOffered(style.setId, now, hemisphere)) return null;
  for (let d = 1; d <= 800; d++) { const t = new Date(now.getTime() + d * DAY); if (isOffered(style.setId, t, hemisphere)) return t; }
  return null;
}
const when = (date, now) => {
  const days = Math.ceil((date - now) / DAY);
  return days <= 13 ? `Back in ${days} day${days === 1 ? '' : 's'}` : days <= 60 ? `Back in ${Math.round(days / 7)} weeks` : 'Back ' + date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// What the Garage shows for each style right now.
//   status: 'equipped' | 'owned' | 'buyable' (in the shop now) | 'locked' (not in the shop now)
export function garageCards(profile, now = new Date()) {
  const hemi = profile.hemisphere || 'north';
  const owned = new Set(profile.ownedSkins || []);
  const equipped = profile.equippedVehicleSkin || 'v_classic';
  return BUS_STYLES.map((style) => {
    const skinId = vehicleSkinFor(style);
    const isOwn = style.setId === null || owned.has(skinId);
    const inShop = style.setId === null || isOffered(style.setId, now, hemi);
    const set = style.setId ? setById(style.setId) : null;
    const status = equipped === skinId ? 'equipped' : isOwn ? 'owned' : inShop ? 'buyable' : 'locked';
    const back = status === 'locked' ? nextBack(style, now, hemi) : null;
    const tag = style.kind === 'weekly' ? (inShop ? 'This week' : '') : style.kind === 'core' ? '' : style.kind === 'season' ? 'Season' : 'Holiday';
    return { style, set, skinId, status, tag, backText: back ? when(back, now) : '' };
  });
}
