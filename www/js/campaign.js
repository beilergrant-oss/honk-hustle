// campaign.js - 11,200 levels, 112 areas, 9 worlds. Levels are generated on demand, never stored.
import { generateLevel, rng, shuffled } from './levelGen.js';

export const AREA_SIZE = 100;                 // every 100 levels = new area
export const TUTORIAL_LEVELS = 10;            // first 10 levels are always easy
export const WORLD_SIZES = [1000, 1200, 1500, 1100, 1300, 1000, 1400, 1200, 1500]; // each world is 1000-1500 levels
export const TOTAL_LEVELS = WORLD_SIZES.reduce((a, b) => a + b, 0); // 11,200

// Colors are for the scene: ground, sky gradient. rewardVehicleSkin / rewardPassengerSkin are free when the world is finished.
export const WORLDS = [
  { id: 'shores',  name: 'Sunny Shores',   ground: '#FFD23F', sky: ['#FF9A3C', '#FFE08A'], rewardVehicleSkin: 'v_surf',    rewardPassengerSkin: 'p_sunhat' },
  { id: 'desert',  name: 'Desert Highway', ground: '#E8B36B', sky: ['#F6C453', '#FDE7B0'], rewardVehicleSkin: 'v_safari',  rewardPassengerSkin: 'p_cowboy' },
  { id: 'frost',   name: 'Frosty Peaks',   ground: '#EAF6FF', sky: ['#9CC9F0', '#E6F4FF'], rewardVehicleSkin: 'v_frost',   rewardPassengerSkin: 'p_beanie' },
  { id: 'neon',    name: 'Neon Downtown',  ground: '#2B2D5B', sky: ['#1B1040', '#5B2E91'], rewardVehicleSkin: 'v_neon',    rewardPassengerSkin: 'p_headphones' },
  { id: 'jungle',  name: 'Jungle Run',     ground: '#6FBF4A', sky: ['#9EE07A', '#E3F7C8'], rewardVehicleSkin: 'v_jungle',  rewardPassengerSkin: 'p_explorer' },
  { id: 'candy',   name: 'Candy Land',     ground: '#FFB6D9', sky: ['#FF8AC4', '#FFE1F0'], rewardVehicleSkin: 'v_candy',   rewardPassengerSkin: 'p_icecream' },
  { id: 'spooky',  name: 'Spooky Hollow',  ground: '#5B3A7A', sky: ['#2A1740', '#8B4B2A'], rewardVehicleSkin: 'v_spooky',  rewardPassengerSkin: 'p_witch' },
  { id: 'sky',     name: 'Sky Harbor',     ground: '#CFE8FF', sky: ['#5EA8F5', '#DDF0FF'], rewardVehicleSkin: 'v_sky',     rewardPassengerSkin: 'p_pilot' },
  { id: 'moon',    name: 'Moon Base',      ground: '#B9BCC9', sky: ['#05060F', '#2A2F55'], rewardVehicleSkin: 'v_moon',    rewardPassengerSkin: 'p_astronaut' },
];

const WORLD_STARTS = WORLD_SIZES.reduce((acc, size, i) => { acc.push((acc[i - 1] ?? 0) + (i ? WORLD_SIZES[i - 1] : 0)); return acc; }, []);
// WORLD_STARTS[i] = number of levels before world i

export function locate(n) {
  let wi = WORLD_SIZES.length - 1;
  for (let i = 0; i < WORLD_SIZES.length; i++) if (n <= WORLD_STARTS[i] + WORLD_SIZES[i]) { wi = i; break; }
  const inWorld = n - WORLD_STARTS[wi];                     // 1-based inside the world
  return {
    n,
    worldIndex: wi,
    world: WORLDS[wi % WORLDS.length],
    areaGlobal: Math.ceil(n / AREA_SIZE),                   // 1..112
    areaInWorld: Math.ceil(inWorld / AREA_SIZE),
    levelInArea: ((n - 1) % AREA_SIZE) + 1,
    firstOfArea: (n - 1) % AREA_SIZE === 0,
    lastOfArea: n % AREA_SIZE === 0,
    firstOfWorld: inWorld === 1,
    lastOfWorld: inWorld === WORLD_SIZES[wi],
  };
}

// ---- Difficulty mix: exactly 12 easy / 5 hard / 3 extra hard in every block of 20 (60% / 25% / 15%) ----
const patterns = new Map();
const valid = (p) => {
  if (p[0] !== 'easy' || p[p.length - 1] !== 'easy') return false;        // blocks never start/end hard
  let run = 0;
  for (let i = 0; i < p.length; i++) {
    run = p[i] === 'easy' ? 0 : run + 1;
    if (run > 2) return false;                                            // no 3 tough levels in a row
    if (i && p[i] === 'extraHard' && p[i - 1] === 'extraHard') return false;
  }
  return true;
};
function blockPattern(b) {
  if (patterns.has(b)) return patterns.get(b);
  const base = [...Array(12).fill('easy'), ...Array(5).fill('hard'), ...Array(3).fill('extraHard')];
  let p = base;
  for (let a = 0; a < 5000; a++) {
    const cand = shuffled(base, rng(b * 2654435761 + a * 40503));
    if (valid(cand)) { p = cand; break; }
  }
  patterns.set(b, p);
  return p;
}
export function tierOf(n) {
  if (n <= TUTORIAL_LEVELS) return 'easy';
  const i = n - TUTORIAL_LEVELS - 1;
  return blockPattern(Math.floor(i / 20))[i % 20];
}

// Cheap info for the level-select map. Does NOT generate the level.
export const levelInfo = (n) => ({ ...locate(n), tier: tierOf(n) });

// ---- Level generation with cache + background prefetch ----
const cache = new Map();
const CACHE_MAX = 80;
const handcrafted = new Map();
export function registerHandcrafted(levels) { levels.forEach((l, i) => handcrafted.set(i + 1, l)); } // optional: keep your old levels

export function getLevel(n) {
  if (n < 1 || n > TOTAL_LEVELS) throw new Error('Level out of range: ' + n);
  if (cache.has(n)) { const l = cache.get(n); cache.delete(n); cache.set(n, l); return l; }
  let level = handcrafted.get(n) || { ...generateLevel(n, tierOf(n)) };
  if (!level.moveLimit) level.moveLimit = Math.ceil(level.vehicles.length * 1.6);
  if (!level.coinReward) level.coinReward = 40;
  level.info = levelInfo(n);
  cache.set(n, level);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  return level;
}

// Call after a level loads: builds the next few levels while the player is busy.
export function prefetch(from, count = 3) {
  const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (f) => setTimeout(f, 30);
  let n = from + 1;
  const step = () => { if (n > from + count || n > TOTAL_LEVELS) return; getLevel(n++); idle(step); };
  idle(step);
}

// ---- Unlocking ----
export const isLevelUnlocked = (n, highestCompleted) => n <= highestCompleted + 1;
export const isAreaUnlocked = (areaGlobal, highestCompleted) => (areaGlobal - 1) * AREA_SIZE + 1 <= highestCompleted + 1;
export const isWorldUnlocked = (worldIndex, highestCompleted) => WORLD_STARTS[worldIndex] + 1 <= highestCompleted + 1;

// Call when a level is completed. Returns what to celebrate and what to grant.
export function completionEvents(n) {
  const loc = locate(n);
  const ev = { areaUnlocked: null, worldUnlocked: null, bonusCoins: 0, rewardSkins: [] };
  if (loc.lastOfArea && n < TOTAL_LEVELS) { ev.areaUnlocked = loc.areaGlobal + 1; ev.bonusCoins += 300; }
  if (loc.lastOfWorld) {
    ev.rewardSkins = [loc.world.rewardVehicleSkin, loc.world.rewardPassengerSkin];
    ev.bonusCoins += 1000;
    if (n < TOTAL_LEVELS) ev.worldUnlocked = loc.worldIndex + 1;
  }
  return ev;
}
