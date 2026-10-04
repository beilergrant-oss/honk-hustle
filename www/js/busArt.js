// busArt.js - original SVG art for the loading screen. Pure string builders: no DOM, no images.
// Scene is drawn in a 390 x 844 box; the bus is drawn in its own 400 x 360 box and placed into the scene.
import { PASSENGER_PALETTE } from './loadingThemes.js';

const RAINBOW = ['#ff3b3b', '#ff9f1c', '#ffe14d', '#3ddc84', '#3b82f6', '#9b5de5'];
const seeded = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const shade = (hex, amt) => { // amt -1..1 : darken / lighten
  const n = parseInt(hex.slice(1), 16), c = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('');
};
export { shade };

// ---------------- hats (origin = top centre of a head; head is 40 wide) ----------------
const HATS = {
  none: () => '',
  snorkel: () => `<rect x="-17" y="9" width="34" height="11" rx="5" fill="#2fc7ff" stroke="#0b6f95" stroke-width="2"/><rect x="-14" y="11" width="11" height="7" rx="3" fill="#bff4ff"/><rect x="3" y="11" width="11" height="7" rx="3" fill="#bff4ff"/><path d="M19 12 Q29 0 24 -13" stroke="#ff7a59" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  firehat: () => `<ellipse cx="0" cy="3" rx="26" ry="5" fill="#c92222"/><path d="M-17 3 Q-17 -16 0 -16 Q17 -16 17 3Z" fill="#e63b3b"/><rect x="-3" y="-24" width="6" height="10" rx="2" fill="#ffd23f"/><path d="M-7 -8 h14 v8 q-7 5 -14 0z" fill="#ffd23f"/>`,
  astronaut: () => `<circle cx="0" cy="10" r="27" fill="#ffffff" fill-opacity=".26" stroke="#dfe6f5" stroke-width="3.5"/><path d="M-18 2 Q0 -12 18 2" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><rect x="-4" y="-22" width="8" height="8" rx="2" fill="#c8d0e6"/>`,
  visor: () => `<rect x="-21" y="8" width="42" height="15" rx="7" fill="#1a1530" stroke="#3df5ff" stroke-width="2.5"/><rect x="-16" y="11" width="32" height="9" rx="4" fill="#ff4fd8" opacity=".85"/>`,
  sportcap: () => `<path d="M-19 4 Q-19 -14 0 -14 Q19 -14 19 4Z" fill="#1d4ed8"/><path d="M-4 4 Q16 -2 31 6 Q16 11 -4 8Z" fill="#163aa8"/><circle cx="0" cy="-14" r="3" fill="#fff"/><path d="M-7 -4 h14" stroke="#fff" stroke-width="3"/>`,
  safari: () => `<ellipse cx="0" cy="3" rx="30" ry="6.5" fill="#c9a064"/><path d="M-17 3 Q-17 -17 0 -17 Q17 -17 17 3Z" fill="#dcb67d"/><rect x="-17" y="-4" width="34" height="6" fill="#6b4a1f"/>`,
  crown: () => `<path d="M-18 4 L-18 -12 L-9 -3 L0 -16 L9 -3 L18 -12 L18 4Z" fill="#ffd23f" stroke="#d19a00" stroke-width="2"/><circle cx="-18" cy="-13" r="3" fill="#ff4d4d"/><circle cx="0" cy="-17" r="3" fill="#3b82f6"/><circle cx="18" cy="-13" r="3" fill="#ff4d4d"/>`,
  jester: () => `<path d="M-19 4 Q-31 -14 -27 -23 Q-14 -15 0 -13 Q14 -15 27 -23 Q31 -14 19 4Z" fill="#9b5de5"/><path d="M0 -13 Q-5 -2 -3 4 H19 Q31 -14 27 -23 Q14 -15 0 -13Z" fill="#ffd23f" opacity=".92"/><circle cx="-27" cy="-24" r="4" fill="#ffd23f"/><circle cx="27" cy="-24" r="4" fill="#ffd23f"/>`,
  sunhat: () => `<ellipse cx="0" cy="3" rx="31" ry="7" fill="#ffe58a" stroke="#d9b24a" stroke-width="1.5"/><path d="M-17 3 Q-17 -17 0 -17 Q17 -17 17 3Z" fill="#ffe58a" stroke="#d9b24a" stroke-width="1.5"/><rect x="-17" y="-4" width="34" height="6" fill="#ff5a5a"/>`,
  shades: () => `<rect x="-17" y="13" width="34" height="10" rx="5" fill="#15161d"/><rect x="-2" y="15" width="4" height="3" fill="#15161d"/><rect x="-14" y="15" width="9" height="2.5" rx="1" fill="#fff" opacity=".35"/>`,
  flowerCrown: () => [-16, -8, 0, 8, 16].map((x, i) => `<circle cx="${x}" cy="${2 - (i % 2) * 3}" r="5.5" fill="${['#ff7aa8', '#ffffff', '#ffe14d', '#b983ff', '#ff7aa8'][i]}"/><circle cx="${x}" cy="${2 - (i % 2) * 3}" r="1.8" fill="#ffb21f"/>`).join(''),
  acorn: () => `<path d="M-19 4 Q-19 -14 0 -14 Q19 -14 19 4Z" fill="#9b6a2f"/><rect x="-2" y="-21" width="4" height="9" rx="2" fill="#6b4a1f"/><path d="M-19 4 H19" stroke="#6b4a1f" stroke-width="2"/>`,
  beanie: () => `<path d="M-19 5 Q-19 -17 0 -17 Q19 -17 19 5Z" fill="#3b82f6"/><rect x="-20" y="-2" width="40" height="8" rx="4" fill="#ffffff"/><circle cx="0" cy="-20" r="5" fill="#fff"/>`,
  earmuffs: () => `<path d="M-21 18 Q-21 -10 0 -10 Q21 -10 21 18" fill="none" stroke="#555" stroke-width="3"/><circle cx="-22" cy="18" r="8" fill="#ff9ad5"/><circle cx="22" cy="18" r="8" fill="#ff9ad5"/>`,
  santa: () => `<path d="M-19 4 Q-14 -24 12 -22 Q22 -20 22 -8 Q14 -14 8 -12 Q4 0 19 4Z" fill="#ef3b3b"/><rect x="-21" y="-1" width="42" height="9" rx="4.5" fill="#fff"/><circle cx="22" cy="-8" r="5.5" fill="#fff"/>`,
  pumpkinHat: () => `<ellipse cx="0" cy="-5" rx="20" ry="14" fill="#ff8a1f"/><path d="M-7 -18 Q-9 0 -7 8M7 -18 Q9 0 7 8" stroke="#d96a00" stroke-width="1.5" fill="none"/><rect x="-2.5" y="-23" width="5" height="8" rx="2" fill="#3c7a2a"/>`,
  witch: () => `<ellipse cx="0" cy="3" rx="29" ry="6" fill="#2a1a45"/><path d="M-14 3 L2 -34 L14 3Z" fill="#3a2360"/><rect x="-14" y="-4" width="28" height="6" fill="#ffb02e"/>`,
  heartBand: () => `<path d="M-19 8 Q-19 -12 0 -12 Q19 -12 19 8" fill="none" stroke="#ff9ac2" stroke-width="3"/><path d="M-12 -10 L-12 -16 M12 -10 L12 -16" stroke="#ff9ac2" stroke-width="2"/><path d="M-12 -17 c-6 -6 -12 2 -6 7 l6 5 l6 -5 c6 -5 0 -13 -6 -7z" fill="#ff3b6b" transform="translate(0 -2) scale(.8) translate(-3 -2)"/><path d="M12 -17 c-6 -6 -12 2 -6 7 l6 5 l6 -5 c6 -5 0 -13 -6 -7z" fill="#ff3b6b" transform="translate(0 -2) scale(.8) translate(3 -2)"/>`,
  leprechaun: () => `<ellipse cx="0" cy="3" rx="26" ry="5.5" fill="#228a44"/><rect x="-14" y="-24" width="28" height="28" rx="3" fill="#2fae5a"/><rect x="-14" y="-5" width="28" height="7" fill="#1b1b1b"/><rect x="-4" y="-5" width="8" height="7" fill="#ffd23f"/>`,
  bunnyEars: () => `<g><ellipse cx="-9" cy="-20" rx="6" ry="19" fill="#fff" transform="rotate(-8 -9 -20)"/><ellipse cx="-9" cy="-20" rx="3" ry="14" fill="#ffb3d1" transform="rotate(-8 -9 -20)"/><ellipse cx="9" cy="-20" rx="6" ry="19" fill="#fff" transform="rotate(8 9 -20)"/><ellipse cx="9" cy="-20" rx="3" ry="14" fill="#ffb3d1" transform="rotate(8 9 -20)"/></g>`,
  rainbowBand: () => RAINBOW.map((c, i) => `<path d="M${-19 + i * 0.6} ${7 - i * 0.3} Q0 ${-16 - i * 2.4} ${19 - i * 0.6} ${7 - i * 0.3}" fill="none" stroke="${c}" stroke-width="2.6"/>`).join(''),
};

// ---------------- roof items (origin = bottom centre, sitting on the roof) ----------------
const ROOF = {
  surfboard: () => `<g transform="rotate(10)"><ellipse cx="0" cy="-34" rx="12" ry="38" fill="#ffffff" stroke="#2f7bff" stroke-width="2"/><rect x="-12" y="-44" width="24" height="7" fill="#ff7a59"/><rect x="-12" y="-30" width="24" height="7" fill="#2f7bff"/><path d="M0 -2 L-6 6 L6 6Z" fill="#2f7bff"/></g>`,
  lifebuoy: () => `<circle cx="0" cy="-22" r="19" fill="#fff" stroke="#e8e8e8" stroke-width="1"/><circle cx="0" cy="-22" r="19" fill="none" stroke="#ff3b3b" stroke-width="9" stroke-dasharray="15 15"/><circle cx="0" cy="-22" r="8" fill="#6fd0ff" opacity=".0"/><circle cx="0" cy="-22" r="9" fill="#35b6ff" opacity=".35"/>`,
  luggage: () => `<rect x="-30" y="-30" width="60" height="30" rx="5" fill="#1ea6a0"/><rect x="-24" y="-30" width="4" height="30" fill="#0f7c78"/><rect x="20" y="-30" width="4" height="30" fill="#0f7c78"/><rect x="-14" y="-52" width="46" height="23" rx="5" fill="#ff9f1c"/><rect x="-8" y="-52" width="4" height="23" fill="#d97a00"/><rect x="18" y="-52" width="4" height="23" fill="#d97a00"/><rect x="-6" y="-60" width="14" height="8" rx="3" fill="none" stroke="#6b4a1f" stroke-width="3"/>`,
  flowerPot: () => `<path d="M-14 -22 H14 L10 0 H-10Z" fill="#c2703d"/><rect x="-16" y="-27" width="32" height="7" rx="3" fill="#d98650"/>${[[-9, -46, '#ff7aa8'], [0, -54, '#ffe14d'], [9, -44, '#ffffff']].map(([x, y, c]) => `<path d="M${x} -27 V${y}" stroke="#3c9a3c" stroke-width="3"/><circle cx="${x}" cy="${y}" r="7" fill="${c}"/><circle cx="${x}" cy="${y}" r="2.6" fill="#ffb21f"/>`).join('')}`,
  umbrella: () => `<path d="M0 0 V-52" stroke="#d8d8d8" stroke-width="3"/><path d="M-34 -48 Q0 -82 34 -48Z" fill="#ff5f5f"/><path d="M-12 -52 Q0 -80 12 -52 Q0 -50 -12 -52Z" fill="#fff"/><path d="M-34 -48 Q-24 -42 -17 -48 Q-8 -42 0 -48 Q8 -42 17 -48 Q24 -42 34 -48" fill="#ff5f5f"/>`,
  leafPile: () => `<ellipse cx="0" cy="-8" rx="30" ry="10" fill="#d9731f"/><ellipse cx="-14" cy="-16" rx="18" ry="8" fill="#ff9f1c"/><ellipse cx="14" cy="-15" rx="18" ry="8" fill="#b5381f"/><ellipse cx="0" cy="-22" rx="14" ry="6" fill="#ffb21f"/>`,
  pumpkin: () => `<ellipse cx="0" cy="-20" rx="26" ry="20" fill="#ff8a1f"/><path d="M-9 -38 Q-14 -20 -9 -2M9 -38 Q14 -20 9 -2M0 -40 V0" stroke="#d96a00" stroke-width="2" fill="none"/><rect x="-3" y="-47" width="6" height="10" rx="2" fill="#3c7a2a"/><path d="M-12 -24 l5 -6 l5 6zM2 -24 l5 -6 l5 6z" fill="#3a1d00"/><path d="M-10 -12 Q0 -4 10 -12 l-3 -3 l-3 3 l-4 -3 l-3 3z" fill="#3a1d00"/>`,
  snowman: () => `<circle cx="0" cy="-16" r="17" fill="#fff"/><circle cx="0" cy="-44" r="12" fill="#fff"/><rect x="-11" y="-62" width="22" height="12" rx="2" fill="#222"/><rect x="-16" y="-52" width="32" height="4" rx="2" fill="#222"/><circle cx="-4" cy="-46" r="1.8" fill="#222"/><circle cx="4" cy="-46" r="1.8" fill="#222"/><path d="M0 -43 L10 -41 L0 -39Z" fill="#ff7a1a"/><rect x="-13" y="-34" width="26" height="6" rx="3" fill="#ef3b3b"/><circle cx="0" cy="-18" r="2" fill="#222"/><circle cx="0" cy="-10" r="2" fill="#222"/>`,
  snowCap: () => `<ellipse cx="0" cy="-8" rx="34" ry="11" fill="#fff"/><ellipse cx="-10" cy="-14" rx="18" ry="9" fill="#fff"/><ellipse cx="14" cy="-13" rx="16" ry="8" fill="#f2f8ff"/>`,
  gifts: () => `<rect x="-30" y="-26" width="34" height="26" rx="3" fill="#ef3b3b"/><rect x="-15" y="-26" width="4" height="26" fill="#ffe14d"/><rect x="-30" y="-15" width="34" height="4" fill="#ffe14d"/><rect x="4" y="-20" width="26" height="20" rx="3" fill="#2fae5a"/><rect x="15" y="-20" width="4" height="20" fill="#fff"/><rect x="-14" y="-44" width="24" height="19" rx="3" fill="#3b82f6"/><rect x="-4" y="-44" width="4" height="19" fill="#fff"/><path d="M-2 -44 q-10 -10 -14 -2 q6 6 14 2z M-2 -44 q10 -10 14 -2 q-6 6 -14 2z" fill="#ffe14d"/>`,
  tree: () => `<rect x="-4" y="-8" width="8" height="8" fill="#7a4a2b"/><path d="M0 -62 L-24 -26 H24Z M0 -48 L-28 -12 H28Z" fill="#1f8f4a"/><path d="M0 -62 L-24 -26 H24Z" fill="#26a85a"/><path d="M0 -76 l3 7 7 .5 -5.5 4.5 2 7 -6.5 -4 -6.5 4 2 -7 -5.5 -4.5 7 -.5z" fill="#ffd23f"/><circle cx="-8" cy="-30" r="3" fill="#ff4d4d"/><circle cx="9" cy="-40" r="3" fill="#ffd23f"/><circle cx="-12" cy="-16" r="3" fill="#3b82f6"/><circle cx="12" cy="-18" r="3" fill="#ff4d4d"/>`,
  cauldron: () => `<ellipse cx="0" cy="-22" rx="25" ry="20" fill="#26262e"/><ellipse cx="0" cy="-38" rx="22" ry="7" fill="#7cff4f"/><circle cx="-6" cy="-46" r="5" fill="#7cff4f" opacity=".9"/><circle cx="8" cy="-52" r="3.5" fill="#7cff4f" opacity=".8"/><rect x="-17" y="-4" width="6" height="6" fill="#26262e"/><rect x="11" y="-4" width="6" height="6" fill="#26262e"/>`,
  balloons: () => `${[[-16, -58, '#ff5f5f'], [4, -66, '#ff9ac2'], [20, -54, '#ffffff']].map(([x, y, c]) => `<path d="M${x} ${y + 12} Q${x + 3} -14 0 0" stroke="#ccc" stroke-width="1.5" fill="none"/><ellipse cx="${x}" cy="${y}" rx="11" ry="14" fill="${c}"/><ellipse cx="${x - 3}" cy="${y - 5}" rx="3" ry="4.5" fill="#fff" opacity=".5"/>`).join('')}`,
  heartSign: () => `<rect x="-3" y="-16" width="6" height="16" fill="#8a6a3a"/><path d="M0 -26 C-28 -52 -28 -78 0 -62 C28 -78 28 -52 0 -26Z" fill="#ff3b6b"/><ellipse cx="-12" cy="-58" rx="5" ry="7" fill="#fff" opacity=".4" transform="rotate(-25 -12 -58)"/>`,
  potOfGold: () => `<ellipse cx="0" cy="-18" rx="26" ry="18" fill="#26262e"/><ellipse cx="0" cy="-32" rx="22" ry="7" fill="#3a3a46"/>${[[-12, -36], [0, -41], [12, -36], [6, -46], [-6, -46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#ffd700" stroke="#e0a800" stroke-width="1.5"/>`).join('')}`,
  eggs: () => [[-22, '#ff9ad5'], [0, '#6ec6ff'], [22, '#ffe14d']].map(([x, c], i) => `<ellipse cx="${x}" cy="-17" rx="12" ry="16" fill="${c}"/><path d="M${x - 12} -17 q4 -5 8 0 t8 0 t8 0" stroke="#fff" stroke-width="2.5" fill="none"/><circle cx="${x - 4}" cy="-24" r="2" fill="#fff" opacity=".7"/>`).join(''),
  rainbowArch: () => '',
  ladder: () => `<g stroke="#e3e8f2" stroke-width="5" stroke-linecap="round"><path d="M-36 -8 H36 M-36 -22 H36"/></g><g stroke="#e3e8f2" stroke-width="3">${[-28, -14, 0, 14, 28].map((x) => `<path d="M${x} -8 V-22"/>`).join('')}</g>`,
  siren: () => `<rect x="-20" y="-10" width="40" height="10" rx="3" fill="#2a2f3d"/><circle class="hh-bulb" cx="-9" cy="-28" r="15" fill="#ff3b3b" opacity=".28"/><circle class="hh-bulb" style="--d:.5s" cx="9" cy="-28" r="15" fill="#3b82f6" opacity=".28"/><rect x="-18" y="-26" width="16" height="16" rx="6" fill="#ff3b3b"/><rect x="2" y="-26" width="16" height="16" rx="6" fill="#3b82f6"/><rect x="-14" y="-23" width="5" height="8" rx="2" fill="#fff" opacity=".5"/>`,
  planet: () => `<circle cx="0" cy="-30" r="20" fill="#ffb454"/><path d="M-19 -36 Q0 -28 19 -36" stroke="#ff8a1f" stroke-width="4" fill="none"/><ellipse cx="0" cy="-30" rx="36" ry="8" fill="none" stroke="#ffe58a" stroke-width="4" transform="rotate(-18 0 -30)"/>`,
  rocket: () => `<g transform="rotate(14)"><path d="M0 -64 Q13 -48 11 -16 H-11 Q-13 -48 0 -64Z" fill="#f2f4fb"/><path d="M0 -64 Q8 -56 9 -47 H-9 Q-8 -56 0 -64Z" fill="#ff3b3b"/><circle cx="0" cy="-34" r="5.5" fill="#6ec6ff" stroke="#9aa6c8" stroke-width="2"/><path d="M-11 -20 L-21 -6 H-11Z M11 -20 L21 -6 H11Z" fill="#ff3b3b"/><path d="M-5 -14 Q0 4 5 -14Z" fill="#ffb21f"/></g>`,
  controller: () => `<rect x="-32" y="-26" width="64" height="28" rx="13" fill="#2b2b4d" stroke="#3df5ff" stroke-width="2.5"/><path d="M-19 -18 v11 M-24.5 -12.5 h11" stroke="#3df5ff" stroke-width="3.6"/><circle cx="15" cy="-18" r="3.6" fill="#ff4fd8"/><circle cx="23" cy="-11" r="3.6" fill="#ffe14d"/>`,
  basketball: () => `<circle cx="0" cy="-21" r="21" fill="#ff8a1f"/><path d="M-21 -21 H21 M0 -42 V0 M-15 -36 Q-5 -21 -15 -6 M15 -36 Q5 -21 15 -6" stroke="#7a3a00" stroke-width="2.4" fill="none"/>`,
  trophy: () => `<path d="M-14 -52 H14 V-40 Q14 -28 0 -26 Q-14 -28 -14 -40Z" fill="#ffd23f" stroke="#d19a00" stroke-width="2"/><path d="M-14 -48 Q-27 -48 -23 -37 Q-19 -31 -12 -33 M14 -48 Q27 -48 23 -37 Q19 -31 12 -33" stroke="#d19a00" stroke-width="3" fill="none"/><rect x="-3" y="-26" width="6" height="13" fill="#d19a00"/><rect x="-13" y="-13" width="26" height="13" rx="3" fill="#a56a00"/>`,
  pennant: () => `<path d="M0 0 V-64" stroke="#e8e8e8" stroke-width="3"/><path d="M0 -64 L42 -51 L0 -38Z" fill="#ff3b3b"/><path d="M0 -58 L28 -51 L0 -44Z" fill="#fff" opacity=".85"/>`,
  palmTree: () => `<path d="M0 0 Q7 -22 1 -44" stroke="#8a5a2b" stroke-width="6" fill="none" stroke-linecap="round"/>${[-70, -30, 10, 50, 90, -105].map((a) => `<path d="M1 -44 Q${Math.sin(a * 0.0175) * 22} ${-58 + Math.abs(a) * 0.12} ${Math.sin(a * 0.0175) * 40} ${-42 + Math.abs(a) * 0.22}" stroke="#2fbf5a" stroke-width="8" fill="none" stroke-linecap="round"/>`).join('')}<circle cx="1" cy="-43" r="4" fill="#8a5a2b"/>`,
  toucan: () => `<ellipse cx="0" cy="-22" rx="14" ry="20" fill="#1b1b24"/><ellipse cx="3" cy="-18" rx="8" ry="12" fill="#fff"/><circle cx="2" cy="-38" r="9" fill="#1b1b24"/><path d="M9 -43 Q40 -48 36 -26 Q23 -30 9 -34Z" fill="#ff9f1c"/><path d="M13 -37 Q30 -38 35 -30" stroke="#e65a1f" stroke-width="2.4" fill="none"/><path d="M9 -43 Q22 -45 24 -40 Q14 -39 9 -36Z" fill="#ffd23f"/><ellipse cx="-3" cy="-12" rx="7" ry="6" fill="#ffd23f"/><circle cx="5" cy="-40" r="2.6" fill="#fff"/><circle cx="5.6" cy="-40" r="1.2" fill="#000"/>`,
  chest: () => `<rect x="-27" y="-26" width="54" height="26" rx="4" fill="#7a3a1b"/><path d="M-27 -26 Q0 -50 27 -26Z" fill="#9a4a24"/><rect x="-27" y="-14" width="54" height="5" fill="#ffd23f"/><rect x="-5" y="-22" width="10" height="12" rx="2" fill="#ffd23f"/><circle cx="-10" cy="-33" r="5" fill="#ffd700"/><circle cx="6" cy="-37" r="5" fill="#ffd700"/><circle cx="16" cy="-31" r="4" fill="#ff4d6d"/>`,
  bigCrown: () => `<path d="M-30 0 L-30 -34 L-15 -18 L0 -42 L15 -18 L30 -34 L30 0Z" fill="#ffd23f" stroke="#d19a00" stroke-width="3"/><rect x="-30" y="-9" width="60" height="9" fill="#e0a800"/><circle cx="-30" cy="-37" r="5" fill="#ff4d4d"/><circle cx="0" cy="-45" r="5.5" fill="#3b82f6"/><circle cx="30" cy="-37" r="5" fill="#ff4d4d"/><circle cx="-10" cy="-4.5" r="3" fill="#ff4d4d"/><circle cx="10" cy="-4.5" r="3" fill="#3ddc84"/>`,
  beachball: () => `<circle cx="0" cy="-20" r="20" fill="#fff"/><path d="M0 -20 L-20 -20 A20 20 0 0 1 -10 -37Z" fill="#ff4d4d"/><path d="M0 -20 L-10 -37 A20 20 0 0 1 10 -37Z" fill="#ffd23f"/><path d="M0 -20 L10 -37 A20 20 0 0 1 20 -20Z" fill="#3b82f6"/><circle cx="0" cy="-20" r="3" fill="#fff"/>`,
   // drawn behind the roof, see busSvg()
};

// ---------------- body patterns (SVG <pattern> tiles used inside the body clip) ----------------
function patternDefs(p) {
  const c = p.colors, c0 = c[0] || '#fff';
  const heart = (x, y, s, f) => `<path d="M${x} ${y + 6 * s} c-${10 * s} -${8 * s} -${8 * s} -${18 * s} 0 -${11 * s} c${8 * s} -${7 * s} ${10 * s} ${3 * s} 0 ${11 * s}z" fill="${f}"/>`;
  const tiles = {
    stripes: `<pattern id="hh-pat" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="16" height="46" fill="${c0}"/></pattern>`,
    hearts: `<pattern id="hh-pat" width="44" height="44" patternUnits="userSpaceOnUse">${heart(12, 18, 1, c0)}${heart(34, 40, 1, c0)}</pattern>`,
    clover: `<pattern id="hh-pat" width="46" height="46" patternUnits="userSpaceOnUse"><g fill="${c0}"><circle cx="12" cy="9" r="5"/><circle cx="21" cy="9" r="5"/><circle cx="12" cy="18" r="5"/><circle cx="21" cy="18" r="5"/><rect x="16" y="19" width="2" height="10"/></g><g fill="${c0}" opacity=".7"><circle cx="35" cy="34" r="3.5"/><circle cx="41" cy="34" r="3.5"/><circle cx="35" cy="40" r="3.5"/><circle cx="41" cy="40" r="3.5"/></g></pattern>`,
    eggs: `<pattern id="hh-pat" width="48" height="48" patternUnits="userSpaceOnUse"><ellipse cx="14" cy="16" rx="8" ry="11" fill="${c[0]}"/><rect x="6" y="15" width="16" height="3" fill="${c[1] || '#ffd23f'}"/><ellipse cx="38" cy="38" rx="7" ry="10" fill="${c[2] || '#6ec6ff'}"/><rect x="31" y="37" width="14" height="3" fill="${c[0]}"/></pattern>`,
    snow: `<pattern id="hh-pat" width="42" height="42" patternUnits="userSpaceOnUse"><g stroke="${c0}" stroke-width="2.4" stroke-linecap="round"><path d="M12 5 V19 M5 12 H19 M7 7 L17 17 M17 7 L7 17"/><path d="M33 26 V36 M28 31 H38 M30 28 L36 34 M36 28 L30 34" opacity=".8"/></g></pattern>`,
    leaves: `<pattern id="hh-pat" width="44" height="44" patternUnits="userSpaceOnUse"><ellipse cx="12" cy="12" rx="9" ry="4.5" fill="${c0}" transform="rotate(35 12 12)"/><ellipse cx="34" cy="32" rx="9" ry="4.5" fill="${c0}" opacity=".8" transform="rotate(-30 34 32)"/></pattern>`,
    petals: `<pattern id="hh-pat" width="46" height="46" patternUnits="userSpaceOnUse"><g fill="${c[0]}">${[0, 1, 2, 3, 4].map((k) => `<circle cx="${14 + Math.cos(k * 1.2566) * 6.5}" cy="${14 + Math.sin(k * 1.2566) * 6.5}" r="4.6"/>`).join('')}</g><circle cx="14" cy="14" r="3.2" fill="${c[1] || '#ffd23f'}"/><g fill="${c[0]}" opacity=".7">${[0, 1, 2, 3, 4].map((k) => `<circle cx="${36 + Math.cos(k * 1.2566) * 4.5}" cy="${36 + Math.sin(k * 1.2566) * 4.5}" r="3.2"/>`).join('')}</g></pattern>`,
    bats: `<pattern id="hh-pat" width="52" height="46" patternUnits="userSpaceOnUse"><path d="M14 20 q-4 -10 -12 -6 q4 3 4 7 q3 -2 6 4 q2 -3 4 0 q3 -6 6 -4 q0 -4 4 -7 q-8 -4 -12 6z" fill="${c0}" transform="translate(6 0)"/><path d="M14 20 q-4 -10 -12 -6 q4 3 4 7 q3 -2 6 4 q2 -3 4 0 q3 -6 6 -4 q0 -4 4 -7 q-8 -4 -12 6z" fill="${c0}" opacity=".75" transform="translate(26 20) scale(.8)"/></pattern>`,
    sun: `<pattern id="hh-pat" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="5.5" fill="${c0}"/><g stroke="${c0}" stroke-width="2.2" stroke-linecap="round">${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<path d="M${14 + Math.cos(k * 0.785) * 9} ${14 + Math.sin(k * 0.785) * 9} L${14 + Math.cos(k * 0.785) * 12.5} ${14 + Math.sin(k * 0.785) * 12.5}"/>`).join('')}</g></pattern>`,
    flowers: `<pattern id="hh-pat" width="120" height="120" patternUnits="userSpaceOnUse"><g transform="translate(26 30)"><g fill="${c[0]}">${[0, 1, 2, 3, 4].map((k) => `<ellipse cx="0" cy="-8" rx="5.5" ry="9" transform="rotate(${k * 72})"/>`).join('')}</g><circle r="3.4" fill="#ffd23f"/></g><g transform="translate(88 88) scale(.7)"><g fill="${c[1]}">${[0, 1, 2, 3, 4].map((k) => `<ellipse cx="0" cy="-8" rx="5.5" ry="9" transform="rotate(${k * 72})"/>`).join('')}</g><circle r="3.4" fill="#ffd23f"/></g></pattern>`,
    rainbow: '',
    waves: `<pattern id="hh-pat" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 12 q7.5 -9 15 0 t15 0 t15 0 t15 0" stroke="${c0}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-15 27 q7.5 -9 15 0 t15 0 t15 0 t15 0 t15 0" stroke="${c[1] || c0}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/></pattern>`,
    stars: `<pattern id="hh-pat" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M14 6 l2.6 6.6 7 .5 -5.4 4.5 1.8 6.9 -6 -3.8 -6 3.8 1.8 -6.9 -5.4 -4.5 7 -.5z" fill="${c0}"/><circle cx="38" cy="14" r="1.8" fill="${c[1] || '#fff'}"/><circle cx="34" cy="38" r="2.6" fill="${c[1] || '#fff'}" opacity=".8"/><circle cx="8" cy="40" r="1.5" fill="${c[1] || '#fff'}"/></pattern>`,
    grid: `<pattern id="hh-pat" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" stroke="${c0}" stroke-width="2" fill="none" opacity=".75"/><circle cx="0" cy="0" r="3" fill="${c[1] || c0}"/></pattern>`,
    balls: `<pattern id="hh-pat" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="8.5" fill="none" stroke="${c0}" stroke-width="2.2"/><path d="M5.5 14H22.5M14 5.5V22.5" stroke="${c0}" stroke-width="2"/><circle cx="36" cy="37" r="6" fill="none" stroke="${c0}" stroke-width="2" opacity=".7"/></pattern>`,
    diamonds: `<pattern id="hh-pat" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M20 5 L31 20 L20 35 L9 20Z" fill="${c0}" opacity=".9"/><circle cx="0" cy="0" r="2.4" fill="${c0}"/><circle cx="40" cy="40" r="2.4" fill="${c0}"/></pattern>`,
    none: '',
  };
  return tiles[p.id] || '';
}

// ---------------- the bus (front view) ----------------
const passengerSvg = (x, y, color, hatId, i) => `
  <g transform="translate(${x} ${y})">
    <g class="hh-arm hh-arm-l" style="--d:${(i * 0.37).toFixed(2)}s"><rect x="-33" y="6" width="9" height="30" rx="4.5" fill="${color}" transform="rotate(28 -29 10)"/></g>
    <g class="hh-arm hh-arm-r" style="--d:${(i * 0.37 + 0.5).toFixed(2)}s"><rect x="24" y="6" width="9" height="30" rx="4.5" fill="${color}" transform="rotate(-28 29 10)"/></g>
    <ellipse cx="0" cy="26" rx="20" ry="26" fill="${shade(color, -0.12)}"/>
    <rect x="-20" y="-22" width="40" height="46" rx="20" fill="${color}"/>
    <ellipse cx="-8" cy="-12" rx="6" ry="4" fill="#fff" opacity=".35"/>
    <circle cx="-7" cy="0" r="2.6" fill="#1b1d2b"/><circle cx="7" cy="0" r="2.6" fill="#1b1d2b"/>
    <path d="M-7 8 Q0 15 7 8" stroke="#1b1d2b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <g transform="translate(0 -22)">${(HATS[hatId] || HATS.none)()}</g>
  </g>`;

export function busSvg(theme) {
  const b = theme.bus, body = b.body, dark = shade(body, -0.22), light = shade(body, 0.4);
  const bodyPath = 'M50 158 Q50 112 96 108 H304 Q350 112 350 158 V318 Q350 334 334 334 H66 Q50 334 50 318 Z';
  const roofX = [120, 200, 280];
  const hasArch = b.roof.includes('rainbowArch');
  const pass = [[90, 70], [145, 56], [200, 48], [255, 56], [310, 70]].map(([x, y], i) => passengerSvg(x, y, PASSENGER_PALETTE[(i + (theme.id.length % 3)) % PASSENGER_PALETTE.length], b.hats[i], i)).join('');
  const roof = b.roof.map((r, i) => (r === 'rainbowArch' ? '' : `<g transform="translate(${roofX[i]} 108)">${ROOF[r] ? ROOF[r]() : ''}</g>`)).join('');
  const arch = hasArch ? RAINBOW.map((c, i) => `<path d="M${58 + i * 5} 110 Q200 ${-44 + i * 9} ${342 - i * 5} 110" fill="none" stroke="${c}" stroke-width="6" opacity=".95"/>`).join('') : '';
  const rainbowBand = b.pattern.id === 'rainbow' ? RAINBOW.map((c, i) => `<rect x="50" y="${243 + i * 4.2}" width="300" height="4.4" fill="${c}"/>`).join('') : '';
  const ex = b.extras || [];
  return `
  <g id="hh-bus">
    <ellipse cx="200" cy="352" rx="165" ry="14" fill="#000" opacity=".22"/>
    ${arch}
    <g id="hh-roof-people">${pass}</g>
    ${roof}
    <g stroke="#cfd6e6" stroke-width="4" stroke-linecap="round"><path d="M62 108 H338"/><path d="M80 108 V98 M200 108 V96 M320 108 V98" stroke-width="3"/></g>
    ${ex.includes('snowRoof') ? `<g fill="#fff"><ellipse cx="90" cy="108" rx="34" ry="8"/><ellipse cx="200" cy="106" rx="50" ry="9"/><ellipse cx="305" cy="108" rx="34" ry="8"/></g>` : ''}
    <path d="${bodyPath}" fill="${body}"/>
    <clipPath id="hh-busclip"><path d="${bodyPath}"/></clipPath>
    <g clip-path="url(#hh-busclip)">
      ${b.pattern.id !== 'rainbow' ? `<rect x="40" y="100" width="320" height="240" fill="url(#hh-pat)" opacity=".92"/>` : ''}
      ${rainbowBand}
      <rect x="40" y="262" width="320" height="14" fill="${b.trim}" opacity=".95"/>
      <rect x="40" y="108" width="320" height="20" fill="${light}" opacity=".45"/>
      <rect x="40" y="300" width="320" height="40" fill="${dark}" opacity=".35"/>
    </g>
    <path d="M60 140 Q66 118 98 114 H190" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>
    <rect x="118" y="116" width="164" height="24" rx="7" fill="#15161d"/><text id="hh-dest" x="200" y="133.5" text-anchor="middle" font-family="'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif" font-weight="900" font-size="15" fill="#ffc83d" letter-spacing="2">${theme.sign[0]}</text>
    <rect x="74" y="146" width="118" height="100" rx="18" fill="url(#hh-glass)" stroke="${dark}" stroke-width="5"/>
    <rect x="208" y="146" width="118" height="100" rx="18" fill="url(#hh-glass)" stroke="${dark}" stroke-width="5"/>
    <path d="M86 160 L112 160 L90 232 L86 232Z" fill="#fff" opacity=".28"/><path d="M220 160 L246 160 L224 232 L220 232Z" fill="#fff" opacity=".28"/>
    <g>
      <rect x="110" y="196" width="48" height="50" rx="22" fill="#2f9bff"/><circle cx="133" cy="196" r="24" fill="#2f9bff"/>
      <rect x="112" y="191" width="42" height="12" rx="6" fill="#15161d"/><path d="M121 213 Q133 222 145 213" stroke="#15161d" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="133" cy="244" rx="26" ry="9" fill="none" stroke="#222" stroke-width="5"/>
      <circle cx="108" cy="240" r="7" fill="#2f9bff"/><circle cx="158" cy="240" r="7" fill="#2f9bff"/>
    </g>
    <g class="hh-driver-wave">
      <rect x="244" y="196" width="48" height="50" rx="22" fill="#ffc83d"/><circle cx="267" cy="196" r="24" fill="#ffc83d"/>
      <circle cx="258" cy="193" r="2.8" fill="#1b1d2b"/><circle cx="277" cy="193" r="2.8" fill="#1b1d2b"/><path d="M257 203 Q267 213 278 203" stroke="#1b1d2b" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g transform="translate(267 174)">${(HATS[b.driverHat !== undefined ? b.driverHat : (b.hats[3] === 'none' ? 'sunhat' : b.hats[3])] || HATS.none)()}</g>
      <g transform="rotate(-24 293 205)"><rect class="hh-wave" x="288" y="170" width="11" height="40" rx="5.5" fill="#ffc83d"/></g>
    </g>
    <rect x="192" y="146" width="16" height="100" fill="${dark}"/>
    <rect x="26" y="168" width="22" height="50" rx="9" fill="#2a2f3d"/><rect x="352" y="168" width="22" height="50" rx="9" fill="#2a2f3d"/>
    <rect x="116" y="276" width="168" height="46" rx="13" fill="#aab3c6" stroke="#8a93a8" stroke-width="3"/>
    <g stroke="#8a93a8" stroke-width="3" stroke-linecap="round"><path d="M128 290 H272 M128 299 H272 M128 308 H272"/></g>
    <g class="hh-lights"><circle cx="90" cy="292" r="25" fill="#fff8c4" opacity=".35"/><circle cx="310" cy="292" r="25" fill="#fff8c4" opacity=".35"/>
      <circle cx="90" cy="292" r="19" fill="#fffbe0" stroke="#d8dce8" stroke-width="4"/><circle cx="310" cy="292" r="19" fill="#fffbe0" stroke="#d8dce8" stroke-width="4"/>
      <circle cx="84" cy="286" r="6" fill="#fff"/><circle cx="304" cy="286" r="6" fill="#fff"/></g>
    <rect x="52" y="320" width="296" height="24" rx="12" fill="#c9d0de" stroke="#9aa3b8" stroke-width="2"/>
    <rect x="166" y="324" width="68" height="16" rx="4" fill="#2f9bff"/><path d="M200 326 l2.5 5 5 .7 -3.6 3.5 .9 5 -4.8 -2.5 -4.8 2.5 .9 -5 -3.6 -3.5 5 -.7z" fill="#fff" transform="scale(.8) translate(50 82)"/>
    <rect x="72" y="334" width="46" height="26" rx="11" fill="#1c202d"/><rect x="282" y="334" width="46" height="26" rx="11" fill="#1c202d"/>
    ${ex.includes('neon') ? `<g fill="none" stroke-linejoin="round"><path d="${bodyPath}" stroke="#3df5ff" stroke-width="3.5" opacity=".95"/><path d="${bodyPath}" stroke="#3df5ff" stroke-width="9" opacity=".25"/><path d="M74 146 h118 v100 h-118z M208 146 h118 v100 h-118z" stroke="#ff4fd8" stroke-width="2.5" opacity=".9"/></g><ellipse cx="200" cy="352" rx="150" ry="9" fill="#3df5ff" opacity=".45"/>` : ''}
    ${ex.includes('shield') ? `<g transform="translate(200 266)"><path d="M-15 -14 H15 V2 Q15 14 0 20 Q-15 14 -15 2Z" fill="#fff" stroke="#ffd23f" stroke-width="3"/><path d="M0 -8 Q7 -1 4 6 Q8 5 6 12 Q0 16 -6 12 Q-8 6 -3 2 Q-3 -3 0 -8Z" fill="#ff7a1a"/></g>` : ''}
    ${ex.includes('crest') ? `<g transform="translate(200 266)"><path d="M-15 -14 H15 V2 Q15 14 0 20 Q-15 14 -15 2Z" fill="#ffd23f" stroke="#7a3fd0" stroke-width="3"/><path d="M-8 -6 L-4 2 L0 -9 L4 2 L8 -6 L8 6 H-8Z" fill="#7a3fd0"/></g>` : ''}
    ${ex.includes('sportStripe') ? `<g clip-path="url(#hh-busclip)"><path d="M40 248 H360 V254 H40Z" fill="#fff" opacity=".95"/><path d="M40 255 H360 V258 H40Z" fill="#1d4ed8"/></g>` : ''}
    ${ex.includes('wreath') ? `<circle cx="200" cy="299" r="19" fill="none" stroke="#1f8f4a" stroke-width="9"/><circle cx="188" cy="288" r="3" fill="#ef3b3b"/><circle cx="212" cy="290" r="3" fill="#ef3b3b"/><circle cx="200" cy="318" r="3" fill="#ef3b3b"/><path d="M194 316 l6 8 6 -8 l-6 -3z" fill="#ef3b3b"/>` : ''}
    ${ex.includes('lights') ? `<path d="M56 126 Q128 150 200 126 Q272 150 344 126" fill="none" stroke="#1b4d2b" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const x = 62 + i * 34, y = 126 + (i % 2 ? 11 : 17); return `<circle class="hh-bulb" style="--d:${(i * 0.23).toFixed(2)}s" cx="${x}" cy="${y}" r="5" fill="${['#ff4d4d', '#ffd23f', '#3ddc84', '#3b82f6'][i % 4]}"/>`; }).join('')}` : ''}
    ${ex.includes('cobweb') ? `<g stroke="#fff" stroke-width="1.6" fill="none" opacity=".75"><path d="M54 150 Q80 152 96 176 M54 150 Q60 174 78 196 M54 150 L100 150 M54 150 L54 200"/><path d="M62 150 Q66 164 78 170 M70 150 Q74 160 88 163"/></g><g transform="translate(332 134)"><ellipse cx="0" cy="-6" rx="4.6" ry="5.4" fill="#1b1b1b"/><path d="M0 -12 V-30" stroke="#fff" stroke-width="1.2" opacity=".7"/></g>` : ''}
  </g>`;
}


// ---------------- standalone bus portrait (garage / shop cards): a small street scene around one bus ----------------
// uid makes every id unique so 16 of these can sit on one page. look: { id, bus, sign, sky?: [top,bottom], skyline?: [colours] }
export function busCardSvg(look, uid = 'x') {
  const [sky0, sky1] = look.sky || ['#8fd3ff', '#fff0fa'];
  const sk = look.skyline || ['#ffd3a8', '#ffb3c7', '#b9e4ff', '#ffe28a'];
  const blocks = [[0, 96, 44], [40, 130, 40], [78, 84, 46], [296, 112, 44], [334, 144, 40], [366, 90, 46]].map(([x, h, w], i) => `<rect x="${x - 6}" y="${270 - h}" width="${w}" height="${h + 2}" rx="3" fill="${sk[i % sk.length]}"/>${[0, 1, 2].map((k) => `<rect x="${x + 2 + (k % 2) * 16}" y="${270 - h + 10 + k * 20}" width="9" height="11" rx="2" fill="#fff" opacity=".5"/>`).join('')}`).join('');
  const svg = `<svg viewBox="0 -24 400 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${look.name || look.id} bus">
    <defs>
      <linearGradient id="hh-cardsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky0}"/><stop offset="1" stop-color="${sky1}"/></linearGradient>
      <linearGradient id="hh-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8f3ff"/><stop offset="1" stop-color="#8fd0f5"/></linearGradient>
      ${patternDefs(look.bus.pattern)}
    </defs>
    <rect x="0" y="-24" width="400" height="440" fill="url(#hh-cardsky)"/>
    ${blocks}
    <rect x="0" y="262" width="400" height="154" fill="${look.ground || '#7f8cab'}"/>
    <path d="M0 262 H400" stroke="#fff" stroke-width="4" opacity=".5"/>
    <path d="M0 384 H400" stroke="#fff" stroke-width="4" stroke-dasharray="28 26" opacity=".35"/>
    ${busSvg({ id: look.id, bus: look.bus, sign: look.sign || ['BUS'] })}
  </svg>`;
  return svg.replace(/id="(hh-[a-z-]+)"/g, `id="$1-${uid}"`).replace(/url\(#(hh-[a-z-]+)\)/g, `url(#$1-${uid})`);
}

// ---------------- trees ----------------
function tree(type, x, y, s, colors) {
  const [leaf, acc] = colors, T = `translate(${x} ${y}) scale(${s})`;
  if (type === 'palm') return `<g transform="${T}"><path d="M0 0 Q10 -50 -4 -108" stroke="${acc}" stroke-width="11" fill="none" stroke-linecap="round"/>${[-70, -35, 0, 35, 70, 110, -110].map((a) => `<path d="M-4 -108 Q${Math.sin(a * 0.0175) * 40} ${-118 + Math.abs(a) * 0.22} ${Math.sin(a * 0.0175) * 74} ${-98 + Math.abs(a) * 0.5}" stroke="${leaf}" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('')}<circle cx="-4" cy="-106" r="6" fill="${acc}"/></g>`;
  if (type === 'blossom') return `<g transform="${T}"><path d="M0 0 V-52 M0 -34 L-16 -56 M0 -40 L14 -62" stroke="${theme_trunk(acc)}" stroke-width="9" stroke-linecap="round"/><circle cx="0" cy="-78" r="34" fill="${leaf}"/><circle cx="-26" cy="-60" r="24" fill="${leaf}"/><circle cx="26" cy="-62" r="25" fill="${leaf}"/><g fill="#fff" opacity=".7"><circle cx="-10" cy="-86" r="4"/><circle cx="14" cy="-74" r="4"/><circle cx="-28" cy="-60" r="3.5"/><circle cx="28" cy="-66" r="3.5"/></g></g>`;
  if (type === 'round') return `<g transform="${T}"><rect x="-6" y="-46" width="12" height="46" rx="4" fill="#7a4a2b"/><circle cx="0" cy="-72" r="32" fill="${leaf}"/><circle cx="-24" cy="-56" r="22" fill="${leaf}"/><circle cx="24" cy="-58" r="23" fill="${acc}" opacity=".85"/><circle cx="-6" cy="-84" r="18" fill="${shade(leaf, 0.25)}" opacity=".6"/></g>`;
  if (type === 'pine') return `<g transform="${T}"><rect x="-5" y="-26" width="10" height="26" fill="#6b4226"/>${[[-26, 56, 0], [-52, 46, 1], [-76, 36, 2]].map(([yy, w]) => `<path d="M0 ${yy - 34} L${-w / 1.3} ${yy} H${w / 1.3}Z" fill="${leaf}"/>`).join('')}<g fill="${acc === '#ffffff' ? '#fff' : 'none'}"><path d="M0 -110 L-14 -88 Q0 -82 14 -88Z"/><path d="M0 -86 L-22 -56 Q0 -48 22 -56Z"/></g>${acc !== '#ffffff' ? `<path d="M0 -118 l4 9 9 .7 -7 6 2.4 9 -8.4 -5 -8.4 5 2.4 -9 -7 -6 9 -.7z" fill="${acc}"/>${[[-10, -80], [12, -66], [-18, -44], [16, -36], [0, -56]].map(([a, b], i) => `<circle class="hh-bulb" style="--d:${i * 0.3}s" cx="${a}" cy="${b}" r="3.4" fill="${['#ff4d4d', '#ffd23f', '#3b82f6'][i % 3]}"/>`).join('')}` : ''}</g>`;
  return `<g transform="${T}" stroke="${leaf}" stroke-width="7" stroke-linecap="round" fill="none"><path d="M0 0 V-70 M0 -40 L-26 -78 M0 -50 L24 -88 M0 -70 L-12 -104 M-26 -78 L-40 -84 M24 -88 L38 -92"/></g>`;
}
const theme_trunk = (c) => (/^#/.test(c) ? c : '#7a4a2b');

// ---------------- the whole scene ----------------
export function sceneSvg(theme) {
  const r = seeded(theme.id.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
  const [sky0, sky1] = theme.sky;
  const stars = theme.stars ? Array.from({ length: 34 }, (_, i) => `<circle class="hh-star" style="--d:${(r() * 3).toFixed(2)}s" cx="${(r() * 390).toFixed(0)}" cy="${(r() * 330).toFixed(0)}" r="${(0.7 + r() * 1.4).toFixed(1)}" fill="#fff"/>`).join('') : '';
  const cel = {
    sun: `<circle cx="318" cy="146" r="86" fill="url(#hh-glow)"/><circle cx="318" cy="146" r="31" fill="#fff4a6"/>`,
    sunset: `<circle cx="285" cy="418" r="150" fill="url(#hh-glow)"/><circle cx="285" cy="430" r="60" fill="#ffd36a"/>`,
    moon: `<circle cx="308" cy="150" r="96" fill="url(#hh-glow)"/><circle cx="308" cy="150" r="34" fill="${theme.id === 'halloween' ? '#ffb454' : '#fff6d6'}"/><g fill="#000" opacity=".1"><circle cx="298" cy="140" r="7"/><circle cx="320" cy="160" r="5"/><circle cx="312" cy="136" r="3.5"/></g>`,
    none: '',
  }[theme.celestial];
  const rainbow = theme.rainbow ? RAINBOW.map((c, i) => `<path d="M${-20 + i * 9} 470 Q195 ${210 + i * 8} ${410 - i * 9} 470" fill="none" stroke="${c}" stroke-width="9" opacity=".6"/>`).join('') : '';
  const cloud = (x, y, s, d) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="hh-cloud" style="--d:${d}s"><g fill="#fff" opacity=".92"><ellipse cx="0" cy="0" rx="44" ry="17"/><ellipse cx="-24" cy="-10" rx="22" ry="17"/><ellipse cx="10" cy="-18" rx="26" ry="21"/><ellipse cx="34" cy="-4" rx="20" ry="14"/></g></g></g>`;
  const night = theme.stars;
  const clouds = night ? `<g opacity=".18">${cloud(70, 300, 1, 0)}</g>` : `${cloud(60, 330, 1.1, 0)}${cloud(300, 300, 0.9, -12)}${cloud(190, 360, 0.7, -25)}`;
  const hills = theme.hills ? `<path d="M-10 470 Q60 400 150 440 T300 420 T400 450 V500 H-10Z" fill="${theme.hills[0]}"/><path d="M-10 490 Q90 430 190 470 T400 460 V520 H-10Z" fill="${theme.hills[1]}"/>` : '';
  const skyline = theme.skyline ? (() => { const xs = [0, 40, 78, 120, 162, 200, 245, 285, 330]; return xs.map((x, i) => { const h = 70 + ((i * 53) % 90), w = 36 + ((i * 17) % 14); const col = theme.skyline[i % theme.skyline.length]; return `<g><rect x="${x}" y="${470 - h}" width="${w}" height="${h + 2}" rx="3" fill="${col}"/>${Array.from({ length: Math.floor(h / 22) }, (_, k) => `<rect x="${x + 7}" y="${470 - h + 10 + k * 22}" width="${w - 14}" height="9" rx="2" fill="#fff" opacity=".55"/>`).join('')}</g>`; }).join(''); })() : '';
  const sea = theme.sea ? `<rect x="0" y="446" width="390" height="30" fill="${theme.sea}"/><g stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"><path d="M20 456 q8 -5 16 0 t16 0 M150 462 q8 -5 16 0 t16 0 M270 454 q8 -5 16 0 t16 0"/></g>` : '';
  const lt = theme.trees, tc = theme.treeColors;
  const trees = `${tree(lt, 34, 556, 1.05, tc)}${tree(lt, 352, 560, 1.15, tc)}${tree(lt, 92, 520, 0.7, tc)}${tree(lt, 304, 518, 0.62, tc)}`;
  const flowers = (x, y, cols) => cols.map((c, i) => `<circle cx="${x + i * 16 - 22}" cy="${y + ((i * 7) % 12)}" r="6" fill="${c}"/>`).join('');
  const bush = theme.trees === 'pine' || theme.id === 'halloween' ? '#2f8f6a' : '#3fbf55';
  return `
  <svg class="hh-scene" viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="hh-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky0}"/><stop offset="1" stop-color="${sky1}"/></linearGradient>
      <radialGradient id="hh-glow"><stop offset="0" stop-color="#fff6c0" stop-opacity=".75"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></radialGradient>
      <linearGradient id="hh-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8f3ff"/><stop offset="1" stop-color="#8fd0f5"/></linearGradient>
      ${patternDefs(theme.bus.pattern)}
    </defs>
    <rect width="390" height="844" fill="url(#hh-sky)"/>
    ${stars}${cel}${rainbow}${clouds}${hills}${sea}${skyline}
    <rect x="0" y="470" width="390" height="374" fill="${theme.sidewalk}"/>
    <path d="M70 536 H320 L440 844 H-50Z" fill="${theme.ground}"/>
    <path d="M70 536 L-50 844 M320 536 L440 844" stroke="#fff" stroke-width="5" opacity=".8" fill="none"/>
    <path d="M195 540 L195 844" stroke="#fff" stroke-width="5" stroke-dasharray="26 30" opacity=".55"/>
    <rect x="0" y="470" width="390" height="8" fill="#000" opacity=".06"/>
    ${trees}
    <g transform="translate(14.5 338) scale(.9)">${busSvg(theme)}</g>
    <g><ellipse cx="14" cy="842" rx="96" ry="56" fill="${bush}"/><ellipse cx="86" cy="852" rx="70" ry="40" fill="${shade(bush, -0.12)}"/><ellipse cx="382" cy="842" rx="104" ry="60" fill="${bush}"/><ellipse cx="300" cy="856" rx="64" ry="38" fill="${shade(bush, -0.12)}"/>
      ${flowers(46, 806, theme.particles.colors.length ? theme.particles.colors.slice(0, 3).concat(['#ff4d4d']) : ['#ff4d4d', '#ffd23f', '#ff9ad5'])}${flowers(352, 810, ['#ff4d4d', '#ffd23f', '#ff9ad5'])}</g>
  </svg>`;
}

// ---------------- falling particles (HTML so they can animate freely) ----------------
const PARTICLE = {
  snow: (c) => `<circle cx="6" cy="6" r="5" fill="${c}"/>`,
  petal: (c) => `<path d="M6 0 Q13 6 6 14 Q-1 6 6 0Z" fill="${c}"/>`,
  leaf: (c) => `<path d="M2 12 Q0 2 12 0 Q14 10 2 12Z" fill="${c}"/><path d="M2 12 L10 3" stroke="#00000033" stroke-width="1"/>`,
  heart: (c) => `<path d="M7 13 C-4 6 1 -2 7 3 C13 -2 18 6 7 13Z" fill="${c}"/>`,
  bat: (c) => `<path d="M12 8 q-3 -8 -11 -4 q3 2 3 5 q2 -1 4 3 q1 -2 4 0 q2 -4 4 -3 q0 -3 3 -5 q-8 -4 -11 4z" fill="${c}" transform="scale(1.1)"/>`,
  clover: (c) => `<g fill="${c}"><circle cx="5" cy="5" r="4"/><circle cx="11" cy="5" r="4"/><circle cx="5" cy="11" r="4"/><circle cx="11" cy="11" r="4"/></g>`,
  confetti: (c) => `<rect x="1" y="2" width="9" height="5" rx="1.5" fill="${c}"/>`,
  sparkle: (c) => `<path d="M7 0 L8.6 5.4 L14 7 L8.6 8.6 L7 14 L5.4 8.6 L0 7 L5.4 5.4Z" fill="${c}"/>`,
};
export function particlesHtml(theme) {
  const p = theme.particles; if (!p || p.type === 'none' || !PARTICLE[p.type]) return '';
  const r = seeded(99 + theme.id.length * 13);
  return Array.from({ length: p.count }, (_, i) => {
    const size = 10 + r() * 14, left = r() * 100, dur = (p.type === 'sparkle' ? 2.4 : 7) + r() * 6, delay = -r() * dur, c = p.colors[i % p.colors.length], sway = 10 + r() * 28;
    return `<span class="hh-p hh-p-${p.type}" style="left:${left.toFixed(1)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s;--sway:${sway.toFixed(0)}px;${p.type === 'sparkle' ? `top:${(48 + r() * 18).toFixed(0)}%;` : ''}"><svg viewBox="0 0 16 16" width="100%" height="100%">${PARTICLE[p.type](c)}</svg></span>`;
  }).join('');
}
