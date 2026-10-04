// packs.js - Season Packs: for each season, the season's themed set (bus + outfit) plus three extra bus skins, sold together at a discount.
// Pure data, no imports except the bundle id. The extra buses are vehicle skins (obtain: 'pack'); their paint is used by look.js.
import { BUNDLE_ID } from './themes.js';

export const SEASON_PACKS = [
  { id: 'spring', season: 'spring', setId: 'spring', name: 'Spring Bloom Pack', glyph: '\u{1F338}', coinPrice: 9000, usd: '$4.99', sky: ['#bff0ff', '#f3ffe8'],
    variants: [
      { name: 'Meadow Mint',    topper: 'flowerPot', paint: { body: '#7fe08a', trim: '#ffffff', pattern: 'petals', colors: ['#ff9ad5', '#ffffff'] } },
      { name: 'Cherry Blossom', topper: 'heart',     paint: { body: '#ffc2dc', trim: '#ff7aa8', pattern: 'petals', colors: ['#ffffff'] } },
      { name: 'Tulip Express',  topper: 'balloon',   paint: { body: '#ffe14d', trim: '#ff5a8a', pattern: 'dots', colors: ['#ff5a8a', '#ffffff'] } },
    ] },
  { id: 'summer', season: 'summer', setId: 'summer', name: 'Summer Splash Pack', glyph: '☀️', coinPrice: 9000, usd: '$4.99', sky: ['#6fd8ff', '#fff3c4'],
    variants: [
      { name: 'Sunset Cruiser',   topper: 'umbrella', paint: { body: '#ff8a3d', trim: '#ffe14d', pattern: 'waves', colors: ['#fff3b0'] } },
      { name: 'Lagoon Splash',    topper: 'lifebuoy', paint: { body: '#3ad6e0', trim: '#ffffff', pattern: 'waves', colors: ['#ffffff'] } },
      { name: 'Watermelon Wagon', topper: 'palm',     paint: { body: '#ff5a6a', trim: '#3dcc6a', pattern: 'dots', colors: ['#2a1b2d', '#ffffff'] } },
    ] },
  { id: 'autumn', season: 'autumn', setId: 'autumn', name: 'Autumn Harvest Pack', glyph: '\u{1F342}', coinPrice: 9000, usd: '$4.99', sky: ['#ffd9a8', '#fff2dc'],
    variants: [
      { name: 'Maple Coach',  topper: 'leafPile', paint: { body: '#d9531f', trim: '#ffd23f', pattern: 'leaves', colors: ['#7a2f10'] } },
      { name: 'Pumpkin Spice', topper: 'pumpkin', paint: { body: '#ff9a2b', trim: '#6b3a1b', pattern: 'leaves', colors: ['#fff1c9'] } },
      { name: 'Acorn Express', topper: 'flag',    paint: { body: '#9b6a2f', trim: '#e0b080', pattern: 'dots', colors: ['#fff1c9'] } },
    ] },
  { id: 'winter', season: 'winter', setId: 'winter', name: 'Winter Wonderland Pack', glyph: '❄️', coinPrice: 9000, usd: '$4.99', sky: ['#bfe3ff', '#f4fbff'],
    variants: [
      { name: 'Frost Express',    topper: 'snowCap', paint: { body: '#bfe8ff', trim: '#ffffff', pattern: 'snow', colors: ['#ffffff'] } },
      { name: 'Candy Cane',       topper: 'lollipop', paint: { body: '#ffffff', trim: '#ff4040', pattern: 'stripes', colors: ['#ff4040'] } },
      { name: 'Midnight Aurora',  topper: 'antenna', paint: { body: '#2b3a8a', trim: '#62f5c8', pattern: 'stars', colors: ['#62f5c8', '#ffffff'], glow: true } },
    ] },
].map((p) => ({ ...p, productId: BUNDLE_ID + '.pack.' + p.id, variants: p.variants.map((v, i) => ({ ...v, id: 'v_pk_' + p.id + '_' + (i + 1) })) }));

export const packById = (id) => SEASON_PACKS.find((p) => p.id === id);
export const PACK_PAINT = {};   // skin id -> paint
SEASON_PACKS.forEach((p) => p.variants.forEach((v) => { PACK_PAINT[v.id] = v.paint; }));
// vehicle skin objects for skinData.js
export const packSkins = () => SEASON_PACKS.flatMap((p) => p.variants.map((v) => ({
  id: v.id, name: v.name, rarity: 'epic', obtain: 'pack', packId: p.id,
  style: { topper: v.topper, pattern: v.paint.pattern, accents: v.paint.colors, glossy: true },
})));
