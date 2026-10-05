// app.js - Honk Hustle: boot, screens and the play loop.
import { bootLoadingScreen } from './loadingScreen.js';
import { makeBootTasks } from './bootTasks.js';
import { pickTheme } from './loadingThemes.js';
import { sceneSvg, particlesHtml } from './busArt.js';
import { base44 } from './api/base44Client.js';
import { LOADING_ART } from './art.js';
import { loadProfile, saveProfile, resetProfile, restoreIfMissing } from './store.js';
import { getLevel, prefetch, TOTAL_LEVELS, levelInfo, AREA_SIZE, WORLDS, completionEvents, locate } from './campaign.js';
import { startRound, applyResult, SKIP_COST, SPECIAL_BONUS } from './rounds.js';
import { STREAK_CYCLE, dailyState, claimDaily } from './daily.js';
import { streakProgress } from './rounds.js';
import { POWERUPS, usePowerup, availability } from './powerups.js';
import { createGame, tapVehicle, drainEvents, failStuck } from './game.js';
import { OBSTACLES } from './levelGen.js';
import { decorHtml, iconSvg, topperSvg } from './decorArt.js';
import { createRenderer } from './render.js';
import { resolveLook, paintFor } from './look.js';
import { mountGarage } from './garageScreen.js';
import { getShopSets, getShopPacks, buyWithMoney, restorePurchases, equipSkin, timeLeft } from './shop.js';
import { packById } from './packs.js';
import { COIN_PACKS, POWERUP_BUNDLES, SINGLE_POWERUP_COIN_PRICE, coinPurchase } from './catalog.js';
import { vehicleSkinId, passengerSkinId, setById, setProductId } from './themes.js';
import { skinById, isOwned, passengerFor } from './skinData.js';
import { miniBus, riderPic, busPic } from './cartoon.js';
import { BACKDROPS } from './backdrops.js';
import { lookFor, BUS_STYLES } from './busStyles.js';
import { configureSfx, sfx, haptic, unlockAudio } from './sfx.js';
import { nextCombo, resetCombo, comboText, comboColor, floatText } from './juice.js';
import { initIap } from './iap.js';
import { CONFIG } from './config.js';
import { $, esc, fmt, toast, modal, closeModal } from './ui.js';

const S = { profile: loadProfile(), route: 'loading', level: null, game: null, round: null, renderer: null, attempts: 0, levelNo: 1, targeting: false, garage: null, shopTab: 'packs', areaView: 1, offline: false, seenHint: {} };
window.__hh = S;   // handy for debugging and the automated tests

const save = (patch) => { S.profile = saveProfile({ ...S.profile, ...patch }); configureSfx(S.profile.settings); return S.profile; };
const moneyOk = () => !!window.NativeIAP;                 // real-money buttons only exist when the StoreKit bridge is live
const nextLevelNo = () => Math.min(TOTAL_LEVELS, (S.profile.highestLevel || 0) + 1);

// ======================================================================= navigation
const SCREENS = ['home', 'levels', 'game', 'shop', 'garage', 'settings'];
function go(name) {
  if (S.route === 'game' && name !== 'game' && S.renderer) S.renderer.stop();
  if (S.route === 'garage' && S.garage) { S.garage.destroy(); S.garage = null; }
  S.route = name; S.targeting = false;
  for (const s of SCREENS) $('#' + s).hidden = s !== name;
  ({ home: renderHome, levels: renderLevels, shop: renderShop, settings: renderSettings, garage: renderGarage, game: () => {} })[name]();
  if (name === 'game' && S.renderer) S.renderer.start();
}
const backBar = (title, right = '') => `<div class="bar"><button class="round-btn" data-go="home" aria-label="Back">‹</button><h1 class="title">${title}</h1>${right}</div>`;
const coinsPill = () => `<span class="pill" aria-label="Coins">${iconSvg('coin', 22)} <span data-coins>${fmt(S.profile.coins)}</span></span>`;

// ======================================================================= home
function flamePill(streak) {
  const sp = streakProgress(streak), golden = sp.special && streak >= 10;
  return `<span class="pill flame${golden ? ' golden' : ''}" title="Win levels first try in a row for free power-ups">${iconSvg('flame', 20)} ${streak}${golden ? ' GOLDEN' : `<i class="fbar"><b style="width:${Math.round((sp.progress || 0) * 100)}%"></b></i><small>${sp.next ? 'next ' + sp.next : ''}</small>`}</span>`;
}
function showDaily(auto) {
  const d = dailyState(S.profile); if (auto && !d.claimable) return;
  const cells = (granted) => STREAK_CYCLE.map((r, i) => { const st = i < d.index || (granted && i === d.index) ? 'past' : i === d.index ? 'today' : 'next'; return `<div class="dday ${st}"><small>Day ${i + 1}</small><span>${r.coins ? iconSvg('coin', 18) + ' ' + r.coins : iconSvg({ heli: 'heli', bay: 'park', key: 'key' }[r.powerup], 20)}</span>${st === 'past' ? '<i>✓</i>' : ''}</div>`; }).join('');
  const show = (granted) => modal({ icon: 'gift', title: 'Daily Reward', body: `<div class="dgrid">${cells(granted)}</div><small class="muted">${d.streak > 1 ? d.streak + ' day streak' : 'Play daily to build a streak'} • Best ${d.best}</small>`, dismissible: true,
    actions: granted ? [{ label: 'Reward claimed!', cls: 'green' }] : d.claimable ? [{ label: 'Claim', cls: 'green', onClick: () => { const r = claimDaily(S.profile); save(r.profile); sfx.coin(); haptic('success'); $$coins(); if (S.route === 'home') renderHome(); show(true); return false; } }, { label: 'Later', cls: 'ghost' }] : [{ label: 'Come back tomorrow', cls: 'ghost' }] });
  show(false);
}
const FEST = { christmas: ['\u{1F384}', '\u{1F381}', '\u26C4', '\u2744\uFE0F'], halloween: ['\u{1F383}', '\u{1F987}', '\u{1F47B}', '\u{1F56F}\uFE0F'], valentine: ['\u{1F496}', '\u{1F339}', '\u{1F48C}', '\u{1F9F8}'], stpatrick: ['\u2618\uFE0F', '\u{1F308}', '\u{1F4B0}', '\u{1F37A}'], easter: ['\u{1F95A}', '\u{1F430}', '\u{1F337}', '\u{1F423}'], pride: ['\u{1F308}', '\u{1F984}', '\u{1F496}', '\u2728'],
    newyear: ['\u{1F386}', '\u{1F37E}', '\u{1F389}', '\u{1F973}'], july4: ['\u{1F386}', '\u{1F1FA}\u{1F1F8}', '\u{1F9E8}', '\u2B50'], thanksgiving: ['\u{1F983}', '\u{1F341}', '\u{1F967}', '\u{1F33D}'], lunarnewyear: ['\u{1F3EE}', '\u{1F9E7}', '\u{1F409}', '\u{1F386}'], diwali: ['\u{1FA94}', '\u2728', '\u{1F386}', '\u{1F36C}'] };
// A little hanging signpost that names the season or world, styled in that theme's own colours and icon (instead of plain text on a dark pill).
function signChip(t, reason) {
  if (reason === 'regular') return '';
  const icon = (FEST[t.id] && FEST[t.id][0]) || '⭐';
  return `<div class="home-chip" style="--b1:${t.title[0]};--b2:${t.title2[1]}"><span class="hc-ic">${decorHtml(icon)}</span><span class="hc-tx">${esc(t.name)}</span></div>`;
}
// The same scene as the home screen (backdrop of your world, your bus, your riders), reused by the loading screen so the two match.
function homeArt(p, picked) {
  const t = picked.theme, festive = picked.reason === 'holiday', info = levelInfo(nextLevelNo());
  const bdKey = festive ? '' : info.world.bd, bd = BACKDROPS[info.world.bd] || BACKDROPS.city, vid = p.equippedVehicleSkin || 'v_classic', pid = p.equippedPassengerSkin || 'p_classic';
  const sky = festive ? t.sky : bd.sky, ground = festive ? t.ground : bd.ground, dset = (festive && FEST[t.id]) || bd.decor;
  const spots = [[4, 12, 62], [78, 9, 70], [-2, 32, 56], [86, 34, 60], [2, 56, 66], [84, 58, 64], [10, 80, 70], [70, 82, 72]];
  const decor = spots.map(([x, y, sz], i) => `<span class="hd" style="left:${x}%;top:${y}%;width:${Math.round(sz * 1.15)}px;height:${Math.round(sz * 1.15)}px;animation-delay:${-i * 0.7}s">${decorHtml(dset[i % dset.length])}</span>`).join('');
  const crowd = [0, 1, 2, 3, 4, 5].map((i) => `<span class="hr" style="animation-delay:${-i * 0.18}s">${riderPic(pid, i, 84)}</span>`).join('');
  return `<div class="home-bg hb" style="background:linear-gradient(${sky[0]},${sky[1]} 38%,${ground} 38%)"><div class="hb-road"></div>${decor}</div><div class="hhero lhero"><div class="hbus">${busPic(vid)}</div><div class="hcrowd">${crowd}</div></div>`;
}
function renderHome() {
  const p = S.profile, picked = pickTheme(new Date(), { hemisphere: p.hemisphere, seasonal: p.settings.seasonal });
  const t = picked.theme, [w1, ...rest] = 'Honk Hustle'.split(' ');
  const next = nextLevelNo(), info = levelInfo(next), streak = p.winStreak || 0, festive = picked.reason === 'holiday';
  // The home screen is drawn in the same cartoon style as the game: your equipped bus and riders on the backdrop of the world you are in.
  const bdKey = festive ? '' : info.world.bd, bd = BACKDROPS[info.world.bd] || BACKDROPS.city, vid = p.equippedVehicleSkin || 'v_classic', pid = p.equippedPassengerSkin || 'p_classic';
  const sky = festive ? t.sky : bd.sky, ground = festive ? t.ground : bd.ground;
  const spots = [[4, 12, 62], [78, 9, 70], [-2, 32, 56], [86, 34, 60], [2, 56, 66], [84, 58, 64], [10, 80, 70], [70, 82, 72]];
  const dset = (festive && FEST[t.id]) || bd.decor;
  const decor = spots.map(([x, y, sz], i) => `<span class="hd" style="left:${x}%;top:${y}%;width:${Math.round(sz * 1.15)}px;height:${Math.round(sz * 1.15)}px;animation-delay:${-i * 0.7}s">${decorHtml(dset[i % dset.length])}</span>`).join('');
  const crowd = ['#ff3fa4', '#22c94a', '#ffd60a', '#2a7bff', '#ff3030', '#9345e8'].map((c, i) => `<span class="hr" style="animation-delay:${-i * 0.18}s">${riderPic(pid, i, 84)}</span>`).join('');
  $('#home').innerHTML = `
    <div class="home-bg hb" style="background:linear-gradient(${sky[0]},${sky[1]} 38%,${ground} 38%)"><div class="hb-road"></div>${decor}</div>
    <div class="home-fx">${festive || picked.reason === 'season' ? particlesHtml(t) : ''}</div>
    <div class="home-top">${coinsPill()}<div class="ht-right">${dailyState(p).claimable ? '<button class="pill daily-btn" data-act="daily">' + iconSvg('gift', 20) + ' Daily</button>' : ''}<button class="topbtn" data-go="settings" aria-label="Settings">${iconSvg('gear', 26)}</button></div></div>
    <div class="home-logo" style="--c1:${t.title[0]};--c2:${t.title2[0]}">
      <span class="w w1" data-t="${w1}">${w1}</span><span class="w w2" data-t="${rest.join(' ')}!">${rest.join(' ')}!</span>
      ${signChip(t, picked.reason)}
    </div>
    <div class="hhero"><div class="hbus">${busPic(vid)}</div><div class="hcrowd">${crowd}</div></div>
    <div class="home-bottom">
      <div class="home-play" style="--tc:${(festive ? t.title : bd.band)[0]}"><button class="btn green big" data-act="play" style="width:100%">Play</button><small>Level ${next}${info.tier === 'hard' ? ' • Hard' : info.tier === 'extraHard' ? ' • Extra Hard' : ''} • ${esc(info.world.name)}</small></div>
      <div class="home-row home-row3">
        <button data-go="levels"><span>${iconSvg('map', 30)}</span>Levels</button>
        <button data-go="garage"><span>${iconSvg('bus', 30)}</span>Garage</button>
        <button data-go="shop"><span>${iconSvg('cart', 30)}</span>Shop</button>
      </div>
    </div>`;
  const bg = $('#home .home-bg'); bg.style.pointerEvents = 'none';
}

// ======================================================================= level picker
function renderLevels() {
  const hi = S.profile.highestLevel || 0, cur = nextLevelNo(), area = S.areaView;
  const first = (area - 1) * AREA_SIZE + 1, last = Math.min(TOTAL_LEVELS, area * AREA_SIZE), loc = locate(first), totalAreas = Math.ceil(TOTAL_LEVELS / AREA_SIZE);
  const cells = [];
  for (let n = first; n <= last; n++) {
    const tier = levelInfo(n).tier, done = n <= hi, locked = n > hi + 1 && !S.profile.settings.openLevels, isCur = n === cur;
    cells.push(`<button class="lv ${done ? 'done' : ''} ${isCur ? 'current' : ''} ${locked ? 'locked' : ''}" data-lv="${n}" aria-label="Level ${n}${locked ? ', locked' : done ? ', completed' : ''}">${n}${tier !== 'easy' ? `<span class="t ${tier}">${tier === 'hard' ? 'HARD' : 'XHARD'}</span>` : ''}${done ? `<span class="ck">${'\u2B50'.repeat((S.profile.stars || {})[n] || 1)}</span>` : ''}</button>`);
  }
  $('#levels').innerHTML = `${backBar('Levels', coinsPill())}
    <div class="areanav"><button class="round-btn" data-area="-1" ${area <= 1 ? 'disabled' : ''} aria-label="Previous area">‹</button>
      <div class="mid"><b>${esc(loc.world.name)}</b><small>Area ${area} of ${totalAreas} • levels ${first}–${last}</small></div>
      <button class="round-btn" data-area="1" ${area >= totalAreas ? 'disabled' : ''} aria-label="Next area">›</button></div>
    <div class="scroll sky"><div class="lvgrid">${cells.join('')}</div></div>`;
  $('#levels').classList.add('sky');
  const cu = $('#levels .lv.current'); if (cu) cu.scrollIntoView({ block: 'center' });
}

// ======================================================================= game
function buildGameDom() {
  $('#game').innerHTML = `
    <div class="hud"><button class="round-btn" data-act="pause" aria-label="Pause">❚❚</button>
      <div class="lvl"><b data-lvname>Level 1</b><small data-lvtier></small></div>
      <span class="pill moves" data-moves aria-live="polite">Moves 0</span>${coinsPill()}</div>
    <div class="stage"><canvas id="board" aria-label="Game board"></canvas><div class="banner" data-banner hidden></div></div>
    <div class="powerbar">${['heli', 'bay', 'key'].map((k) => `<button class="pw" data-pw="${k}" aria-label="${POWERUPS[k].name}"><span class="i">${iconSvg({ heli: 'heli', bay: 'park', key: 'key' }[k], 26)}</span>${POWERUPS[k].name}<span class="n" data-n></span></button>`).join('')}</div>`;
  S.renderer = createRenderer($('#board'), {
    onTapVehicle: onTapVehicle, onMoves: setMoves, onStatus: onStatus,
  });
}

function startLevel(n, { retry = false } = {}) {
  n = Math.max(1, Math.min(TOTAL_LEVELS, n));
  if (!retry) S.attempts = 0;
  S.levelNo = n;
  if (S.route !== 'game' || !S.renderer) { if (!S.renderer) buildGameDom(); }
  const level = getLevel(n);                                       // generated on demand
  S.level = level; S.round = startRound(level, S.profile); S.game = createGame(level, S.round);
  S.targeting = false;
  go('game');
  const th = pickTheme(new Date(), { hemisphere: S.profile.hemisphere, seasonal: S.profile.settings.seasonal }).theme;
  S.renderer.setLevel(S.game, resolveLook(S.profile), { ...level.info.world, decorTheme: th && th.id !== 'regular' ? th.id : null });
  S.renderer.setTargeting(false);
  $('#game').style.background = level.info.world.sky[0];
  $('[data-lvname]').textContent = 'Level ' + n;
  $('[data-lvtier]').textContent = (level.tier === 'hard' ? 'HARD' : level.tier === 'extraHard' ? 'EXTRA HARD' : level.info.world.name.toUpperCase()) + (S.round.special ? ' • GOLDEN STREAK' : '');
  setMoves(S.game.round.moveLimit - S.game.round.movesUsed);
  refreshPowerbar();
  showHint(n, level); resetCombo();
  if (level.info.firstOfWorld && !retry) showWorldBanner(level.info);
  prefetch(n, 3);
}

function showWorldBanner(info) {
  const st = $('#game .stage'), w = info.world, el = document.createElement('button');
  el.className = 'worldbanner'; el.style.background = `linear-gradient(${w.sky[0]},${w.sky[1]})`;
  el.innerHTML = `<small>World ${info.worldIndex + 1} of ${WORLDS.length}</small><h2>${esc(w.name)}</h2><i style="background:${w.ground}"></i><small>Tap to start</small>`;
  el.onclick = () => el.remove(); st.appendChild(el); setTimeout(() => el.remove(), 2600);
}
const OB_ICON = { cone: 'cone', lock: 'lock', barrier: 'cone', ice: 'snow', mystery: 'mystery', slot: 'cone', deepice: 'snow', gate: 'cone' };
function showHint(n, level) {
  const b = $('[data-banner]'), msgs = { 1: 'Tap a vehicle to send it to the bay. Passengers board a bus of their colour.', 2: 'Blocked? Move the vehicle in front first. Every tap costs a move.', 3: 'Locked vehicles open after enough others have left.' };
  const seen = S.profile.seenObstacles || [], fresh = level && OBSTACLES.find((o) => o.id !== 'cone' && (level.obstacles || []).includes(o.id) && !seen.includes(o.id));
  if (msgs[n] && !S.seenHint[n]) { b.textContent = msgs[n]; b.hidden = false; S.seenHint[n] = true; setTimeout(() => { b.hidden = true; }, 6000); }
  else if (fresh) { b.innerHTML = iconSvg(OB_ICON[fresh.id] || 'cone', 18) + ' New: ' + esc(fresh.name) + ' - ' + esc(fresh.desc); b.hidden = false; save({ seenObstacles: [...seen, fresh.id] }); setTimeout(() => { b.hidden = true; }, 7000); }
  else b.hidden = true;
}
function setMoves(left) { const m = $('[data-moves]'); if (!m) return; m.textContent = 'Moves ' + Math.max(0, left); m.classList.toggle('low', left <= 3); }

function refreshPowerbar() {
  for (const k of ['heli', 'bay', 'key']) {
    const a = availability(k, S.game.round, S.profile.powerups || {}), btn = $(`[data-pw="${k}"]`), n = $('[data-n]', btn);
    n.textContent = a.free > 0 ? 'FREE' : a.owned; n.classList.toggle('free', a.free > 0); btn.classList.toggle('none', !a.canUse); btn.classList.toggle('active', S.targeting && k === 'heli');
  }
  $$coins();
}
const $$coins = () => document.querySelectorAll('[data-coins]').forEach((e) => { e.textContent = fmt(S.profile.coins); });

function playEvents() { S.renderer.play(drainEvents(S.game)); }

function onTapVehicle(id) {
  unlockAudio();
  const g = S.game; if (!g || g.status !== 'playing' || S.route !== 'game') return;
  $('[data-banner]').hidden = true;
  if (S.targeting) { applyPowerup('heli', id); return; }
  const r = tapVehicle(g, id); if (r.result === 'ignored') return;
  if (r.result === 'go') { const c = nextCombo(); if (c > 1) { const st = $('#game .stage'); floatText(st, comboText(c), st.clientWidth / 2, st.clientHeight * 0.35, comboColor(c)); haptic('light'); } } else resetCombo();
  playEvents(); setMoves(g.round.moveLimit - g.round.movesUsed);
}

// ---- power-ups ----
function pressPower(type) {
  unlockAudio();
  const g = S.game; if (!g || g.status !== 'playing') return;
  const a = availability(type, g.round, S.profile.powerups || {});
  if (!a.canUse) return offerBuy(type);
  if (type === 'heli') { S.targeting = !S.targeting; S.renderer.setTargeting(S.targeting); const b = $('[data-banner]'); b.textContent = 'Tap any vehicle to lift it into the bay.'; b.hidden = !S.targeting; refreshPowerbar(); return; }
  applyPowerup(type);
}
function applyPowerup(type, targetId) {
  const g = S.game, res = usePowerup(type, g, g.round, S.profile.powerups || {}, targetId);
  S.targeting = false; S.renderer.setTargeting(false); $('[data-banner]').hidden = true;
  if (!res.ok) { toast(res.reason === 'no-effect' ? (type === 'key' ? 'Nothing is locked or frozen right now.' : 'That one cannot be lifted.') : 'None left.'); refreshPowerbar(); return false; }
  g.round = res.round; S.round = res.round; save({ powerups: res.inventory });
  sfx.power(); haptic('medium'); playEvents(); refreshPowerbar(); setMoves(g.round.moveLimit - g.round.movesUsed);
  if (g.status === 'playing' && S.modalStuck) { S.modalStuck = false; closeModal(); }
  return true;
}
function offerBuy(type) {
  const price = SINGLE_POWERUP_COIN_PRICE[type], p = POWERUPS[type], can = S.profile.coins >= price;
  modal({ icon: { heli: 'heli', bay: 'park', key: 'key' }[type], title: p.name, body: esc(p.desc) + '<br>You have none left.', dismissible: true, actions: [
    { label: `Buy 1 for ${fmt(price)} coins`, cls: 'gold', disabled: !can, onClick: () => { const r = coinPurchase(S.profile, 'powerup', type); if (r.ok) { save(r.profile); refreshPowerbar(); sfx.coin(); toast('Bought ' + p.name); } return true; } },
    { label: can ? 'Not now' : 'Not enough coins yet. Win levels to earn more.', cls: 'ghost' },
  ] });
}

// ---- end of round ----
function onStatus(kind, reason) {
  if (S.route !== 'game') return;
  if (kind === 'won') return handleWin();
  if (kind === 'stuck') return handleStuck();
  return handleLose(reason);
}

function handleWin() {
  const g = S.game, level = S.level, n = S.levelNo, firstTry = S.attempts === 0;
  const mult = S.round.special ? S.round.special.coinMultiplier : 1, reward = level.coinReward * mult;
  const left = Math.max(0, S.round.moveLimit - S.round.movesUsed), slack = Math.max(1, S.round.moveLimit - level.vehicles.length), ratio = left / slack, stars = ratio >= 0.5 ? 3 : ratio >= 0.2 ? 2 : 1;
  let p = applyResult(S.profile, firstTry ? 'win-first-try' : 'win-retry');
  const ev = completionEvents(n), starRow = { html: Array.from({ length: 3 }, (_, i) => iconSvg(i < stars ? 'starOn' : 'starOff', 20)).join('') }, lines = [['Stars', starRow], ['Coins', '+' + fmt(reward)]];
  let coins = (p.coins || 0) + reward + ev.bonusCoins, owned = [...(p.ownedSkins || [])];
  if (ev.bonusCoins) lines.push([ev.worldUnlocked !== null ? 'World complete!' : 'Area complete!', '+' + fmt(ev.bonusCoins)]);
  for (const s of ev.rewardSkins) { if (!owned.includes(s)) { owned.push(s); const sk = skinById(s); if (sk) lines.push(['New skin', sk.name]); } }
  if (S.round.special) lines.push(['Golden Streak', 'x' + SPECIAL_BONUS.coinMultiplier + ' coins']);
  p = { ...p, coins, ownedSkins: owned, highestLevel: Math.max(p.highestLevel || 0, n), stars: { ...(p.stars || {}), [n]: Math.max((p.stars || {})[n] || 0, stars) } };
  save(p);
  lines.push(['Win streak', { html: iconSvg('flame', 18) + ' ' + p.winStreak + (firstTry ? '' : ' (retries reset it)') }]);
  sfx.win(); haptic('success'); $$coins();
  const last = n >= TOTAL_LEVELS;
  modal({ icon: 'trophy', title: 'Level ' + n + ' cleared!', lines, actions: [
    last ? { label: 'You finished the game!', cls: 'green', onClick: () => go('home') } : { label: 'Next level', cls: 'green', onClick: () => { startLevel(n + 1); } },
    { label: 'Home', cls: 'ghost', onClick: () => go('home') },
  ] });
}

function handleStuck() {
  S.modalStuck = true;
  const a = availability('bay', S.game.round, S.profile.powerups || {});
  sfx.lose(); haptic('error');
  modal({ icon: 'full', title: 'The bay is full!', body: 'No passenger can board right now.' + (a.canUse ? ' Use Bay+ to add a parking slot and keep going.' : ''), actions: [
    ...(a.canUse ? [{ label: 'Use Bay+' + (a.free > 0 ? ' (free)' : ''), cls: 'green', onClick: () => { applyPowerup('bay'); S.modalStuck = false; return true; } }] : []),
    { label: 'Give up', cls: 'ghost', onClick: () => { S.modalStuck = false; failStuck(S.game); playEvents(); return true; } },
  ] });
}

function handleLose(reason) {
  const n = S.levelNo; let p = applyResult(S.profile, 'lose'); p = save(p);
  sfx.lose(); haptic('error');
  const can = p.coins >= SKIP_COST;
  modal({ icon: reason === 'out-of-moves' ? 'clock' : 'full', title: reason === 'out-of-moves' ? 'Out of moves' : 'Bay full', body: 'Your win streak was reset. Try a different order!', actions: [
    { label: 'Try again', cls: 'green', onClick: () => { S.attempts++; startLevel(n, { retry: true }); } },
    { label: `Win level for ${fmt(SKIP_COST)} coins`, cls: 'gold', disabled: !can, onClick: () => skipLevel(n) },
    { label: 'Home', cls: 'ghost', onClick: () => go('home') },
  ] });
}
function skipLevel(n) {
  if (S.profile.coins < SKIP_COST) return false;
  save(applyResult({ ...S.profile, coins: S.profile.coins - SKIP_COST, highestLevel: Math.max(S.profile.highestLevel || 0, n) }, 'skip'));
  sfx.coin(); toast('Level skipped'); startLevel(Math.min(TOTAL_LEVELS, n + 1)); return true;
}

function openPause() {
  if (!S.game || S.game.status !== 'playing') return;
  modal({ title: 'Paused', dismissible: true, actions: [
    { label: 'Resume', cls: 'green' },
    { label: 'Restart (ends your streak)', cls: 'ghost', onClick: () => { save(applyResult(S.profile, 'lose')); S.attempts++; startLevel(S.levelNo, { retry: true }); } },
    { label: 'Levels', cls: 'ghost', onClick: () => go('levels') },
    { label: 'Home', cls: 'ghost', onClick: () => go('home') },
  ] });
}

// ======================================================================= garage
function renderGarage() {
  const root = $('#garage'); root.innerHTML = '';
  S.garage = mountGarage(root, {
    profile: S.profile, onClose: () => go('home'), onShop: () => { S.shopTab = 'packs'; go('shop'); },
    onEquip: (skinId) => {
      let next = { ...S.profile };
      if (skinId.startsWith('p_')) next.equippedPassengerSkin = skinId;
      else { next.equippedVehicleSkin = skinId; const r = passengerFor(skinId); if (r && isOwned(next, r)) next.equippedPassengerSkin = r; }
      sfx.tap(); return { ok: true, profile: save(next) };
    },
  });
}

// ======================================================================= shop
function renderShop() {
  const tabs = [['packs', 'Packs'], ['sets', 'Bus sets'], ['power', 'Power-ups'], ['coins', 'Coins']];
  $('#shop').classList.add('sky');
  $('#shop').innerHTML = `${backBar('Shop', coinsPill())}
    <div class="tabs">${tabs.map(([id, l]) => `<button data-tab="${id}" class="${S.shopTab === id ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="scroll" id="shopBody"></div>`;
  const body = $('#shopBody');
  if (S.shopTab === 'packs') body.innerHTML = packsHtml(); else if (S.shopTab === 'sets') body.innerHTML = setsHtml(); else if (S.shopTab === 'power') body.innerHTML = powerHtml(); else body.innerHTML = coinsHtml();
}
function setCard(c) {
  const set = c.set, vs = skinById(vehicleSkinId(set.id)), st = BUS_STYLES.find((s) => s.id === set.id);
  const pic = st ? `<img src="img/buses/${st.id}.png" alt="${esc(set.name)} bus" loading="lazy">` : `<div class="big">${topperSvg(vs.style.topper) || iconSvg('bus', 64)}</div>`;
  const equipped = S.profile.equippedVehicleSkin === vs.id;
  const acts = c.ownsAll ? `<button class="btn ${equipped ? 'ghost' : 'green'}" data-equipset="${set.id}" ${equipped ? 'disabled' : ''}>${equipped ? 'Equipped' : 'Equip set'}</button>`
    : `<button class="btn gold" data-buyset="${set.id}">${iconSvg('coin', 18)} ${fmt(c.coinPrice)}</button>${moneyOk() ? `<button class="btn" data-moneyset="${set.id}">${c.usd}</button>` : ''}`;
  return `<div class="set"><div class="pic">${pic}<span class="tagl">${c.tag}${c.endsAt ? ' • ' + timeLeft(c.endsAt) : ''}</span></div>
    <div class="body"><h3>${esc(set.name)}</h3><div class="muted">Bus: ${esc(set.vehicle.name)} • Outfit: ${esc(set.passenger.name)}</div><div class="acts">${acts}</div></div></div>`;
}
// a little bus picture drawn from a skin's paint (used by the Season Packs)
function packsHtml() {
  const packs = getShopPacks(S.profile, new Date()), eq = S.profile.equippedVehicleSkin;
  const cell = (skinId, label, paint, topper, owned, setEquip, riderId, ri) => {
    const on = eq === skinId, btn = !owned ? `<span class="lockt">${iconSvg('lock', 14)} In pack</span>` : `<button class="btn ${on ? 'ghost' : 'green'}" ${setEquip ? `data-equipset="${setEquip}"` : `data-equipskin="${skinId}"`} ${on ? 'disabled' : ''}>${on ? 'Equipped' : 'Equip'}</button>`;
    return `<div class="pk"><div class="pkpic">${miniBus(paint, '#ffc41f', topper)}<span class="pkr">${riderPic(riderId, ri, 56)}</span></div><b>${esc(label)}</b>${btn}</div>`;
  };
  return packs.map((c) => {
    const p = c.pack, set = setById(p.setId), vid = vehicleSkinId(p.setId), own = c.owned;
    const cells = [cell(vid, set.vehicle.name, paintFor(vid), set.vehicle.style.topper, own.has(vid), p.setId, passengerSkinId(p.setId), 0), ...p.variants.map((v, i) => cell(v.id, v.name, v.paint, v.topper, own.has(v.id), null, v.riderId, i + 1))].join('');
    const acts = c.ownsAll ? '<div class="muted" style="text-align:center">You own this pack</div>' : `<div class="acts"><button class="btn gold" data-buypack="${p.id}">${iconSvg('coin', 18)} ${fmt(p.coinPrice)}</button>${moneyOk() ? `<button class="btn" data-moneypack="${p.id}">${p.usd}</button>` : ''}</div>`;
    return `<div class="pack" style="--s1:${p.sky[0]};--s2:${p.sky[1]}"><div class="packhd"><span class="gl">${decorHtml(p.glyph)}</span><div><h3>${esc(p.name)}</h3><small>${c.inSeason ? 'In season now' : 'Any time'} • Bus set + outfit + 3 extra buses</small></div></div><div class="pkgrid">${cells}</div>${acts}</div>`;
  }).join('') + '<p class="muted" style="text-align:center;margin:16px auto;max-width:420px">Packs are yours forever. Each one unlocks the season set plus three more buses with their own colours.</p>';
}
function setsHtml() {
  const sh = getShopSets(S.profile, new Date());
  return `<div class="section">In the shop this week</div><div class="shopgrid">${sh.weekly.map(setCard).join('')}</div>
    ${sh.limited.length ? `<div class="section">Limited time</div><div class="shopgrid">${sh.limited.map(setCard).join('')}</div>` : ''}
    <p class="muted" style="text-align:center;margin:16px auto;max-width:420px">Anything you buy is yours forever, even after it leaves the shop. New sets arrive every Monday.</p>`;
}
function powerHtml() {
  const own = S.profile.powerups || {};
  const singles = ['heli', 'bay', 'key'].map((k) => `<div class="item"><div class="ic">${iconSvg({ heli: 'heli', bay: 'park', key: 'key' }[k], 42)}</div><div class="tx"><b>${POWERUPS[k].name} <small>(you have ${own[k] || 0})</small></b><small>${esc(POWERUPS[k].desc)}</small></div><button class="btn gold" data-buypu="${k}">${iconSvg('coin', 18)} ${fmt(SINGLE_POWERUP_COIN_PRICE[k])}</button></div>`).join('');
  const bundles = POWERUP_BUNDLES.map((b) => `<div class="item"><div class="ic">${iconSvg(b.art || 'kit1', 46)}</div><div class="tx"><b>${esc(b.name)}</b><small>${b.items.heli} of each power-up</small></div><button class="btn gold" data-buybundle="${b.id}">${iconSvg('coin', 18)} ${fmt(b.coinPrice)}</button>${moneyOk() ? `<button class="btn" data-moneybundle="${b.id}">${b.price}</button>` : ''}</div>`).join('');
  return `<div class="section">Single</div>${singles}<div class="section">Bundles</div>${bundles}<p class="muted" style="text-align:center;margin:12px auto;max-width:420px">Win streaks give free power-up uses each round: 1 free after a first-try win, 2 after three in a row.</p>`;
}
function coinsHtml() {
  if (!moneyOk()) return `<div class="card" style="max-width:420px;margin:20px auto;text-align:center">${iconSvg('coin', 42)}<b>Earn coins by winning levels</b><p class="muted">Every level pays coins, and bonus coins for finishing an area or a world. Coin packs are not available in this build.</p></div>`;
  return COIN_PACKS.map((c) => `<div class="item"><div class="ic">${iconSvg(c.art || 'coins1', 46)}</div><div class="tx"><b>${fmt(c.coins)} coins ${c.badge ? `<small>(${c.badge})</small>` : ''}</b></div><button class="btn" data-moneycoins="${c.id}">${c.price}</button></div>`).join('')
    + `<div style="text-align:center;margin:14px"><button class="btn ghost" data-act="restore">Restore purchases</button></div>`;
}
async function shopMoney(productId, label) {
  try { toast(window.NativeIAP && window.NativeIAP.sandbox ? 'Test purchase…' : 'Contacting the App Store…'); await buyWithMoney(productId); S.profile = loadProfile(); sfx.coin(); toast(label + ' unlocked!'); renderShop(); }
  catch (e) { toast((e && e.message) || 'Purchase did not complete.'); }
}

// ======================================================================= settings
function renderSettings() {
  const s = S.profile.settings, sw = (k, on) => `<button class="sw ${on ? 'on' : ''}" role="switch" aria-checked="${on}" data-set="${k}" aria-label="${k}"></button>`;
  $('#settings').classList.add('sky');
  $('#settings').innerHTML = `${backBar('Settings')}
    <div class="scroll">
      <div class="setrow"><div class="tx">Sound<small>Effects while you play</small></div>${sw('sound', s.sound)}</div>
      <div class="setrow"><div class="tx">Haptics<small>Little taps on your iPhone</small></div>${sw('haptics', s.haptics)}</div>
      <div class="setrow"><div class="tx">Seasonal looks<small>Holiday and seasonal buses on the home screen</small></div>${sw('seasonal', s.seasonal)}</div>
      <div class="setrow"><div class="tx">Open all levels<small>Play any level from the picker (for testing)</small></div>${sw('openLevels', s.openLevels)}</div>
      <div class="setrow"><div class="tx">Test coins<small>Add 10,000 coins to try the Shop (for testing)</small></div><button class="btn" data-act="testcoins" style="padding:10px 14px">+10,000</button></div>
      <div class="setrow"><div class="tx">Hemisphere<small>Decides which season is on</small></div><select class="sel" data-hemi aria-label="Hemisphere"><option value="north" ${S.profile.hemisphere === 'south' ? '' : 'selected'}>Northern</option><option value="south" ${S.profile.hemisphere === 'south' ? 'selected' : ''}>Southern</option></select></div>
      ${moneyOk() ? `<div class="setrow"><div class="tx">Restore purchases<small>Get back skins and sets you bought before</small></div><button class="btn" data-act="restore" style="padding:10px 14px">Restore</button></div>` : ''}
      <div class="setrow"><div class="tx">Privacy & terms<small>How your data is handled</small></div><a class="btn ghost" style="padding:10px 14px;text-decoration:none" href="${esc(CONFIG.PRIVACY_URL)}" target="_blank" rel="noopener">Privacy</a><a class="btn ghost" style="padding:10px 14px;text-decoration:none" href="${esc(CONFIG.TERMS_URL)}" target="_blank" rel="noopener">Terms</a></div>
      <div class="setrow"><div class="tx">Reset progress<small>Erase levels, coins and skins on this device</small></div><button class="btn red" data-act="reset" style="padding:10px 14px">Reset</button></div>
      <p class="muted" style="text-align:center">Honk Hustle ${CONFIG.VERSION} • Levels ${fmt(TOTAL_LEVELS)} • Best streak ${S.profile.bestStreak || 0}</p>
    </div>`;
}

// ======================================================================= clicks (one handler for the whole app)
document.addEventListener('click', async (e) => {
  const t = e.target.closest('button,[data-go],[data-lv]'); if (!t || t.closest('#garage') || t.closest('.overlay') || t.closest('#loading')) return;
  unlockAudio();
  const d = t.dataset;
  if (d.go) { sfx.tap(); return go(d.go); }
  if (d.act === 'daily') return showDaily(false);
  if (d.act === 'play') { sfx.tap(); return startLevel(nextLevelNo()); }
  if (d.act === 'pause') return openPause();
  if (d.lv) { sfx.tap(); return startLevel(+d.lv); }
  if (d.area) { S.areaView = Math.max(1, Math.min(Math.ceil(TOTAL_LEVELS / AREA_SIZE), S.areaView + +d.area)); return renderLevels(); }
  if (d.pw) return pressPower(d.pw);
  if (d.tab) { S.shopTab = d.tab; return renderShop(); }
  if (d.set) { save({ settings: { ...S.profile.settings, [d.set]: !S.profile.settings[d.set] } }); return renderSettings(); }
  if (d.act === 'restore') { try { const r = await restorePurchases(); S.profile = loadProfile(); toast('Purchases restored'); } catch (err) { toast('Nothing to restore'); } return; }
  if (d.act === 'testcoins') { save({ coins: (S.profile.coins || 0) + 10000 }); sfx.coin(); toast('+10,000 coins'); return renderSettings(); }
  if (d.act === 'reset') return modal({ icon: 'warning', title: 'Reset everything?', body: 'This erases your levels, coins, power-ups and skins on this device.', actions: [{ label: 'Erase progress', cls: 'red', onClick: () => { S.profile = resetProfile(); S.areaView = 1; configureSfx(S.profile.settings); go('home'); } }, { label: 'Cancel', cls: 'ghost' }] });
  if (d.buyset) { const r = coinPurchase(S.profile, 'set', setById(d.buyset), { hemisphere: S.profile.hemisphere }); if (r.ok) { save(r.profile); sfx.coin(); toast('Set unlocked!'); } else toast({ 'not-enough-coins': 'Not enough coins yet.', 'not-in-shop': 'Not in the shop right now.', 'already-owned': 'You already own it.' }[r.reason] || 'Could not buy.'); return renderShop(); }
  if (d.buypack) { const r = coinPurchase(S.profile, 'pack', packById(d.buypack)); if (r.ok) { save(r.profile); sfx.coin(); toast('Pack unlocked!'); } else toast({ 'not-enough-coins': 'Not enough coins yet.', 'already-owned': 'You already own it.' }[r.reason] || 'Could not buy.'); return renderShop(); }
  if (d.moneypack) return shopMoney(packById(d.moneypack).productId, 'Pack');
  if (d.equipskin) { const rd = passengerFor(d.equipskin), patch = { equippedVehicleSkin: d.equipskin }; if (rd && isOwned(S.profile, rd)) patch.equippedPassengerSkin = rd; save(patch); toast('Equipped'); return renderShop(); }
  if (d.equipset) { save({ equippedVehicleSkin: vehicleSkinId(d.equipset), equippedPassengerSkin: passengerSkinId(d.equipset) }); toast('Equipped'); return renderShop(); }
  if (d.buypu) { const r = coinPurchase(S.profile, 'powerup', d.buypu); if (r.ok) { save(r.profile); sfx.coin(); toast('Bought!'); } else toast('Not enough coins yet.'); return renderShop(); }
  if (d.buybundle) { const b = POWERUP_BUNDLES.find((x) => x.id === d.buybundle), r = coinPurchase(S.profile, 'bundle', b); if (r.ok) { save(r.profile); sfx.coin(); toast('Bought ' + b.name); } else toast('Not enough coins yet.'); return renderShop(); }
  if (d.moneyset) return shopMoney(setProductId(d.moneyset), 'Set');
  if (d.moneybundle) return shopMoney(POWERUP_BUNDLES.find((x) => x.id === d.moneybundle).productId, 'Bundle');
  if (d.moneycoins) return shopMoney(COIN_PACKS.find((x) => x.id === d.moneycoins).productId, 'Coins');
});
document.addEventListener('change', (e) => { if (e.target.matches('[data-hemi]')) { save({ hemisphere: e.target.value }); } });
document.addEventListener('pointerdown', unlockAudio, { once: true });
document.addEventListener('gesturestart', (e) => e.preventDefault());

// ======================================================================= boot
async function boot() {
  await restoreIfMissing(); S.profile = loadProfile();
  configureSfx(S.profile.settings);
  buildGameDom();
  const cap = window.Capacitor && window.Capacitor.Plugins;
  try { if (cap && cap.SplashScreen) cap.SplashScreen.hide(); } catch (e) {}
  initIap();                                                    // no-op in the browser or without a RevenueCat key
  const q = new URLSearchParams(location.search), result = {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.get('date') || '')) globalThis.__HH_DATE = q.get('date');   // preview any day's loading screen
  const boot = bootLoadingScreen($('#loading'), {
    tasks: makeBootTasks({ base44, pingUrl: null, result }),
    canPlayOffline: true, embedded: true, hemisphere: S.profile.hemisphere, seasonal: S.profile.settings.seasonal,
    artUrl: LOADING_ART, sceneHtml: () => homeArt(S.profile, pickTheme(new Date(), { hemisphere: S.profile.hemisphere, seasonal: S.profile.settings.seasonal })), forceTheme: q.get('theme') || null, minShowMs: q.get('fast') ? 0 : 1600,
    onDone: () => { boot.destroy(); $('#loading').innerHTML = ''; S.profile = loadProfile(); const go2 = q.get('go'); if (go2 === 'game') startLevel(+q.get('level') || nextLevelNo()); else { go(go2 || 'home'); if (!go2 && !q.get('fast')) setTimeout(() => showDaily(true), 500); } },
  });
}
boot();
