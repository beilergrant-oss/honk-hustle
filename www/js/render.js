// render.js - draws the game as a real 3D scene (perspective camera, lit boxes, depth-sorted) on a plain <canvas>, no library needed.
// The game logic (game.js) is instant; this file makes it look good: vehicles drive off, park, passengers hop aboard.
// World: x = right, y = up, z = away from the player. The board sits in front (z 0..h), then the parking bay, then the passenger queue.
import { cellsOf } from './levelGen.js';
import { shade } from './busArt.js';
import { COLOR_HEX, TOPPER_EMOJI, rr, drawPassenger } from './look.js';
import { sfx, haptic } from './sfx.js';
import { BACKDROPS } from './backdrops.js';
import { blocker } from './game.js';

const DIR_VEC = { E: [1, 0], S: [0, 1], W: [-1, 0], N: [0, -1] };       // grid directions (grid y grows toward the player)
const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const PITCH = 1.16, SINP = Math.sin(PITCH), COSP = Math.cos(PITCH), FOV = 36 * Math.PI / 180;
const LIGHT = (() => { const v = [-0.45, 0.85, -0.35], n = Math.hypot(...v); return v.map((x) => x / n); })();
const BODY_H = 0.34, CAB_H = 0.3;
let PASS_H = 0.98, PASS_GAP = 0.7;   // set by layout() so about 9 big passengers always fit across the queue
const INK = '#3a4a78';   // the dark outline colour of the cartoon look

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lit = (hex, l) => { const [r, g, b] = rgb(hex); const f = (v) => clamp(Math.round(l > 1 ? v + (255 - v) * (l - 1) * 1.6 : v * l), 0, 255); return `rgb(${f(r)},${f(g)},${f(b)})`; };
const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };

function hull(pts) {   // convex hull (monotone chain) of [x, y] points
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };

export function createRenderer(canvas, opts = {}) {
  const g = canvas.getContext('2d');
  const R = {
    game: null, look: { vehicle: {}, accessory: null }, world: { sky: ['#35b6ff', '#d2f3ff'], ground: '#7f8cab' },
    L: null, vq: [], vslots: [], movers: [], leavers: [], flyers: [], particles: [], floats: [], sched: [], fx: {},
    timelineEnd: 0, shakeAt: 0, shakeAmt: 0, targeting: false, lastClear: 0, combo: 0, raf: 0, running: false,
  };

  // ---------- camera ----------
  let cam = { x: 0, y: 10, z: -10 }, F = 600, cy0 = 300, CW = 400, CH = 700;
  function P(x, y, z) {   // world -> screen {x, y, z: depth, u: pixels per world unit at that depth}
    const px = x - cam.x, py = y - cam.y, pz = z - cam.z;
    const yc = py * COSP + pz * SINP, zc = Math.max(0.05, -py * SINP + pz * COSP), k = F / zc;
    return { x: CW / 2 + px * k, y: cy0 - yc * k, z: zc, u: k };
  }
  const camGround = () => ({ x: cam.x, z: cam.z });

  // ---------- layout (world units: one board cell = 1) ----------
  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = canvas.clientWidth, H = canvas.clientHeight; CW = W; CH = H;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gm = R.game; if (!gm) { R.L = { W, H }; return; }
    const bw = gm.w, bh = gm.h, bay = gm.bay;
    const roadW = Math.max(bw + 1.2, bay * 0.92 + 0.5), cx = bw / 2, sw = roadW / bay;
    const roadZ0 = bh + 0.8, slotZ = roadZ0 + 0.18 + 0.6, roadZ1 = roadZ0 + 1.56, qz = roadZ1 + 0.95;
    PASS_GAP = clamp((roadW - 0.8) / 9, 0.7, 1.15); PASS_H = PASS_GAP * 1.4;
    const qMax = Math.floor((roadW - 0.3) / PASS_GAP);
    R.L = { W, H, bw, bh, bay, cx, roadW, sw, roadX0: cx - roadW / 2, roadZ0, roadZ1, slotZ, qz, qMax, qx0: cx - ((Math.min(qMax, 99) - 1) * PASS_GAP) / 2 };
    // fit the whole scene on screen: find the closest camera that keeps everything inside the margins
    F = (H / 2) / Math.tan(FOV / 2);
    const tz = (qz + 0.2 - 0.5) / 2, m = 4;
    const pts = [[-0.45, 0, -0.55], [bw + 0.45, 0, -0.55], [cx - roadW / 2 - 0.2, PASS_H * 1.3, qz + 0.2], [cx + roadW / 2 + 0.2, PASS_H * 1.3, qz + 0.2], [cx + roadW / 2 + 1.0, 0.3, qz], [-0.45, 0.6, bh], [bw + 0.45, 0.6, bh]];
    const place = (d) => { cam = { x: cx, y: d * SINP, z: tz - d * COSP }; cy0 = H / 2; return pts.map((p) => P(p[0], p[1], p[2])); };
    let lo = 3, hi = 400;
    for (let i = 0; i < 30; i++) {
      const d = (lo + hi) / 2, pr = place(d), minX = Math.min(...pr.map((p) => p.x)), maxX = Math.max(...pr.map((p) => p.x)), minY = Math.min(...pr.map((p) => p.y)), maxY = Math.max(...pr.map((p) => p.y));
      if (minX >= m && maxX <= W - m && maxY - minY <= H - 2 * m) hi = d; else lo = d;
    }
    const pr = place(hi), minY = Math.min(...pr.map((p) => p.y)), maxY = Math.max(...pr.map((p) => p.y));
    cy0 = H / 2 + (H / 2 - (minY + maxY) / 2);
    R.L.cell = P(0, 0, 0).u;   // pixels per cell at the board's near edge (used for text sizes)
  }
  const slotC = (i) => ({ x: R.L.roadX0 + (i + 0.5) * R.L.sw, z: R.L.slotZ });
  const queueW = (i) => ({ x: R.L.qx0 + i * PASS_GAP, z: R.L.qz });
  const queuePos = (i) => { const q = queueW(i), p = P(q.x, PASS_H * 0.5, q.z); return { x: p.x, y: p.y }; };
  const cellW = (cx, cy) => ({ x: cx + 0.5, z: R.L.bh - cy - 0.5 });
  const vehW = (v) => { const cs = cellsOf(v), a = cs[0], b = cs[cs.length - 1]; return cellW((a.x + b.x) / 2, (a.y + b.y) / 2); };
  const vehCenter = (v) => { const c = vehW(v), p = P(c.x, BODY_H + CAB_H, c.z); return { x: p.x, y: p.y }; };
  const SEAT_R = 0.085;
  function seatW(slot, seat, seats) {   // a seat marker on a parked bus's roof
    const c = slotC(slot), cols = seats <= 4 ? seats : Math.ceil(seats / 2), row = seats <= 4 ? 0 : seat < cols ? 0 : 1, rows = seats <= 4 ? 1 : 2;
    const inRow = seats <= 4 ? seats : row === 0 ? cols : seats - cols, idx = seats <= 4 || row === 0 ? seat : seat - cols;
    const span = Math.min(0.5, (inRow - 1) * 0.2), t = inRow > 1 ? -span / 2 + (span * idx) / (inRow - 1) : 0;
    const lat = rows === 1 ? 0 : (row === 0 ? -1 : 1) * R.L.sw * 0.16;
    return { x: c.x + lat, y: BODY_H + CAB_H + 0.03, z: c.z - 0.1 - t * 0 + (t) };
  }
  const seatPos = (slot, seat, seats) => { const w = seatW(slot, seat, seats), p = P(w.x, w.y, w.z); return { x: p.x, y: p.y, r: Math.max(2, SEAT_R * p.u) }; };

  // ---------- scheduling ----------
  const at = (time, fn) => { R.sched.push({ time, fn }); };
  const burst = (x, y, color, n = 14, speed = 160) => {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, sp = speed * (0.4 + Math.random() * 0.8); R.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.6 + Math.random() * 0.4, t: 0, color: Array.isArray(color) ? color[i % color.length] : color, size: 3 + Math.random() * 4 }); }
  };
  const floatText = (text, x, y, color = '#fff') => R.floats.push({ text, x: clamp(x, 70, (R.L ? R.L.W : 400) - 70), y, t0: performance.now(), color });
  const shake = (amt = 5) => { R.shakeAt = performance.now(); R.shakeAmt = amt; };
  const slotScreen = (i) => { const c = slotC(i), p = P(c.x, 0.3, c.z); return { x: p.x, y: p.y, u: p.u }; };

  // ---------- public: level / events ----------
  R.setLevel = (game, look, world) => {
    R.game = game; R.look = look || R.look; if (world) R.world = world;
    R.vq = [...game.queue]; R.vslots = Array(game.bay).fill(null);
    R.movers = []; R.leavers = []; R.flyers = []; R.particles = []; R.floats = []; R.sched = []; R.fx = {}; R.timelineEnd = 0; R.combo = 0;
    layout();
  };
  R.setLook = (look) => { R.look = look; };
  R.setTargeting = (on) => { R.targeting = !!on; };
  R.resize = () => layout();
  R.idle = () => R.sched.length === 0 && R.movers.length === 0 && R.flyers.length === 0 && R.leavers.length === 0;

  R.play = (events) => {
    const now = performance.now(), gm = R.game; let tl = Math.max(R.timelineEnd, now); const parked = {};
    for (const e of events) {
      if (e.t === 'moves') opts.onMoves && opts.onMoves(e.left);
      else if (e.t === 'blocked') {
        R.fx[e.id] = { bump: now }; shake(3); sfx.blocked(); haptic('medium');
        if (e.by) R.fx[e.by] = { ...(R.fx[e.by] || {}), flash: now };
        const v = gm.vehicles.find((x) => x.id === e.id), c = vehCenter(v); floatText('Blocked!', c.x, c.y - R.L.cell * 0.4, '#ffd7d7');
      } else if (e.t === 'locked') {
        R.fx[e.id] = { shake: now }; sfx.locked(); haptic('light');
        const v = gm.vehicles.find((x) => x.id === e.id), c = vehCenter(v); floatText(e.need > 0 ? e.need + ' more to go' : 'Locked', c.x, c.y - R.L.cell * 0.4, '#fff3b0');
      } else if (e.t === 'thaw') {
        R.fx[e.id] = { shake: now }; sfx.locked(); haptic('light');
        const v = gm.vehicles.find((x) => x.id === e.id), c = vehCenter(v); burst(c.x, c.y, ['#bfefff', '#ffffff'], 10, 110); floatText(e.left > 0 ? 'Still frozen' : 'Thawed!', c.x, c.y - R.L.cell * 0.4, '#d7f3ff');
      } else if (e.t === 'barrierOpen') {
        const c0 = cellW(e.x, e.y), p = P(c0.x, 0.3, c0.z); burst(p.x, p.y, ['#ffd23f', '#ffffff'], 12, 120); floatText('Road open!', p.x, p.y - R.L.cell * 0.5, '#fff3b0'); sfx.locked();
      } else if (e.t === 'unlock') {
        R.fx[e.id] = { ...(R.fx[e.id] || {}), pop: now };
        const v = gm.vehicles.find((x) => x.id === e.id); if (v) { const c = vehCenter(v); burst(c.x, c.y, ['#ffe14d', '#ffffff'], 12, 120); }
      } else if (e.t === 'depart') {
        const v = gm.vehicles.find((x) => x.id === e.id), dur = e.heli ? 520 : 150 + 90 * (e.path.length + v.len);
        R.movers.push({ v: { ...v }, t0: now, dur: Math.min(dur, 520), heli: e.heli, slot: e.slot, dist: e.path.length + v.len + 1 });
        parked[e.id] = now + Math.min(dur, 520);
        const t = now - R.lastClear < 1500 ? R.combo + 1 : 1; R.combo = t; R.lastClear = now;
        sfx.go(t); haptic('light');
        at(parked[e.id], () => {
          R.vslots[e.slot] = { id: e.id, color: COLOR_HEX[v.color], seats: v.seats, filled: 0, pop: performance.now(), look: v };
          const r = slotScreen(e.slot); burst(r.x, r.y, COLOR_HEX[v.color], 8, 100);
          if (t > 1) floatText('Combo x' + t + '!', r.x, r.y - r.u * 0.7, t > 3 ? '#ffd23f' : '#ffffff');
        });
      } else if (e.t === 'board') {
        const backlog = tl - now, step = backlog > 1500 ? 38 : backlog > 700 ? 70 : 120, fd = step < 70 ? 150 : 250;   // speeds up when many passengers are waiting to board
        tl = Math.max(tl, (parked[e.id] || now) + 120); const when = tl; tl += step;
        at(when, () => {
          const col = R.vq.shift(); if (col === undefined) return;
          const seats = (gm.vehicles.find((x) => x.id === e.id) || {}).seats || 4;
          R.flyers.push({ color: COLOR_HEX[col], from: queueW(0), to: seatW(e.slot, e.seat, seats), t0: performance.now(), dur: fd, slot: e.slot, id: e.id, seat: e.seat, n: e.n });
        });
      } else if (e.t === 'full') {
        tl += tl - now > 700 ? 70 : 200; at(tl, () => { const s = R.vslots[e.slot]; if (s) { const r = slotScreen(e.slot); burst(r.x, r.y, ['#ffd23f', '#fff', COLOR_HEX[gm.vehicles.find((x) => x.id === e.id).color]], 22, 200); floatText('Full!', r.x, r.y - r.u * 0.7, '#ffd23f'); sfx.full(); haptic('medium'); } });
      } else if (e.t === 'leave') {
        tl += tl - now > 700 ? 50 : 160; at(tl, () => { const s = R.vslots[e.slot]; if (s) { R.leavers.push({ s, slot: e.slot, t0: performance.now() }); R.vslots[e.slot] = null; } });
      } else if (e.t === 'bay') {
        at(now, () => { while (R.vslots.length < gm.bay) R.vslots.push(null); layout(); sfx.power(); });
      } else if (e.t === 'won' || e.t === 'lost' || e.t === 'stuck') {
        tl += 450; const ev = e; at(tl, () => opts.onStatus && opts.onStatus(ev.t, ev.reason));
      }
    }
    R.timelineEnd = tl;
  };

  // ---------- 3D boxes ----------
  // A box is [x0, x1, z0, z1, y0, y1]. Only faces turned toward the camera are drawn, each lit by its normal.
  function box(b, hex, o = {}) {
    const [x0, x1, z0, z1, y0, y1] = b;
    const faces = [
      { n: [0, 1, 0], p: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], skip: o.noTop },
      { n: [0, 0, -1], p: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] },
      { n: [-1, 0, 0], p: [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]] },
      { n: [1, 0, 0], p: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] },
      { n: [0, 0, 1], p: [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]] },
    ];
    for (const f of faces) {
      if (f.skip) continue;
      const q = f.p[0]; if (f.n[0] * (cam.x - q[0]) + f.n[1] * (cam.y - q[1]) + f.n[2] * (cam.z - q[2]) <= 0) continue;
      const l = 0.74 + 0.4 * Math.max(0, f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2]), base = (o.faceColor && o.faceColor(f)) || hex;
      const sp = f.p.map((pt) => P(pt[0], pt[1], pt[2])), top = f.n[1] === 1, r = clamp(sp[0].u * 0.085, 1.6, 8);
      const ys = sp.map((p) => p.y), y0s = Math.min(...ys), y1s = Math.max(...ys);
      const gr = top ? g.createLinearGradient(sp[3].x, sp[3].y, sp[1].x, sp[1].y) : g.createLinearGradient(0, y0s, 0, y1s);
      gr.addColorStop(0, lit(base, l * (top ? 1.1 : 1.1))); gr.addColorStop(1, lit(base, l * (top ? 0.94 : 0.86)));
      rpath(sp, r); g.fillStyle = gr; g.fill();
      g.strokeStyle = o.edge || shade(base, -0.5); g.lineWidth = o.lw || clamp(sp[0].u * 0.026, 0.9, 1.7); g.lineJoin = 'round'; g.stroke();
      if (top && !o.noGloss && sp[0].u * Math.abs(f.p[1][0] - f.p[0][0]) > 12) {   // a soft sheen across the top
        const L2 = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
        g.beginPath(); [L2(sp[3], sp[0], 0.1), L2(sp[2], sp[1], 0.1), L2(sp[2], sp[1], 0.32), L2(sp[3], sp[0], 0.32)].forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); g.fillStyle = 'rgba(255,255,255,.34)'; g.fill();
      } else if (!top && o.shine) {   // glass: a diagonal streak
        const w = Math.hypot(sp[1].x - sp[0].x, sp[1].y - sp[0].y), h = y1s - y0s;
        if (w > 8 && h > 5) { g.save(); rpath(sp, r); g.clip(); g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(sp[0].x + w * 0.18, y1s); g.lineTo(sp[0].x + w * 0.34, y1s); g.lineTo(sp[0].x + w * 0.5, y0s); g.lineTo(sp[0].x + w * 0.34, y0s); g.closePath(); g.fill(); g.restore(); }
      }
    }
  }
  function rpath(pts, r) {   // closed polygon with rounded corners
    const n = pts.length; g.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n], d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1, d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1, k1 = Math.min(r / d1, 0.5), k2 = Math.min(r / d2, 0.5);
      const a = { x: p1.x + (p0.x - p1.x) * k1, y: p1.y + (p0.y - p1.y) * k1 }, c = { x: p1.x + (p2.x - p1.x) * k2, y: p1.y + (p2.y - p1.y) * k2 };
      i ? g.lineTo(a.x, a.y) : g.moveTo(a.x, a.y); g.quadraticCurveTo(p1.x, p1.y, c.x, c.y);
    }
    g.closePath();
  }
  const rpoly = (pts, rpx) => { rpath(pts.map((p) => P(p[0], p[1], p[2])), rpx); };
  const flat = (pts, fill, alpha = 1) => { g.save(); g.globalAlpha *= alpha; g.beginPath(); pts.forEach((pt, i) => { const s = P(pt[0], pt[1], pt[2]); i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y); }); g.closePath(); g.fillStyle = fill; g.fill(); g.restore(); };
  const discFlat = (x, y, z, r, fill) => { const p = P(x, y, z); g.fillStyle = fill; g.beginPath(); g.ellipse(p.x, p.y, r * p.u, r * p.u * SINP, 0, 0, 7); g.fill(); };
  // distance from the camera to the nearest point of a ground rectangle (the farther one is drawn first)
  const depthKey = (x0, x1, z0, z1) => { const cg = camGround(), nx = clamp(cg.x, x0, x1), nz = clamp(cg.z, z0, z1); return (nx - cg.x) ** 2 + (nz - cg.z) ** 2; };
  const dist2 = (x, z) => { const cg = camGround(); return (x - cg.x) ** 2 + (z - cg.z) ** 2; };

  // a vehicle pose: centre (world), direction, scale, lift
  function carGeom(v, pose) {
    const sc = pose.sc || 1, dv = DIR_VEC[v.dir], wd = [dv[0], -dv[1]], hl = (v.len * 0.5 - 0.07) * sc, hw = 0.38 * sc, lift = pose.lift || 0;
    const ab = (t0, t1, w, y0, y1) => {   // axis-aligned box from along-axis range (nose = +t) and half width
      if (wd[0] !== 0) { const a = pose.cx + wd[0] * t0, b = pose.cx + wd[0] * t1; return [Math.min(a, b), Math.max(a, b), pose.cz - w, pose.cz + w, y0 * sc + lift, y1 * sc + lift]; }
      const a = pose.cz + wd[1] * t0, b = pose.cz + wd[1] * t1; return [pose.cx - w, pose.cx + w, Math.min(a, b), Math.max(a, b), y0 * sc + lift, y1 * sc + lift];
    };
    return { sc, wd, hl, hw, ab, lift };
  }
  function drawCar(v, pose) {
    const st = R.look.vehicle || {}, mystery = !!v.mystery && v.state === 'grid' && !!R.game && !!blocker(R.game, v), hex = mystery ? '#7d869f' : (COLOR_HEX[v.color] || '#ccc'), locked = v.lock > 0, frozen = v.ice > 0, { sc, wd, hl, hw, ab } = carGeom(v, pose);
    g.save(); if (pose.alpha !== undefined) g.globalAlpha = pose.alpha;
    const lat = wd[0] !== 0 ? [0, 1] : [1, 0];   // lateral axis (x or z)
    const sideVis = (s) => { const nx = lat[0] * s, nz = lat[1] * s; return nx * (cam.x - pose.cx) + nz * (cam.z - pose.cz) > 0; };
    const wheel = (t, s) => {
      const w0 = hw - 0.03 * sc, w1 = hw + 0.045 * sc; const bx = ab(t - 0.14 * sc, t + 0.14 * sc, 0, 0, 0.21);
      const a = s > 0 ? [w0, w1] : [-w1, -w0];
      const b = wd[0] !== 0 ? [bx[0], bx[1], pose.cz + a[0], pose.cz + a[1], bx[4], bx[5]] : [pose.cx + a[0], pose.cx + a[1], bx[2], bx[3], bx[4], bx[5]];
      box(b, '#2a2f4a', { edge: INK });
    };
    const wt = [-hl + 0.25 * sc, hl - 0.25 * sc];
    for (const s of [-1, 1]) if (!sideVis(s)) wt.forEach((t) => wheel(t, s));
    const paint = R.look.paint, edge = paint && paint.glow ? paint.trim : undefined;
    if (paint) {   // skin: the whole bus takes the skin's colours; a thin belt stripe and a roof band keep the game colour for matching
      box(ab(-hl, hl, hw, 0.08, 0.2), paint.body, { edge });
      box(ab(-hl, hl, hw, 0.2, 0.27), hex, { edge });
      box(ab(-hl, hl, hw, 0.27, BODY_H), paint.body, { edge });
      box(ab(hl - 0.05 * sc, hl + 0.012, hw * 1.03, 0.1, 0.26), paint.trim, { edge });
      box(ab(-hl - 0.012, -hl + 0.05 * sc, hw * 1.03, 0.1, 0.26), paint.trim, { edge });
    } else box(ab(-hl, hl, hw, 0.08, BODY_H), hex);
    for (const s of [-1, 1]) if (sideVis(s)) wt.forEach((t) => wheel(t, s));
    // headlights on the nose
    for (const sgn of [-1, 1]) {   // headlights and tail lights
      const lat = (t0, t1, y0, y1, a, b) => (wd[0] !== 0 ? [Math.min(pose.cx + wd[0] * t0, pose.cx + wd[0] * t1), Math.max(pose.cx + wd[0] * t0, pose.cx + wd[0] * t1), pose.cz + a, pose.cz + b, y0 * sc + (pose.lift || 0), y1 * sc + (pose.lift || 0)] : [pose.cx + a, pose.cx + b, Math.min(pose.cz + wd[1] * t0, pose.cz + wd[1] * t1), Math.max(pose.cz + wd[1] * t0, pose.cz + wd[1] * t1), y0 * sc + (pose.lift || 0), y1 * sc + (pose.lift || 0)]);
      const c0 = sgn * hw * 0.62 * sc;
      box(lat(hl - 0.005, hl + 0.04 * sc, 0.1, 0.23, c0 - 0.085 * sc, c0 + 0.085 * sc), '#fff7b8', { edge: INK, noGloss: true });
      box(lat(-hl - 0.04 * sc, -hl + 0.005, 0.1, 0.22, c0 - 0.07 * sc, c0 + 0.07 * sc), '#ff5a5a', { edge: INK, noGloss: true });
    }
    // cabin: glass sides with a coloured roof
    const cabB = ab(-hl + 0.07 * sc, hl - 0.3 * sc, hw * 0.74, BODY_H, BODY_H + CAB_H);
    box(cabB, hex, { faceColor: (f) => (f.n[1] === 1 ? shade(paint ? paint.body : hex, 0.16) : '#9fe0ff'), edge: edge, shine: true });
    // roof markings: skin stripes, a seat pip per seat, an arrow showing the way out
    const rt = (BODY_H + CAB_H) * sc + 0.004 + (pose.lift || 0), ct0 = -hl + 0.07 * sc, ct1 = hl - 0.3 * sc, cmid = (ct0 + ct1) / 2;
    const pt = (t, l) => wd[0] !== 0 ? [pose.cx + wd[0] * t, rt, pose.cz + l] : [pose.cx + l, rt, pose.cz + wd[1] * t];
    if (paint && paint.pattern !== 'none') roofPattern(paint, pt, ct0, ct1, hw * 0.6);
    if (paint) flat([pt(ct0 + 0.02, -hw * 0.27), pt(ct1 - 0.02, -hw * 0.27), pt(ct1 - 0.02, hw * 0.27), pt(ct0 + 0.02, hw * 0.27)], hex);
    const span = ct1 - ct0 - 0.2, step = v.seats > 1 ? Math.min(span / (v.seats - 1), 0.17) : 0;
    for (let i = 0; i < v.seats; i++) { const q = pt(cmid + (i - (v.seats - 1) / 2) * step, 0), sp = P(q[0], q[1], q[2]); ball(sp.x, sp.y - sp.u * 0.05 * sc, Math.max(2, 0.055 * sc * sp.u), '#ffffff'); }
    flat([pt(hl - 0.12 * sc, 0), pt(hl - 0.3 * sc, -0.13 * sc), pt(hl - 0.3 * sc, 0.13 * sc)], 'rgba(255,255,255,.95)');
    if (locked) { flat([pt(ct0, -hw * 0.74), pt(ct1, -hw * 0.74), pt(ct1, hw * 0.74), pt(ct0, hw * 0.74)], 'rgba(20,24,50,.5)'); }
    if (frozen) { flat([pt(ct0 - 0.05, -hw * 1.0), pt(ct1 + 0.2, -hw * 1.0), pt(ct1 + 0.2, hw * 1.0), pt(ct0 - 0.05, hw * 1.0)], 'rgba(170,228,255,.55)'); }
    g.restore();
    // things that must stay upright
    const tp = pt(cmid, 0), c = P(tp[0], tp[1], tp[2]);
    if (st.topper && TOPPER_EMOJI[st.topper] && !locked) { g.save(); g.fillStyle = '#000'; if (pose.alpha !== undefined) g.globalAlpha = pose.alpha; g.font = Math.round(c.u * 0.42 * sc) + 'px ' + EMOJI_FONT; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(TOPPER_EMOJI[st.topper], c.x, c.y + c.u * 0.1); g.restore(); }
    if (frozen || mystery) {
      const rr2 = c.u * 0.27 * sc;
      g.fillStyle = frozen ? '#1f6fb0' : '#10246b'; g.beginPath(); g.arc(c.x, c.y - rr2 * 0.3, rr2, 0, 7); g.fill(); g.strokeStyle = frozen ? '#e6f8ff' : '#ffe14d'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (frozen) { g.font = Math.round(rr2 * 1.0) + 'px ' + EMOJI_FONT; g.fillText('\u2744\uFE0F', c.x, c.y - rr2 * 0.3); if (v.ice > 1) { g.fillStyle = '#e6f8ff'; g.font = '900 ' + Math.round(rr2 * 0.8) + 'px system-ui'; g.fillText('x' + v.ice, c.x + rr2 * 1.05, c.y - rr2 * 1.3); } }
      else { g.font = '900 ' + Math.round(rr2 * 1.3) + 'px system-ui'; g.fillText('?', c.x, c.y - rr2 * 0.3); }
    }
    if (locked) {
      const need = Math.max(1, v.lock - R.game.departures), r = c.u * 0.27 * sc;
      g.fillStyle = '#10246b'; g.beginPath(); g.arc(c.x, c.y - r * 0.3, r, 0, 7); g.fill(); g.strokeStyle = '#ffe14d'; g.lineWidth = 2; g.stroke();
      g.font = Math.round(r * 1.0) + 'px ' + EMOJI_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('\u{1F512}', c.x, c.y - r * 0.3);
      g.fillStyle = '#ffe14d'; g.font = '900 ' + Math.round(r * 0.8) + 'px system-ui'; g.fillText(need, c.x + r * 1.05, c.y - r * 1.3);
    }
  }
  const DOTTY = new Set(['dots', 'stars', 'balls', 'hearts', 'bats', 'clover', 'eggs', 'sun', 'diamonds', 'notes', 'petals', 'skulls', 'circus', 'bolt', 'snow', 'leaves']);
  function roofPattern(pa, pt, t0, t1, hwr) {   // a simple version of the skin's pattern, drawn flat on the cabin roof
    const cols = pa.colors.length ? pa.colors : ['#ffffff'], len = t1 - t0, id = pa.pattern;
    if (id === 'checker' || id === 'grid') { const n = Math.max(2, Math.round(len / 0.2)); for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) { const a = t0 + (len * i) / n, b = t0 + (len * (i + 1)) / n, l0 = -hwr + j * hwr, l1 = l0 + hwr; flat([pt(a, l0), pt(b, l0), pt(b, l1), pt(a, l1)], cols[0], 0.85); } }
    else if (DOTTY.has(id)) { const n = Math.max(2, Math.round(len / 0.2)); for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { const q = pt(t0 + (len * (i + 0.5)) / n, (j ? 0.78 : -0.78) * hwr); discFlat(q[0], q[1], q[2], 0.055, cols[(i + j) % cols.length]); } }
    else { const n = Math.max(3, Math.round(len / 0.14)); for (let i = 0; i < n; i += 2) { const a = t0 + (len * i) / n, b = t0 + (len * (i + 1)) / n; flat([pt(a, -hwr), pt(b, -hwr), pt(b, hwr), pt(a, hwr)], cols[(i / 2) % cols.length], 0.85); } }
  }
  const carFootprint = (v, pose) => { const { hl, hw } = carGeom(v, pose), b = carGeom(v, pose).ab(-hl, hl, hw, 0, 0); return b; };
  const carHull = (v, pose, extra = 0.06) => {
    const b = carFootprint(v, pose), ys = [0, BODY_H + CAB_H + 0.02], pts = [];
    for (const x of [b[0] - extra, b[1] + extra]) for (const z of [b[2] - extra, b[3] + extra]) for (const y of ys) { const s = P(x, y + (pose.lift || 0), z); pts.push([s.x, s.y]); }
    return hull(pts);
  };
  function drawCone(x, z) {
    const p = P(x, 0, z), c = p.u; g.save(); g.translate(p.x, p.y);
    g.fillStyle = 'rgba(10,15,40,.25)'; g.beginPath(); g.ellipse(c * 0.08, c * 0.02, c * 0.3, c * 0.1, 0, 0, 7); g.fill();
    g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(0, -c * 0.62); g.lineTo(c * 0.24, -c * 0.02); g.lineTo(-c * 0.24, -c * 0.02); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-c * 0.12, -c * 0.33); g.lineTo(c * 0.12, -c * 0.33); g.lineTo(c * 0.16, -c * 0.22); g.lineTo(-c * 0.16, -c * 0.22); g.closePath(); g.fill();
    g.fillStyle = '#d95f00'; rr(g, -c * 0.28, -c * 0.07, c * 0.56, c * 0.09, c * 0.03); g.fill(); g.restore();
  }
  // Other things that stand in the lot. The look changes every 200 levels; cones always mark blocked bay slots.
  function drawWall(x, z, skin) {
    if (!skin || skin === 'cone') return drawCone(x, z);
    const p = P(x, 0, z), c = p.u; g.save(); g.translate(p.x, p.y);
    g.fillStyle = 'rgba(10,15,40,.25)'; g.beginPath(); g.ellipse(c * 0.06, c * 0.02, c * 0.34, c * 0.11, 0, 0, 7); g.fill();
    g.lineJoin = 'round'; g.lineWidth = Math.max(1, c * 0.03);
    if (skin === 'barrel') {
      const gr = g.createLinearGradient(-c * 0.3, 0, c * 0.3, 0); gr.addColorStop(0, '#d98a3a'); gr.addColorStop(0.5, '#f0aa55'); gr.addColorStop(1, '#a8651f');
      g.fillStyle = gr; g.strokeStyle = '#6b3d0e'; rr(g, -c * 0.27, -c * 0.62, c * 0.54, c * 0.6, c * 0.12); g.fill(); g.stroke();
      g.fillStyle = '#4a4f66'; for (const yy of [-0.5, -0.2]) g.fillRect(-c * 0.27, c * yy, c * 0.54, c * 0.06);
    } else if (skin === 'rock') {
      const gr = g.createLinearGradient(0, -c * 0.6, 0, 0); gr.addColorStop(0, '#c9ced9'); gr.addColorStop(1, '#7c8398');
      g.fillStyle = gr; g.strokeStyle = '#4b5166'; g.beginPath(); g.moveTo(-c * 0.34, -c * 0.02); g.lineTo(-c * 0.3, -c * 0.34); g.lineTo(-c * 0.08, -c * 0.58); g.lineTo(c * 0.22, -c * 0.46); g.lineTo(c * 0.36, -c * 0.1); g.lineTo(c * 0.28, -c * 0.02); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-c * 0.1, -c * 0.4, c * 0.1, c * 0.05, -0.5, 0, 7); g.fill();
    } else if (skin === 'crate') {
      g.fillStyle = '#c98a45'; g.strokeStyle = '#6b3d0e'; rr(g, -c * 0.3, -c * 0.6, c * 0.6, c * 0.58, c * 0.05); g.fill(); g.stroke();
      g.strokeStyle = '#8a5424'; g.lineWidth = Math.max(1.5, c * 0.05); g.beginPath(); g.moveTo(-c * 0.28, -c * 0.58); g.lineTo(c * 0.28, -c * 0.04); g.moveTo(c * 0.28, -c * 0.58); g.lineTo(-c * 0.28, -c * 0.04); g.stroke();
    } else {   // bush
      for (const [bx, by, br, col] of [[-0.16, -0.22, 0.2, '#2f9e48'], [0.16, -0.22, 0.2, '#2f9e48'], [0, -0.38, 0.24, '#3fbf5a']]) { g.fillStyle = col; g.strokeStyle = '#1d6a30'; g.beginPath(); g.arc(c * bx, c * by, c * br, 0, 7); g.fill(); g.stroke(); }
    }
    g.restore();
  }
  // A road barrier that lifts once enough vehicles have left; the number shows how many more.
  function drawBarrier(x, z, need) {
    const p = P(x, 0, z), c = p.u; g.save(); g.translate(p.x, p.y);
    g.fillStyle = 'rgba(10,15,40,.25)'; g.beginPath(); g.ellipse(c * 0.04, c * 0.02, c * 0.4, c * 0.1, 0, 0, 7); g.fill();
    g.fillStyle = '#4a4f66'; g.fillRect(-c * 0.34, -c * 0.34, c * 0.07, c * 0.34); g.fillRect(c * 0.27, -c * 0.34, c * 0.07, c * 0.34);
    g.lineJoin = 'round'; g.lineWidth = Math.max(1, c * 0.03); g.strokeStyle = '#7a1f1f';
    for (const [yy, hh] of [[-0.6, 0.17], [-0.38, 0.17]]) { g.save(); rr(g, -c * 0.44, c * yy, c * 0.88, c * hh, c * 0.04); g.clip(); g.fillStyle = '#fff'; g.fillRect(-c * 0.5, c * yy, c, c * hh); g.fillStyle = '#e8412c'; for (let k = -4; k < 5; k++) { g.beginPath(); g.moveTo(c * (k * 0.22), c * yy); g.lineTo(c * (k * 0.22 + 0.11), c * yy); g.lineTo(c * (k * 0.22 + 0.11 - 0.08), c * (yy + hh)); g.lineTo(c * (k * 0.22 - 0.08), c * (yy + hh)); g.closePath(); g.fill(); } g.restore(); rr(g, -c * 0.44, c * yy, c * 0.88, c * hh, c * 0.04); g.stroke(); }
    const r2 = c * 0.2; g.fillStyle = '#10246b'; g.beginPath(); g.arc(0, -c * 0.8, r2, 0, 7); g.fill(); g.strokeStyle = '#ffe14d'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#ffe14d'; g.font = '900 ' + Math.round(r2 * 1.3) + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(need, 0, -c * 0.79);
    g.restore();
  }
  function ball(x, y, r, hex, face = false) {   // a little shaded sphere
    g.fillStyle = 'rgba(10,15,40,.3)'; g.beginPath(); g.ellipse(x + r * 0.2, y + r * 0.85, r * 0.9, r * 0.3, 0, 0, 7); g.fill();
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05); gr.addColorStop(0, shade(hex, 0.55)); gr.addColorStop(0.45, hex); gr.addColorStop(1, shade(hex, -0.38));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.45, r * 0.28, r * 0.16, -0.6, 0, 7); g.fill();
    g.lineWidth = Math.max(1, r * 0.22); g.strokeStyle = INK; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    if (face && r > 4) { g.fillStyle = '#fff'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx * r * 0.36, y - r * 0.05, r * 0.28, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(x + sx * r * 0.36, y - r * 0.02, r * 0.14, 0, 7); g.fill(); g.fillStyle = '#fff'; } }
  }
  function person(wx, wy, wz, hex, wobble = 0, grow = 1, idle = false) {   // a standing passenger sprite sized by perspective
    const foot = P(wx, wy, wz), head = P(wx, wy + PASS_H * grow, wz), s = foot.y - head.y, bob = idle ? Math.abs(Math.sin(performance.now() / 230 + wx * 5)) * s * 0.07 : 0;
    drawPassenger(g, foot.x, (foot.y + head.y) / 2 - bob, s, hex, R.look.accessory, wobble, idle, R.look.outfit);
  }

  // parked bus in the bay (nose toward the player)
  function drawParked(s, slot, alpha, dx, now) {
    const c = slotC(slot), pop = s.pop ? clamp((now - s.pop) / 220, 0, 1) : 1, sc = 0.7 + 0.3 * ease(pop) + Math.sin(pop * Math.PI) * 0.08;
    const cx = c.x + dx, hw = R.L.sw * 0.4 * sc, hl = 0.52 * sc;
    g.save(); g.globalAlpha = alpha;
    const paint = R.look.paint, edge = paint && paint.glow ? paint.trim : undefined;
    if (paint) {
      box([cx - hw, cx + hw, c.z - hl, c.z + hl, 0.06, 0.2], paint.body, { edge });
      box([cx - hw, cx + hw, c.z - hl, c.z + hl, 0.2, 0.27], s.color, { edge });
      box([cx - hw, cx + hw, c.z - hl, c.z + hl, 0.27, BODY_H + 0.04], paint.body, { edge });
      box([cx - hw * 1.03, cx + hw * 1.03, c.z - hl - 0.012, c.z - hl + 0.05, 0.1, 0.26], paint.trim, { edge });
    } else box([cx - hw, cx + hw, c.z - hl, c.z + hl, 0.06, BODY_H + 0.04], s.color);
    box([cx - hw * 0.9, cx + hw * 0.9, c.z - hl + 0.03, c.z + hl * 0.5, BODY_H + 0.04, BODY_H + 0.04 + CAB_H * sc], s.color, { faceColor: (f) => (f.n[1] === 1 ? (paint ? shade(paint.body, 0.16) : s.color) : '#9fe0ff'), shine: true });
    if (paint) { const ry = BODY_H + 0.04 + CAB_H * sc + 0.004; flat([[cx - hw * 0.27, ry, c.z - hl + 0.05], [cx + hw * 0.27, ry, c.z - hl + 0.05], [cx + hw * 0.27, ry, c.z + hl * 0.5 - 0.02], [cx - hw * 0.27, ry, c.z + hl * 0.5 - 0.02]], s.color); }
    const wz = [c.z - hl + 0.2, c.z + hl - 0.2];
    for (const sx of [cx - hw, cx + hw]) for (const z of wz) { const vis = Math.sign(sx - cx) * (cam.x - cx) > 0 || Math.abs(cam.x - cx) < 0.01; if (vis) box([sx - 0.035, sx + 0.035, z - 0.12, z + 0.12, 0, 0.19], '#2a2f4a', { edge: INK }); }
    g.restore();
    for (let i = 0; i < s.seats; i++) {
      const w = seatW(slot, i, s.seats), p = P(w.x + dx, w.y + (sc - 1) * 0.1, w.z), r = Math.max(2, SEAT_R * p.u);
      g.globalAlpha = alpha;
      if (i < s.filled) ball(p.x, p.y - r * 0.4, r * 1.15, s.fills ? s.fills[i] : '#fff', true);
      else { g.fillStyle = 'rgba(15,25,60,.4)'; g.beginPath(); g.ellipse(p.x, p.y, r, r * SINP, 0, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  }

  // ---------- input ----------
  const poseOf = (v) => { const c = vehW(v); return { cx: c.x, cz: c.z }; };
  R.hitTest = (x, y) => {
    const gm = R.game; if (!gm || !R.L || !R.L.cx) return null; let best = null, bd = Infinity;
    for (const v of gm.vehicles) {
      if (v.state !== 'grid') continue; const pose = poseOf(v);
      if (inPoly(carHull(v, pose, 0.02), x, y)) { const d = dist2(pose.cx, pose.cz); if (d < bd) { bd = d; best = v.id; } }
    }
    return best;
  };
  R.vehiclePoint = (id) => { const v = R.game.vehicles.find((x) => x.id === id); return v ? vehCenter(v) : null; };
  const onDown = (ev) => {
    const rect = canvas.getBoundingClientRect(), id = R.hitTest(ev.clientX - rect.left, ev.clientY - rect.top);
    if (id && opts.onTapVehicle) { ev.preventDefault(); opts.onTapVehicle(id); }
  };
  canvas.addEventListener('pointerdown', onDown);

  // ---------- frame ----------
  const poly = (pts) => { g.beginPath(); pts.forEach((pt, i) => { const s = P(pt[0], pt[1], pt[2]); i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y); }); g.closePath(); };

  const bdOf = () => BACKDROPS[R.world.bd] || BACKDROPS.city;
  // little details scattered over the ground, one kind per theme (seeded, so they stay put)
  let speckKey = '', speckList = [];
  function specksFor(L) {
    const bd = bdOf(), key = (R.world.bd || '') + '|' + L.bw + 'x' + L.bh + '|' + L.bay; if (key === speckKey) return speckList;
    let seed = 11; for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) % 9973; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    speckList = [];
    for (let i = 0, tries = 0; i < 150 && tries < 900; tries++) {
      const x = -9 + rnd() * (L.bw + 18), z = -10 + rnd() * (L.qz + 22);
      if (x > -0.5 && x < L.bw + 0.5 && z > -0.5 && z < L.bh + 0.5) continue;                        // not on the board
      if (x > L.roadX0 - 0.5 && x < L.roadX0 + L.roadW + 0.5 && z > L.roadZ0 - 0.4 && z < L.qz + 0.9) continue;   // not on the road and queue
      speckList.push({ x, z, c: bd.speckColors[Math.floor(rnd() * bd.speckColors.length)], s: 0.6 + rnd() * 0.9, r: rnd() * 6.28 }); i++;
    }
    speckKey = key; return speckList;
  }
  function drawSpeck(kind, p, d) {
    const u = p.u * d.s; g.save(); g.translate(p.x, p.y); g.fillStyle = d.c; g.strokeStyle = d.c;
    if (kind === 'grass') { g.lineWidth = Math.max(1.5, u * 0.07); g.lineCap = 'round'; g.beginPath(); for (const a of [-0.45, 0, 0.45]) { g.moveTo(0, 0); g.lineTo(Math.sin(a) * u * 0.3, -u * 0.3 * Math.cos(a)); } g.stroke(); }
    else if (kind === 'sand') { g.beginPath(); g.ellipse(0, 0, u * 0.1, u * 0.05, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(u * 0.2, u * 0.08, u * 0.06, u * 0.03, 0, 0, 7); g.fill(); }
    else if (kind === 'snow') { g.globalAlpha = 0.9; g.beginPath(); g.ellipse(0, 0, u * 0.13, u * 0.07, 0, 0, 7); g.fill(); }
    else if (kind === 'stars') { const r = u * 0.16; g.beginPath(); for (let i = 0; i < 8; i++) { const rr2 = i % 2 ? r * 0.35 : r, an = i * Math.PI / 4; g.lineTo(Math.cos(an) * rr2, Math.sin(an) * rr2 * 0.9); } g.closePath(); g.fill(); }
    else if (kind === 'cobble') { g.lineWidth = Math.max(1.2, u * 0.05); g.globalAlpha = 0.55; g.beginPath(); g.ellipse(0, 0, u * 0.28, u * 0.14, 0, 0, 7); g.stroke(); }
    else if (kind === 'sprinkles') { g.rotate(d.r); rr(g, -u * 0.14, -u * 0.04, u * 0.28, u * 0.08, u * 0.04); g.fill(); }
    else if (kind === 'bubbles') { g.lineWidth = Math.max(1.2, u * 0.05); g.globalAlpha = 0.7; g.beginPath(); g.arc(0, 0, u * 0.14, 0, 7); g.stroke(); g.globalAlpha = 0.25; g.fill(); }
    else if (kind === 'leaves') { g.rotate(d.r); g.beginPath(); g.ellipse(0, 0, u * 0.17, u * 0.08, 0, 0, 7); g.fill(); }
    else if (kind === 'petals') { g.beginPath(); for (let k = 0; k < 5; k++) g.arc(Math.cos(k * 1.2566) * u * 0.07, Math.sin(k * 1.2566) * u * 0.05, u * 0.05, 0, 7); g.fill(); }
    g.restore();
  }
  function drawGround(now) {
    const L = R.L, gm = R.game, W = L.W, H = L.H, bd = bdOf(), ground = bd.ground;
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, bd.sky[0]); bg.addColorStop(1, bd.sky[1]); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    poly([[-60, 0, -8], [60, 0, -8], [60, 0, 80], [-60, 0, 80]]); g.fillStyle = ground; g.fill();
    for (const d of specksFor(L)) { const p = P(d.x, 0.002, d.z); if (p.x > -40 && p.x < W + 40 && p.y > -40 && p.y < H + 40) drawSpeck(bd.speck, p, d); }
    if (bd.crosswalk) { for (let i = -2; i < L.bw + 2; i += 0.8) poly([[i, 0.002, -1.45], [i + 0.45, 0.002, -1.45], [i + 0.45, 0.002, -0.8], [i, 0.002, -0.8]]), g.fillStyle = 'rgba(255,255,255,.8)', g.fill(); }
    const fog = g.createLinearGradient(0, 0, 0, H * 0.3); fog.addColorStop(0, rgba(bd.sky[0], 0.55)); fog.addColorStop(1, rgba(bd.sky[0], 0)); g.fillStyle = fog; g.fillRect(0, 0, W, H * 0.3);
    // board: a framed plate with a visible edge and a checker of two tile colours
    const bw = L.bw, bh = L.bh, edge = shade(bd.plate, -0.4);
    poly([[-0.2, -0.2, -0.2], [bw + 0.2, -0.2, -0.2], [bw + 0.2, 0, -0.2], [-0.2, 0, -0.2]]); g.fillStyle = edge; g.fill();
    rpoly([[-0.2, 0.001, -0.2], [bw + 0.2, 0.001, -0.2], [bw + 0.2, 0.001, bh + 0.2], [-0.2, 0.001, bh + 0.2]], 12); g.fillStyle = bd.plate; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke();
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { rpoly([[x + 0.04, 0.002, bh - y - 0.96], [x + 0.96, 0.002, bh - y - 0.96], [x + 0.96, 0.002, bh - y - 0.04], [x + 0.04, 0.002, bh - y - 0.04]], 6); g.fillStyle = (x + y) % 2 ? bd.tileA : bd.tileB; g.fill(); }
    // road with the parking bay
    const rx0 = L.roadX0 - 0.3, rx1 = L.roadX0 + L.roadW + 0.3;
    poly([[rx0, -0.12, L.roadZ0], [rx1, -0.12, L.roadZ0], [rx1, 0, L.roadZ0], [rx0, 0, L.roadZ0]]); g.fillStyle = '#272d44'; g.fill();
    poly([[rx0, 0.001, L.roadZ0], [rx1, 0.001, L.roadZ0], [rx1, 0.001, L.roadZ1], [rx0, 0.001, L.roadZ1]]); g.fillStyle = '#4a5575'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    for (let i = 0; i < gm.bay; i++) {
      const x0 = L.roadX0 + i * L.sw + 0.05, x1 = x0 + L.sw - 0.1, z0 = L.roadZ0 + 0.14, z1 = L.roadZ1 - 0.14, blocked = gm.blockedSlots.includes(i);
      g.save(); poly([[x0, 0.002, z0], [x1, 0.002, z0], [x1, 0.002, z1], [x0, 0.002, z1]]); g.strokeStyle = blocked ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.9)'; g.lineWidth = 2.4; g.setLineDash(blocked ? [] : [6, 5]); g.stroke(); g.restore();
    }
    // soft shadows under everything that stands on the ground
    const shadow = (b) => { for (const [e, a] of [[0.1, 0.1], [0.03, 0.16]]) { rpoly([[b[0] + 0.14 - e, 0.003, b[2] - 0.1 - e], [b[1] + 0.14 + e, 0.003, b[2] - 0.1 - e], [b[1] + 0.14 + e, 0.003, b[3] - 0.1 + e], [b[0] + 0.14 - e, 0.003, b[3] - 0.1 + e]], 6); g.fillStyle = 'rgba(10,15,40,' + a + ')'; g.fill(); } };
    for (const v of gm.vehicles) if (v.state === 'grid') { const pose = Object.assign(poseOf(v), vehFx(v, now)); shadow(carFootprint(v, pose)); }
    for (let i = 0; i < gm.bay; i++) { const s = R.vslots[i]; if (s) { const c = slotC(i), hw = L.sw * 0.4; shadow([c.x - hw, c.x + hw, c.z - 0.52, c.z + 0.52]); } }
  }
  // seasons and holidays sprinkle a few of their own sprites into the world's scenery
  const SEASON_DECOR = { spring: ['\u{1F338}', '\u{1F337}', '\u{1F98B}'], summer: ['\u{1F334}', '⛱️', '\u{1F349}'], autumn: ['\u{1F341}', '\u{1F383}', '\u{1F330}'], winter: ['\u{1F332}', '⛄', '❄️'],
    christmas: ['\u{1F384}', '\u{1F381}', '⛄'], halloween: ['\u{1F383}', '\u{1F987}', '\u{1F47B}'], valentine: ['\u{1F496}', '\u{1F339}', '\u{1F48C}'], stpatrick: ['☘️', '\u{1F308}', '\u{1F4B0}'], easter: ['\u{1F95A}', '\u{1F430}', '\u{1F337}'], pride: ['\u{1F308}', '\u{1F984}', '\u{1F496}'] };
  let decorKey = '', decorList = [];
  function decorFor(L) {
    const dt = R.world.decorTheme, bd = bdOf(), key = (R.world.bd || '') + '|' + L.bw + 'x' + L.bh + '|' + L.bay + '|' + (dt || ''); if (key === decorKey) return decorList;
    const seas = SEASON_DECOR[dt];
    let seed = 7; for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) % 9973; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    let n = 0; const pick = () => { n++; return seas && n % 6 === 0 ? seas[n % seas.length] : bd.decor[Math.floor(rnd() * bd.decor.length)]; };
    decorList = [];
    const zTop = L.qz + 1.5, step = 1.9;
    for (let z = -0.6; z < zTop; z += step * (0.8 + rnd() * 0.5)) {    // down both sides
      decorList.push({ x: -1.15 - rnd() * 0.7, z, e: pick(), s: 0.85 + rnd() * 0.4 }, { x: L.bw + 1.15 + rnd() * 0.7, z: z + rnd(), e: pick(), s: 0.85 + rnd() * 0.4 });
    }
    for (let x = -1.8; x < L.bw + 2; x += 1.9 + rnd() * 0.8) {          // along the bottom (near the player) and the top (past the queue)
      decorList.push({ x: x + rnd() * 0.5, z: -1.8 - rnd() * 1.6, e: pick(), s: 0.8 + rnd() * 0.4 });
      decorList.push({ x: x + rnd() * 0.5, z: zTop + rnd() * 1.4, e: pick(), s: 0.85 + rnd() * 0.4 });
    }
    decorKey = key; return decorList;
  }
  // the world's name on a ribbon, top left
  function drawRibbon() {
    const L = R.L, bd = bdOf(), name = (R.world.name || '').toUpperCase(); if (!name || L.H < 360) return;
    g.save(); g.font = '900 15px Poppins, system-ui, sans-serif'; const tw = g.measureText(name).width, w = tw + 56, h = 32, x = 8, y = 8;
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, bd.band[0]); gr.addColorStop(1, bd.band[1]);
    rr(g, x, y, w, h, 12); g.fillStyle = gr; g.fill(); g.lineWidth = 1.5; g.strokeStyle = shade(bd.band[1], -0.4); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.28)'; rr(g, x + 3, y + 3, w - 6, h * 0.38, 8); g.fill();
    g.font = '18px ' + EMOJI_FONT; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(bd.icon, x + 20, y + h / 2 + 1);
    g.font = '900 15px Poppins, system-ui, sans-serif'; g.textAlign = 'left'; g.lineWidth = 4; g.strokeStyle = INK; g.strokeText(name, x + 38, y + h / 2 + 1); g.fillStyle = '#fff'; g.fillText(name, x + 38, y + h / 2 + 1);
    g.restore();
  }
  function vehFx(v, now) {
    const fx = R.fx[v.id] || {}, dv = DIR_VEC[v.dir], o = { dx: 0, dz: 0, sc: 1 };
    if (fx.bump) { const t = (now - fx.bump) / 320; if (t < 1) { const k = Math.sin(t * Math.PI) * 0.18; o.dx = dv[0] * k; o.dz = -dv[1] * k; } }
    if (fx.shake) { const t = (now - fx.shake) / 360; if (t < 1) o.dx += Math.sin(t * 40) * 0.08 * (1 - t); }
    if (fx.pop) { const t = (now - fx.pop) / 320; if (t < 1) o.sc = 1 + Math.sin(t * Math.PI) * 0.18; }
    return o;
  }
  const withFx = (v, now) => { const c = vehW(v), f = vehFx(v, now); return { cx: c.x + f.dx, cz: c.z + f.dz, sc: f.sc }; };

  function frame(now) {
    R.raf = requestAnimationFrame(frame);
    const L = R.L, gm = R.game; if (!L || !L.cx) { g.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); return; }
    if (R.sched.length) { const due = R.sched.filter((s) => s.time <= now).sort((a, b) => a.time - b.time); if (due.length) { R.sched = R.sched.filter((s) => s.time > now); due.forEach((s) => s.fn()); } }
    g.save();
    const sh = clamp(1 - (now - R.shakeAt) / 260, 0, 1); if (sh > 0) g.translate((Math.random() - 0.5) * R.shakeAmt * sh * 2, (Math.random() - 0.5) * R.shakeAmt * sh * 2);
    drawGround(now);

    // everything that stands up is collected, sorted far to near, then drawn
    const items = [];
    const decor = decorFor(L);
    for (const d of decor) items.push({ k: dist2(d.x, d.z), d: () => { const p = P(d.x, 0, d.z); g.fillStyle = 'rgba(10,15,40,.18)'; g.beginPath(); g.ellipse(p.x, p.y, p.u * 0.45 * d.s, p.u * 0.14 * d.s, 0, 0, 7); g.fill(); g.fillStyle = '#000'; g.font = Math.round(p.u * d.s) + 'px ' + EMOJI_FONT; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(d.e, p.x, p.y + p.u * 0.08); } });
    for (const w of gm.walls) { const c = cellW(w.x, w.y); items.push({ k: dist2(c.x, c.z), d: () => drawWall(c.x, c.z, gm.wallSkin) }); }
    for (const b of gm.barriers) if (gm.departures < b.until) { const c = cellW(b.x, b.y), need = b.until - gm.departures; items.push({ k: dist2(c.x, c.z), d: () => drawBarrier(c.x, c.z, need) }); }
    for (let i = 0; i < gm.bay; i++) if (gm.blockedSlots.includes(i)) { const c = slotC(i); items.push({ k: dist2(c.x, c.z), d: () => drawCone(c.x, c.z) }); }
    const hi = {};
    for (const v of gm.vehicles) {
      if (v.state !== 'grid') continue; const pose = withFx(v, now), fx = R.fx[v.id] || {}, b = carFootprint(v, pose);
      items.push({ k: depthKey(b[0], b[1], b[2], b[3]), d: () => {
        drawCar(v, pose);
        const ring = (col, lw) => { g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; const h = carHull(v, pose, 0.05); g.beginPath(); h.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.stroke(); g.restore(); };
        if (fx.flash && now - fx.flash < 450) ring('rgba(255,70,70,' + (1 - (now - fx.flash) / 450) + ')', 4);
        if (R.targeting && v.lock === 0) ring('rgba(255,255,255,' + (0.55 + 0.45 * Math.sin(now / 160)) + ')', 3);
      } });
    }
    R.movers = R.movers.filter((m) => {
      const t = clamp((now - m.t0) / m.dur, 0, 1); if (t >= 1) return false;
      const c = vehW(m.v), dv = DIR_VEC[m.v.dir]; let pose;
      if (m.heli) { const s = slotC(m.slot), k = ease(t); pose = { cx: c.x + (s.x - c.x) * k, cz: c.z + (s.z - c.z) * k, sc: 1 - 0.4 * k, lift: Math.sin(t * Math.PI) * 1.4 }; }
      else { const k = ease(t) * m.dist; pose = { cx: c.x + dv[0] * k, cz: c.z - dv[1] * k, sc: 1, alpha: t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1 }; }
      const b = carFootprint(m.v, pose); items.push({ k: depthKey(b[0], b[1], b[2], b[3]) - 0.5, d: () => drawCar(m.v, pose) }); return true;
    });
    for (let i = 0; i < gm.bay; i++) { const s = R.vslots[i]; if (s) { const c = slotC(i); items.push({ k: dist2(c.x, c.z), d: () => drawParked(s, i, 1, 0, now) }); } }
    for (const lv of R.leavers) { const t = clamp((now - lv.t0) / 420, 0, 1), c = slotC(lv.slot); items.push({ k: dist2(c.x, c.z), d: () => drawParked(lv.s, lv.slot, 1 - t, ease(t) * L.roadW * 0.7, now) }); }
    const n = R.vq.length, shown = Math.min(n, L.qMax);
    for (let i = shown - 1; i >= 0; i--) { const q = queueW(i), col = COLOR_HEX[R.vq[i]]; items.push({ k: dist2(q.x, q.z) + i * 0.001, d: () => person(q.x, 0, q.z, col, 0, i === 0 ? 1.18 : 1, true) }); }
    R.flyers = R.flyers.filter((f) => {
      const t = clamp((now - f.t0) / f.dur, 0, 1), k = ease(t);
      if (t >= 1) { const s = R.vslots[f.slot]; if (s && s.id === f.id) { s.filled = Math.max(s.filled, f.seat + 1); (s.fills = s.fills || [])[f.seat] = f.color; } sfx.board(f.n || 0); const p = P(f.to.x, f.to.y, f.to.z); burst(p.x, p.y, f.color, 4, 60); return false; }
      const x = f.from.x + (f.to.x - f.from.x) * k, z = f.from.z + (f.to.z - f.from.z) * k, y = (f.to.y - PASS_H * 0.5) * k + Math.sin(t * Math.PI) * 0.8;
      items.push({ k: dist2(x, z) - 4, d: () => person(x, Math.max(0, y), z, f.color, Math.sin(t * 12) * 0.2, 0.9) }); return true;
    });
    items.sort((a, b) => b.k - a.k).forEach((it) => it.d());
    if (n > shown) { const q = P(queueW(shown - 1).x + 0.55, 0.3, L.qz); g.fillStyle = '#10246b'; g.font = '800 15px system-ui'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('+' + (n - shown), q.x, q.y); }
    if (n === 0) { const q = P(L.cx, 0.3, L.qz); g.fillStyle = '#10246b'; g.font = '800 15px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Everyone is on board!', q.x, q.y); }
    drawRibbon();
    g.restore();
    const dt = 1 / 60;
    R.particles = R.particles.filter((p) => { p.t += dt; if (p.t >= p.life) return false; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; g.globalAlpha = 1 - p.t / p.life; g.fillStyle = p.color; g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); g.globalAlpha = 1; return true; });
    R.floats = R.floats.filter((f) => { const t = (now - f.t0) / 800; if (t >= 1) return false; g.globalAlpha = 1 - t * t; g.font = '900 20px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = 'rgba(16,36,107,.75)'; g.strokeText(f.text, f.x, f.y - t * 38); g.fillStyle = f.color; g.fillText(f.text, f.x, f.y - t * 38); g.globalAlpha = 1; return true; });
  }

  R.start = () => { if (!R.running) { R.running = true; layout(); R.raf = requestAnimationFrame(frame); } };
  R.stop = () => { R.running = false; cancelAnimationFrame(R.raf); };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => layout()) : null; if (ro) ro.observe(canvas);
  window.addEventListener('resize', layout);
  R.destroy = () => { R.stop(); canvas.removeEventListener('pointerdown', onDown); window.removeEventListener('resize', layout); if (ro) ro.disconnect(); };
  return R;
}
