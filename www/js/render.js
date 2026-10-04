// render.js - draws the board on a <canvas> and plays the game's events as animations.
// The game logic (game.js) is instant; this file makes it look good: vehicles drive off, park, passengers hop aboard.
import { cellsOf } from './levelGen.js';
import { shade } from './busArt.js';
import { COLOR_HEX, TOPPER_EMOJI, rr, patternFill, drawPassenger } from './look.js';
import { sfx, haptic } from './sfx.js';

const DIR_ANGLE = { E: 0, S: Math.PI / 2, W: Math.PI, N: -Math.PI / 2 };
const DIR_VEC = { E: [1, 0], S: [0, 1], W: [-1, 0], N: [0, -1] };
const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

export function createRenderer(canvas, opts = {}) {
  const g = canvas.getContext('2d');
  const R = {
    game: null, look: { vehicle: {}, accessory: null }, world: { sky: ['#35b6ff', '#d2f3ff'], ground: '#7f8cab' },
    L: null, vq: [], vslots: [], movers: [], leavers: [], flyers: [], particles: [], floats: [], sched: [], fx: {},
    timelineEnd: 0, shakeAt: 0, shakeAmt: 0, targeting: false, lastClear: 0, combo: 0, raf: 0, running: false,
  };

  // ---------- layout ----------
  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gm = R.game; if (!gm) { R.L = { W, H }; return; }
    const m = 10, bay = gm.bay;
    const sw = Math.min(70, (W - 2 * m - 12) / bay), bayH = sw * 1.12 + 10, queueH = clamp(H * 0.1, 54, 72), gap = 24;
    const boardH = H - bayH - queueH - gap * 2 - m * 2;
    const cell = Math.floor(Math.min((W - 2 * m) / gm.w, boardH / gm.h));
    const stackH = cell * gm.h + gap + bayH + gap + queueH, top = Math.max(m, Math.round((H - stackH) / 2 - 6));   // the whole stack sits in the middle
    R.L = {
      W, H, m, cell, bx: Math.round((W - cell * gm.w) / 2), by: top,
      sw, bayX: (W - sw * bay) / 2, bayY: top + cell * gm.h + gap, bayH, queueY: top + cell * gm.h + gap + bayH + gap, queueH,
      pw: clamp((W - 2 * m) / 11, 22, 34),
    };
  }
  const slotRect = (i) => ({ x: R.L.bayX + i * R.L.sw, y: R.L.bayY, w: R.L.sw, h: R.L.bayH });
  function seatPos(slot, seat, seats) {   // centre of a seat circle inside a parked vehicle
    const r = slotRect(slot), bw = r.w - 8, cols = seats <= 4 ? seats : Math.ceil(seats / 2), row = seats <= 4 ? 0 : seat < cols ? 0 : 1;
    const inRow = seats <= 4 ? seats : row === 0 ? cols : seats - cols, idx = seats <= 4 ? seat : row === 0 ? seat : seat - cols;
    const step = Math.min(bw * 0.22, (bw - 10) / Math.max(inRow, 1)), x0 = r.x + r.w / 2 - ((inRow - 1) * step) / 2;
    return { x: x0 + idx * step, y: r.y + r.h * (seats <= 4 ? 0.36 : 0.26 + row * 0.2) + 3, r: Math.min(step * 0.45, bw * 0.1) };
  }
  const queuePos = (i) => ({ x: R.L.m + R.L.pw * (i + 0.5), y: R.L.queueY + R.L.queueH * 0.5 });

  // ---------- scheduling ----------
  const at = (time, fn) => { R.sched.push({ time, fn }); };
  const burst = (x, y, color, n = 14, speed = 160) => {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, sp = speed * (0.4 + Math.random() * 0.8); R.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.6 + Math.random() * 0.4, t: 0, color: Array.isArray(color) ? color[i % color.length] : color, size: 3 + Math.random() * 4 }); }
  };
  const floatText = (text, x, y, color = '#fff') => R.floats.push({ text, x: clamp(x, 70, (R.L ? R.L.W : 400) - 70), y, t0: performance.now(), color });
  const shake = (amt = 5) => { R.shakeAt = performance.now(); R.shakeAmt = amt; };
  const cellCenter = (cx, cy) => ({ x: R.L.bx + (cx + 0.5) * R.L.cell, y: R.L.by + (cy + 0.5) * R.L.cell });
  const vehCenter = (v) => { const cs = cellsOf(v), a = cs[0], b = cs[cs.length - 1]; return cellCenter((a.x + b.x) / 2, (a.y + b.y) / 2); };

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
          const r = slotRect(e.slot); burst(r.x + r.w / 2, r.y + r.h * 0.5, COLOR_HEX[v.color], 8, 100);
          if (t > 1) floatText('Combo x' + t + '!', r.x + r.w / 2, r.y - 4, t > 3 ? '#ffd23f' : '#ffffff');
        });
      } else if (e.t === 'board') {
        const backlog = tl - now, step = backlog > 1500 ? 38 : backlog > 700 ? 70 : 120, fd = step < 70 ? 150 : 250;   // speeds up when many passengers are waiting to board
        tl = Math.max(tl, (parked[e.id] || now) + 120); const when = tl; tl += step;
        at(when, () => {
          const col = R.vq.shift(); if (col === undefined) return;
          const from = queuePos(0), to = seatPos(e.slot, e.seat, (gm.vehicles.find((x) => x.id === e.id) || {}).seats || 4);
          R.flyers.push({ color: COLOR_HEX[col], from, to, t0: performance.now(), dur: fd, slot: e.slot, id: e.id, seat: e.seat, n: e.n });
        });
      } else if (e.t === 'full') {
        tl += tl - now > 700 ? 70 : 200; at(tl, () => { const s = R.vslots[e.slot]; if (s) { const r = slotRect(e.slot); burst(r.x + r.w / 2, r.y + r.h / 2, ['#ffd23f', '#fff', COLOR_HEX[gm.vehicles.find((x) => x.id === e.id).color]], 22, 200); floatText('Full!', r.x + r.w / 2, r.y - 4, '#ffd23f'); sfx.full(); haptic('medium'); } });
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

  // ---------- input ----------
  R.hitTest = (x, y) => {
    const L = R.L, gm = R.game; if (!gm || !L) return null;
    const find = (py) => { const cx = Math.floor((x - L.bx) / L.cell), cy = Math.floor((py - L.by) / L.cell); if (cx < 0 || cy < 0 || cx >= gm.w || cy >= gm.h) return null; for (const v of gm.vehicles) if (v.state === 'grid' && cellsOf(v).some((c) => c.x === cx && c.y === cy)) return v.id; return null; };
    return find(y + bodyH() * 0.45) || find(y);
  };
  R.vehiclePoint = (id) => { const v = R.game.vehicles.find((x) => x.id === id); return v ? vehCenter(v) : null; };
  const onDown = (ev) => {
    const rect = canvas.getBoundingClientRect(), id = R.hitTest(ev.clientX - rect.left, ev.clientY - rect.top);
    if (id && opts.onTapVehicle) { ev.preventDefault(); opts.onTapVehicle(id); }
  };
  canvas.addEventListener('pointerdown', onDown);

  // ---------- drawing ----------
  // ---- 3D look: a box is a stack of shifted outlines (wheels, body, window band, roof lip) with the roof drawn on top ----
  function box3d(cx, cy, L, Wd, ang, hex, H, o = {}) {
    const st = R.look.vehicle || {}, sc = o.scale || 1, lift = o.lift || 0, rad = Wd * 0.3, cell = R.L.cell;
    g.save(); if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    const at = (dy, fn) => { g.save(); g.translate(cx, cy - lift + dy); g.rotate(ang); g.scale(sc, sc); fn(); g.restore(); };
    // soft shadow on the ground (stays put while the vehicle is lifted)
    g.save(); g.translate(cx + H * 0.45, cy + H * 0.3 + lift * 0.5); g.rotate(ang); g.scale(sc * (1 - lift * 0.004), sc * (1 - lift * 0.004));
    g.fillStyle = 'rgba(10,15,40,.3)'; rr(g, -L / 2 - 2, -Wd / 2 - 2, L + 4, Wd + 4, rad + 2); g.fill(); g.restore();
    // wheels peek out from under the body
    at(-H * 0.12, () => { g.fillStyle = '#171a2b'; for (const wx of [-0.3, 0.3]) rr(g, wx * L - cell * 0.11, -Wd / 2 - 2.5, cell * 0.22, Wd + 5, 3), g.fill(); });
    const steps = Math.max(4, Math.round(H / 1.6));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      at(-t * H, () => {
        if (t < 0.5) { g.fillStyle = shade(hex, -0.42 + 0.26 * (t / 0.5)); rr(g, -L / 2, -Wd / 2, L, Wd, rad); }
        else if (t < 0.84) { g.fillStyle = t < 0.62 ? '#2a4a86' : '#1b2d5e'; rr(g, -L / 2 + 1.2, -Wd / 2 + 1.2, L - 2.4, Wd - 2.4, rad); }
        else { g.fillStyle = shade(hex, -0.12); rr(g, -L / 2 - 1.5, -Wd / 2 - 1.5, L + 3, Wd + 3, rad + 1.5); }
        g.fill();
      });
    }
    at(0, () => { g.strokeStyle = shade(hex, -0.6); g.lineWidth = 1.4; rr(g, -L / 2, -Wd / 2, L, Wd, rad); g.stroke(); });
    // roof
    at(-H, () => {
      const rl = L + 3, rw = Wd + 3;
      const grad = g.createLinearGradient(0, -rw / 2, 0, rw / 2); grad.addColorStop(0, shade(hex, 0.38)); grad.addColorStop(0.45, hex); grad.addColorStop(1, shade(hex, -0.14));
      g.fillStyle = grad; rr(g, -rl / 2, -rw / 2, rl, rw, rad + 1.5); g.fill();
      rr(g, -rl / 2, -rw / 2, rl, rw, rad + 1.5); patternFill(g, st, cell / 64);
      g.fillStyle = 'rgba(255,255,255,' + (st.glossy ? 0.3 : 0.16) + ')'; rr(g, -rl / 2 + 3, -rw / 2 + 2, rl - 6, rw * 0.28, rw * 0.14); g.fill();   // light from above
      if (o.roof) o.roof(rl, rw);
      g.strokeStyle = shade(hex, -0.5); g.lineWidth = Math.max(1.4, cell * 0.035); rr(g, -rl / 2, -rw / 2, rl, rw, rad + 1.5); g.stroke();
      if (o.locked) { g.fillStyle = 'rgba(20,24,50,.5)'; rr(g, -rl / 2, -rw / 2, rl, rw, rad + 1.5); g.fill(); }
    });
    g.restore();
  }
  const bodyH = () => R.L.cell * 0.34;

  function drawVehicleTop(v, cx, cy, extra = {}) {
    const { cell } = R.L, st = R.look.vehicle || {}, hex = COLOR_HEX[v.color] || '#ccc';
    const L = v.len * cell - cell * 0.12, Wd = cell * 0.76, locked = v.lock > 0, H = bodyH() * (extra.scale || 1);
    box3d(cx, cy, L, Wd, DIR_ANGLE[v.dir], hex, H, {
      scale: extra.scale, lift: extra.lift, locked,
      roof: (rl) => {
        // windscreen at the nose (+x) and a small rear window
        g.fillStyle = 'rgba(25,45,90,.86)'; rr(g, rl / 2 - cell * 0.4, -Wd * 0.34, cell * 0.24, Wd * 0.68, cell * 0.08); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, rl / 2 - cell * 0.38, -Wd * 0.3, cell * 0.06, Wd * 0.3, cell * 0.03); g.fill();
        g.fillStyle = 'rgba(25,45,90,.6)'; rr(g, -rl / 2 + cell * 0.1, -Wd * 0.28, cell * 0.12, Wd * 0.56, cell * 0.05); g.fill();
        g.fillStyle = 'rgba(255,255,255,.26)'; rr(g, -rl / 2 + cell * 0.3, -Wd * 0.28, rl - cell * 0.8, Wd * 0.56, cell * 0.1); g.fill();
        const pipR = clamp(cell * 0.07, 2, 4), span = rl - cell * 1.1, step = v.seats > 1 ? Math.min(span / (v.seats - 1), pipR * 3.2) : 0;
        g.fillStyle = 'rgba(255,255,255,.95)';
        for (let i = 0; i < v.seats; i++) { g.beginPath(); g.arc((i - (v.seats - 1) / 2) * step - cell * 0.04, 0, pipR, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.moveTo(rl / 2 - cell * 0.66, -cell * 0.1); g.lineTo(rl / 2 - cell * 0.48, 0); g.lineTo(rl / 2 - cell * 0.66, cell * 0.1); g.closePath(); g.fill();
        g.fillStyle = '#fff6b0'; for (const sy of [-1, 1]) { g.beginPath(); g.arc(rl / 2 - 3, sy * Wd * 0.3, cell * 0.07, 0, 7); g.fill(); }
        g.fillStyle = '#ff4b4b'; for (const sy of [-1, 1]) { g.beginPath(); g.arc(-rl / 2 + 3, sy * Wd * 0.3, cell * 0.05, 0, 7); g.fill(); }
      },
    });
    const uy = cy - (extra.lift || 0) - H;   // things that must stay upright sit on the roof
    if (st.topper && TOPPER_EMOJI[st.topper] && !locked) { g.font = Math.round(cell * 0.4) + 'px ' + EMOJI_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(TOPPER_EMOJI[st.topper], cx, uy - cell * 0.02); }
    if (locked) {
      const need = Math.max(1, v.lock - R.game.departures);
      g.fillStyle = '#10246b'; g.beginPath(); g.arc(cx, uy, cell * 0.27, 0, 7); g.fill(); g.strokeStyle = '#ffe14d'; g.lineWidth = 2; g.stroke();
      g.font = Math.round(cell * 0.26) + 'px ' + EMOJI_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('\u{1F512}', cx, uy - cell * 0.02);
      g.fillStyle = '#ffe14d'; g.font = '900 ' + Math.round(cell * 0.2) + 'px system-ui'; g.fillText(need, cx + cell * 0.27, uy - cell * 0.27);
    }
  }

  function drawCone(cx, cy) {
    const c = R.L.cell; g.save(); g.translate(cx, cy);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0, c * 0.3, c * 0.3, c * 0.09, 0, 0, 7); g.fill();
    g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(0, -c * 0.34); g.lineTo(c * 0.26, c * 0.3); g.lineTo(-c * 0.26, c * 0.3); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-c * 0.12, -c * 0.02); g.lineTo(c * 0.12, -c * 0.02); g.lineTo(c * 0.16, c * 0.1); g.lineTo(-c * 0.16, c * 0.1); g.closePath(); g.fill();
    g.fillStyle = '#d95f00'; rr(g, -c * 0.3, c * 0.26, c * 0.6, c * 0.1, c * 0.03); g.fill(); g.restore();
  }

  function slab(x, y, w, h, r, top, side, depth) {
    g.fillStyle = 'rgba(10,15,40,.26)'; rr(g, x + 5, y + depth + 7, w, h, r); g.fill();
    g.fillStyle = side; rr(g, x, y + depth, w, h, r); g.fill();
    g.fillStyle = top; rr(g, x, y, w, h, r); g.fill();
  }
  function drawBay(now) {
    const L = R.L, gm = R.game;
    slab(L.bayX - 6, L.bayY - 4, L.sw * gm.bay + 12, L.bayH + 8, 14, '#4a5575', '#2c344e', 7);   // asphalt lot
    for (let i = 0; i < gm.bay; i++) {
      const r = slotRect(i), blocked = gm.blockedSlots.includes(i);
      g.strokeStyle = blocked ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.8)'; g.lineWidth = 2.5; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(r.x + 3, r.y + 3); g.lineTo(r.x + 3, r.y + r.h - 3); g.lineTo(r.x + r.w - 3, r.y + r.h - 3); g.lineTo(r.x + r.w - 3, r.y + 3); g.stroke();
      if (blocked) { g.font = Math.round(r.w * 0.5) + 'px ' + EMOJI_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('\u{1F6A7}', r.x + r.w / 2, r.y + r.h / 2); }
    }
    for (let i = 0; i < gm.bay; i++) { const s = R.vslots[i]; if (s) drawParked(s, slotRect(i), 1, 0, now); }
    for (const lv of R.leavers) { const t = clamp((now - lv.t0) / 420, 0, 1); drawParked(lv.s, slotRect(lv.slot), 1 - t, ease(t) * L.W * 0.5, now); }
  }
  function drawParked(s, r, alpha, dx, now) {
    const bw = r.w - 10, Wd = bw * 0.92, Ln = r.h * 0.8, H = r.w * 0.2;
    const pop = s.pop ? clamp((now - s.pop) / 220, 0, 1) : 1, sc = 0.7 + 0.3 * ease(pop) + Math.sin(pop * Math.PI) * 0.08;
    const cx = r.x + r.w / 2 + dx, cy = r.y + r.h * 0.5 + H * 0.35;
    const slot = R.vslots.indexOf(s) >= 0 ? R.vslots.indexOf(s) : (R.leavers.find((l) => l.s === s) || {}).slot;
    box3d(cx, cy, Ln, Wd, Math.PI / 2, s.color, H, {
      scale: sc, alpha,
      roof: (rl, rw) => {   // frame is rotated: +x points down the screen, so the windscreen is at the bottom
        g.fillStyle = 'rgba(25,45,90,.86)'; rr(g, rl / 2 - Ln * 0.2, -rw * 0.38, Ln * 0.14, rw * 0.76, 3); g.fill();
        g.fillStyle = '#fff6b0'; for (const sy of [-1, 1]) { g.beginPath(); g.arc(rl / 2 - 3, sy * rw * 0.3, 2.2, 0, 7); g.fill(); }
      },
    });
    for (let i = 0; i < s.seats; i++) {
      const p = seatPos(slot, i, s.seats), px = p.x + dx, py = p.y - H + 2;
      g.globalAlpha = alpha;
      if (i < s.filled) ball(px, py, p.r * 1.08, s.fills ? s.fills[i] : '#fff');
      else { g.fillStyle = 'rgba(15,25,60,.35)'; g.beginPath(); g.arc(px, py, p.r, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  function ball(x, y, r, hex) {   // a little shaded sphere
    g.fillStyle = 'rgba(10,15,40,.3)'; g.beginPath(); g.ellipse(x + r * 0.2, y + r * 0.85, r * 0.9, r * 0.3, 0, 0, 7); g.fill();
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05); gr.addColorStop(0, shade(hex, 0.55)); gr.addColorStop(0.45, hex); gr.addColorStop(1, shade(hex, -0.38));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.45, r * 0.28, r * 0.16, -0.6, 0, 7); g.fill();
  }

  function drawQueue() {
    const L = R.L, n = R.vq.length, max = Math.floor((L.W - 2 * L.m - 36) / L.pw);
    slab(L.m, L.queueY, L.W - 2 * L.m, L.queueH, 18, '#e9f2ff', '#a9bde6', 6);
    const size = Math.min(L.queueH * 0.72, L.pw * 1.15), shown = Math.min(n, max);
    for (let i = shown - 1; i >= 0; i--) { const p = queuePos(i); drawPassenger(g, p.x, p.y, size * (i === 0 ? 1.08 : 1), COLOR_HEX[R.vq[i]], R.look.accessory, 0); }
    if (n > shown) { g.fillStyle = '#10246b'; g.font = '800 14px system-ui'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('+' + (n - shown), L.W - L.m - 8, L.queueY + L.queueH / 2); }
    if (n === 0) { g.fillStyle = '#10246b'; g.font = '800 15px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Everyone is on board!', L.W / 2, L.queueY + L.queueH / 2); }
  }

  function frame(now) {
    R.raf = requestAnimationFrame(frame);
    const L = R.L, gm = R.game; if (!L || !L.cell) { g.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); return; }
    // scheduled callbacks
    if (R.sched.length) { const due = R.sched.filter((s) => s.time <= now).sort((a, b) => a.time - b.time); if (due.length) { R.sched = R.sched.filter((s) => s.time > now); due.forEach((s) => s.fn()); } }
    // background
    const bgG = g.createLinearGradient(0, 0, 0, L.H); bgG.addColorStop(0, R.world.sky[0]); bgG.addColorStop(1, R.world.sky[1]);
    g.fillStyle = bgG; g.fillRect(0, 0, L.W, L.H);
    g.save();
    const sh = clamp(1 - (now - R.shakeAt) / 260, 0, 1); if (sh > 0) g.translate((Math.random() - 0.5) * R.shakeAmt * sh * 2, (Math.random() - 0.5) * R.shakeAmt * sh * 2);
    // board
    const { bx, by, cell } = L;
    const depth = Math.round(cell * 0.2), W2 = cell * gm.w + 8, H2 = cell * gm.h + 8;
    slab(bx - 4, by - 4, W2, H2, 16, R.world.ground, shade(R.world.ground, -0.42), depth);
    g.save(); rr(g, bx - 4, by - 4, W2, H2, 16); g.clip();
    const tg = g.createLinearGradient(0, by, 0, by + H2); tg.addColorStop(0, 'rgba(255,255,255,.16)'); tg.addColorStop(1, 'rgba(0,0,0,.14)'); g.fillStyle = tg; g.fillRect(bx - 4, by - 4, W2, H2);
    for (let y = 0; y < gm.h; y++) for (let x = 0; x < gm.w; x++) if ((x + y) % 2) { g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(bx + x * cell, by + y * cell, cell, cell); }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; rr(g, bx - 3, by - 3, W2 - 2, H2 - 2, 15); g.stroke();
    for (const w of gm.walls) { const c = cellCenter(w.x, w.y); drawCone(c.x, c.y); }
    // vehicles on the grid
    const drawOrder = gm.vehicles.filter((v) => v.state === 'grid').sort((a, b) => vehCenter(a).y - vehCenter(b).y);   // lower vehicles overlap the ones behind them
    for (const v of drawOrder) {
      const c = vehCenter(v), fx = R.fx[v.id] || {}; let ox = 0, oy = 0, sc = 1;
      if (fx.bump) { const t = (now - fx.bump) / 320; if (t < 1) { const k = Math.sin(t * Math.PI) * cell * 0.18, d = DIR_VEC[v.dir]; ox = d[0] * k; oy = d[1] * k; } }
      if (fx.shake) { const t = (now - fx.shake) / 360; if (t < 1) ox = Math.sin(t * 40) * cell * 0.08 * (1 - t); }
      if (fx.pop) { const t = (now - fx.pop) / 320; if (t < 1) sc = 1 + Math.sin(t * Math.PI) * 0.18; }
      drawVehicleTop(v, c.x + ox, c.y + oy, { scale: sc });
      if (fx.flash && now - fx.flash < 450) { g.save(); g.strokeStyle = 'rgba(255,70,70,' + (1 - (now - fx.flash) / 450) + ')'; g.lineWidth = 4; const cs = cellsOf(v), a = cs[0], b = cs[cs.length - 1]; rr(g, bx + Math.min(a.x, b.x) * cell + 2, by + Math.min(a.y, b.y) * cell + 2, (Math.abs(a.x - b.x) + 1) * cell - 4, (Math.abs(a.y - b.y) + 1) * cell - 4, cell * 0.25); g.stroke(); g.restore(); }
      if (R.targeting && v.lock === 0) { g.save(); g.strokeStyle = 'rgba(255,255,255,' + (0.55 + 0.45 * Math.sin(now / 160)) + ')'; g.lineWidth = 3; const cs = cellsOf(v), a = cs[0], b = cs[cs.length - 1]; rr(g, bx + Math.min(a.x, b.x) * cell + 1, by + Math.min(a.y, b.y) * cell + 1, (Math.abs(a.x - b.x) + 1) * cell - 2, (Math.abs(a.y - b.y) + 1) * cell - 2, cell * 0.3); g.stroke(); g.restore(); }
    }
    // vehicles driving off the board
    R.movers = R.movers.filter((m) => {
      const t = clamp((now - m.t0) / m.dur, 0, 1); if (t >= 1) return false;
      const c = vehCenter(m.v);
      if (m.heli) { const r = slotRect(m.slot), tx = r.x + r.w / 2, ty = r.y + r.h / 2, k = ease(t); drawVehicleTop(m.v, c.x + (tx - c.x) * k, c.y + (ty - c.y) * k - Math.sin(t * Math.PI) * cell * 1.4, { scale: 1 - 0.45 * k, lift: Math.sin(t * Math.PI) * 14 }); }
      else { const d = DIR_VEC[m.v.dir], k = ease(t) * m.dist * cell; drawVehicleTop(m.v, c.x + d[0] * k, c.y + d[1] * k, { scale: 1 - 0.25 * t }); }
      return true;
    });
    g.restore();
    drawBay(now);
    // passengers in flight
    R.flyers = R.flyers.filter((f) => {
      const t = clamp((now - f.t0) / f.dur, 0, 1), k = ease(t), x = f.from.x + (f.to.x - f.from.x) * k, y = f.from.y + (f.to.y - f.from.y) * k - Math.sin(t * Math.PI) * 26;
      if (t >= 1) { const s = R.vslots[f.slot]; if (s && s.id === f.id) { s.filled = Math.max(s.filled, f.seat + 1); (s.fills = s.fills || [])[f.seat] = f.color; } sfx.board(f.n || 0); burst(f.to.x, f.to.y, f.color, 4, 60); return false; }
      drawPassenger(g, x, y, R.L.pw * 1.1, f.color, R.look.accessory, Math.sin(t * 12) * 0.2); return true;
    });
    drawQueue();
    // particles + floating text (on top of everything)
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
