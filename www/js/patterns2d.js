// patterns2d.js - body patterns for vehicle skins, drawn on a 128 x 128 canvas (copied from the 3D skin code, no Three.js needed).
const heartPath = (g, x, y, s) => { g.beginPath(); g.moveTo(x, y + s * 0.35); g.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.2, y - s * 0.9, x, y - s * 0.3); g.bezierCurveTo(x + s * 0.2, y - s * 0.9, x + s, y - s * 0.4, x, y + s * 0.35); g.fill(); };
const grid4 = (fn) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) fn(i * 32 + 16, j * 32 + 16, i, j); };
export const DRAW = {
  stripes: (g, acc) => { g.fillStyle = acc(0); for (let x = -128; x < 256; x += 36) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x - 114, 128); g.lineTo(x - 128, 128); g.fill(); } },
  checker: (g, acc) => { g.fillStyle = acc(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) g.fillRect(i * 32, j * 32, 32, 32); },
  dots:    (g, acc) => { g.fillStyle = acc(0); grid4((x, y) => { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }); },
  zebra:   (g, acc) => { g.fillStyle = acc(0); for (let x = 0; x < 128; x += 26) g.fillRect(x + (x % 52 ? 6 : 0), 0, 10, 128); },
  stars:   (g, acc) => { g.fillStyle = acc(0); g.font = '26px sans-serif'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillText('\u2605', i * 32 + 3, j * 32 + 26); },
  waves:   (g, acc) => { g.strokeStyle = acc(0); g.lineWidth = 5; for (let y = 14; y < 140; y += 28) { g.beginPath(); for (let x = 0; x <= 128; x += 4) g.lineTo(x, y + Math.sin(x / 10) * 7); g.stroke(); } },
  grid:    (g, acc) => { g.strokeStyle = acc(0); g.lineWidth = 3; for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); } },
  balls:   (g, acc) => { g.strokeStyle = acc(0); g.lineWidth = 3; grid4((x, y) => { g.beginPath(); g.arc(x, y, 11, 0, 7); g.moveTo(x - 11, y); g.lineTo(x + 11, y); g.moveTo(x, y - 11); g.lineTo(x, y + 11); g.stroke(); }); },
  leaves:  (g, acc) => { g.fillStyle = acc(0); grid4((x, y, i, j) => { g.save(); g.translate(x, y); g.rotate((i * 2 + j) * 0.9); g.beginPath(); g.ellipse(0, 0, 13, 6, 0, 0, 7); g.fill(); g.restore(); }); },
  diamonds:(g, acc) => { g.fillStyle = acc(0); grid4((x, y) => { g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 9, y); g.lineTo(x, y + 12); g.lineTo(x - 9, y); g.fill(); }); },
  hazard:  (g, acc) => { g.fillStyle = acc(0); for (let x = -128; x < 256; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 0); g.lineTo(x - 108, 128); g.lineTo(x - 128, 128); g.fill(); } },
  skulls:  (g, acc) => { g.fillStyle = acc(0); grid4((x, y) => { g.beginPath(); g.arc(x, y - 2, 9, 0, 7); g.fill(); g.fillRect(x - 5, y + 4, 10, 8); g.fillStyle = '#000'; g.fillRect(x - 5, y - 5, 4, 4); g.fillRect(x + 1, y - 5, 4, 4); g.fillStyle = acc(0); }); },
  bolt:    (g, acc) => { g.fillStyle = acc(0); grid4((x, y) => { g.beginPath(); g.moveTo(x + 3, y - 14); g.lineTo(x - 8, y + 2); g.lineTo(x - 1, y + 2); g.lineTo(x - 4, y + 14); g.lineTo(x + 8, y - 4); g.lineTo(x + 1, y - 4); g.fill(); }); },
  notes:   (g, acc) => { g.fillStyle = acc(0); g.font = '30px sans-serif'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillText((i + j) % 2 ? '\u266A' : '\u266B', i * 32 + 4, j * 32 + 28); },
  circus:  (g, acc) => { g.fillStyle = acc(0); for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 16, 128); },
  petals:  (g, acc) => { grid4((x, y, i, j) => { g.fillStyle = acc(0); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.2566) * 7, y + Math.sin(k * 1.2566) * 7, 5, 0, 7); g.fill(); } g.fillStyle = acc(1); g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }); },
  sun:     (g, acc) => { g.fillStyle = acc(0); g.strokeStyle = acc(0); g.lineWidth = 3; grid4((x, y) => { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(x + Math.cos(k * 0.785) * 9, y + Math.sin(k * 0.785) * 9); g.lineTo(x + Math.cos(k * 0.785) * 13, y + Math.sin(k * 0.785) * 13); g.stroke(); } }); },
  snow:    (g, acc) => { g.strokeStyle = acc(0); g.lineWidth = 2.5; grid4((x, y) => { for (let k = 0; k < 3; k++) { const a = k * 1.047; g.beginPath(); g.moveTo(x - Math.cos(a) * 9, y - Math.sin(a) * 9); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke(); } }); },
  bats:    (g, acc) => { g.fillStyle = acc(0); grid4((x, y) => { g.beginPath(); g.moveTo(x, y + 2); g.quadraticCurveTo(x - 6, y - 10, x - 15, y - 3); g.quadraticCurveTo(x - 9, y + 1, x - 6, y + 7); g.quadraticCurveTo(x - 2, y + 3, x, y + 8); g.quadraticCurveTo(x + 2, y + 3, x + 6, y + 7); g.quadraticCurveTo(x + 9, y + 1, x + 15, y - 3); g.quadraticCurveTo(x + 6, y - 10, x, y + 2); g.fill(); }); },
  hearts:  (g, acc) => { g.fillStyle = acc(0); grid4((x, y) => heartPath(g, x, y, 12)); },
  clover:  (g, acc) => { g.fillStyle = acc(0); grid4((x, y) => { for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.5708) * 5, y + Math.sin(k * 1.5708) * 5, 5, 0, 7); g.fill(); } g.fillRect(x - 1, y + 4, 2, 9); }); },
  eggs:    (g, acc) => { grid4((x, y, i, j) => { g.fillStyle = acc(i + j); g.beginPath(); g.ellipse(x, y, 8, 11, 0, 0, 7); g.fill(); g.fillStyle = acc(i + j + 1); g.fillRect(x - 8, y - 1, 16, 3); }); },
  rainbow: (g, acc, n) => { const bands = Math.max(n, 1), h = 128 / bands; for (let k = 0; k < bands; k++) { g.fillStyle = acc(k); g.fillRect(0, k * h, 128, h + 1); } },
};

export const PATTERN_NAMES = Object.keys(DRAW);
