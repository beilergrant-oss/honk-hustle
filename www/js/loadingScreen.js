// loadingScreen.js - the Bus Blitz Party loading screen. Plain DOM (works inside React via a ref, or on its own).
//
//   const screen = bootLoadingScreen(rootElement, { tasks, pingUrl, onDone });
//
// It picks today's theme (holiday > season > regular), draws the scene, runs the loader and shows REAL progress and
// REAL connection state (Wi-Fi / mobile data / offline / slow). When everything is loaded the bus honks and drives off,
// then onDone(result) is called so you can show the main menu.
import { createLoader } from './loader.js';
import { pickTheme, APP_NAME, APP_TAGLINE } from './loadingThemes.js';
import { sceneSvg, particlesHtml } from './busArt.js';

export const DEFAULT_TIPS = [   // keep each under ~50 characters so it fits on two lines on small phones
  'Every tap on a vehicle costs a move.',
  'Win first try to build a streak and earn freebies.',
  'Heli-Lift ignores blockers. Save it!',
  'Master Key unlocks every locked block.',
  'Match passenger colors to bus colors.',
  'A full bay means trouble. Free a slot first!',
];

const FONT = "'Lilita One','Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif";
const CSS = `
.hh-root{--font:${FONT};position:fixed;inset:0;display:flex;justify-content:center;background:#0e1730;font-family:var(--font);color:#fff;overflow:hidden;-webkit-tap-highlight-color:transparent;user-select:none}
.hh-root.hh-embedded{position:absolute}
.hh-screen{position:relative;width:100%;max-width:520px;height:100%;overflow:hidden;isolation:isolate}
@supports (width:1cqw){.hh-screen{container-type:size;max-width:min(520px,calc(100dvh * .5625))}}
.hh-scene{position:absolute;inset:0;width:100%;height:100%;display:block}
.hh-fx{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:3}
/* --- logo --- */
.hh-logo{position:absolute;z-index:5;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 3.2%);display:flex;flex-direction:column;align-items:center;pointer-events:none;transform:rotate(-3deg)}
.hh-badge{width:clamp(44px,12vw,62px);margin-bottom:-6px;filter:drop-shadow(0 3px 0 #0d1c5a)}
.hh-word{position:relative;display:block;line-height:.92;color:transparent;letter-spacing:.005em;white-space:nowrap;text-transform:uppercase;isolation:isolate;font-weight:900;text-shadow:0.055em 0.000em 0 #fff,0.053em 0.014em 0 #fff,0.048em 0.027em 0 #fff,0.039em 0.039em 0 #fff,0.028em 0.048em 0 #fff,0.014em 0.053em 0 #fff,0.000em 0.055em 0 #fff,-0.014em 0.053em 0 #fff,-0.027em 0.048em 0 #fff,-0.039em 0.039em 0 #fff,-0.048em 0.027em 0 #fff,-0.053em 0.014em 0 #fff,-0.055em 0.000em 0 #fff,-0.053em -0.014em 0 #fff,-0.048em -0.027em 0 #fff,-0.039em -0.039em 0 #fff,-0.028em -0.048em 0 #fff,-0.014em -0.053em 0 #fff,-0.000em -0.055em 0 #fff,0.014em -0.053em 0 #fff,0.028em -0.048em 0 #fff,0.039em -0.039em 0 #fff,0.048em -0.028em 0 #fff,0.053em -0.014em 0 #fff;animation:hh-bob 1.8s ease-in-out infinite;transform-origin:50% 80%}
.hh-w2{animation-delay:-.45s}
.hh-word::before,.hh-word::after{content:attr(data-t);position:absolute;left:0;top:0;white-space:nowrap;font-weight:900}
.hh-word::before{z-index:-1;color:#10246b;text-shadow:0.130em 0.000em 0 #10246b,0.126em 0.034em 0 #10246b,0.113em 0.065em 0 #10246b,0.092em 0.092em 0 #10246b,0.065em 0.113em 0 #10246b,0.034em 0.126em 0 #10246b,0.000em 0.130em 0 #10246b,-0.034em 0.126em 0 #10246b,-0.065em 0.113em 0 #10246b,-0.092em 0.092em 0 #10246b,-0.113em 0.065em 0 #10246b,-0.126em 0.034em 0 #10246b,-0.130em 0.000em 0 #10246b,-0.126em -0.034em 0 #10246b,-0.113em -0.065em 0 #10246b,-0.092em -0.092em 0 #10246b,-0.065em -0.113em 0 #10246b,-0.034em -0.126em 0 #10246b,-0.000em -0.130em 0 #10246b,0.034em -0.126em 0 #10246b,0.065em -0.113em 0 #10246b,0.092em -0.092em 0 #10246b,0.113em -0.065em 0 #10246b,0.126em -0.034em 0 #10246b,0 .2em 0 #0a1745,0 .26em .12em rgba(0,0,0,.4)}
.hh-word::after{background:linear-gradient(180deg,rgba(255,255,255,.62) 0,rgba(255,255,255,.62) 13%,rgba(255,255,255,0) 14%),linear-gradient(180deg,var(--c1) 0%,var(--c1) 40%,var(--c2) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:0;text-shadow:none}
@keyframes hh-bob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-3%) scale(1.025,.975)}}
.hh-w1{--s:clamp(48px,14vw,80px);font-size:var(--s)}
.hh-w2{--s:clamp(56px,18vw,100px);font-size:var(--s);margin-top:calc(var(--s) * -.04)}
.hh-tag{margin-top:clamp(14px,3vw,22px);font-size:clamp(13px,3.6vw,16px);letter-spacing:.04em;color:#fff;text-shadow:0 2px 0 rgba(10,23,69,.8),0 0 8px rgba(10,23,69,.6);transform:rotate(3deg)}
.hh-chip{margin-top:6px;padding:3px 12px;border-radius:999px;background:rgba(10,23,69,.55);font-size:12px;letter-spacing:.08em;text-transform:uppercase;transform:rotate(3deg);backdrop-filter:blur(3px)}
@supports (width:1cqw){
.hh-w1{--s:clamp(40px,min(15cqw,8cqh),80px)}
.hh-w2{--s:clamp(48px,min(20cqw,9cqh),100px)}
.hh-badge{width:clamp(36px,min(12cqw,5.5cqh),62px)}
.hh-tag{font-size:clamp(12px,min(3.8cqw,1.9cqh),16px)}
}
@container (max-height:780px){.hh-tag,.hh-chip{display:none}}
/* --- bottom block --- */
.hh-bottom{position:absolute;z-index:6;left:0;right:0;bottom:0;padding:0 clamp(18px,6vw,34px) calc(env(safe-area-inset-bottom,0px) + 22px);display:flex;flex-direction:column;align-items:stretch;gap:9px}
.hh-status{display:flex;align-items:center;gap:10px;font-size:clamp(15px,4.2vw,18px);text-shadow:0 2px 0 rgba(10,23,69,.85),0 0 10px rgba(10,23,69,.5);min-height:24px}
.hh-pct{margin-left:auto;font-variant-numeric:tabular-nums}
.hh-label{display:none}
.hh-root.is-offline .hh-label,.hh-root.is-slow .hh-label,.hh-root.is-error .hh-label{display:inline}
.hh-tag,.hh-chip,.hh-tip,.hh-meta{display:none!important}
.hh-panel h3{display:none}
.hh-root.is-offline .hh-label,.hh-root.is-error .hh-label,.hh-root.is-slow .hh-label{padding:2px 10px;border-radius:999px;background:rgba(10,23,69,.72);backdrop-filter:blur(3px)}
.hh-bar{position:relative;height:clamp(26px,7vw,32px);border-radius:999px;background:#0f2358;border:4px solid #fff;box-shadow:0 0 0 3px #0f2358,0 6px 0 3px rgba(10,23,69,.6),inset 0 3px 6px rgba(0,0,0,.5);overflow:hidden}
.hh-fill{position:absolute;left:0;top:0;bottom:0;width:100%;transform-origin:left center;transform:scaleX(0);border-radius:999px;background:linear-gradient(180deg,#b9ff5a 0%,#5fe02a 55%,#32b81a 100%);box-shadow:inset 0 3px 0 rgba(255,255,255,.55)}
.hh-fill::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.28) 0 12px,transparent 12px 28px);animation:hh-stripes 1s linear infinite;border-radius:inherit}
.hh-root.is-slow .hh-fill,.hh-root.is-offline .hh-fill{background:linear-gradient(180deg,#ffe27a 0%,#ffb21f 55%,#e08a00 100%)}
.hh-root.is-error .hh-fill{background:linear-gradient(180deg,#ff9a9a,#ef4444 60%,#c42020)}
.hh-root.is-offline .hh-fill::after,.hh-root.is-error .hh-fill::after{animation-play-state:paused}
.hh-root.is-done .hh-fill{animation:hh-glowbar .9s ease-in-out infinite alternate}
.hh-meta{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13px;min-height:34px}
.hh-conn{display:inline-flex;align-items:center;gap:7px;padding:4px 11px 4px 8px;border-radius:999px;background:rgba(10,23,69,.62);backdrop-filter:blur(4px);white-space:nowrap;transition:background .3s}
.hh-conn svg{width:18px;height:18px;flex:none}
.hh-conn.bad{background:rgba(190,60,20,.85)}.hh-conn.warn{background:rgba(160,110,0,.85)}
.hh-tip{flex:1;text-align:right;color:#fff;opacity:.96;text-shadow:0 1px 0 rgba(10,23,69,.95),0 0 6px rgba(10,23,69,.9),0 0 12px rgba(10,23,69,.7);font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-weight:600;font-size:12px;line-height:1.25;transition:opacity .4s;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:58%}
.hh-panel{display:none;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.96);color:#10246b;box-shadow:0 8px 0 rgba(10,23,69,.35),0 14px 30px rgba(0,0,0,.35);text-align:center}
.hh-panel h3{margin:0 0 3px;font-size:19px;font-weight:400}
.hh-panel p{margin:0 0 10px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-weight:600;font-size:13px;line-height:1.35;color:#3a4a8a}
.hh-btns{display:flex;gap:10px;justify-content:center}
.hh-btn{font-family:var(--font);font-size:16px;color:#fff;border:0;border-radius:14px;padding:10px 18px;background:linear-gradient(180deg,#5fd0ff,#2f7bff);box-shadow:0 4px 0 #1a4fb5;cursor:pointer;min-height:44px}
.hh-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #1a4fb5}
.hh-btn.alt{background:linear-gradient(180deg,#ffd86a,#ffa21f);box-shadow:0 4px 0 #b36b00;color:#4a2b00}
.hh-root.is-offline .hh-panel.p-offline,.hh-root.is-error .hh-panel.p-error{display:block}
.hh-root.is-offline .hh-tip,.hh-root.is-error .hh-tip{display:none}
.hh-btn[hidden]{display:none}
/* --- key art (ordinary days) --- */
.has-art .hh-logo{display:none}
.hh-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:53% 0;display:block;transition:transform .9s ease-in}
.has-art.is-leaving .hh-art{transform:scale(1.12)}
.has-art .hh-bottom{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 34px)}
.has-art .hh-bar{background:#0a2a68;border-color:#7fd6ff;box-shadow:0 0 0 3px #1d63c4,0 6px 0 3px rgba(8,30,90,.55),inset 0 3px 6px rgba(0,0,0,.5)}
.has-art .hh-pct{color:#fff;-webkit-text-stroke:4px #0a2a68;paint-order:stroke fill}
.art-autumn{filter:sepia(.45) saturate(1.25) hue-rotate(-12deg) brightness(1.02)}
.art-winter{filter:saturate(.7) hue-rotate(14deg) brightness(1.12) contrast(.96)}
.art-spring{filter:saturate(1.1) brightness(1.04)}
.art-summer{filter:saturate(1.15) brightness(1.03)}
/* --- animation --- */
@keyframes hh-stripes{to{background-position:56px 0}}
@keyframes hh-glowbar{from{box-shadow:inset 0 3px 0 rgba(255,255,255,.55),0 0 6px #b9ff5a}to{box-shadow:inset 0 3px 0 rgba(255,255,255,.55),0 0 22px #e6ff9a}}
@keyframes hh-bounce{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-4px) rotate(-.35deg)}50%{transform:translateY(0)}75%{transform:translateY(-3px) rotate(.35deg)}}
@keyframes hh-wave{0%,100%{transform:rotate(0)}50%{transform:rotate(-24deg)}}
@keyframes hh-wavearm{0%,100%{transform:rotate(0)}50%{transform:rotate(-18deg)}}
@keyframes hh-drift{from{transform:translateX(-30px)}to{transform:translateX(30px)}}
@keyframes hh-twinkle{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes hh-glowlights{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes hh-fall{0%{transform:translate3d(0,-12vh,0) rotate(0)}50%{transform:translate3d(var(--sway),42vh,0) rotate(180deg)}100%{transform:translate3d(calc(var(--sway) * -1),104vh,0) rotate(360deg)}}
@keyframes hh-rise{0%{transform:scale(.2);opacity:0}30%{opacity:1}100%{transform:scale(1.3) translateY(-16px);opacity:0}}
@keyframes hh-bulb{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes hh-honk{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px) rotate(-1deg)}40%{transform:translateX(5px) rotate(1deg)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
@keyframes hh-drive{to{transform:translateX(130%)}}
@keyframes hh-fadeout{to{opacity:0}}
.hh-scene #hh-bus{transform-box:fill-box;transform-origin:50% 100%;animation:hh-bounce 1.15s ease-in-out infinite}
.hh-arm{transform-box:fill-box;transform-origin:50% 90%;animation:hh-wavearm .9s ease-in-out infinite;animation-delay:var(--d,0s)}
.hh-wave{transform-box:fill-box;transform-origin:50% 100%;animation:hh-wave .8s ease-in-out infinite}
.hh-cloud{animation:hh-drift 14s ease-in-out infinite alternate;animation-delay:var(--d,0s)}
.hh-star{animation:hh-twinkle 2.6s ease-in-out infinite;animation-delay:var(--d,0s)}
.hh-lights{animation:hh-glowlights 1.6s ease-in-out infinite}
.hh-bulb{animation:hh-bulb 1.4s ease-in-out infinite;animation-delay:var(--d,0s)}
.hh-p{position:absolute;top:0;animation:hh-fall linear infinite;will-change:transform;opacity:.92}
.hh-p-sparkle{animation:hh-rise ease-out infinite;opacity:1}
.hh-root.is-honk .hh-scene #hh-bus{animation:hh-honk .45s ease-in-out 1}
.hh-root.is-leaving .hh-scene #hh-bus{animation:hh-drive .8s cubic-bezier(.55,0,.9,.4) forwards}
.hh-root.is-leaving .hh-screen{animation:hh-fadeout .35s ease-in .55s forwards}
@media (prefers-reduced-motion:reduce){.hh-scene *,.hh-p,.hh-fill::after{animation:none!important}.hh-root.is-leaving .hh-screen{animation:hh-fadeout .2s forwards}.hh-root.is-leaving .hh-scene #hh-bus{animation:none}}
`;

const ICON = {
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M2.5 9a14 14 0 0 1 19 0M6 12.8a9 9 0 0 1 12 0M9.4 16.4a4 4 0 0 1 5.2 0"/><circle cx="12" cy="19.6" r="1.4" fill="#fff"/></svg>',
  cell: '<svg viewBox="0 0 24 24" fill="#fff"><rect x="3" y="15" width="4" height="6" rx="1.2"/><rect x="9" y="11" width="4" height="10" rx="1.2"/><rect x="15" y="6" width="4" height="15" rx="1.2"/></svg>',
  off: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M2.5 9a14 14 0 0 1 8-3.8M21.5 9a14 14 0 0 0-3.4-2.6M6 12.8a9 9 0 0 1 3.6-1.9M18 12.8a9 9 0 0 0-1.8-1.5M9.4 16.4a4 4 0 0 1 2.6-1M4 3l16 18"/><circle cx="12" cy="19.6" r="1.4" fill="#fff"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
};
const BADGE = '<svg class="hh-badge" viewBox="0 0 64 44" aria-hidden="true"><rect x="3" y="3" width="58" height="34" rx="12" fill="#ffc83d" stroke="#10246b" stroke-width="4"/><rect x="9" y="10" width="12" height="11" rx="3" fill="#8fd0f5"/><rect x="26" y="10" width="12" height="11" rx="3" fill="#8fd0f5"/><rect x="43" y="10" width="12" height="11" rx="3" fill="#8fd0f5"/><rect x="3" y="25" width="58" height="5" fill="#ff8a1f"/><circle cx="17" cy="38" r="5" fill="#10246b"/><circle cx="47" cy="38" r="5" fill="#10246b"/></svg>';

let cssInjected = false;
function injectCss() {
  if (cssInjected || typeof document === 'undefined') return; cssInjected = true;
  const s = document.createElement('style'); s.setAttribute('data-hh', ''); s.textContent = CSS; document.head.appendChild(s);
}
const q = (el, sel) => el.querySelector(sel);

export function connectionLabel(c, measuredMbps) {
  if (!c.online) return { icon: 'off', text: 'Offline', tone: 'bad' };
  const quality = c.quality === 'poor' || (measuredMbps !== null && measuredMbps < 0.5) ? 'Slow' : c.quality === 'good' || (measuredMbps !== null && measuredMbps >= 3) ? 'Fast' : c.quality === 'ok' ? 'OK' : '';
  const kind = c.type === 'wifi' ? 'Wi-Fi' : c.type === 'cellular' ? 'Mobile data' : 'Online';
  return { icon: c.type === 'wifi' ? 'wifi' : c.type === 'cellular' ? 'cell' : 'globe', text: quality ? kind + ' · ' + quality : kind, tone: quality === 'Slow' ? 'warn' : '' };
}

export function createScreen(root, opts = {}) {
  injectCss();
  const { appName = APP_NAME, tagline = APP_TAGLINE, tips = [], minShowMs = 1600, onDone = () => {}, embedded = false, onCheck = () => {}, onPlayOffline = () => {}, onRetry = () => {} } = opts;
  const words = appName.split(' '), w2 = words.length > 1 ? words.pop() : '', w1 = words.join(' ');   // last word on its own line
  root.classList.add('hh-root'); if (embedded) root.classList.add('hh-embedded');
  root.innerHTML = `
    <div class="hh-screen" role="progressbar" aria-label="Loading ${appName}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="hh-scenebox"></div>
      <div class="hh-fx"></div>
      <div class="hh-logo">${BADGE}
        <span class="hh-word hh-w1" data-t="${w1}">${w1}</span>
        ${w2 ? `<span class="hh-word hh-w2" data-t="${w2}!">${w2}!</span>` : ''}
        <div class="hh-tag" hidden></div><div class="hh-chip" hidden></div>
      </div>
      <div class="hh-bottom">
        <div class="hh-status" aria-live="polite"><span class="hh-conn"></span><span class="hh-label"></span><span class="hh-pct">0%</span></div>
        <div class="hh-bar"><div class="hh-fill"></div></div>
        <div class="hh-panel p-offline"><h3>No connection</h3><div class="hh-btns"><button class="hh-btn" data-act="check">Retry</button><button class="hh-btn alt" data-act="offline" hidden>Play offline</button></div></div>
        <div class="hh-panel p-error"><h3>Couldn't load</h3><p class="hh-errmsg" hidden></p><div class="hh-btns"><button class="hh-btn" data-act="retry">Retry</button></div></div>
        <span class="hh-tip" hidden></span>
      </div>
    </div>`;
  const el = { screen: q(root, '.hh-screen'), box: q(root, '.hh-scenebox'), fx: q(root, '.hh-fx'), fill: q(root, '.hh-fill'), label: q(root, '.hh-label'), pct: q(root, '.hh-pct'), conn: q(root, '.hh-conn'), tip: q(root, '.hh-tip'), chip: q(root, '.hh-chip'), err: q(root, '.hh-errmsg'), offBtn: q(root, '[data-act=offline]'), w1: q(root, '.hh-w1'), w2: q(root, '.hh-w2') };
  root.addEventListener('click', (e) => { const a = e.target && e.target.getAttribute && e.target.getAttribute('data-act'); if (a === 'check') onCheck(); if (a === 'offline') onPlayOffline(); if (a === 'retry') onRetry(); });

  let theme = null, shown = 0, target = 0, raf = 0, destroyed = false, startAt = Date.now(), finished = false, finishing = false, destTimer = 0, tipTimer = 0, tipIdx = Math.floor(Math.random() * (tips.length || 1)), lastState = null;

  function setTheme(t, reason) {
    theme = t;
    const home = !!opts.sceneHtml, art = !home && !!(opts.artUrl && (t.id === 'regular' || reason === 'season')); root.classList.toggle('has-art', art); root.classList.toggle('has-home', home);   // ordinary days use the key art, which already has the logo
    el.box.innerHTML = home ? opts.sceneHtml() : art ? `<img class="hh-art art-${t.id}" src="${opts.artUrl}" alt="">` : sceneSvg(t); el.fx.innerHTML = home || (art && t.id === 'regular') ? '' : particlesHtml(t);
    for (const [n, w] of [[1, el.w1], [2, el.w2]]) if (w) { const cc = n === 1 ? t.title : t.title2; w.style.setProperty('--c1', cc[0]); w.style.setProperty('--c2', cc[1]); }
    const showChip = false;   // no season / holiday sign el.chip.hidden = !showChip; el.chip.textContent = showChip ? t.name : '';
    root.setAttribute('data-theme', t.id);
    clearInterval(destTimer); let di = 0; const dest = q(root, '#hh-dest'); if (dest) destTimer = setInterval(() => { di = (di + 1) % t.sign.length; dest.textContent = t.sign[di]; }, 2200);
  }
  function showTip() { el.tip.style.opacity = 0; setTimeout(() => { if (destroyed) return; tipIdx = (tipIdx + 1) % tips.length; el.tip.textContent = tips[tipIdx]; el.tip.style.opacity = 1; }, 350); }
  if (tips.length) { el.tip.hidden = false; el.tip.textContent = tips[tipIdx]; tipTimer = setInterval(showTip, 4500); }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (shown < target) shown = Math.min(target, shown + Math.max(0.0035, (target - shown) * 0.14));   // eases up, never down, never past the real value
    el.fill.style.transform = 'scaleX(' + Math.max(0.0001, shown).toFixed(4) + ')';
    const pct = Math.round(shown * 100); el.pct.textContent = pct + '%'; el.screen.setAttribute('aria-valuenow', String(pct));
    if (finished && !finishing && shown >= 0.999 && Date.now() - startAt >= minShowMs) leave();
  }
  function leave() {
    finishing = true; root.classList.add('is-honk'); el.label.textContent = '';
    setTimeout(() => { root.classList.remove('is-honk'); root.classList.add('is-leaving'); setTimeout(() => { if (!destroyed) onDone(lastState); }, 900); }, 480);
  }

  function update(s) {
    if (destroyed) return; lastState = s; target = Math.max(target, s.progress);
    root.classList.toggle('is-slow', s.status === 'slow'); root.classList.toggle('is-offline', s.status === 'offline'); root.classList.toggle('is-error', s.status === 'error'); root.classList.toggle('is-done', s.status === 'done');
    if (!finishing) el.label.textContent = s.status === 'offline' ? 'No connection' : s.status === 'error' ? 'Couldn\u2019t load' : s.status === 'slow' ? 'Slow connection' : '';
    
    el.offBtn.hidden = !s.canPlayOffline;
    const c = connectionLabel(s.connection, s.measuredMbps); el.conn.className = 'hh-conn ' + c.tone; el.conn.innerHTML = ICON[c.icon]; el.conn.setAttribute('aria-label', c.text); el.conn.title = c.text;
    if (s.status === 'done') finished = true;
  }
  update({ status: 'loading', progress: 0, label: '', connection: { online: true, type: 'unknown', quality: 'unknown' }, measuredMbps: null });
  raf = requestAnimationFrame(frame);
  return { update, setTheme, destroy() { destroyed = true; cancelAnimationFrame(raf); clearInterval(destTimer); clearInterval(tipTimer); root.innerHTML = ''; root.classList.remove('hh-root', 'is-slow', 'is-offline', 'is-error', 'is-done', 'is-honk', 'is-leaving'); }, getTheme: () => theme };
}

// One call that wires everything together.
export function bootLoadingScreen(root, opts = {}) {
  const { tasks, loaderOptions = {}, pingUrl = null, canPlayOffline = false, hemisphere = 'north', seasonal = true, seasonMode = 'full', forceTheme = null, now = new Date(), env, ...screenOpts } = opts;
  let loader = null;
  const screen = createScreen(root, { ...screenOpts, onCheck: () => loader && loader.checkNow(), onPlayOffline: () => loader && loader.playOffline(), onRetry: () => loader && loader.retry() });
  const picked = pickTheme(now, { hemisphere, seasonal, seasonMode, force: forceTheme });
  screen.setTheme(picked.theme, picked.reason);
  loader = createLoader({ tasks, pingUrl, canPlayOffline, env, ...loaderOptions, onUpdate: screen.update });
  loader.start();
  return { loader, screen, theme: picked.theme, reason: picked.reason, destroy() { loader.cancel(); screen.destroy(); } };
}
