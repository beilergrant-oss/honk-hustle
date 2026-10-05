// packs.js - Season Packs: for each season, the season's themed set (bus + outfit) plus three extra bus skins, sold together at a discount.
// Pure data, no imports except the bundle id. The extra buses are vehicle skins (obtain: 'pack'); their paint is used by look.js.
import { BUNDLE_ID } from './themes.js';

const finalize = (p) => ({ ...p, productId: BUNDLE_ID + '.pack.' + p.id, variants: p.variants.map((v, i) => ({ ...v, id: 'v_pk_' + p.id + '_' + (i + 1), riderId: 'p_pk_' + p.id + '_' + (i + 1) })) });

export const SEASON_PACKS = [
  { id: 'spring', season: 'spring', setId: 'spring', name: 'Spring Bloom Pack', glyph: '\u{1F338}', coinPrice: 9000, usd: '$4.99', sky: ['#bff0ff', '#f3ffe8'],
    variants: [
      { hat: 'flowerCrown', name: 'Meadow Mint',    topper: 'flowerPot', paint: { body: '#7fe08a', trim: '#ffffff', pattern: 'petals', colors: ['#ff9ad5', '#ffffff'] } },
      { hat: 'bunnyEars', name: 'Cherry Blossom', topper: 'heart',     paint: { body: '#ffc2dc', trim: '#ff7aa8', pattern: 'petals', colors: ['#ffffff'] } },
      { hat: 'party', name: 'Tulip Express',  topper: 'balloon',   paint: { body: '#ffe14d', trim: '#ff5a8a', pattern: 'dots', colors: ['#ff5a8a', '#ffffff'] } },
    ] },
  { id: 'summer', season: 'summer', setId: 'summer', name: 'Summer Splash Pack', glyph: '☀️', coinPrice: 9000, usd: '$4.99', sky: ['#6fd8ff', '#fff3c4'],
    variants: [
      { hat: 'shades', name: 'Sunset Cruiser',   topper: 'umbrella', paint: { body: '#ff8a3d', trim: '#ffe14d', pattern: 'waves', colors: ['#fff3b0'] } },
      { hat: 'sunhat', name: 'Lagoon Splash',    topper: 'lifebuoy', paint: { body: '#3ad6e0', trim: '#ffffff', pattern: 'waves', colors: ['#ffffff'] } },
      { hat: 'snorkel', name: 'Watermelon Wagon', topper: 'palm',     paint: { body: '#ff5a6a', trim: '#3dcc6a', pattern: 'dots', colors: ['#2a1b2d', '#ffffff'] } },
    ] },
  { id: 'autumn', season: 'autumn', setId: 'autumn', name: 'Autumn Harvest Pack', glyph: '\u{1F342}', coinPrice: 9000, usd: '$4.99', sky: ['#ffd9a8', '#fff2dc'],
    variants: [
      { hat: 'acorn', name: 'Maple Coach',  topper: 'leafPile', paint: { body: '#d9531f', trim: '#ffd23f', pattern: 'leaves', colors: ['#7a2f10'] } },
      { hat: 'pumpkinHat', name: 'Pumpkin Spice', topper: 'pumpkin', paint: { body: '#ff9a2b', trim: '#6b3a1b', pattern: 'leaves', colors: ['#fff1c9'] } },
      { hat: 'explorer', name: 'Acorn Express', topper: 'flag',    paint: { body: '#9b6a2f', trim: '#e0b080', pattern: 'dots', colors: ['#fff1c9'] } },
    ] },
  { id: 'winter', season: 'winter', setId: 'winter', name: 'Winter Wonderland Pack', glyph: '❄️', coinPrice: 9000, usd: '$4.99', sky: ['#bfe3ff', '#f4fbff'],
    variants: [
      { hat: 'beanie', name: 'Frost Express',    topper: 'snowCap', paint: { body: '#bfe8ff', trim: '#ffffff', pattern: 'snow', colors: ['#ffffff'] } },
      { hat: 'santa', name: 'Candy Cane',       topper: 'lollipop', paint: { body: '#ffffff', trim: '#ff4040', pattern: 'stripes', colors: ['#ff4040'] } },
      { hat: 'earmuffs', name: 'Midnight Aurora',  topper: 'antenna', paint: { body: '#2b3a8a', trim: '#62f5c8', pattern: 'stars', colors: ['#62f5c8', '#ffffff'], glow: true } },
    ] },
].map((p) => finalize({ kind: 'season', ...p }));

// Weekly Packs: one per rotating weekly set. Four are for sale each week (same rotation as the weekly sets); gone next Monday, back in a few weeks.
// Owned ones stay in the Garage forever. Each unlocks the set (bus + outfit) plus three extra buses.
export const WEEKLY_PACKS = [
  { id: 'wk_ocean', kind: 'weekly', setId: 'ocean', name: 'Ocean Breeze Pack', glyphTopper: 'lifebuoy', coinPrice: 7000, usd: '$3.99', sky: ['#8fe3ff', '#e6fbff'],
    variants: [
      { hat: 'sunhat', name: 'Coral Cruiser', topper: 'umbrella', paint: { body: '#ff7f6e', trim: '#ffffff', pattern: 'waves', colors: ['#ffd9d0'] } },
      { hat: 'snorkel', name: 'Deep Blue', topper: 'lifebuoy', paint: { body: '#1f6fd1', trim: '#8fe3ff', pattern: 'waves', colors: ['#ffffff'] } },
      { hat: 'explorer', name: 'Seafoam Sprint', topper: 'surfboard', paint: { body: '#5ee6c0', trim: '#ffffff', pattern: 'dots', colors: ['#ffffff'] } },
    ] },
  { id: 'wk_fire', kind: 'weekly', setId: 'fire', name: 'Fire & Rescue Pack', glyphTopper: 'ladder', coinPrice: 7000, usd: '$3.99', sky: ['#ffd0c4', '#fff1ea'],
    variants: [
      { hat: 'firefighter', name: 'Ladder Truck', topper: 'ladder', paint: { body: '#e63232', trim: '#ffd23f', pattern: 'stripes', colors: ['#ffffff'] } },
      { hat: 'hardhat', name: 'Hose Hero', topper: 'lightBar', paint: { body: '#ff7a1a', trim: '#ffffff', pattern: 'stripes', colors: ['#ffffff'] } },
      { hat: 'racerHelmet', name: 'Ember Express', topper: 'flag', paint: { body: '#8a1c1c', trim: '#ffb347', pattern: 'bolt', colors: ['#ffb347'] } },
    ] },
  { id: 'wk_space', kind: 'weekly', setId: 'space', name: 'Space Explorer Pack', glyphTopper: 'planet', coinPrice: 7000, usd: '$3.99', sky: ['#b9c4ff', '#f0f2ff'],
    variants: [
      { hat: 'astronaut', name: 'Moon Rover', topper: 'planet', paint: { body: '#c9ced8', trim: '#6c7cff', pattern: 'stars', colors: ['#ffffff'] } },
      { hat: 'alien', name: 'Nebula Nomad', topper: 'rocket', paint: { body: '#6a3df0', trim: '#ff7ae0', pattern: 'stars', colors: ['#ffe58a', '#ffffff'] } },
      { hat: 'pilot', name: 'Comet Coach', topper: 'antenna', paint: { body: '#1b2459', trim: '#ffe58a', pattern: 'stars', colors: ['#ffffff'], glow: true } },
    ] },
  { id: 'wk_cyber', kind: 'weekly', setId: 'cyber', name: 'Neon / Cyber Pack', glyphTopper: 'controller', coinPrice: 7000, usd: '$3.99', sky: ['#c9b8ff', '#f1ecff'],
    variants: [
      { hat: 'vr', name: 'Pixel Pulse', topper: 'controller', paint: { body: '#1c1442', trim: '#ff3df0', pattern: 'grid', colors: ['#ff3df0'], glow: true } },
      { hat: 'headphones', name: 'Laser Lime', topper: 'speaker', paint: { body: '#12261a', trim: '#8dff3d', pattern: 'grid', colors: ['#8dff3d'], glow: true } },
      { hat: 'robot', name: 'Glitch Bus', topper: 'antenna', paint: { body: '#0f2a3d', trim: '#3df5ff', pattern: 'bolt', colors: ['#3df5ff'], glow: true } },
    ] },
  { id: 'wk_sports', kind: 'weekly', setId: 'sports', name: 'Sports Champ Pack', glyphTopper: 'ball', coinPrice: 7000, usd: '$3.99', sky: ['#c4f5c9', '#f1fff2'],
    variants: [
      { hat: 'sweatband', name: 'Striker', topper: 'ball', paint: { body: '#3ad65a', trim: '#ffffff', pattern: 'balls', colors: ['#ffffff'] } },
      { hat: 'racerHelmet', name: 'Slam Dunk', topper: 'ball', paint: { body: '#ff8a1f', trim: '#1b1b1b', pattern: 'balls', colors: ['#1b1b1b'] } },
      { hat: 'goldCrown', name: 'Champion Gold', topper: 'crown', paint: { body: '#ffd23f', trim: '#ffffff', pattern: 'stars', colors: ['#ffffff'] } },
    ] },
  { id: 'wk_jungle', kind: 'weekly', setId: 'jungle', name: 'Jungle Adventure Pack', glyphTopper: 'palm', coinPrice: 7000, usd: '$3.99', sky: ['#c6f0b0', '#f3ffe8'],
    variants: [
      { hat: 'explorer', name: 'Parrot Express', topper: 'palm', paint: { body: '#ff4d4d', trim: '#3dcc6a', pattern: 'leaves', colors: ['#ffd23f'] } },
      { hat: 'monkey', name: 'Vine Runner', topper: 'flowerPot', paint: { body: '#2f8a3c', trim: '#c9e86a', pattern: 'leaves', colors: ['#c9e86a'] } },
      { hat: 'cowboy', name: 'Safari Sunrise', topper: 'flag', paint: { body: '#e8a23a', trim: '#6b3a1b', pattern: 'zebra', colors: ['#3a2412'] } },
    ] },
  { id: 'wk_royal', kind: 'weekly', setId: 'royal', name: 'Royal Court Pack', glyphTopper: 'crown', coinPrice: 7000, usd: '$3.99', sky: ['#ffe9a8', '#fff8e0'],
    variants: [
      { hat: 'goldCrown', name: 'Ruby Regal', topper: 'crown', paint: { body: '#b3123c', trim: '#ffd23f', pattern: 'diamonds', colors: ['#ffd23f'] } },
      { hat: 'crown', name: 'Sapphire Duke', topper: 'flag', paint: { body: '#1e3fa8', trim: '#e8d28a', pattern: 'diamonds', colors: ['#e8d28a'] } },
      { hat: 'unicornHorn', name: 'Emerald Empress', topper: 'horn', paint: { body: '#2fb37a', trim: '#fff1a8', pattern: 'stars', colors: ['#fff1a8'] } },
    ] },
  { id: 'wk_construction', kind: 'weekly', setId: 'construction', name: 'Construction Crew Pack', glyphTopper: 'trafficCone', coinPrice: 7000, usd: '$3.99', sky: ['#ffe29a', '#fff7de'],
    variants: [
      { hat: 'hardhat', name: 'Dozer Yellow', topper: 'trafficCone', paint: { body: '#ffc72c', trim: '#1b1b1b', pattern: 'hazard', colors: ['#1b1b1b'] } },
      { hat: 'explorer', name: 'Crane Crew', topper: 'lightBar', paint: { body: '#ff7a1a', trim: '#ffffff', pattern: 'stripes', colors: ['#ffffff'] } },
      { hat: 'hardhat', name: 'Concrete Cruiser', topper: 'ladder', paint: { body: '#9aa3b0', trim: '#ffd23f', pattern: 'hazard', colors: ['#ffd23f'] } },
    ] },
  { id: 'wk_pirate', kind: 'weekly', setId: 'pirate', name: 'Pirate Voyage Pack', glyphTopper: 'jollyFlag', coinPrice: 7000, usd: '$3.99', sky: ['#b8d8e6', '#eef8fc'],
    variants: [
      { hat: 'buccaneer', name: 'Treasure Hunter', topper: 'potOfGold', paint: { body: '#7a4a1f', trim: '#ffd23f', pattern: 'skulls', colors: ['#ffd23f'] } },
      { hat: 'pirate', name: 'Ghost Ship', topper: 'jollyFlag', paint: { body: '#cfe8ef', trim: '#2a3a4a', pattern: 'skulls', colors: ['#2a3a4a'] } },
      { hat: 'snorkel', name: 'Kraken Coach', topper: 'lifebuoy', paint: { body: '#2f6a5a', trim: '#ff7a3a', pattern: 'waves', colors: ['#c9ffe9'] } },
    ] },
  { id: 'wk_hero', kind: 'weekly', setId: 'hero', name: 'Hero Squad Pack', glyphTopper: 'boltSign', coinPrice: 7000, usd: '$3.99', sky: ['#ffc9c9', '#fff0f0'],
    variants: [
      { hat: 'hero', name: 'Cape Crusader', topper: 'boltSign', paint: { body: '#2f5fff', trim: '#ffe14d', pattern: 'bolt', colors: ['#ffe14d'] } },
      { hat: 'ninja', name: 'Mighty Mask', topper: 'lightBar', paint: { body: '#1b1b1b', trim: '#ff3b3b', pattern: 'bolt', colors: ['#ff3b3b'] } },
      { hat: 'hero', name: 'Captain Star', topper: 'flag', paint: { body: '#ffffff', trim: '#d62d2d', pattern: 'stars', colors: ['#2f5fff'] } },
    ] },
  { id: 'wk_rock', kind: 'weekly', setId: 'rock', name: 'Rock Tour Pack', glyphTopper: 'speaker', coinPrice: 7000, usd: '$3.99', sky: ['#ffc2d6', '#fff0f5'],
    variants: [
      { hat: 'mohawk', name: 'Amp Attack', topper: 'speaker', paint: { body: '#ff3b6b', trim: '#ffffff', pattern: 'notes', colors: ['#ffffff'] } },
      { hat: 'headphones', name: 'Encore Express', topper: 'balloon', paint: { body: '#7a2cff', trim: '#ffd23f', pattern: 'notes', colors: ['#ffd23f'] } },
      { hat: 'cowboy', name: 'Stage Diver', topper: 'lightBar', paint: { body: '#1b1b1b', trim: '#3df5ff', pattern: 'notes', colors: ['#3df5ff'], glow: true } },
    ] },
  { id: 'wk_circus', kind: 'weekly', setId: 'circus', name: 'Circus Parade Pack', glyphTopper: 'bigTop', coinPrice: 7000, usd: '$3.99', sky: ['#ffd0e8', '#fff0f8'],
    variants: [
      { hat: 'party', name: 'Ringmaster', topper: 'bigTop', paint: { body: '#7a2cff', trim: '#ffd23f', pattern: 'circus', colors: ['#ffffff'] } },
      { hat: 'clown', name: 'Cotton Candy', topper: 'balloon', paint: { body: '#ff9ad5', trim: '#6ec6ff', pattern: 'circus', colors: ['#ffffff'] } },
      { hat: 'jester', name: 'Big Top Blue', topper: 'lollipop', paint: { body: '#2f6bff', trim: '#ffd23f', pattern: 'stripes', colors: ['#ffffff'] } },
    ] },
].map(finalize);

export const ALL_PACKS = [...SEASON_PACKS, ...WEEKLY_PACKS];

export const packById = (id) => ALL_PACKS.find((p) => p.id === id);
export const PACK_PAINT = {};   // skin id -> paint
ALL_PACKS.forEach((p) => p.variants.forEach((v) => { PACK_PAINT[v.id] = v.paint; }));
// vehicle skin objects for skinData.js
export const packSkins = () => ALL_PACKS.flatMap((p) => p.variants.map((v) => ({
  id: v.id, name: v.name, rarity: 'epic', obtain: 'pack', packId: p.id,
  style: { topper: v.topper, pattern: v.paint.pattern, accents: v.paint.colors, glossy: true },
})));

// Riders that go with each extra bus: a matching hat, and an outfit in the bus's colours (see outfitFor in look.js).
export const packPassengerSkins = () => ALL_PACKS.flatMap((p) => p.variants.map((v) => ({
  id: v.riderId, name: v.name + ' Rider', rarity: 'epic', obtain: 'pack', packId: p.id, style: { accessory: v.hat },
})));
export const PACK_PAIRS = {};
ALL_PACKS.forEach((p) => p.variants.forEach((v) => { PACK_PAIRS[v.id] = v.riderId; }));
