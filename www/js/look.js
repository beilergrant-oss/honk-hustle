// look.js - how skins are drawn in 2D: vehicle patterns and toppers, passenger hats. Shared by the board and the shop previews.
import { DRAW } from './patterns2d.js';
import { shade } from './busArt.js';
import { skinById } from './skinData.js';
import { BUS_STYLES } from './busStyles.js';
import { vehicleSkinId } from './themes.js';

export const COLOR_HEX = { magenta: '#ff4fa8', green: '#2fcf6a', yellow: '#ffd23a', blue: '#2f8bff', red: '#ff4545', purple: '#9b5de5' };

export const TOPPER_EMOJI = {
  taxiSign: '\u{1F695}', lightBar: '\u{1F6A8}', rocket: '\u{1F680}', horn: '\u{1F984}', crown: '\u{1F451}', surfboard: '\u{1F3C4}', flag: '\u{1F6A9}', snowCap: '❄️',
  antenna: '\u{1F4E1}', lollipop: '\u{1F36D}', pumpkin: '\u{1F383}', balloon: '\u{1F388}', lifebuoy: '\u{1F6DF}', ladder: '\u{1FA9C}', planet: '\u{1FA90}', controller: '\u{1F3AE}',
  ball: '\u{1F3C0}', palm: '\u{1F334}', trafficCone: '\u{1F6A7}', jollyFlag: '\u{1F3F4}‍☠️', boltSign: '⚡', speaker: '\u{1F50A}', bigTop: '\u{1F3AA}', flowerPot: '\u{1F338}',
  umbrella: '⛱️', leafPile: '\u{1F342}', snowman: '⛄', gifts: '\u{1F381}', cauldron: '\u{1F9EA}', heart: '\u{1F496}', potOfGold: '\u{1F4B0}', eggs: '\u{1F95A}', rainbowArch: '\u{1F308}',
};

// accessory -> [kind, colour 1, colour 2]
const HATS = {
  sunhat: ['brim', '#ffe58a', '#ff6b6b'], cowboy: ['brim', '#8a5a2b', '#5a3a1b'], beanie: ['dome', '#3b82f6', '#ffffff'], headphones: ['band', '#222222', '#ff4fd8'],
  explorer: ['brim', '#d8c28a', '#8a6a3a'], icecream: ['cone', '#ff9ad5', '#e0a458'], witch: ['cone', '#4b2a7a', '#ffcc33'], pilot: ['dome', '#7a4a25', '#222222'],
  astronaut: ['bubble', '#cfe8ff', '#ffffff'], pirate: ['pirate', '#1d1d1d', '#ffffff'], chef: ['puff', '#ffffff', '#eeeeee'], robot: ['antenna', '#bbbbbb', '#ff3b3b'],
  crown: ['crown', '#ffd700', '#ff4d4d'], party: ['cone', '#ff5fa8', '#ffe14d'], catEars: ['ears', '#444444', '#ff9ad5'], ninja: ['mask', '#1d1d1d', '#1d1d1d'],
  snorkel: ['visor', '#1d3b5a', '#9fe6ff'], firefighter: ['dome', '#ff3b3b', '#ffe14d'], alien: ['antenna', '#7cff4f', '#7cff4f'], vr: ['visor', '#2b2b3d', '#3df5ff'],
  sweatband: ['band', '#ffffff', '#ff4d4d'], monkey: ['ears', '#8a5a2b', '#e0b080'], jester: ['cone', '#ff4d4d', '#3b82f6'], hardhat: ['dome', '#ffd23f', '#e0b21f'],
  buccaneer: ['dome', '#d62d2d', '#ffffff'], hero: ['mask', '#ff3b3b', '#ff3b3b'], mohawk: ['band', '#ff4fd8', '#3df5ff'], clown: ['puff', '#ff9f1c', '#ff3b3b'],
  flowerCrown: ['band', '#ff7aa8', '#ffe14d'], shades: ['visor', '#1d1d1d', '#444444'], acorn: ['dome', '#9b6a2f', '#6b4a1f'], earmuffs: ['band', '#444444', '#ff9ad5'],
  santa: ['cone', '#ff3b3b', '#ffffff'], pumpkinHat: ['dome', '#ff8a1f', '#3c7a2a'], heartBand: ['band', '#ff9ac2', '#ff3b6b'], leprechaun: ['brim', '#2f9e44', '#1d1d1d'],
  bunnyEars: ['ears', '#ffffff', '#ffb3d1'], rainbowBand: ['band', '#ff9f1c', '#3b82f6'],
};

// ---- helpers ----
export function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

const tiles = new Map();
function tileFor(pattern, accents) {
  const key = pattern + '|' + accents.join(',');
  if (tiles.has(key)) return tiles.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  if (DRAW[pattern]) DRAW[pattern](g, (i) => accents[((i % accents.length) + accents.length) % accents.length], accents.length);
  tiles.set(key, c); return c;
}

// The paint job of a vehicle skin: the body colour and trim of the bus, plus a roof pattern. The roof and the belt stripe keep the
// game colour, so the player can still match passengers to buses at a glance.
const SKIN_PAINT = {
  v_taxi: { body: '#ffd23f', trim: '#111111', pattern: 'checker', colors: ['#111111'] },
  v_police: { body: '#1e3a8a', trim: '#ffffff', pattern: 'stripes', colors: ['#ffffff'] },
  v_racing: { body: '#e32d2d', trim: '#ffffff', pattern: 'stripes', colors: ['#ffffff'] },
  v_unicorn: { body: '#ffd9f3', trim: '#b983ff', pattern: 'stars', colors: ['#ffffff', '#ffe14d'] },
  v_gold: { body: '#e6b422', trim: '#fff1a8', pattern: 'none', colors: [] },
  v_surf: { body: '#2bd0d0', trim: '#ff8a3d', pattern: 'waves', colors: ['#ffffff'] },
  v_safari: { body: '#c9a15a', trim: '#3b2a14', pattern: 'zebra', colors: ['#1b1b1b'] },
  v_frost: { body: '#a8defa', trim: '#ffffff', pattern: 'snow', colors: ['#ffffff'] },
  v_neon: { body: '#241a5c', trim: '#3df5ff', pattern: 'grid', colors: ['#3df5ff'], glow: true },
  v_jungle: { body: '#3a9a46', trim: '#7a5230', pattern: 'dots', colors: ['#ffffff'] },
  v_candy: { body: '#ff9ad5', trim: '#ffffff', pattern: 'stripes', colors: ['#ffffff'] },
  v_spooky: { body: '#ff8a1f', trim: '#2a1b3d', pattern: 'bats', colors: ['#2a1b3d'] },
  v_sky: { body: '#8fd0ff', trim: '#ffffff', pattern: 'stars', colors: ['#ffffff'] },
  v_moon: { body: '#c9ced8', trim: '#7a8296', pattern: 'none', colors: [] },
};
export function paintFor(skinId) {
  if (!skinId || skinId === 'v_classic') return null;
  const bs = BUS_STYLES.find((s) => s.setId && vehicleSkinId(s.setId) === skinId);
  if (bs) { const b = bs.look.bus; return { body: b.body, trim: b.trim, pattern: b.pattern.id, colors: b.pattern.colors || [], glow: bs.id === 'cyber' }; }
  return SKIN_PAINT[skinId] || null;
}

// The skin for the player's equipped ids -> what the board needs.
export function resolveLook(profile) {
  const v = skinById(profile.equippedVehicleSkin || 'v_classic'), p = skinById(profile.equippedPassengerSkin || 'p_classic');
  const vs = (v && v.style) || {};
  return {
    vehicle: { pattern: vs.pattern || null, accents: vs.accents || (vs.accent ? [vs.accent] : ['#ffffff']), topper: vs.topper || null, glossy: !!vs.glossy, emissive: vs.emissive || 0, metal: vs.metalness || 0 },
    accessory: (p && p.style && p.style.accessory) || null,
    paint: paintFor(profile.equippedVehicleSkin || 'v_classic'),
  };
}

// Paints the skin's pattern over a rounded shape already set as the current path (call between save/restore).
export function patternFill(g, look, scale, alpha = 0.85) {
  if (!look.pattern) return;
  const pat = g.createPattern(tileFor(look.pattern, look.accents), 'repeat');
  if (pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().scale(scale));
  g.save(); g.clip(); g.globalAlpha = alpha; g.fillStyle = pat; g.fillRect(-4000, -4000, 8000, 8000); g.restore();
}

// ---- passenger: a bean with eyes, a smile and the equipped hat. (x, y) = centre of the body, s = height ----
export function drawPassenger(g, x, y, s, hex, accessory, wobble = 0) {
  g.save(); g.translate(x, y); g.rotate(wobble);
  const w = s * 0.76;
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, s * 0.5, w * 0.5, s * 0.08, 0, 0, 7); g.fill();
  const grad = g.createRadialGradient(-w * 0.22, -s * 0.28, s * 0.04, 0, 0, s * 0.62); grad.addColorStop(0, shade(hex, 0.5)); grad.addColorStop(0.5, hex); grad.addColorStop(1, shade(hex, -0.36));
  g.fillStyle = grad; rr(g, -w / 2, -s / 2, w, s, w / 2); g.fill();
  g.strokeStyle = shade(hex, -0.5); g.lineWidth = Math.max(1, s * 0.04); g.stroke();
  g.fillStyle = '#1b1d2b'; g.beginPath(); g.arc(-w * 0.2, -s * 0.08, s * 0.065, 0, 7); g.arc(w * 0.2, -s * 0.08, s * 0.065, 0, 7); g.fill();
  g.strokeStyle = '#1b1d2b'; g.lineWidth = Math.max(1, s * 0.06); g.lineCap = 'round'; g.beginPath(); g.arc(0, s * 0.02, s * 0.13, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-w * 0.2, -s * 0.34, w * 0.15, s * 0.075, -0.5, 0, 7); g.fill();
  if (accessory && HATS[accessory]) drawHat(g, HATS[accessory], 0, -s / 2, w, s);
  g.restore();
}
function drawHat(g, [kind, c1, c2], x, y, w, s) {
  g.save(); g.translate(x, y); g.lineWidth = Math.max(1, s * 0.03); g.strokeStyle = 'rgba(0,0,0,.35)';
  const half = w / 2;
  switch (kind) {
    case 'dome': g.fillStyle = c1; g.beginPath(); g.arc(0, s * 0.06, half * 0.95, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = c2; g.fillRect(-half * 0.95, s * 0.02, w * 0.95, s * 0.06); break;
    case 'brim': g.fillStyle = c1; g.beginPath(); g.ellipse(0, s * 0.06, half * 1.35, s * 0.07, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(0, s * 0.05, half * 0.8, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = c2; g.fillRect(-half * 0.8, s * 0.0, w * 0.8, s * 0.05); break;
    case 'cone': g.fillStyle = c1; g.beginPath(); g.moveTo(-half * 0.85, s * 0.07); g.lineTo(half * 0.1, -s * 0.42); g.lineTo(half * 0.85, s * 0.07); g.closePath(); g.fill(); g.stroke(); g.fillStyle = c2; g.beginPath(); g.arc(half * 0.1, -s * 0.42, s * 0.06, 0, 7); g.fill(); g.fillRect(-half * 0.9, s * 0.03, w * 0.9, s * 0.06); break;
    case 'crown': g.fillStyle = c1; g.beginPath(); g.moveTo(-half * 0.8, s * 0.06); g.lineTo(-half * 0.8, -s * 0.2); g.lineTo(-half * 0.4, -s * 0.06); g.lineTo(0, -s * 0.26); g.lineTo(half * 0.4, -s * 0.06); g.lineTo(half * 0.8, -s * 0.2); g.lineTo(half * 0.8, s * 0.06); g.closePath(); g.fill(); g.stroke(); g.fillStyle = c2; g.beginPath(); g.arc(0, -s * 0.2, s * 0.04, 0, 7); g.fill(); break;
    case 'ears': for (const sx of [-1, 1]) { g.save(); g.translate(sx * half * 0.5, -s * 0.08); g.rotate(sx * 0.2); g.fillStyle = c1; g.beginPath(); g.ellipse(0, -s * 0.1, s * 0.09, s * 0.22, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = c2; g.beginPath(); g.ellipse(0, -s * 0.1, s * 0.045, s * 0.15, 0, 0, 7); g.fill(); g.restore(); } break;
    case 'band': g.strokeStyle = c1; g.lineWidth = s * 0.07; g.beginPath(); g.arc(0, s * 0.18, half * 0.98, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); g.fillStyle = c2; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * half * 0.95, s * 0.24, s * 0.08, 0, 7); g.fill(); } break;
    case 'visor': g.fillStyle = c1; rr(g, -half * 0.95, s * 0.3, w * 0.95, s * 0.17, s * 0.06); g.fill(); g.fillStyle = c2; rr(g, -half * 0.75, s * 0.33, w * 0.75, s * 0.1, s * 0.04); g.fill(); break;
    case 'mask': g.fillStyle = c1; g.fillRect(-half, s * 0.33, w, s * 0.1); g.fillStyle = '#fff'; g.fillRect(-half * 0.6, s * 0.35, half * 0.4, s * 0.05); g.fillRect(half * 0.2, s * 0.35, half * 0.4, s * 0.05); break;
    case 'puff': g.fillStyle = c1; for (const [px, py, pr] of [[-0.45, -0.02, 0.2], [0.45, -0.02, 0.2], [0, -0.12, 0.26]]) { g.beginPath(); g.arc(px * half * 1.3, py * s, pr * s, 0, 7); g.fill(); g.stroke(); } break;
    case 'bubble': g.fillStyle = 'rgba(207,232,255,.28)'; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = s * 0.05; g.beginPath(); g.arc(0, s * 0.45, s * 0.55, 0, 7); g.fill(); g.stroke(); break;
    case 'antenna': g.strokeStyle = c1; g.lineWidth = s * 0.04; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * half * 0.3, s * 0.02); g.lineTo(sx * half * 0.5, -s * 0.2); g.stroke(); g.fillStyle = c2; g.beginPath(); g.arc(sx * half * 0.5, -s * 0.22, s * 0.06, 0, 7); g.fill(); } break;
    case 'pirate': g.fillStyle = c1; g.beginPath(); g.moveTo(-half * 1.2, s * 0.08); g.quadraticCurveTo(0, -s * 0.38, half * 1.2, s * 0.08); g.quadraticCurveTo(0, s * 0.0, -half * 1.2, s * 0.08); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(0, -s * 0.08, s * 0.045, 0, 7); g.fill(); break;
    default: break;
  }
  g.restore();
}
