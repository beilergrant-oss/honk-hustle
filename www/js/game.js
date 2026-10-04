// game.js - the rules of one round. Pure logic: no drawing, no DOM. render.js plays the `events` it produces.
//
// How a round works (same rules the level generator solves for):
//  - Tap a vehicle. If its way out of the jam is clear it drives to a free parking slot in the bay.
//  - Passengers wait in one line. The first passenger boards any parked vehicle of their colour that still has a seat.
//  - A full vehicle drives away and frees its slot. Empty the line to win.
//  - Every tap on an unlocked vehicle costs a move, even a blocked one. Locked vehicles cost nothing.
//  - Lose when moves run out, or when the bay is full and nobody can board (Bay+ can rescue that).
import { pathOf, cellsOf } from './levelGen.js';
import { spendMove, movesLeft } from './rounds.js';

export function createGame(level, round) {
  const vehicles = level.vehicles.map((v) => ({ ...v, lock: v.lock || 0, state: 'grid', slot: -1, seatsLeft: v.seats, parkedAt: -1 }));
  const g = {
    level, w: level.w, h: level.h, round,
    vehicles, walls: level.walls.map((c) => ({ ...c })),
    queue: [...level.queue], totalPassengers: level.queue.length,
    bay: round.bay, blockedSlots: [...level.blockedSlots],
    slots: [], departures: 0, parkSeq: 0,
    status: 'playing',            // 'playing' | 'stuck' (bay full) | 'won' | 'lost'
    reason: null,                 // 'out-of-moves' | 'bay-full'
    events: [],
    // ---- the object powerups.js drives ----
    bayIsFull() { return freeSlot(g) === -1; },
    sendToBay(id, opts = {}) { return depart(g, id, opts); },
    refreshBayUI() { resizeSlots(g); settle(g); finish(g); g.events.push({ t: 'bay' }); },
    unlockVehicle(id) { const v = byId(g, id); if (v && v.lock > 0) { v.lock = 0; g.events.push({ t: 'unlock', id }); } },
  };
  resizeSlots(g);
  return g;
}

const byId = (g, id) => g.vehicles.find((v) => v.id === id);
const gridVehicles = (g) => g.vehicles.filter((v) => v.state === 'grid');
export const vehiclesLeft = (g) => g.vehicles.filter((v) => v.state !== 'done').length;
export const usableSlots = (g) => g.bay - g.blockedSlots.length;

function resizeSlots(g) {
  while (g.slots.length < g.bay) g.slots.push(null);
  g.slots.length = g.bay;
}
export const isSlotBlocked = (g, i) => g.blockedSlots.includes(i);
function freeSlot(g) { for (let i = 0; i < g.bay; i++) if (g.slots[i] === null && !isSlotBlocked(g, i)) return i; return -1; }

// Which vehicle (or wall) is in the way? null if the exit is clear.
export function blocker(g, v) {
  const path = pathOf(v, g.w, g.h);
  for (const c of path) {
    if (g.walls.some((wl) => wl.x === c.x && wl.y === c.y)) return { wall: c };
    for (const o of gridVehicles(g)) if (o.id !== v.id && cellsOf(o).some((k) => k.x === c.x && k.y === c.y)) return { vehicle: o.id };
  }
  return null;
}
export const isLocked = (v) => v.lock > 0;

// ---- tapping ----
// Returns { result: 'ignored' | 'locked' | 'blocked' | 'go' }. Read g.events afterwards.
export function tapVehicle(g, id) {
  const v = byId(g, id);
  if (!v || g.status !== 'playing' || v.state !== 'grid') return { result: 'ignored' };
  if (isLocked(v)) { g.events.push({ t: 'locked', id, need: v.lock - g.departures }); return { result: 'locked' }; }
  spendMove(g.round);
  g.events.push({ t: 'moves', left: movesLeft(g.round) });
  const b = blocker(g, v);
  if (b) { g.events.push({ t: 'blocked', id, by: b.vehicle || null, wall: b.wall || null }); finish(g); return { result: 'blocked' }; }
  depart(g, id, {});
  return { result: 'go' };
}

function depart(g, id, { ignoreBlockers = false } = {}) {
  const v = byId(g, id);
  if (!v || v.state !== 'grid') return false;
  const slot = freeSlot(g);
  if (slot === -1) return false;
  v.state = 'bay'; v.slot = slot; v.parkedAt = g.parkSeq++; g.slots[slot] = v.id;
  g.departures++;
  g.events.push({ t: 'depart', id, slot, from: { x: v.x, y: v.y }, path: ignoreBlockers ? [] : pathOf(v, g.w, g.h), heli: ignoreBlockers });
  // vehicles whose lock count has now been reached unlock themselves
  for (const o of gridVehicles(g)) if (o.lock > 0 && g.departures >= o.lock) { o.lock = 0; g.events.push({ t: 'unlock', id: o.id }); }
  settle(g);
  finish(g);
  return true;
}

// Passengers board, full vehicles leave. Repeats until nothing more can happen.
function settle(g) {
  let moved = true, boarded = 0;
  while (moved && g.queue.length) {
    moved = false;
    const parked = g.vehicles.filter((v) => v.state === 'bay').sort((a, b) => a.parkedAt - b.parkedAt);
    for (const p of parked) {
      if (p.seatsLeft > 0 && g.queue[0] === p.color) {
        const color = g.queue.shift(); p.seatsLeft--; moved = true;
        g.events.push({ t: 'board', id: p.id, color, seat: p.seats - p.seatsLeft - 1, slot: p.slot, n: boarded++ });
        if (p.seatsLeft === 0) { g.events.push({ t: 'full', id: p.id, slot: p.slot }); }
        break;
      }
    }
  }
  for (const p of g.vehicles) if (p.state === 'bay' && p.seatsLeft === 0) {
    p.state = 'done'; g.slots[p.slot] = null; g.events.push({ t: 'leave', id: p.id, slot: p.slot });
  }
}

function finish(g) {
  if (g.status === 'won' || g.status === 'lost') return;
  if (g.queue.length === 0) { g.status = 'won'; g.events.push({ t: 'won' }); return; }
  if (movesLeft(g.round) <= 0) { g.status = 'lost'; g.reason = 'out-of-moves'; g.events.push({ t: 'lost', reason: g.reason }); return; }
  if (freeSlot(g) === -1 && gridVehicles(g).length > 0) { g.status = 'stuck'; g.reason = 'bay-full'; g.events.push({ t: 'stuck' }); return; }
  g.status = 'playing'; g.reason = null;
}
// Called by the app when the player gives up on a stuck bay (or retries).
export function failStuck(g) { if (g.status === 'stuck') { g.status = 'lost'; g.events.push({ t: 'lost', reason: 'bay-full' }); } }

export const drainEvents = (g) => { const e = g.events; g.events = []; return e; };

// For tests and hints: the order the generator guarantees will win.
export const solutionOrder = (g) => g.level.solution.filter((id) => byId(g, id).state === 'grid');
