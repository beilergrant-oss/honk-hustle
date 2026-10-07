// bootTasks.js - the REAL work that drives the loading bar in Bus Blitz Party.
// Each task's weight decides how much of the bar it fills. Adjust the Base44 calls to match your project.
import { trackedFetch } from './loader.js';
import { getLevel, prefetch, TOTAL_LEVELS } from './campaign.js';

export const PROFILE_CACHE_KEY = 'honkhustle_profile_v1';   // old internal name, kept so existing saves still load
export const DEFAULT_PROFILE = { coins: 0, highestLevel: 0, winStreak: 0, bestStreak: 0, powerups: { heli: 0, bay: 0, key: 0 }, ownedSkins: [], equippedVehicleSkin: 'v_classic', equippedPassengerSkin: 'p_classic', processedTransactions: [], hemisphere: 'north', seasonalLooks: true };

const store = {
  get(env) { try { const s = (env && env.localStorage) || globalThis.localStorage; return s ? JSON.parse(s.getItem(PROFILE_CACHE_KEY) || 'null') : null; } catch (e) { return null; } },
  set(env, v) { try { const s = (env && env.localStorage) || globalThis.localStorage; if (s) s.setItem(PROFILE_CACHE_KEY, JSON.stringify(v)); } catch (e) { /* private mode etc. */ } },
};

// base44 = your SDK client (import { base44 } from '@/api/base44Client'). result = an object the tasks fill in for your app to read.
export function makeBootTasks({ base44, pingUrl = null, result = {}, env = {} }) {
  return [
    // 1. local: nothing to download, fills the first slice of the bar instantly
    { id: 'engine', label: 'Warming up the engine…', weight: 1, needsNetwork: false,
      run: async (ctx) => { try { if (globalThis.document && document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* fonts are optional */ } ctx.progress(1); } },

    // 2. network: a tiny request to confirm the road is really open. Real bytes drive real progress.
    { id: 'road', label: 'Checking the road…', weight: 1,
      run: async (ctx) => { if (!pingUrl) { ctx.progress(1); return; } await trackedFetch(pingUrl + (pingUrl.includes('?') ? '&' : '?') + '_=' + Date.now(), ctx, { cache: 'no-store' }); } },

    // 3. network: the player's saved progress. Falls back to the on-device copy if offline mode is chosen.
    { id: 'garage', label: 'Loading your garage…', weight: 4,
      run: async (ctx) => {
        ctx.progress(0.1);
        const rows = await base44.entities.PlayerProfile.list();           // adapt: filter to the signed-in user if needed
        ctx.progress(0.6);
        let profile = rows && rows[0];
        if (!profile) profile = await base44.entities.PlayerProfile.create({ ...DEFAULT_PROFILE });
        result.profile = profile; store.set(env, profile); ctx.progress(1);
      },
      offlineFallback: async () => { result.profile = store.get(env) || { ...DEFAULT_PROFILE, id: null, offline: true }; result.offline = true; } },

    // 4. local: pick today's levels so the first tap is instant
    { id: 'levels', label: 'Building your levels…', weight: 2, needsNetwork: false,
      run: async (ctx) => { const next = Math.min(TOTAL_LEVELS, ((result.profile && result.profile.highestLevel) || (store.get(env) || {}).highestLevel || 0) + 1);  /* never past the last level (players who finish the game) */ ctx.progress(0.3); getLevel(next); ctx.progress(0.8); prefetch(next, 3); ctx.progress(1); } },
  ];
}
