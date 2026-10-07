// themes.js - themed skin SETS (a vehicle skin + a passenger skin each), weekly shop rotation, seasons and holidays.
// Pure logic, no Three.js. Everything is based on UTC dates, so the app and your server always agree.
// RULE (unchanged): skins never change a vehicle's or passenger's base colour. They only add patterns and accessories.
import { rng, shuffled } from './levelGen.js';

export const BUNDLE_ID = 'com.yourname.busblitzparty'; // <- your bundle id. Change it HERE ONLY (must match App Store Connect).

export const PRICES = {   // coins for each piece, coins for the full set (discounted), and the real-money price for the full set
  standard: { vehicle: 3000, passenger: 2000, set: 4000, usd: '$1.99', rarity: 'rare' },
  premium:  { vehicle: 5000, passenger: 3500, set: 7000, usd: '$3.99', rarity: 'epic' },
  seasonal: { vehicle: 4000, passenger: 3000, set: 6000, usd: '$2.99', rarity: 'epic' },
};

const RAINBOW = ['#ff3b3b', '#ff9f1c', '#ffe14d', '#3ddc84', '#3b82f6', '#9b5de5'];

// kind: 'weekly' (rotates every week) | 'season' (whole meteorological season) | 'holiday' (limited window)
export const SETS = [
  // ---------- 12 weekly rotating sets ----------
  { id: 'ocean',        kind: 'weekly', price: 'standard', name: 'Ocean Breeze',      vehicle: { name: 'Ocean Breeze Bus',  style: { pattern: 'waves', accents: ['#ffffff'], topper: 'lifebuoy', glossy: true } },            passenger: { name: 'Snorkel Buddy',      style: { accessory: 'snorkel' } } },
  { id: 'fire',         kind: 'weekly', price: 'standard', name: 'Fire & Rescue',     vehicle: { name: 'Rescue Bus',        style: { pattern: 'stripes', accents: ['#ffffff'], topper: 'ladder' } },                         passenger: { name: 'Rookie Firefighter', style: { accessory: 'firefighter' } } },
  { id: 'space',        kind: 'weekly', price: 'premium',  name: 'Space Explorer',    vehicle: { name: 'Star Cruiser',      style: { pattern: 'stars', accents: ['#ffe58a'], topper: 'planet', metalness: 0.3 } },            passenger: { name: 'Little Alien',       style: { accessory: 'alien' } } },
  { id: 'cyber',        kind: 'weekly', price: 'premium',  name: 'Neon / Cyber',      vehicle: { name: 'Cyber Bus',         style: { pattern: 'grid', accents: ['#3df5ff'], topper: 'controller', emissive: 0.5 } },          passenger: { name: 'VR Gamer',           style: { accessory: 'vr' } } },
  { id: 'sports',       kind: 'weekly', price: 'standard', name: 'Sports Champ',      vehicle: { name: 'Team Bus',          style: { pattern: 'balls', accents: ['#ffffff'], topper: 'ball' } },                           passenger: { name: 'Team Captain',       style: { accessory: 'sweatband' } } },
  { id: 'jungle',       kind: 'weekly', price: 'standard', name: 'Jungle Adventure',  vehicle: { name: 'Jungle Bus',        style: { pattern: 'leaves', accents: ['#1f7a33'], topper: 'palm' } },                          passenger: { name: 'Cheeky Monkey',      style: { accessory: 'monkey' } } },
  { id: 'royal',        kind: 'weekly', price: 'premium',  name: 'Royal Court',       vehicle: { name: 'Royal Coach',       style: { pattern: 'diamonds', accents: ['#ffd700'], topper: 'crown', metalness: 0.4 } },         passenger: { name: 'Court Jester',       style: { accessory: 'jester' } } },
  { id: 'construction', kind: 'weekly', price: 'standard', name: 'Construction Crew', vehicle: { name: 'Site Bus',          style: { pattern: 'hazard', accents: ['#1b1b1b'], topper: 'trafficCone' } },                   passenger: { name: 'Site Foreman',       style: { accessory: 'hardhat' } } },
  { id: 'pirate',       kind: 'weekly', price: 'standard', name: 'Pirate Voyage',     vehicle: { name: 'Pirate Bus',        style: { pattern: 'skulls', accents: ['#ffffff'], topper: 'jollyFlag' } },                     passenger: { name: 'Buccaneer',          style: { accessory: 'buccaneer' } } },
  { id: 'hero',         kind: 'weekly', price: 'premium',  name: 'Hero Squad',        vehicle: { name: 'Hero Bus',          style: { pattern: 'bolt', accents: ['#ffe14d'], topper: 'boltSign', glossy: true } },            passenger: { name: 'Caped Hero',         style: { accessory: 'hero' } } },
  { id: 'rock',         kind: 'weekly', price: 'standard', name: 'Rock Tour',         vehicle: { name: 'Tour Bus',          style: { pattern: 'notes', accents: ['#ffffff'], topper: 'speaker' } },                         passenger: { name: 'Punk Rocker',        style: { accessory: 'mohawk' } } },
  { id: 'circus',       kind: 'weekly', price: 'standard', name: 'Circus Parade',     vehicle: { name: 'Big Top Bus',       style: { pattern: 'circus', accents: ['#ffffff'], topper: 'bigTop' } },                         passenger: { name: 'Silly Clown',        style: { accessory: 'clown' } } },
  // ---------- 4 seasons (meteorological, northern hemisphere unless you pass 'south') ----------
  { id: 'spring', kind: 'season', season: 'spring', price: 'seasonal', name: 'Spring Bloom',   vehicle: { name: 'Blossom Bus',  style: { pattern: 'petals', accents: ['#ffffff', '#ffd23f'], topper: 'flowerPot' } }, passenger: { name: 'Flower Child',  style: { accessory: 'flowerCrown' } } },
  { id: 'summer', kind: 'season', season: 'summer', price: 'seasonal', name: 'Summer Beach',   vehicle: { name: 'Beach Bus',    style: { pattern: 'sun', accents: ['#fff3b0'], topper: 'umbrella' } },                      passenger: { name: 'Cool Shades',   style: { accessory: 'shades' } } },
  { id: 'autumn', kind: 'season', season: 'autumn', price: 'seasonal', name: 'Autumn Harvest', vehicle: { name: 'Harvest Bus',  style: { pattern: 'leaves', accents: ['#d9731f'], topper: 'leafPile' } },                   passenger: { name: 'Little Acorn',  style: { accessory: 'acorn' } } },
  { id: 'winter', kind: 'season', season: 'winter', price: 'seasonal', name: 'Winter Snow',    vehicle: { name: 'Snow Bus',     style: { pattern: 'snow', accents: ['#ffffff'], topper: 'snowman', glossy: true } },         passenger: { name: 'Cozy Earmuffs', style: { accessory: 'earmuffs' } } },
  // ---------- 6 holidays ----------
  { id: 'christmas', kind: 'holiday', price: 'seasonal', window: { start: [12, 1], end: [1, 2] },   name: 'Holiday Christmas', vehicle: { name: 'Holiday Bus',  style: { pattern: 'stripes', accents: ['#ffffff'], topper: 'gifts' } },        passenger: { name: 'Santa Helper',     style: { accessory: 'santa' } } },
  { id: 'halloween', kind: 'holiday', price: 'seasonal', window: { start: [10, 10], end: [11, 2] }, name: 'Halloween',         vehicle: { name: 'Haunted Bus',  style: { pattern: 'bats', accents: ['#1b1b1b'], topper: 'cauldron' } },         passenger: { name: 'Little Pumpkin',   style: { accessory: 'pumpkinHat' } } },
  { id: 'valentine', kind: 'holiday', price: 'seasonal', window: { start: [2, 1], end: [2, 21] },   name: "Valentine's Day",   vehicle: { name: 'Love Bus',     style: { pattern: 'hearts', accents: ['#ffffff'], topper: 'heart', glossy: true } }, passenger: { name: "Cupid's Pick",     style: { accessory: 'heartBand' } } },
  { id: 'stpatrick', kind: 'holiday', price: 'seasonal', window: { start: [3, 1], end: [3, 21] },   name: "St. Patrick's Day", vehicle: { name: 'Lucky Bus',    style: { pattern: 'clover', accents: ['#ffffff'], topper: 'potOfGold' } },     passenger: { name: 'Lucky Leprechaun', style: { accessory: 'leprechaun' } } },
  { id: 'easter',    kind: 'holiday', price: 'seasonal', window: { easter: [-14, 7] },              name: 'Easter',            vehicle: { name: 'Bunny Bus',    style: { pattern: 'eggs', accents: ['#ffffff', '#ffd23f', '#6ec6ff'], topper: 'eggs' } }, passenger: { name: 'Easter Bunny', style: { accessory: 'bunnyEars' } } },
  { id: 'pride',     kind: 'holiday', price: 'seasonal', window: { start: [6, 1], end: [6, 30] },   name: 'Rainbow Pride',     vehicle: { name: 'Rainbow Bus',  style: { pattern: 'rainbow', accents: RAINBOW, topper: 'rainbowArch', glossy: true } }, passenger: { name: 'Rainbow Parade', style: { accessory: 'rainbowBand' } } },
];

export const setById = (id) => SETS.find((s) => s.id === id);
export const vehicleSkinId = (setId) => 'v_set_' + setId;
export const passengerSkinId = (setId) => 'p_set_' + setId;
export const setProductId = (setId) => BUNDLE_ID + '.set.' + setId;

// Turns every set into skin objects that skinData.js adds to the Wardrobe. kind: 'vehicle' | 'passenger'
export function setSkins(kind) {
  return SETS.map((s) => ({
    id: (kind === 'vehicle' ? vehicleSkinId : passengerSkinId)(s.id),
    name: s[kind].name,
    rarity: PRICES[s.price].rarity,
    obtain: 'set',
    setId: s.id,
    coinPrice: PRICES[s.price][kind],
    style: s[kind].style,
  }));
}

// ---------- Dates (all UTC) ----------
const DAY = 86400000, WEEK = 7 * DAY;
const EPOCH = Date.UTC(2024, 0, 1);       // a Monday: weeks start Monday 00:00 UTC
export const FEATURED_PER_WEEK = 4;
const ts = (d) => (d instanceof Date ? d.getTime() : d);

export const weekIndex = (now = new Date()) => Math.floor((ts(now) - EPOCH) / WEEK);
export const weekEndsAt = (now = new Date()) => new Date(EPOCH + (weekIndex(now) + 1) * WEEK);

// Anonymous Gregorian algorithm
export function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(year, month - 1, day);
}

// ---------- Weekly rotation ----------
// Every set appears once per cycle (12 sets / 4 per week = a 3-week cycle), and no set shows in two weeks in a row.
const weeklyPool = () => SETS.filter((s) => s.kind === 'weekly').map((s) => s.id);
const cycleCache = new Map();
function cycleOrder(c) {
  if (cycleCache.has(c)) return cycleCache.get(c);
  const pool = weeklyPool();
  const prevTail = c > 0 ? cycleOrder(c - 1).slice(-FEATURED_PER_WEEK) : [];
  let order = shuffled(pool, rng(c * 7919 + 13));
  for (let a = 1; a < 200 && order.slice(0, FEATURED_PER_WEEK).some((id) => prevTail.includes(id)); a++) order = shuffled(pool, rng(c * 7919 + 13 + a * 31));
  cycleCache.set(c, order);
  return order;
}
export function weeklySetIds(week) {
  const pool = weeklyPool(), out = [];
  for (let i = 0; i < FEATURED_PER_WEEK; i++) {
    const p = week * FEATURED_PER_WEEK + i;
    let id = cycleOrder(Math.floor(p / pool.length))[p % pool.length];
    if (out.includes(id)) id = pool.find((x) => !out.includes(x)); // only matters if the pool size changes
    out.push(id);
  }
  return out;
}

// ---------- Seasons and holidays ----------
const SEASON_WINDOWS = {   // [month, day] ranges; [3, 0] = last day of February
  spring: { start: [3, 1],  end: [5, 31] },
  summer: { start: [6, 1],  end: [8, 31] },
  autumn: { start: [9, 1],  end: [11, 30] },
  winter: { start: [12, 1], end: [3, 0] },
};
const SOUTH = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' };

// Returns { start, end } (ms) if `now` is inside the set's window, else null.
export function activeWindow(set, now = new Date(), hemisphere = 'north') {
  const t = ts(now), year = new Date(t).getUTCFullYear();
  for (const y of [year - 1, year, year + 1]) {
    let start, end;
    if (set.kind === 'season') {
      const w = SEASON_WINDOWS[hemisphere === 'south' ? SOUTH[set.season] : set.season];
      start = Date.UTC(y, w.start[0] - 1, w.start[1]);
      end = Date.UTC(w.end[0] < w.start[0] ? y + 1 : y, w.end[0] - 1, w.end[1], 23, 59, 59, 999);
    } else if (set.kind === 'holiday' && set.window.easter) {
      const e = easterSunday(y);
      start = e + set.window.easter[0] * DAY;
      end = e + set.window.easter[1] * DAY + DAY - 1;
    } else if (set.kind === 'holiday') {
      const w = set.window;
      start = Date.UTC(y, w.start[0] - 1, w.start[1]);
      end = Date.UTC(w.end[0] < w.start[0] ? y + 1 : y, w.end[0] - 1, w.end[1], 23, 59, 59, 999);
    } else return null;
    if (t >= start && t <= end) return { start, end };
  }
  return null;
}

export function isOffered(setId, now = new Date(), hemisphere = 'north') {
  const s = setById(setId);
  if (!s) return false;
  if (s.kind === 'weekly') return weeklySetIds(weekIndex(now)).includes(setId);
  return !!activeWindow(s, now, hemisphere);
}

// Everything the shop screen needs for "right now".
export function shopOffers(now = new Date(), hemisphere = 'north') {
  return {
    week: weekIndex(now),
    weeklyEndsAt: weekEndsAt(now),
    weekly: weeklySetIds(weekIndex(now)).map(setById),
    limited: SETS.filter((s) => s.kind !== 'weekly')
      .map((s) => ({ set: s, window: activeWindow(s, now, hemisphere) }))
      .filter((x) => x.window)
      .map((x) => ({ set: x.set, endsAt: new Date(x.window.end) })),
  };
}
