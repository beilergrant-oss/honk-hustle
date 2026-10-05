// levelGen.js - solvable-by-construction level generator for Hard / Extra Hard
export const SIZES = { car: { len: 2, seats: 2 }, van: { len: 3, seats: 4 }, bus: { len: 4, seats: 6 } };
// 10 colours. The first 6 are the original set; more colours join as the levels go on (see colorsFor).
export const COLORS = ['magenta', 'green', 'yellow', 'blue', 'red', 'purple', 'orange', 'cyan', 'brown', 'lime'];
// Number of different bus / passenger colours at level n: grows steadily from 3 to all 10 by around level 7,500.
export function colorsFor(tier, n) {
  if (n <= 3) return 2;
  const grow = Math.floor(n / 1000);
  return Math.min(COLORS.length, tier === 'easy' ? 3 + grow : tier === 'hard' ? 5 + grow : 6 + grow);
}

// ---- Obstacles ----
// A new kind arrives every 100-200 levels. After that, each stretch of 150 levels uses the newest kind plus a changing mix of the older ones,
// so some old obstacles leave for a while and come back in higher levels.
export const OBSTACLES = [
  { id: 'cone',    intro: 1,   name: 'Cones',            icon: '\u{1F6A7}', desc: 'Cones fill parts of the lot.' },
  { id: 'lock',    intro: 40,  name: 'Padlocks',         icon: '\u{1F512}', desc: 'Opens after that many have left.' },
  { id: 'barrier', intro: 200, name: 'Barriers',         icon: '\u{1F6A7}', desc: 'Lifts after that many have left.' },
  { id: 'ice',     intro: 350, name: 'Frozen buses',     icon: '\u2744\uFE0F', desc: 'Tap to thaw (costs a move), tap again to go.' },
  { id: 'mystery', intro: 500, name: 'Mystery buses',    icon: '\u2753',     desc: 'Colour shows once its way is clear.' },
  { id: 'slot',    intro: 650, name: 'Blocked bay slots', icon: '\u26D4',    desc: 'A cone blocks a bay slot.' },
  { id: 'deepice', intro: 800, name: 'Deep freeze',      icon: '\u{1F9CA}', desc: 'Two thaw taps before it can go.' },
  { id: 'gate',    intro: 950, name: 'Roadworks',        icon: '\u{1F6A7}', desc: 'More barriers, each lifting at its own time.' },
];
export const ERA = 150;
export const WALL_SKINS = ['cone', 'barrel', 'rock', 'crate', 'bush'];
export const wallSkinFor = (n) => WALL_SKINS[Math.floor(n / 200) % WALL_SKINS.length];
const hash = (a, b) => { let x = (a * 374761393 + b * 668265263) >>> 0; x = ((x ^ (x >>> 13)) * 1274126177) >>> 0; return (x ^ (x >>> 16)) >>> 0; };
export const introducedAt = (n) => OBSTACLES.filter((o) => o.intro <= n);
export const newestObstacle = (n) => { const ps = introducedAt(n); const o = ps[ps.length - 1]; return o && o.intro > 1 && n - o.intro < ERA ? o.id : null; };
// Which obstacle kinds are in play at level n for a tier. Easy levels get at most one gentle kind.
export function activeObstacles(n, tier) {
  if (n <= 3) return [];
  const pool = introducedAt(n), era = Math.floor(n / ERA), newest = newestObstacle(n), on = new Set();
  if (newest) on.add(newest);
  pool.forEach((o, i) => { if (hash(era + 1, i + 7) % 100 < 55) on.add(o.id); });
  for (let i = 0; on.size < Math.min(2, pool.length) && i < 20; i++) on.add(pool[hash(era, i) % pool.length].id);
  let list = pool.map((o) => o.id).filter((id) => on.has(id));
  if (tier === 'easy') { const gentle = list.filter((id) => ['cone', 'lock', 'barrier', 'ice'].includes(id)); list = gentle.length ? [gentle[hash(n, 3) % gentle.length]] : []; }
  return list;
}

// slack = extra moves allowed on top of "one tap per vehicle" (every tap on a vehicle costs 1 move).
export const DIFFICULTY = {
  easy:      { w: 7,  h: 7,  vehicles: 8,  colors: 3, locks: 0, cones: 0, bay: 7, blockedSlots: 0, shuffle: 0,   maxFree: 0.85, slack: 1.8, coins: 40 },
  hard:      { w: 9,  h: 9,  vehicles: 14, colors: 5, locks: 0, cones: 0, bay: 7, blockedSlots: 0, shuffle: 0.2, maxFree: 0.55, slack: 1.7, coins: 100 },
  extraHard: { w: 10, h: 10, vehicles: 18, colors: 6, locks: 0, cones: 0, bay: 7, blockedSlots: 0, shuffle: 0.3, maxFree: 0.45, slack: 1.5, coins: 200 },
};

// Difficulty rises smoothly with the level number (reaches its cap around level 5000): early levels are gentle, later ones are tight.
export function configFor(tier, n) {
  const c = { ...DIFFICULTY[tier] };
  const p = Math.min(1, n / 5000), q = Math.sqrt(p);   // q rises faster at first
  c.ice = 0; c.mystery = 0; c.barriers = 0; c.wallSkin = wallSkinFor(n); c.active = [];
  if (n <= 3) return { ...c, w: 6, h: 6, vehicles: 3 + n, colors: 2, maxFree: 1 }; // tutorial
  const on = activeObstacles(n, tier), has = (id) => on.includes(id); c.active = on;
  const k = tier === 'easy' ? 0 : tier === 'hard' ? 1 : 2;
  if (tier === 'easy') {
    c.vehicles = 5 + Math.round(q * 8);               // 5 -> 13
    c.maxFree = 0.85 - 0.25 * p; c.slack = 1.85 - 0.3 * p;
  } else if (tier === 'hard') {
    c.vehicles = 10 + Math.round(q * 16);             // 10 -> 26
    c.maxFree = 0.6 - 0.2 * p; c.slack = 1.75 - 0.35 * p;
  } else {
    c.vehicles = 14 + Math.round(q * 18);             // 14 -> 32
    c.w = c.h = n < 300 ? 10 : 11; c.maxFree = 0.5 - 0.17 * p; c.slack = 1.6 - 0.3 * p;
  }
  if (tier === 'hard' && n >= 120) c.w = c.h = 9;
  if (tier === 'hard' && n < 120) c.w = c.h = 8;
  if (has('cone')) c.cones = [1, 3 + Math.round(q * 3), 5 + Math.round(q * 4)][k];
  if (has('lock')) c.locks = [1, 1 + Math.round(q * 2), 2 + Math.round(q * 3)][k];
  if (has('barrier') || has('gate')) c.barriers = [1, 2 + Math.round(q * 2), 3 + Math.round(q * 3)][k] + (has('gate') ? 2 : 0);
  if (has('ice') || has('deepice')) { c.ice = [1, 2 + Math.round(q * 2), 3 + Math.round(q * 3)][k]; c.iceTaps = has('deepice') ? 2 : 1; }
  if (has('mystery') && k) c.mystery = [0, 3 + Math.round(q * 3), 4 + Math.round(q * 6)][k];
  if (has('slot') && k) c.blockedSlots = k === 1 ? (p > 0.4 ? 1 : 0) : 1 + (p > 0.6 ? 1 : 0);
  c.vehicles = Math.max(c.vehicles, 4);
  c.colors = colorsFor(tier, n);
  return c;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
export function shuffled(arr, r) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const isHoriz = (v) => v.dir === 'E' || v.dir === 'W';
export function cellsOf(v) {
  return Array.from({ length: v.len }, (_, i) => ({ x: v.x + (isHoriz(v) ? i : 0), y: v.y + (isHoriz(v) ? 0 : i) }));
}
export function pathOf(v, w, h) {
  const out = [];
  if (v.dir === 'E') for (let x = v.x + v.len; x < w; x++) out.push({ x, y: v.y });
  if (v.dir === 'W') for (let x = v.x - 1; x >= 0; x--) out.push({ x, y: v.y });
  if (v.dir === 'S') for (let y = v.y + v.len; y < h; y++) out.push({ x: v.x, y });
  if (v.dir === 'N') for (let y = v.y - 1; y >= 0; y--) out.push({ x: v.x, y });
  return out;
}

// Plays the bay/queue rules for a given removal order. true = level is won.
export function simulate(level, order) {
  const slots = level.bay - level.blockedSlots.length;
  const queue = [...level.queue];
  const byId = Object.fromEntries(level.vehicles.map((v) => [v.id, v]));
  let parked = [];
  const board = () => {
    let moved = true;
    while (moved && queue.length) {
      moved = false;
      for (const p of parked) {
        if (p.left > 0 && queue[0] === p.color) { queue.shift(); p.left--; moved = true; break; }
      }
    }
    parked = parked.filter((p) => p.left > 0);
  };
  for (const id of order) {
    if (parked.length >= slots) return false;
    const v = byId[id];
    parked.push({ color: v.color, left: v.seats });
    board();
  }
  return queue.length === 0;
}

// ---- Fast internals: flat grids instead of string-keyed Sets (about 10x quicker) ----
const DX = { N: 0, S: 0, E: 1, W: -1 }, DY = { N: -1, S: 1, E: 0, W: 0 };
const bodyIdx = (v, w) => {
  const hz = v.dir === 'E' || v.dir === 'W', out = [];
  for (let i = 0; i < v.len; i++) out.push((v.y + (hz ? 0 : i)) * w + v.x + (hz ? i : 0));
  return out;
};
const pathIdx = (v, w, h) => {
  const out = [];
  let x = v.x, y = v.y;
  if (v.dir === 'E') x += v.len; else if (v.dir === 'W') x -= 1; else if (v.dir === 'S') y += v.len; else y -= 1;
  for (; x >= 0 && y >= 0 && x < w && y < h; x += DX[v.dir], y += DY[v.dir]) out.push(y * w + x);
  return out;
};

function tryBuild(n, tier, cfg, r) {
  const { w, h } = cfg;
  const occ = new Uint8Array(w * h);
  const walls = [];
  while (walls.length < cfg.cones) {
    const x = Math.floor(r() * w), y = Math.floor(r() * h);
    if (!occ[y * w + x]) { occ[y * w + x] = 1; walls.push({ x, y }); }
  }
  const sizePool = ['car', 'car', 'van', 'van', 'bus'];
  const vehicles = [], owners = Array.from({ length: w * h }, () => []);
  for (let i = 0; i < cfg.vehicles; i++) {
    // Sample several legal spots and keep the one that blocks the most vehicles already placed.
    let best = null;
    for (let t = 0; t < 200; t++) {
      const size = pick(sizePool, r), dir = pick(['N', 'E', 'S', 'W'], r);
      const { len, seats } = SIZES[size];
      const horiz = dir === 'E' || dir === 'W';
      const x = Math.floor(r() * (w - (horiz ? len - 1 : 0)));
      const y = Math.floor(r() * (h - (horiz ? 0 : len - 1)));
      const v = { id: 'v' + i, size, len, seats, x, y, dir };
      const body = bodyIdx(v, w);
      if (body.some((c) => occ[c])) continue;
      // KEY IDEA: a new vehicle's exit must be clear of everything placed so far.
      // Anything placed later may block it, and is removed earlier, so it's always solvable.
      const path = pathIdx(v, w, h);
      if (path.some((c) => occ[c])) continue;
      const hit = new Set();
      body.forEach((c) => owners[c].forEach((o) => hit.add(o)));
      if (!best || hit.size > best.score) best = { v, body, path, score: hit.size };
    }
    if (best) {
      best.body.forEach((c) => { occ[c] = 1; });
      best.path.forEach((c) => owners[c].push(vehicles.length));
      vehicles.push(best.v);
    }
  }
  if (vehicles.length < cfg.vehicles * 0.75) return null;

  const solution = vehicles.map((v) => v.id).reverse();
  const byId = Object.fromEntries(vehicles.map((v) => [v.id, v]));
  vehicles.forEach((v) => { v.color = COLORS[Math.floor(r() * cfg.colors)]; });

  // Locked blocks: a vehicle removed at step p has seen p departures, so lock <= p is always safe.
  shuffled(solution.map((id, p) => ({ id, p })).filter((o) => o.p >= 2), r)
    .slice(0, cfg.locks)
    .forEach((o) => { byId[o.id].lock = 1 + Math.floor(r() * Math.min(o.p, 6)); });

  // Frozen buses (extra thaw taps), mystery buses (colour hidden until the way is clear) and barriers (lift after N departures).
  const pos = Object.fromEntries(solution.map((id, p) => [id, p]));
  let iceTaps = 0;
  shuffled(vehicles.filter((v) => !v.lock), r).slice(0, cfg.ice).forEach((v) => { v.ice = cfg.iceTaps || 1; iceTaps += v.ice; });
  shuffled(vehicles, r).slice(0, cfg.mystery).forEach((v) => { v.mystery = true; });
  const barriers = [], bocc = new Set(), paths = vehicles.map((v) => ({ v, cells: pathIdx(v, w, h) }));
  for (const o of shuffled(solution.map((id) => ({ id, p: pos[id] })).filter((o) => o.p >= 1), r)) {
    if (barriers.length >= cfg.barriers) break;
    const mine = paths.find((q) => q.v.id === o.id).cells.filter((c) => !occ[c] && !bocc.has(c));
    if (!mine.length) continue;
    const cell = mine[Math.floor(r() * mine.length)];
    const minq = Math.min(...paths.filter((q) => q.cells.includes(cell)).map((q) => pos[q.v.id]));
    if (minq < 1) continue;
    bocc.add(cell); barriers.push({ x: cell % w, y: Math.floor(cell / w), until: 1 + Math.floor(r() * Math.min(minq, 6)) });
  }

  const blocks = solution.map((id) => Array(byId[id].seats).fill(byId[id].color));
  for (let s = 0, k = Math.floor(blocks.length * cfg.shuffle); s < k; s++) {
    const i = Math.floor(r() * (blocks.length - 1));
    [blocks[i], blocks[i + 1]] = [blocks[i + 1], blocks[i]];
  }
  const blockedSlots = shuffled([...Array(cfg.bay).keys()], r).slice(0, cfg.blockedSlots);

  const level = {
    n, tier, w, h, bay: cfg.bay, blockedSlots, walls, barriers, wallSkin: cfg.wallSkin, vehicles, queue: blocks.flat(), solution, obstacles: cfg.active,
    moveLimit: Math.ceil((vehicles.length + iceTaps) * cfg.slack), coinReward: cfg.coins,
  };
  const free = vehicles.filter((v) => !pathIdx(v, w, h).some((c) => occ[c] || bocc.has(c))).length;
  if (free > cfg.maxFree * vehicles.length) return null;
  return simulate(level, solution) ? level : null;
}

export function generateLevel(n, tier, seed = n * 7919) {
  if (!DIFFICULTY[tier]) throw new Error('Unknown tier ' + tier);
  const base = configFor(tier, n);
  // Pass 1 = full difficulty. Pass 2 relaxes slightly so generation never fails.
  const passes = [base, { ...base, maxFree: Math.min(1, base.maxFree + 0.15), shuffle: base.shuffle / 2, vehicles: Math.max(3, Math.round(base.vehicles * 0.85)) }];
  for (const cfg of passes) {
    for (let a = 0; a < 300; a++) {
      const level = tryBuild(n, tier, cfg, rng(seed + a * 101));
      if (level) return level;
    }
  }
  throw new Error('Could not generate level ' + n);
}
