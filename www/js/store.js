// store.js - the player's saved progress, kept on the device (localStorage). No account or server needed.
import { DEFAULT_PROFILE, PROFILE_CACHE_KEY } from './bootTasks.js';

export const DEFAULTS = {
  ...DEFAULT_PROFILE,
  id: 'local',
  hemisphere: 'north',
  settings: { sound: true, haptics: true, seasonal: true, openLevels: false },
};

let memory = null; // used if localStorage is unavailable
// iOS can clear a web view's localStorage when the phone is low on space, so the save is also mirrored into native storage
// (@capacitor/preferences) and restored from there if localStorage comes back empty.
const prefs = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
function mirror(p) { try { const P = prefs(); if (P) P.set({ key: PROFILE_CACHE_KEY, value: p ? JSON.stringify(p) : '' }); } catch (e) { /* optional */ } }
export async function restoreIfMissing() {
  try { if (localStorage.getItem(PROFILE_CACHE_KEY)) return; const P = prefs(); if (!P) return; const { value } = await P.get({ key: PROFILE_CACHE_KEY }); if (value) localStorage.setItem(PROFILE_CACHE_KEY, value); } catch (e) { /* optional */ }
}
function read() {
  try { const raw = localStorage.getItem(PROFILE_CACHE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return memory; }
}
function write(p) { memory = p; mirror(p); try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p)); } catch (e) { /* storage full or blocked: keep in memory */ } }

export function loadProfile() {
  const saved = read() || {};
  return {
    ...DEFAULTS, ...saved, id: 'local',
    powerups: { ...DEFAULTS.powerups, ...(saved.powerups || {}) },
    settings: { ...DEFAULTS.settings, ...(saved.settings || {}) },
    ownedSkins: saved.ownedSkins || [],
  };
}
export function saveProfile(p) { const next = { ...p, id: 'local' }; write(next); return next; }
export function resetProfile() { write(null); try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch (e) {} return loadProfile(); }
