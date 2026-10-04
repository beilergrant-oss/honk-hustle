// garageScreen.js - the Bus Garage: all 16 bus styles in a grid, tap one for a big preview and Equip / Buy.
// Plain DOM (no framework) so it works anywhere; BusGarage.jsx is the React wrapper for Base44.
//   mountGarage(root, { profile, now, images, canBuyWithMoney, onEquip(styleId), onBuyCoins(styleId), onBuyMoney(styleId), onClose })
//   -> { update(profile), destroy() }
// images: optional { styleId: 'https://...png' }. If a style has an image it is shown instead of the drawn bus.
import { BUS_STYLES, garageCards, passengerSkinFor } from './busStyles.js';
import { busCardSvg } from './busArt.js';
import { PRICES } from './themes.js';

const CSS = `
.bg-root{--ink:#10246b;position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(#35b6ff,#8fdcff 40%,#d2f3ff);font-family:'Poppins','Lilita One',system-ui,sans-serif;color:var(--ink);overflow:hidden}
.bg-top{display:flex;align-items:center;gap:10px;padding:max(12px,env(safe-area-inset-top)) 14px 8px}
.bg-title{flex:1;font:400 28px/1 'Lilita One',system-ui,sans-serif;color:#fff;-webkit-text-stroke:5px var(--ink);paint-order:stroke fill;letter-spacing:.5px;text-shadow:0 3px 0 rgba(16,36,107,.35)}
.bg-coins{background:#fff;border-radius:999px;padding:6px 12px;font-weight:800;font-size:14px;box-shadow:0 2px 0 rgba(16,36,107,.25)}
.bg-x{width:38px;height:38px;border-radius:50%;border:0;background:#fff;color:var(--ink);font:800 18px system-ui;box-shadow:0 2px 0 rgba(16,36,107,.25);cursor:pointer}
.bg-scroll{flex:1;overflow:auto;padding:4px 12px max(18px,env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch}
.bg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;max-width:980px;margin:0 auto}
@media(min-width:620px){.bg-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.bg-card{position:relative;border:0;padding:0;border-radius:18px;overflow:hidden;background:#0d1a4a;cursor:pointer;text-align:left;box-shadow:0 4px 0 rgba(16,36,107,.35);transition:transform .12s;font:inherit}
.bg-card:active{transform:scale(.97)}
.bg-card:focus-visible{outline:3px solid #fff;outline-offset:2px}
.bg-art{display:block;width:100%;aspect-ratio:400/440;background:#fff}
.bg-art svg,.bg-art img{display:block;width:100%;height:100%;object-fit:cover}
.bg-card[data-status=locked] .bg-art{filter:saturate(.35) brightness(.78)}
.bg-pill{position:absolute;left:7%;right:7%;bottom:8px;border-radius:999px;padding:6px 8px;font:800 12.5px/1.1 system-ui,sans-serif;display:flex;gap:5px;justify-content:center;align-items:center;box-shadow:0 2px 0 rgba(0,0,0,.28);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bg-tag{position:absolute;top:7px;left:7px;background:rgba(16,36,107,.85);color:#fff;border-radius:999px;padding:3px 8px;font:800 10.5px system-ui;letter-spacing:.3px}
.bg-state{position:absolute;top:7px;right:7px;border-radius:999px;padding:3px 8px;font:800 10.5px system-ui;background:#fff;color:var(--ink)}
.bg-state.eq{background:#3ddc84;color:#06361b}
.bg-state.lock{background:#10246b;color:#fff}
.bg-sheet-wrap{position:absolute;inset:0;background:rgba(10,20,60,.55);display:flex;align-items:flex-end;justify-content:center;animation:bgfade .15s ease-out}
.bg-sheet{width:100%;max-width:520px;background:#fff;border-radius:24px 24px 0 0;padding:14px 16px max(18px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;max-height:92%;overflow:auto;animation:bgup .2s ease-out}
.bg-sheet .bg-art{border-radius:16px;overflow:hidden;aspect-ratio:400/400}
.bg-sheet h2{margin:0;font:400 26px/1.05 'Lilita One',system-ui,sans-serif}
.bg-sub{font-size:13px;opacity:.8;line-height:1.35}
.bg-row{display:flex;gap:8px;flex-wrap:wrap}
.bg-btn{flex:1 1 140px;border:0;border-radius:14px;padding:13px 14px;font:800 15px system-ui;cursor:pointer;color:#fff;background:linear-gradient(#4a9bff,#2f6bff);box-shadow:0 3px 0 #1a3fa8}
.bg-btn.green{background:linear-gradient(#52e08a,#22b85a);box-shadow:0 3px 0 #13783a}
.bg-btn.gold{background:linear-gradient(#ffd23a,#ffa800);box-shadow:0 3px 0 #b87400;color:#3a2600}
.bg-btn.ghost{background:#eef2ff;color:var(--ink);box-shadow:0 3px 0 #c5cef0}
.bg-btn[disabled]{opacity:.55;cursor:default}
.bg-msg{min-height:18px;font-size:13px;font-weight:700;color:#c0392b}
@keyframes bgfade{from{opacity:0}to{opacity:1}}@keyframes bgup{from{transform:translateY(30px);opacity:.6}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){.bg-sheet,.bg-sheet-wrap,.bg-card{animation:none;transition:none}}
`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pillBg = (s) => (s.rainbow ? `linear-gradient(90deg,${s.pill.join(',')})` : `linear-gradient(${s.pill[0]},${s.pill[1]})`);
const STATE_TEXT = { equipped: ['✓ Equipped', 'eq'], owned: ['Owned', ''], buyable: ['In shop', ''], locked: ['\u{1F512} Locked', 'lock'] };

export function mountGarage(root, opts = {}) {
  let { profile = {}, now, images = {} } = opts;
  const clock = () => now || new Date();
  if (!document.getElementById('bg-css')) { const st = document.createElement('style'); st.id = 'bg-css'; st.textContent = CSS; document.head.appendChild(st); }
  root.innerHTML = '';
  const el = document.createElement('div'); el.className = 'bg-root'; root.appendChild(el);
  let openId = null, busy = false, message = '';

  const art = (s) => (images[s.id] ? `<img src="${esc(images[s.id])}" alt="${esc(s.name)} bus" loading="lazy">` : busCardSvg(s.look, s.id + (openId === s.id ? '-big' : '')));

  function render() {
    const cards = garageCards(profile, clock());
    el.innerHTML = `
      <div class="bg-top"><div class="bg-title">Bus Garage</div><div class="bg-coins" aria-label="Coins">\u{1FA99} ${(profile.coins || 0).toLocaleString()}</div>${opts.onClose ? '<button class="bg-x" aria-label="Close" data-act="close">✕</button>' : ''}</div>
      <div class="bg-scroll"><div class="bg-grid">${cards.map((c) => `
        <button class="bg-card" data-id="${c.style.id}" data-status="${c.status}" aria-label="${esc(c.style.name)}, ${c.status}">
          <span class="bg-art">${art(c.style)}</span>
          ${c.tag ? `<span class="bg-tag">${c.tag}</span>` : ''}
          <span class="bg-state ${STATE_TEXT[c.status][1]}">${STATE_TEXT[c.status][0]}</span>
          <span class="bg-pill" style="background:${pillBg(c.style)};color:${c.style.ink}"><span aria-hidden="true">${c.style.glyph}</span>${esc(c.style.name)}</span>
        </button>`).join('')}</div></div>
      ${openId ? sheet(cards.find((c) => c.style.id === openId)) : ''}`;
  }

  function sheet(c) {
    const s = c.style, set = c.set, price = set ? PRICES[set.price] : null;
    const money = !!opts.canBuyWithMoney && price;
    const coins = profile.coins || 0;
    let actions = '';
    if (c.status === 'equipped') actions = `<button class="bg-btn green" disabled>✓ Equipped</button>`;
    else if (c.status === 'owned') actions = `<button class="bg-btn green" data-act="equip" ${busy ? 'disabled' : ''}>Equip</button>`;
    else if (c.status === 'buyable') actions = `<button class="bg-btn gold" data-act="coins" ${busy ? 'disabled' : ''}>\u{1FA99} ${price.set.toLocaleString()} coins${coins < price.set ? ' (need more)' : ''}</button>${money ? `<button class="bg-btn" data-act="money" ${busy ? 'disabled' : ''}>${price.usd}</button>` : ''}`;
    else actions = `<button class="bg-btn ghost" disabled>${esc(c.backText || 'Not in the shop right now')}</button>`;
    const sub = !set ? 'Your free starter bus.' : c.status === 'locked' ? `${esc(set.name)} comes back to the shop. Anything you already own stays yours forever.` : `Bus and matching passenger outfits${set.kind === 'weekly' ? ' • in the shop this week' : ''}.`;
    return `<div class="bg-sheet-wrap" data-act="dismiss"><div class="bg-sheet" role="dialog" aria-label="${esc(s.name)}">
      <span class="bg-art">${art(s)}</span><h2>${esc(s.name)}</h2><div class="bg-sub">${sub}</div>
      <div class="bg-row">${actions}<button class="bg-btn ghost" data-act="back">Back</button></div><div class="bg-msg" role="status">${esc(message)}</div></div></div>`;
  }

  const REASON = { 'not-enough-coins': 'Not enough coins yet. Win levels to earn more.', 'not-in-shop': 'This style is not in the shop right now.', 'already-owned': 'You already own this one.', 'not-for-sale': 'This one is not for sale.' };
  async function run(fn) {
    busy = true; message = ''; render();
    try { const r = await fn(); if (r && r.ok === false) message = REASON[r.reason] || 'Could not complete that.'; else if (r && r.profile) profile = r.profile; }
    catch (e) { message = (e && e.message) || 'Something went wrong. Try again.'; }
    busy = false; render();
  }
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act],[data-id]'); if (!t) return;
    const act = t.dataset.act;
    if (t.dataset.id && !act) { openId = t.dataset.id; message = ''; render(); return; }
    if (act === 'dismiss') { if (e.target === t) { openId = null; render(); } return; }
    if (act === 'back') { openId = null; render(); return; }
    if (act === 'close') { opts.onClose && opts.onClose(); return; }
    if (busy || !openId) return;
    if (act === 'equip') run(() => opts.onEquip(openId));
    if (act === 'coins') run(() => opts.onBuyCoins(openId));
    if (act === 'money') run(() => opts.onBuyMoney(openId));
  });
  document.addEventListener('keydown', onKey);
  function onKey(e) { if (e.key === 'Escape' && openId) { openId = null; render(); } }
  render();
  return { update(p) { profile = p; render(); }, destroy() { document.removeEventListener('keydown', onKey); el.remove(); } };
}
