// daily.js - daily check-in: one reward per calendar day on a repeating 7-day cycle, with a streak.
export const STREAK_CYCLE = [{ coins: 30 }, { powerup: 'bay' }, { coins: 50 }, { powerup: 'key' }, { coins: 80 }, { powerup: 'heli' }, { coins: 150 }];
export const CYCLE_LENGTH = STREAK_CYCLE.length;
export function dayKey(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const daysBetween = (a, b) => { const [fy, fm, fd] = a.split('-').map(Number), [ty, tm, td] = b.split('-').map(Number); return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000); };
export function dailyState(profile, now = new Date()) {
  const daily = profile.daily || {}, today = dayKey(now), gap = daily.last ? daysBetween(daily.last, today) : null;
  const claimable = gap !== 0, streak = claimable ? (gap === 1 ? (daily.streak || 0) + 1 : 1) : daily.streak || 1;
  const index = (streak - 1) % CYCLE_LENGTH;
  return { claimable, streak, index, today, best: Math.max(daily.best || 0, streak), reward: STREAK_CYCLE[index] };
}
export function claimDaily(profile, now = new Date()) {
  const s = dailyState(profile, now); if (!s.claimable) return { profile, state: s, reward: null };
  const powerups = { ...(profile.powerups || {}) }; if (s.reward.powerup) powerups[s.reward.powerup] = (powerups[s.reward.powerup] || 0) + 1;
  return { profile: { ...profile, coins: (profile.coins || 0) + (s.reward.coins || 0), powerups, daily: { last: s.today, streak: s.streak, best: s.best } }, state: s, reward: s.reward };
}
