// powerups.js - 3 power-ups. There are NO free power-ups by default: free uses only come from win streaks (see rounds.js).
export const POWERUPS = {
  heli: { name: 'Heli-Lift',  icon: '🚁', desc: 'Lift any vehicle straight into the bay, ignoring blockers.' },
  bay:  { name: 'Bay+',       icon: '🅿️', desc: 'Clears a blocked bay slot, or adds one extra slot.' },
  key:  { name: 'Master Key', icon: '🔑', desc: 'Instantly unlocks every locked and frozen block.' },
};

// round.freeUses = streak bonus uses left this round (any power-up). inventory = what the player owns.
export function availability(type, round, inventory) {
  const free = round.freeUses || 0;
  const owned = inventory[type] || 0;
  return { free, owned, canUse: free > 0 || owned > 0 };
}

// Effects call into YOUR existing game object. Wire these method names to what you already have.
const effects = {
  heli(game, targetId) {                       // targetId = vehicle tapped after pressing the button
    const v = game.vehicles.find((x) => x.id === targetId);
    if (!v || v.lock > 0 || game.bayIsFull()) return false;
    game.sendToBay(targetId, { ignoreBlockers: true });
    return true;
  },
  bay(game) {
    if (game.blockedSlots.length) game.blockedSlots.shift();
    else game.bay += 1;
    game.refreshBayUI();
    return true;
  },
  key(game) {
    const locked = game.vehicles.filter((v) => v.state === 'grid' && (v.lock > 0 || v.ice > 0));
    if (!locked.length) return false;          // nothing locked: don't waste it
    locked.forEach((v) => game.unlockVehicle(v.id));
    return true;
  },
};

// Spends a free streak use first, then inventory. Only spends if the effect actually worked.
export function usePowerup(type, game, round, inventory, targetId) {
  const a = availability(type, round, inventory);
  if (!a.canUse) return { ok: false, reason: 'none-left' };
  if (!effects[type](game, targetId)) return { ok: false, reason: 'no-effect' };
  const usedFree = a.free > 0;
  return {
    ok: true,
    usedFree,
    round: usedFree ? { ...round, freeUses: round.freeUses - 1 } : round,
    inventory: usedFree ? inventory : { ...inventory, [type]: inventory[type] - 1 },
  };
}
