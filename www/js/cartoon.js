// cartoon.js - small cartoon pictures of buses and riders for the Garage and the Shop (same colours and hats as in the game).
import { TOPPER_EMOJI, COLOR_HEX, passengerPreview, paintFor, outfitFor } from './look.js';
import { skinById } from './skinData.js';
import { shade } from './busArt.js';
import { BUS_STYLES, vehicleSkinFor } from './busStyles.js';
const INK = '#14205a';

// A glossy front view of a bus in the style of the Garage art: shaded body, big windows with a driver and a waving rider, chrome bumper and
// round headlights, a roof rail with colourful riders. paint = the skin's paint (null = classic yellow), hex = the game colour of the belt stripe.
let uidN = 0;
const ROOF = ['#9b4de5', '#ff3b3b', '#22c4e8', '#ffd60a', '#2fd45a', '#ff7ab8', '#ff8a00'];
export function miniBus(paint, hex, topper) {
  const u = 'b' + (uidN++), p = paint || { body: '#ffc41f', trim: '#ff9a00', pattern: 'none', colors: [] }, cols = p.colors.length ? p.colors : ['#ffffff'], id = p.pattern;
  const dark = shade(p.body, -0.55), top = shade(p.body, 0.32), low = shade(p.body, -0.22), sw = `stroke="${dark}" stroke-width="3.2" stroke-linejoin="round"`;
  let pat = '';
  if (id === 'checker' || id === 'grid') for (let i = 0; i < 12; i++) pat += `<rect x="${14 + i * 16}" y="${i % 2 ? 66 : 73}" width="16" height="7" fill="${cols[0]}" opacity=".9"/>`;
  else if (['stripes', 'waves', 'zebra', 'rainbow', 'hazard'].includes(id)) for (let i = 0; i < 9; i++) pat += `<rect x="${16 + i * 22}" y="64" width="10" height="16" fill="${cols[i % cols.length]}" opacity=".88" transform="skewX(-14)"/>`;
  else if (id !== 'none') for (let i = 0; i < 11; i++) pat += `<circle cx="${22 + i * 17}" cy="${i % 2 ? 68 : 75}" r="4.4" fill="${cols[i % cols.length]}"/>`;
  const fig = (x, c, k) => `<g transform="translate(${x} 22)"><path d="M-9 -3 L-12 -16 M9 -3 L12 -16" stroke="${c}" stroke-width="5" stroke-linecap="round"/><rect x="-7.5" y="-4" width="15" height="17" rx="7" fill="${c}" stroke="${shade(c, -0.5)}" stroke-width="1.6"/><circle cx="0" cy="-9" r="8.5" fill="${c}" stroke="${shade(c, -0.5)}" stroke-width="1.6"/><ellipse cx="-3" cy="-12.5" rx="3" ry="2" fill="#fff" opacity=".6"/></g>`;
  const crowd = ROOF.map((c, i) => fig(34 + i * 25.5, c, i)).join('');
  const person = (x, c, wave) => `<g transform="translate(${x} 112)">${wave ? `<path d="M-15 8 L-19 -6 M15 8 L19 -6" stroke="${c}" stroke-width="6" stroke-linecap="round"/>` : ''}<rect x="-12" y="2" width="24" height="26" rx="11" fill="${c}"/><circle cx="0" cy="-6" r="12" fill="${c}"/><ellipse cx="-4" cy="-11" rx="4.5" ry="3" fill="#fff" opacity=".55"/></g>`;
  return `<svg viewBox="0 0 220 196" role="img"><defs>
    <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".5" stop-color="${p.body}"/><stop offset="1" stop-color="${low}"/></linearGradient>
    <linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4f2ff"/><stop offset="1" stop-color="#5faee8"/></linearGradient>
    <linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#c3cde6"/><stop offset="1" stop-color="#8a96b8"/></linearGradient>
    <radialGradient id="${u}h" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff7b8"/><stop offset="1" stop-color="#ffd23f"/></radialGradient></defs>
    <ellipse cx="110" cy="188" rx="96" ry="7" fill="rgba(16,36,107,.25)"/>
    <rect x="24" y="150" width="34" height="40" rx="11" fill="#2a2f4a" stroke="#14205a" stroke-width="3"/><rect x="162" y="150" width="34" height="40" rx="11" fill="#2a2f4a" stroke="#14205a" stroke-width="3"/>
    <path d="M26 30 H194" stroke="${shade(p.body, -0.3)}" stroke-width="3.5" stroke-linecap="round"/><path d="M26 30 V44 M194 30 V44 M70 30 V44 M110 30 V44 M150 30 V44" stroke="${shade(p.body, -0.3)}" stroke-width="2.5"/>
    ${crowd}
    <rect x="20" y="38" width="180" height="62" rx="20" fill="url(#${u}b)" ${sw}/>
    <rect x="32" y="46" width="156" height="21" rx="9" fill="#2b4a82" stroke="${dark}" stroke-width="2.4"/><path d="M40 50 h40 l-10 13 h-40z M110 50 h30 l-10 13 h-30z" fill="#fff" opacity=".22"/>
    <rect x="8" y="84" width="204" height="78" rx="24" fill="url(#${u}b)" ${sw}/>
    ${pat}
    <rect x="22" y="86" width="82" height="48" rx="14" fill="url(#${u}g)" stroke="${dark}" stroke-width="3"/><rect x="116" y="86" width="82" height="48" rx="14" fill="url(#${u}g)" stroke="${dark}" stroke-width="3"/>
    ${person(62, '#2f8bff', false)}${person(157, '#ffd60a', true)}
    <path d="M30 90 h26 l-14 22 h-26z M124 90 h26 l-14 22 h-26z" fill="#fff" opacity=".4"/>
    <rect x="8" y="136" width="204" height="9" fill="${hex}" stroke="${dark}" stroke-width="2.4"/>
    <rect x="6" y="150" width="208" height="20" rx="10" fill="url(#${u}c)" stroke="#5a6690" stroke-width="3"/>
    <rect x="76" y="140" width="68" height="24" rx="7" fill="#3a4262" stroke="#14205a" stroke-width="2.6"/><path d="M82 148 H138 M82 154 H138 M82 160 H138" stroke="#c3cde6" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="42" cy="145" r="15" fill="url(#${u}c)" stroke="#5a6690" stroke-width="3"/><circle cx="42" cy="145" r="10.5" fill="url(#${u}h)"/>
    <circle cx="178" cy="145" r="15" fill="url(#${u}c)" stroke="#5a6690" stroke-width="3"/><circle cx="178" cy="145" r="10.5" fill="url(#${u}h)"/>
    <rect x="-1" y="94" width="11" height="24" rx="5" fill="#2a2f4a" stroke="#14205a" stroke-width="2"/><rect x="210" y="94" width="11" height="24" rx="5" fill="#2a2f4a" stroke="#14205a" stroke-width="2"/>
    <path d="M18 100 Q22 90 36 90 H88" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45"/>
    ${topper && TOPPER_EMOJI[topper] ? `<text x="196" y="30" text-anchor="middle" font-size="26">${TOPPER_EMOJI[topper]}</text>` : ''}</svg>`;
}
const imgSrc = (s) => 'img/buses/' + s.id + '.png';
// The big picture of a bus skin: the rendered art when there is one for it (the 16 Garage styles), otherwise the drawn glossy bus.
export const busPic = (skinId) => {
  const st = BUS_STYLES.find((x) => vehicleSkinFor(x) === skinId);
  if (st) return `<img class="busimg" src="${imgSrc(st)}" alt="${st.name}">`;
  const sk = skinById(skinId); return miniBus(paintFor(skinId), '#2a7bff', sk && sk.style && sk.style.topper);
};
const RIDER_COLORS = Object.values(COLOR_HEX);
export const riderPic = (skinId, i = 0, size = 96) => { const sk = skinById(skinId), url = passengerPreview(RIDER_COLORS[i % RIDER_COLORS.length], sk && sk.style && sk.style.accessory, outfitFor(skinId), size); return url ? `<img src="${url}" alt="" width="${size}" height="${size}">` : ''; };
