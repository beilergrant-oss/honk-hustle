// garageScreen.js - the Garage: your own buses and riders. Everything you own (bought in the shop, won from worlds, season packs) shows up here,
// with locked ones greyed out. Tap an owned one to equip it; equipping a bus also puts on the rider that matches it.
//   mountGarage(root, { profile, onEquip(skinId), onShop(), onClose() }) -> { update(profile), destroy() }
import { VEHICLE_SKINS, PASSENGER_SKINS, isOwned, passengerFor, skinById } from './skinData.js';
import { busPic, riderPic } from './cartoon.js';
import { COLOR_HEX } from './look.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const RARITY = { common: '#8fa3c8', rare: '#3b82f6', epic: '#9b5de5', legendary: '#ffb300' };
const HOW = (s) => (s.obtain === 'world' ? 'Finish World ' + ((s.world || 0) + 1) : s.obtain === 'pack' ? 'In a Season Pack' : s.obtain === 'set' ? 'In a Set' : 'In the Shop');

export function mountGarage(root, opts = {}) {
  let { profile = {} } = opts, tab = 'bus';
  root.innerHTML = '';
  const el = document.createElement('div'); el.className = 'gar'; root.appendChild(el);

  function cards(list, kind) {
    const eqId = kind === 'bus' ? (profile.equippedVehicleSkin || 'v_classic') : (profile.equippedPassengerSkin || 'p_classic');
    const rows = list.map((s, i) => ({ s, i, own: isOwned(profile, s.id), eq: s.id === eqId }));
    rows.sort((a, b) => (b.eq - a.eq) || (b.own - a.own) || (a.i - b.i));
    return rows.map(({ s, i, own, eq }) => `<button class="gc ${eq ? 'eq' : ''} ${own ? '' : 'lock'}" data-skin="${s.id}" ${own ? '' : 'data-locked="1"'} aria-label="${esc(s.name)}${own ? '' : ', locked'}">
      <span class="gp">${kind === 'bus' ? busPic(s.id) : riderPic(s.id, i)}</span><b>${esc(s.name)}</b>
      <span class="gs" style="background:${RARITY[s.rarity] || RARITY.common}"></span>
      <i class="gt">${eq ? '✓ Equipped' : own ? 'Tap to equip' : '\u{1F512} ' + esc(HOW(s))}</i></button>`).join('');
  }

  function render() {
    const vid = profile.equippedVehicleSkin || 'v_classic', pid = profile.equippedPassengerSkin || 'p_classic';
    const ownedBus = VEHICLE_SKINS.filter((s) => isOwned(profile, s.id)).length, ownedRid = PASSENGER_SKINS.filter((s) => isOwned(profile, s.id)).length;
    const crowd = Object.values(COLOR_HEX).slice(0, 6).map((_, i) => riderPic(pid, i, 64)).join('');
    el.innerHTML = `
      <div class="gtop"><button class="round-btn" data-g="close" aria-label="Back">‹</button><h1>Garage</h1><span class="pill">\u{1FA99} ${(profile.coins || 0).toLocaleString()}</span></div>
      <div class="gstage"><div class="gbus">${busPic(vid)}</div><div class="gcrowd">${crowd}</div><div class="gname">${esc((skinById(vid) || {}).name || 'Classic')} <small>+ ${esc((skinById(pid) || {}).name || 'Classic')}</small></div></div>
      <div class="gtabs"><button class="${tab === 'bus' ? 'on' : ''}" data-tab="bus">\u{1F68C} Buses <small>${ownedBus}/${VEHICLE_SKINS.length}</small></button><button class="${tab === 'rider' ? 'on' : ''}" data-tab="rider">\u{1F9D1} Riders <small>${ownedRid}/${PASSENGER_SKINS.length}</small></button></div>
      <div class="gscroll"><div class="ggrid">${tab === 'bus' ? cards(VEHICLE_SKINS, 'bus') : cards(PASSENGER_SKINS, 'rider')}</div>
        <div class="gshop"><button class="btn gold" data-g="shop">\u{1F6D2} Get more in the Shop</button></div></div>`;
  }
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-g],[data-tab],[data-skin]'); if (!t) return;
    if (t.dataset.g === 'close') return opts.onClose && opts.onClose();
    if (t.dataset.g === 'shop') return opts.onShop && opts.onShop();
    if (t.dataset.tab) { tab = t.dataset.tab; return render(); }
    if (t.dataset.skin) {
      if (t.dataset.locked) return opts.onShop && opts.onShop(t.dataset.skin);
      const r = opts.onEquip(t.dataset.skin); if (r && r.profile) profile = r.profile; render();
    }
  });
  render();
  return { update(p) { profile = p; render(); }, destroy() { el.remove(); } };
}
export { passengerFor };
