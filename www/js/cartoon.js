// cartoon.js - small cartoon pictures of buses and riders for the Garage and the Shop (same colours and hats as in the game).
import { COLOR_HEX, passengerPreview, paintFor, outfitFor } from './look.js';
import { topperUrl, hasTopper } from './decorArt.js';
import { skinById } from './skinData.js';
const INK = '#14205a';

// A side view of a bus: chunky outline, big windows, glossy top. paint = the skin's paint (or null for the classic bus), hex = the game colour of the belt stripe.
export function miniBus(paint, hex, topper, uid = 'm') {
  const p = paint || { body: '#ffc41f', trim: '#ff9a00', pattern: 'none', colors: [] }, cols = p.colors.length ? p.colors : ['#ffffff'], id = p.pattern;
  let pat = '';
  if (id === 'checker' || id === 'grid') for (let i = 0; i < 8; i++) pat += `<rect x="${21 + i * 11}" y="${i % 2 ? 38 : 45}" width="11" height="7" fill="${cols[0]}" opacity=".9"/>`;
  else if (['stripes', 'waves', 'zebra', 'rainbow', 'hazard'].includes(id)) for (let i = 0; i < 6; i++) pat += `<rect x="${22 + i * 14}" y="37" width="7" height="15" fill="${cols[i % cols.length]}" opacity=".85" transform="skewX(-12)"/>`;
  else if (id !== 'none') for (let i = 0; i < 7; i++) pat += `<circle cx="${25 + i * 13}" cy="${i % 2 ? 42 : 48}" r="3.6" fill="${cols[i % cols.length]}"/>`;
  const sw = `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;
  return `<svg viewBox="0 0 130 90" role="img"><ellipse cx="65" cy="82" rx="54" ry="5" fill="rgba(16,36,107,.22)"/>
    <rect x="9" y="30" width="112" height="42" rx="12" fill="${p.body}" ${sw}/>
    <rect x="14" y="14" width="102" height="30" rx="11" fill="${p.body}" ${sw}/>
    <rect x="20" y="19" width="90" height="17" rx="7" fill="#a6e4ff" stroke="${INK}" stroke-width="2.4"/>
    <path d="M26 21 l14 0 -9 13 -9 0z" fill="#fff" opacity=".55"/>
    ${pat}
    <rect x="9" y="52" width="112" height="9" fill="${hex}" stroke="${INK}" stroke-width="2.4"/>
    <rect x="4" y="58" width="12" height="11" rx="4" fill="#fff7b8" ${sw}/><rect x="114" y="58" width="12" height="11" rx="4" fill="#ff5a5a" ${sw}/>
    <rect x="50" y="26" width="30" height="7" rx="3.5" fill="${hex}" stroke="${INK}" stroke-width="2"/>
    <circle cx="35" cy="72" r="10" fill="#2a2f4a" ${sw}/><circle cx="95" cy="72" r="10" fill="#2a2f4a" ${sw}/><circle cx="35" cy="72" r="3.6" fill="#dfe6ff"/><circle cx="95" cy="72" r="3.6" fill="#dfe6ff"/>
    ${topper && hasTopper(topper) ? `<image href="${topperUrl(topper)}" x="52" y="2" width="26" height="26"/>` : ''}</svg>`;
}
export const busPic = (skinId) => { const sk = skinById(skinId); return miniBus(paintFor(skinId), '#2a7bff', sk && sk.style && sk.style.topper); };
const RIDER_COLORS = Object.values(COLOR_HEX);
export const riderPic = (skinId, i = 0, size = 96) => { const sk = skinById(skinId), url = passengerPreview(RIDER_COLORS[i % RIDER_COLORS.length], sk && sk.style && sk.style.accessory, outfitFor(skinId), size); return url ? `<img src="${url}" alt="" width="${size}" height="${size}">` : ''; };
