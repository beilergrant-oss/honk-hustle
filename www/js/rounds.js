// rounds.js - win streak bonuses, move limits, rewards, and the 1000-coin "Win Level" button.

export const SKIP_COST = 1000;

// Streak counts consecutive rounds WON ON THE FIRST TRY. Any lost attempt resets it to 0.
// A win on a retry does not add to the streak, and neither does a coin skip (a skip doesn't break it either).
export const STREAK_RULES = {
  freeUseTiers: [{ wins: 1, uses: 1 }, { wins: 3, uses: 2 }], // free power-up uses PER ROUND (player picks which)
  specialAt: 10,
};
// Special bonus: appears after 10 first-try wins, is active every round, and is lost the moment a round is lost.
export const SPECIAL_BONUS = { id: 'golden_streak', name: 'Golden Streak', extraBaySlots: 1, coinMultiplier: 2 };

export function bonusesFor(streak) {
  let uses = 0;
  for (const t of STREAK_RULES.freeUseTiers) if (streak >= t.wins) uses = t.uses;
  return { freeUses: uses, special: streak >= STREAK_RULES.specialAt ? SPECIAL_BONUS : null };
}

// result: 'win-first-try' | 'win-retry' | 'lose' | 'skip'
export function applyResult(profile, result) {
  let streak = profile.winStreak || 0;
  if (result === 'win-first-try') streak += 1;
  else if (result === 'lose' || result === 'win-retry') streak = 0;
  return { ...profile, winStreak: streak, bestStreak: Math.max(profile.bestStreak || 0, streak) };
}

// ---- A single round ----
export function startRound(level, profile) {
  const b = bonusesFor(profile.winStreak || 0);
  return {
    level,
    moveLimit: level.moveLimit,
    movesUsed: 0,
    freeUses: b.freeUses,
    special: b.special,
    bay: level.bay + (b.special ? b.special.extraBaySlots : 0), // give this to your game as the bay size
  };
}
export const movesLeft = (r) => r.moveLimit - r.movesUsed;

// Call on EVERY tap on a vehicle (blocked taps cost a move too; locked blocks do not).
export function spendMove(round) { round.movesUsed += 1; return movesLeft(round); }

// Call after the tap resolves. Winning on your last move still wins.
export function checkEnd(round, vehiclesLeft) {
  if (vehiclesLeft === 0) return 'win';
  if (movesLeft(round) <= 0) return 'out-of-moves';
  return 'playing';
}

export function winReward(round) {
  const l = round.level;
  const left = Math.max(0, movesLeft(round));
  const slack = Math.max(1, round.moveLimit - l.vehicles.length);
  const ratio = left / slack;
  const stars = ratio >= 0.5 ? 3 : ratio >= 0.2 ? 2 : 1;
  const mult = round.special ? round.special.coinMultiplier : 1;
  return { stars, coins: Math.round((l.coinReward + left * 2) * mult), multiplier: mult };
}

// The 1000-coin button: wins the round instantly. Opens the next level, pays no coin reward, leaves the streak untouched.
export function skipWithCoins(profile, levelNumber) {
  if ((profile.coins || 0) < SKIP_COST) return { ok: false, reason: 'not-enough-coins' };
  return {
    ok: true,
    profile: { ...profile, coins: profile.coins - SKIP_COST, highestLevel: Math.max(profile.highestLevel || 0, levelNumber) },
  };
}
