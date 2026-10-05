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

// slack = extra moves allowed on top of "one tap per vehicle" (every tap on a vehicle costs 1 move).
export const DIFFICULTY = {
  easy:      { w: 6,  h: 6,  vehicles: 8,  colors: 3, locks: 0, cones: 0, bay: 7, blockedSlots: 0, shuffle: 0,   maxFree: 0.8,  slack: 1.8, coins: 40 },
  hard:      { w: 8,  h: 8,  vehicles: 22, colors: 5, locks: 2, cones: 4, bay: 7, blockedSlots: 0, shuffle: 0.2, maxFree: 0.45, slack: 1.5, coins: 100 },
  extraHard: { w: 10, h: 10, vehicles: 28, colors: 6, locks: 4, cones: 8, bay: 7, blockedSlots: 1, shuffle: 0.3, maxFree: 0.35, slack: 1.3, coins: 200 },
};

// Difficulty also creeps up slowly over the whole campaign (reaches its cap around level 6000).
export function configFor(tier, n) {
  const c = { ...DIFFICULTY[tier] };
  const p = Math.min(1, n / 6000);
  if (n <= 3) return { ...c, w: 5, h: 5, vehicles: 3 + n, colors: 2, maxFree: 1 }; // tutorial
  if (tier === 'easy') {
    c.vehicles = 6 + Math.round(p * 6);          // 6 -> 12
    c.locks = p > 0.3 ? 1 : 0;
    c.cones = p > 0.5 ? 2 : 0;
  } else {
    c.vehicles += Math.round(p * 4);
    c.locks += p > 0.6 ? 1 : 0;
  }
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

  const blocks = solution.map((id) => Array(byId[id].seats).fill(byId[id].color));
  for (let s = 0, k = Math.floor(blocks.length * cfg.shuffle); s < k; s++) {
    const i = Math.floor(r() * (blocks.length - 1));
    [blocks[i], blocks[i + 1]] = [blocks[i + 1], blocks[i]];
  }
  const blockedSlots = shuffled([...Array(cfg.bay).keys()], r).slice(0, cfg.blockedSlots);

  const level = {
    n, tier, w, h, bay: cfg.bay, blockedSlots, walls, vehicles, queue: blocks.flat(), solution,
    moveLimit: Math.ceil(vehicles.length * cfg.slack), coinReward: cfg.coins,
  };
  const free = vehicles.filter((v) => !pathIdx(v, w, h).some((c) => occ[c])).length;
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
