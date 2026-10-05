// sceneArt.js - the home / loading backdrop, drawn as one layered vector landscape (no emoji, no loose sprites).
// Layers back to front: sky -> sun/moon/stars/clouds -> theme sky art -> far hills -> skyline/sea -> near hills -> tree line -> ground -> props.
// Everything is generated from a loadingThemes.js theme object, so each season and holiday gets its own look from the same code.
let uid = 0;
const hx = (h) => { const n = parseInt(h.replace('#', '').padEnd(6, '0').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = hx(a), y = hx(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const shade = (c, t) => (t < 0 ? mix(c, '#000000', -t) : mix(c, '#ffffff', t));
const rng = (seed) => { let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
const f = (n) => Math.round(n * 10) / 10;
const TRUNK = '#7a4a2b';

function Defs() {
  const items = [], id = 'sc' + (++uid) + '_';
  const lin = (stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => { const n = id + items.length; items.push(`<linearGradient id="${n}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`); return `url(#${n})`; };
  const rad = (stops, cx = 0.35, cy = 0.3, r = 0.8) => { const n = id + items.length; items.push(`<radialGradient id="${n}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`); return `url(#${n})`; };
  return { lin, rad, out: () => `<defs>${items.join('')}</defs>` };
}

// a smooth hill silhouette from the left edge to the right edge
function hill(W, H, y0, amp, ph, fq, fill) {
  const pts = []; for (let x = -20; x <= W + 40; x += 28) pts.push([x, y0 - amp * (Math.sin(x * fq + ph) * 0.6 + Math.sin(x * fq * 2.3 + ph * 2) * 0.4)]);
  let d = `M${f(pts[0][0])} ${H} L${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f((pts[i][0] + pts[i + 1][0]) / 2)} ${f((pts[i][1] + pts[i + 1][1]) / 2)}`;
  return `<path d="${d} L${W + 40} ${H}Z" fill="${fill}"/>`;
}

// ---------- trees ----------
function canopy(D, cx, by, s, leaf, accent, dots, r) {
  const g = D.rad([[0, shade(leaf, 0.3)], [0.6, leaf], [1, shade(leaf, -0.22)]], 0.32, 0.25, 0.85), dark = shade(leaf, -0.28);
  const blobs = [[0, -42, 20], [-15, -33, 15], [15, -33, 15], [0, -56, 13], [-9, -47, 13], [10, -48, 12]];
  let o = blobs.map(([x, y, rr]) => `<circle cx="${f(cx + x * s)}" cy="${f(by + (y + 4) * s)}" r="${f(rr * s)}" fill="${dark}"/>`).join('');
  o += blobs.map(([x, y, rr]) => `<circle cx="${f(cx + x * s)}" cy="${f(by + y * s)}" r="${f(rr * s)}" fill="${g}"/>`).join('');
  o += `<ellipse cx="${f(cx - 8 * s)}" cy="${f(by - 54 * s)}" rx="${f(9 * s)}" ry="${f(5 * s)}" fill="#fff" opacity=".2" transform="rotate(-25 ${f(cx - 8 * s)} ${f(by - 54 * s)})"/>`;
  for (let i = 0; i < dots; i++) { const a = r() * 6.28, d = r() * 22; o += `<circle cx="${f(cx + Math.cos(a) * d * s)}" cy="${f(by - 42 * s + Math.sin(a) * d * 0.9 * s)}" r="${f((1.6 + r() * 1.6) * s)}" fill="${accent}" opacity=".9"/>`; }
  return o;
}
function trunk(D, cx, by, s, h = 30) {
  const g = D.lin([[0, shade(TRUNK, 0.15)], [1, shade(TRUNK, -0.25)]], 0, 0, 1, 0);
  return `<path d="M${f(cx - 4 * s)} ${f(by)} Q${f(cx - 2 * s)} ${f(by - h * s * 0.5)} ${f(cx - 2.2 * s)} ${f(by - h * s)} L${f(cx + 2.2 * s)} ${f(by - h * s)} Q${f(cx + 2 * s)} ${f(by - h * s * 0.5)} ${f(cx + 4 * s)} ${f(by)}Z" fill="${g}"/>`;
}
function tree(D, kind, cx, by, s, colors, r) {
  const shadow = `<ellipse cx="${f(cx + 4 * s)}" cy="${f(by + 1)}" rx="${f(24 * s)}" ry="${f(4.5 * s)}" fill="rgba(20,30,50,.2)"/>`;
  if (kind === 'palm') {
    const leaf = colors[0], tr = colors[1], tg = D.lin([[0, shade(tr, 0.2)], [1, shade(tr, -0.2)]], 0, 0, 1, 0), lg = D.lin([[0, shade(leaf, 0.25)], [1, shade(leaf, -0.25)]], 0, 0, 0, 1);
    const topx = cx + 6 * s, topy = by - 62 * s;
    let o = shadow + `<path d="M${f(cx - 3 * s)} ${f(by)} Q${f(cx + 10 * s)} ${f(by - 30 * s)} ${f(topx - 3 * s)} ${f(topy)} L${f(topx + 3 * s)} ${f(topy)} Q${f(cx + 14 * s)} ${f(by - 30 * s)} ${f(cx + 4 * s)} ${f(by)}Z" fill="${tg}"/>`;
    for (let i = 1; i < 7; i++) { const t = i / 7, x = cx + (4 + 6 * Math.sin(t * 3.1)) * s * t * 1.4, y = by - 62 * s * t; o += `<path d="M${f(x - 3.4 * s)} ${f(y)} Q${f(x)} ${f(y - 2 * s)} ${f(x + 3.4 * s)} ${f(y)}" stroke="${shade(tr, -0.3)}" stroke-width="${f(1.1 * s)}" fill="none" opacity=".6"/>`; }
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + (i / 6) * Math.PI * 1.0 + (i % 2 ? 0.1 : -0.1), L = (i === 3 ? 26 : 32) * s, tx = topx + Math.cos(a) * L, ty = topy + Math.sin(a) * L * 0.55 + 10 * s;
      const mx = (topx + tx) / 2, my = (topy + ty) / 2 - 14 * s;
      o += `<path d="M${f(topx)} ${f(topy)} Q${f(mx)} ${f(my - 5 * s)} ${f(tx)} ${f(ty)} Q${f(mx)} ${f(my + 7 * s)} ${f(topx)} ${f(topy)}Z" fill="${lg}" stroke="${shade(leaf, -0.35)}" stroke-width="${f(0.8 * s)}" stroke-linejoin="round"/>`;
    }
    return o + `<circle cx="${f(topx - 2 * s)}" cy="${f(topy + 3 * s)}" r="${f(3 * s)}" fill="#6b3f1d"/><circle cx="${f(topx + 3 * s)}" cy="${f(topy + 4 * s)}" r="${f(3 * s)}" fill="#7d4a22"/>`;
  }
  if (kind === 'pine') {
    const green = colors[0], snow = /^#f/i.test(colors[1] || '');
    let o = shadow + trunk(D, cx, by, s, 14);
    [[26, 12, 30], [21, 30, 30], [15, 48, 30]].forEach(([w, b, h], i) => {
      const g = D.lin([[0, shade(green, 0.22)], [1, shade(green, -0.25)]], 0, 0, 0, 1), y1 = by - b * s, ap = y1 - h * s;
      o += `<path d="M${f(cx - w * s)} ${f(y1)} Q${f(cx)} ${f(y1 + 5 * s)} ${f(cx + w * s)} ${f(y1)} L${f(cx)} ${f(ap)}Z" fill="${g}"/>`;
      if (snow) o += `<path d="M${f(cx)} ${f(ap)} L${f(cx + w * 0.52 * s)} ${f(ap + h * 0.52 * s)} Q${f(cx + w * 0.2 * s)} ${f(ap + h * 0.42 * s)} ${f(cx)} ${f(ap + h * 0.58 * s)} Q${f(cx - w * 0.25 * s)} ${f(ap + h * 0.4 * s)} ${f(cx - w * 0.52 * s)} ${f(ap + h * 0.52 * s)}Z" fill="#fff" opacity=".95"/>`;
    });
    return o;
  }
  if (kind === 'bare') {
    const c = '#3a2a3a'; let o = shadow + trunk(D, cx, by, s, 34).replace(/url\([^)]*\)/, c);
    [[-1, 0.9], [1, 0.8], [-0.6, 0.6], [0.7, 0.5]].forEach(([d, h]) => { o += `<path d="M${f(cx)} ${f(by - 34 * s * h)} q${f(d * 12 * s)} ${f(-10 * s)} ${f(d * 22 * s)} ${f(-24 * s)}" stroke="${c}" stroke-width="${f(2.4 * s)}" fill="none" stroke-linecap="round"/>`; });
    return o;
  }
  // round + blossom
  const pink = kind === 'blossom';
  return shadow + trunk(D, cx, by, s, 30) + canopy(D, cx, by, s, colors[0], pink ? '#ffffff' : colors[1], pink ? 10 : 7, r);
}

// ---------- ground props ----------
const bush = (D, x, y, s, c) => { const g = D.rad([[0, shade(c, 0.28)], [1, shade(c, -0.2)]], 0.35, 0.25, 0.9); return `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(20 * s)}" ry="${f(4 * s)}" fill="rgba(20,30,50,.16)"/>` + [[-11, -7, 10], [0, -11, 12], [11, -7, 10], [-2, -4, 11]].map(([dx, dy, rr]) => `<circle cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" r="${f(rr * s)}" fill="${g}"/>`).join(''); };
const tuft = (x, y, s, c) => `<path d="M${f(x)} ${f(y)} q${f(-2 * s)} ${f(-8 * s)} ${f(-5 * s)} ${f(-11 * s)} M${f(x)} ${f(y)} q${f(0.5 * s)} ${f(-10 * s)} ${f(1 * s)} ${f(-14 * s)} M${f(x)} ${f(y)} q${f(3 * s)} ${f(-7 * s)} ${f(6 * s)} ${f(-10 * s)}" stroke="${c}" stroke-width="${f(1.6 * s)}" fill="none" stroke-linecap="round"/>`;
const pumpkin = (D, x, y, s, c = '#ff8a1f') => { const g = D.rad([[0, shade(c, 0.35)], [0.6, c], [1, shade(c, -0.3)]], 0.35, 0.3, 0.8); return `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(15 * s)}" ry="${f(3.4 * s)}" fill="rgba(20,30,50,.2)"/><ellipse cx="${f(x - 6 * s)}" cy="${f(y - 8 * s)}" rx="${f(8 * s)}" ry="${f(9 * s)}" fill="${shade(c, -0.12)}"/><ellipse cx="${f(x + 6 * s)}" cy="${f(y - 8 * s)}" rx="${f(8 * s)}" ry="${f(9 * s)}" fill="${shade(c, -0.12)}"/><ellipse cx="${f(x)}" cy="${f(y - 9 * s)}" rx="${f(10 * s)}" ry="${f(10 * s)}" fill="${g}"/><path d="M${f(x - 4 * s)} ${f(y - 18 * s)} Q${f(x - 6 * s)} ${f(y - 9 * s)} ${f(x - 4 * s)} ${f(y - 1 * s)} M${f(x + 4 * s)} ${f(y - 18 * s)} Q${f(x + 6 * s)} ${f(y - 9 * s)} ${f(x + 4 * s)} ${f(y - 1 * s)}" stroke="${shade(c, -0.35)}" stroke-width="${f(1.1 * s)}" fill="none" opacity=".7"/><path d="M${f(x - 1.5 * s)} ${f(y - 18 * s)} l${f(0.5 * s)} ${f(-5 * s)} l${f(3 * s)} ${f(0.4 * s)} l${f(-0.4 * s)} ${f(5 * s)}Z" fill="#4a7a2a"/>`; };
const leaf = (x, y, s, c, rot) => `<path d="M0 0 Q${f(5 * s)} ${f(-7 * s)} ${f(11 * s)} 0 Q${f(5 * s)} ${f(7 * s)} 0 0Z" fill="${c}" transform="translate(${f(x)} ${f(y)}) rotate(${rot})"/>`;
const leafPile = (x, y, s, cols, r) => { let o = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(17 * s)}" ry="${f(4 * s)}" fill="rgba(20,30,50,.15)"/>`; for (let i = 0; i < 16; i++) o += leaf(x + (r() - 0.5) * 28 * s, y - r() * 8 * s, s * (0.7 + r() * 0.5), cols[i % cols.length], Math.round(r() * 360)); return o; };
const hay = (D, x, y, s) => { const g = D.lin([[0, '#f2d27a'], [1, '#c9a24a']]); return `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(17 * s)}" ry="${f(3.4 * s)}" fill="rgba(20,30,50,.2)"/><rect x="${f(x - 14 * s)}" y="${f(y - 18 * s)}" width="${f(28 * s)}" height="${f(18 * s)}" rx="${f(5 * s)}" fill="${g}" stroke="#a8802f" stroke-width="${f(1.4 * s)}"/><path d="M${f(x - 14 * s)} ${f(y - 9 * s)} H${f(x + 14 * s)} M${f(x - 5 * s)} ${f(y - 18 * s)} V${f(y)} M${f(x + 5 * s)} ${f(y - 18 * s)} V${f(y)}" stroke="#a8802f" stroke-width="${f(1.2 * s)}" opacity=".7"/>`; };
const flower = (x, y, s, c, ctr = '#ffd23f') => `<path d="M${f(x)} ${f(y)} V${f(y - 12 * s)}" stroke="#3f9a45" stroke-width="${f(1.6 * s)}"/>` + [0, 72, 144, 216, 288].map((a) => `<circle cx="${f(x + Math.cos((a * Math.PI) / 180) * 3.6 * s)}" cy="${f(y - 14 * s + Math.sin((a * Math.PI) / 180) * 3.6 * s)}" r="${f(3 * s)}" fill="${c}"/>`).join('') + `<circle cx="${f(x)}" cy="${f(y - 14 * s)}" r="${f(2 * s)}" fill="${ctr}"/>`;
const umbrella = (D, x, y, s) => { const cols = ['#ff5a5a', '#ffffff']; let o = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(18 * s)}" ry="${f(3 * s)}" fill="rgba(20,30,50,.18)"/><path d="M${f(x)} ${f(y)} L${f(x + 2 * s)} ${f(y - 36 * s)}" stroke="#8a5a2b" stroke-width="${f(2 * s)}" stroke-linecap="round"/>`; for (let i = 0; i < 4; i++) { const x0 = x - 22 * s + i * 11 * s; o += `<path d="M${f(x0)} ${f(y - 28 * s)} Q${f(x0 + 5.5 * s)} ${f(y - 46 * s)} ${f(x + 2 * s)} ${f(y - 42 * s)} Q${f(x0 + 11 * s + 3 * s)} ${f(y - 40 * s)} ${f(x0 + 11 * s)} ${f(y - 28 * s)} Q${f(x0 + 5.5 * s)} ${f(y - 31 * s)} ${f(x0)} ${f(y - 28 * s)}Z" fill="${cols[i % 2]}" stroke="#c93a3a" stroke-width="${f(0.8 * s)}"/>`; } return o; };
const ball = (x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(8 * s)}" ry="${f(2 * s)}" fill="rgba(20,30,50,.18)"/><circle cx="${f(x)}" cy="${f(y - 7 * s)}" r="${f(7 * s)}" fill="#fff" stroke="#3a6ad6" stroke-width="${f(1 * s)}"/><path d="M${f(x)} ${f(y - 14 * s)} Q${f(x - 5 * s)} ${f(y - 7 * s)} ${f(x)} ${f(y)} Q${f(x + 5 * s)} ${f(y - 7 * s)} ${f(x)} ${f(y - 14 * s)}Z" fill="#ff5a5a"/><path d="M${f(x - 7 * s)} ${f(y - 7 * s)} Q${f(x)} ${f(y - 11 * s)} ${f(x + 7 * s)} ${f(y - 7 * s)}" stroke="#ffd23f" stroke-width="${f(2.4 * s)}" fill="none"/>`;
const mound = (x, y, s, c = '#ffffff') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(26 * s)}" ry="${f(6 * s)}" fill="${shade('#a8c8f0', 0.1)}"/><ellipse cx="${f(x)}" cy="${f(y - 1.5 * s)}" rx="${f(25 * s)}" ry="${f(5.2 * s)}" fill="${c}"/>`;
const snowman = (x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(14 * s)}" ry="${f(3 * s)}" fill="rgba(60,90,140,.25)"/><circle cx="${f(x)}" cy="${f(y - 9 * s)}" r="${f(10 * s)}" fill="#fff" stroke="#b9d4f0" stroke-width="${f(1 * s)}"/><circle cx="${f(x)}" cy="${f(y - 25 * s)}" r="${f(7.5 * s)}" fill="#fff" stroke="#b9d4f0" stroke-width="${f(1 * s)}"/><circle cx="${f(x - 2.6 * s)}" cy="${f(y - 27 * s)}" r="${f(1 * s)}" fill="#2a3a5a"/><circle cx="${f(x + 2.6 * s)}" cy="${f(y - 27 * s)}" r="${f(1 * s)}" fill="#2a3a5a"/><path d="M${f(x)} ${f(y - 25 * s)} l${f(6 * s)} ${f(1 * s)} l${f(-6 * s)} ${f(1.6 * s)}Z" fill="#ff8a1f"/><rect x="${f(x - 6 * s)}" y="${f(y - 20 * s)}" width="${f(12 * s)}" height="${f(3 * s)}" rx="${f(1.5 * s)}" fill="#e63946"/><rect x="${f(x - 5 * s)}" y="${f(y - 37 * s)}" width="${f(10 * s)}" height="${f(7 * s)}" rx="${f(1.5 * s)}" fill="#2a2f4a"/><rect x="${f(x - 8 * s)}" y="${f(y - 31 * s)}" width="${f(16 * s)}" height="${f(2.4 * s)}" rx="${f(1.2 * s)}" fill="#2a2f4a"/>`;
const gift = (x, y, s, c, rb) => `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(11 * s)}" ry="${f(2.4 * s)}" fill="rgba(20,30,50,.2)"/><rect x="${f(x - 9 * s)}" y="${f(y - 14 * s)}" width="${f(18 * s)}" height="${f(14 * s)}" rx="${f(2 * s)}" fill="${c}" stroke="${shade(c, -0.3)}" stroke-width="${f(1 * s)}"/><rect x="${f(x - 1.6 * s)}" y="${f(y - 14 * s)}" width="${f(3.2 * s)}" height="${f(14 * s)}" fill="${rb}"/><path d="M${f(x)} ${f(y - 14 * s)} q${f(-7 * s)} ${f(-8 * s)} ${f(-8 * s)} ${f(-2 * s)} M${f(x)} ${f(y - 14 * s)} q${f(7 * s)} ${f(-8 * s)} ${f(8 * s)} ${f(-2 * s)}" stroke="${rb}" stroke-width="${f(2 * s)}" fill="none" stroke-linecap="round"/>`;
const egg = (x, y, s, c, st) => `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(6 * s)}" ry="${f(1.6 * s)}" fill="rgba(20,30,50,.18)"/><ellipse cx="${f(x)}" cy="${f(y - 8 * s)}" rx="${f(6.4 * s)}" ry="${f(8.4 * s)}" fill="${c}"/><path d="M${f(x - 6 * s)} ${f(y - 8 * s)} l${f(3 * s)} ${f(-3 * s)} l${f(3 * s)} ${f(3 * s)} l${f(3 * s)} ${f(-3 * s)} l${f(3 * s)} ${f(3 * s)}" stroke="${st}" stroke-width="${f(1.8 * s)}" fill="none"/>`;
const clover = (x, y, s) => `<path d="M${f(x)} ${f(y)} q${f(1 * s)} ${f(-6 * s)} ${f(0)} ${f(-9 * s)}" stroke="#2a8a3a" stroke-width="${f(1.4 * s)}" fill="none"/>` + [[-3.4, -12], [3.4, -12], [-3.4, -8.4], [3.4, -8.4]].map(([dx, dy]) => `<circle cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" r="${f(3.2 * s)}" fill="#2fae5a" stroke="#1f7a3a" stroke-width="${f(0.6 * s)}"/>`).join('');
const tomb = (x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(11 * s)}" ry="${f(2.4 * s)}" fill="rgba(0,0,0,.28)"/><path d="M${f(x - 8 * s)} ${f(y)} V${f(y - 15 * s)} Q${f(x - 8 * s)} ${f(y - 24 * s)} ${f(x)} ${f(y - 24 * s)} Q${f(x + 8 * s)} ${f(y - 24 * s)} ${f(x + 8 * s)} ${f(y - 15 * s)} V${f(y)}Z" fill="#8a8aa6" stroke="#4a4a66" stroke-width="${f(1.2 * s)}"/><path d="M${f(x)} ${f(y - 19 * s)} V${f(y - 9 * s)} M${f(x - 3.4 * s)} ${f(y - 15 * s)} H${f(x + 3.4 * s)}" stroke="#4a4a66" stroke-width="${f(1.4 * s)}"/>`;
const flag = (x, y, s) => `<path d="M${f(x)} ${f(y)} V${f(y - 30 * s)}" stroke="#ccd" stroke-width="${f(1.6 * s)}"/><path d="M${f(x)} ${f(y - 30 * s)} h${f(16 * s)} v${f(11 * s)} h${f(-16 * s)}Z" fill="#fff"/><path d="M${f(x)} ${f(y - 30 * s)} h${f(16 * s)} v${f(2.2 * s)} h${f(-16 * s)}Z M${f(x)} ${f(y - 25.6 * s)} h${f(16 * s)} v${f(2.2 * s)} h${f(-16 * s)}Z M${f(x)} ${f(y - 21.2 * s)} h${f(16 * s)} v${f(2.2 * s)} h${f(-16 * s)}Z" fill="#e63946"/><path d="M${f(x)} ${f(y - 30 * s)} h${f(7 * s)} v${f(6.6 * s)} h${f(-7 * s)}Z" fill="#2f5fd0"/>`;
const diya = (x, y, s) => `<path d="M${f(x - 8 * s)} ${f(y - 5 * s)} Q${f(x)} ${f(y + 3 * s)} ${f(x + 8 * s)} ${f(y - 5 * s)}Z" fill="#c4552a" stroke="#7a2a10" stroke-width="${f(1 * s)}"/><path d="M${f(x)} ${f(y - 6 * s)} q${f(-3.4 * s)} ${f(-5 * s)} ${f(0)} ${f(-10 * s)} q${f(3.4 * s)} ${f(5 * s)} ${f(0)} ${f(10 * s)}Z" fill="#ffd23f"/><circle cx="${f(x)}" cy="${f(y - 8 * s)}" r="${f(9 * s)}" fill="rgba(255,200,80,.25)"/>`;
const envelope = (x, y, s) => `<rect x="${f(x - 7 * s)}" y="${f(y - 18 * s)}" width="${f(14 * s)}" height="${f(18 * s)}" rx="${f(2 * s)}" fill="#d6232f" stroke="#8f1018" stroke-width="${f(1 * s)}"/><circle cx="${f(x)}" cy="${f(y - 10 * s)}" r="${f(3 * s)}" fill="#ffd23f"/>`;
const heartPath = (x, y, s) => `M${f(x)} ${f(y + 6 * s)} C${f(x - 12 * s)} ${f(y - 4 * s)} ${f(x - 6 * s)} ${f(y - 12 * s)} ${f(x)} ${f(y - 5 * s)} C${f(x + 6 * s)} ${f(y - 12 * s)} ${f(x + 12 * s)} ${f(y - 4 * s)} ${f(x)} ${f(y + 6 * s)}Z`;

const PROPS = {   // theme id -> what lies on the grass. Each takes (D, x, y, s, r, t) and returns svg
  autumn: [(D, x, y, s) => pumpkin(D, x, y, s), (D, x, y, s, r, t) => leafPile(x, y, s, t.particles.colors, r), (D, x, y, s) => hay(D, x, y, s)],
  thanksgiving: [(D, x, y, s) => pumpkin(D, x, y, s), (D, x, y, s, r, t) => leafPile(x, y, s, t.particles.colors, r), (D, x, y, s) => hay(D, x, y, s)],
  halloween: [(D, x, y, s) => pumpkin(D, x, y, s, '#ff7a1a'), (D, x, y, s) => tomb(x, y, s), (D, x, y, s) => pumpkin(D, x, y, s * 0.8, '#ff9a2b')],
  spring: [(D, x, y, s) => flower(x, y, s, '#ff9ad5'), (D, x, y, s) => flower(x, y, s, '#ffffff'), (D, x, y, s) => flower(x, y, s, '#ffd23f', '#ff7a3a')],
  easter: [(D, x, y, s) => egg(x, y, s, '#ff9ad5', '#fff'), (D, x, y, s) => egg(x, y, s, '#8fd0ff', '#fff'), (D, x, y, s) => flower(x, y, s, '#c9a8ff')],
  stpatrick: [(D, x, y, s) => clover(x, y, s), (D, x, y, s) => clover(x, y, s * 1.2), (D, x, y, s) => flower(x, y, s, '#ffd23f', '#fff')],
  summer: [(D, x, y, s) => umbrella(D, x, y, s), (D, x, y, s) => ball(x, y, s), (D, x, y, s) => flower(x, y, s, '#ff7a59')],
  regular: [(D, x, y, s) => flower(x, y, s, '#ff7a59'), (D, x, y, s) => umbrella(D, x, y, s), (D, x, y, s) => flower(x, y, s, '#ffffff')],
  winter: [(D, x, y, s) => snowman(x, y, s), (D, x, y, s) => mound(x, y, s), (D, x, y, s) => mound(x, y, s * 0.8)],
  christmas: [(D, x, y, s) => gift(x, y, s, '#e03a3e', '#ffd23f'), (D, x, y, s) => gift(x, y, s, '#1f8f4a', '#fff'), (D, x, y, s) => snowman(x, y, s)],
  valentine: [(D, x, y, s) => `<path d="${heartPath(x, y - 8 * s, s * 0.9)}" fill="#ff4d8a" stroke="#c4235a" stroke-width="${f(s)}"/>`, (D, x, y, s) => flower(x, y, s, '#ff4d8a', '#ffd9e6'), (D, x, y, s) => `<path d="${heartPath(x, y - 8 * s, s * 0.7)}" fill="#ff9ec6"/>`],
  pride: [(D, x, y, s) => flower(x, y, s, '#ff6b6b'), (D, x, y, s) => flower(x, y, s, '#6bb6ff'), (D, x, y, s) => flower(x, y, s, '#ffd23f')],
  july4: [(D, x, y, s) => flag(x, y, s), (D, x, y, s) => flower(x, y, s, '#e63946'), (D, x, y, s) => flower(x, y, s, '#ffffff')],
  diwali: [(D, x, y, s) => diya(x, y, s), (D, x, y, s) => diya(x, y, s * 1.2), (D, x, y, s) => flower(x, y, s, '#ffb21f')],
  lunarnewyear: [(D, x, y, s) => envelope(x, y, s), (D, x, y, s) => flower(x, y, s, '#ff6b8a'), (D, x, y, s) => envelope(x, y, s * 0.8)],
  newyear: [(D, x, y, s) => gift(x, y, s, '#2f3ca8', '#ffd23f'), (D, x, y, s) => gift(x, y, s, '#ffd23f', '#e63946'), (D, x, y, s) => gift(x, y, s * 0.8, '#ff5fa8', '#fff')],
};

// ---------- sky art ----------
function cloud(D, x, y, s, night) {
  const c = night ? '#9aa6d0' : '#ffffff', g = D.lin([[0, c, night ? 0.5 : 0.95], [1, shade(c, -0.12), night ? 0.5 : 0.95]]);
  return `<g class="sc-cl" style="animation-delay:${f(-x / 12)}s"><ellipse cx="${f(x)}" cy="${f(y + 8 * s)}" rx="${f(42 * s)}" ry="${f(10 * s)}" fill="${g}"/><circle cx="${f(x - 16 * s)}" cy="${f(y + 1 * s)}" r="${f(13 * s)}" fill="${g}"/><circle cx="${f(x + 2 * s)}" cy="${f(y - 7 * s)}" r="${f(17 * s)}" fill="${g}"/><circle cx="${f(x + 22 * s)}" cy="${f(y + 2 * s)}" r="${f(12 * s)}" fill="${g}"/></g>`;
}
function firework(x, y, R, cols, r) { let o = ''; for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283, c = cols[i % cols.length]; o += `<path d="M${f(x + Math.cos(a) * R * 0.35)} ${f(y + Math.sin(a) * R * 0.35)} L${f(x + Math.cos(a) * R)} ${f(y + Math.sin(a) * R)}" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><circle cx="${f(x + Math.cos(a) * R * 1.12)}" cy="${f(y + Math.sin(a) * R * 1.12)}" r="2.2" fill="${c}"/>`; } return o + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R * 0.18)}" fill="#fff" opacity=".9"/>`; }
function lantern(D, x, y, s) { const g = D.rad([[0, '#ff6a6a'], [1, '#c4161f']], 0.35, 0.3, 0.8); return `<path d="M${f(x)} 0 V${f(y)}" stroke="#ffd23f" stroke-width="1.2"/><rect x="${f(x - 6 * s)}" y="${f(y)}" width="${f(12 * s)}" height="${f(3 * s)}" rx="1.5" fill="#ffd23f"/><ellipse cx="${f(x)}" cy="${f(y + 15 * s)}" rx="${f(13 * s)}" ry="${f(13 * s)}" fill="${g}" stroke="#8f1018" stroke-width="1"/><rect x="${f(x - 6 * s)}" y="${f(y + 27 * s)}" width="${f(12 * s)}" height="${f(3 * s)}" rx="1.5" fill="#ffd23f"/><path d="M${f(x)} ${f(y + 30 * s)} v${f(10 * s)}" stroke="#ffd23f" stroke-width="2"/>`; }
function rainbow(cx, cy, R0, op) { const cols = ['#ff5a5a', '#ff9f3a', '#ffe14d', '#4cd964', '#4aa8ff', '#7a5af2']; return cols.map((c, i) => `<path d="M${f(cx - (R0 - i * 7))} ${f(cy)} A${f(R0 - i * 7)} ${f(R0 - i * 7)} 0 0 1 ${f(cx + (R0 - i * 7))} ${f(cy)}" stroke="${c}" stroke-width="7.4" fill="none" opacity="${op}"/>`).join(''); }

// ---------- the scene ----------
// top: the sky and horizon above the road (viewBox 400x400, ground begins at y=330). bottom: the foreground below the road (400x200).
export function sceneSvgs(t, seed = 7) {
  const r = rng(seed + t.id.length * 31), night = !!t.stars, D = Defs();
  const W = 400, H = 400, HZ = 330, sky = t.sky;
  const sg = D.lin([[0, sky[0]], [1, sky[1]]]);
  let top = `<rect width="${W}" height="${HZ + 4}" fill="${sg}"/>`;
  if (t.stars) for (let i = 0; i < 46; i++) top += `<circle cx="${f(r() * W)}" cy="${f(r() * 230)}" r="${f(0.6 + r() * 1.3)}" fill="#fff" opacity="${f(0.45 + r() * 0.5)}"/>`;
  // sun / moon
  if (t.celestial === 'sun' || t.celestial === 'sunset') {
    const sy = t.celestial === 'sunset' ? 200 : 96, c1 = t.celestial === 'sunset' ? '#ffb347' : '#ffe27a', g = D.rad([[0, '#fffbe0'], [0.55, c1], [1, shade(c1, -0.12)]], 0.4, 0.35, 0.7), gl = D.rad([[0, c1, 0.55], [1, c1, 0]], 0.5, 0.5, 0.5);
    top += `<circle cx="298" cy="${sy}" r="96" fill="${gl}"/><circle cx="298" cy="${sy}" r="34" fill="${g}"/>`;
  } else if (t.celestial === 'moon') {
    const g = D.rad([[0, '#ffffff'], [1, '#d6e0ff']], 0.38, 0.32, 0.8), gl = D.rad([[0, '#cfdcff', 0.5], [1, '#cfdcff', 0]], 0.5, 0.5, 0.5);
    top += `<circle cx="300" cy="96" r="80" fill="${gl}"/><circle cx="300" cy="96" r="27" fill="${g}"/><circle cx="292" cy="90" r="5" fill="#c3cfee"/><circle cx="308" cy="104" r="3.4" fill="#c3cfee"/><circle cx="306" cy="86" r="2.4" fill="#c3cfee"/>`;
  }
  // sky decorations by theme
  if (t.id === 'pride') top += rainbow(110, HZ - 20, 150, 0.9);
  if (t.id === 'stpatrick') top += rainbow(300, HZ - 10, 130, 0.7);
  if (t.id === 'easter') top += rainbow(120, HZ - 10, 120, 0.4);
  if (['newyear', 'july4', 'diwali'].includes(t.id)) { const cols = t.id === 'july4' ? ['#e63946', '#ffffff', '#4aa8ff'] : t.id === 'diwali' ? ['#ffb21f', '#ff5fa8', '#ffe14d'] : ['#ffd23f', '#ff5fa8', '#4cd9ff']; top += firework(110, 90, 38, cols, r) + firework(220, 150, 30, cols.slice().reverse(), r) + firework(330, 70, 26, cols, r); }
  if (t.id === 'lunarnewyear') top += [40, 120, 280, 360].map((x, i) => lantern(D, x, 20 + (i % 2) * 22, 1)).join('');
  if (t.id === 'valentine') for (let i = 0; i < 7; i++) top += `<path d="${heartPath(30 + r() * 340, 40 + r() * 200, 1.2 + r() * 1.2)}" fill="${i % 2 ? '#ff7fae' : '#ffc2dc'}" opacity=".85"/>`;
  if (!night || t.id === 'halloween') top += [[70, 70, 1], [200, 40, 0.8], [350, 150, 0.9]].map(([x, y, s]) => cloud(D, x, y, s, night)).join('');
  // distant layers
  const far = t.hills ? mix(t.hills[0], sky[1], 0.35) : mix(t.treeColors[0], sky[1], 0.55), mid = t.hills ? t.hills[0] : mix(t.treeColors[0], sky[1], 0.3), near = t.hills ? t.hills[1] : mix(t.treeColors[0], '#000000', 0.05);
  top += hill(W, H, 268, 26, 1.2, 0.012, far);
  if (t.skyline) {
    let x = -6, i = 0; while (x < W) { const w = 22 + r() * 22, h = 54 + r() * 70, c = t.skyline[i++ % t.skyline.length], g = D.lin([[0, shade(c, 0.1)], [1, shade(c, -0.25)]]);
      top += `<rect x="${f(x)}" y="${f(HZ - h)}" width="${f(w)}" height="${f(h + 10)}" rx="2" fill="${g}"/>`;
      for (let wy = HZ - h + 8; wy < HZ - 8; wy += 11) for (let wx = x + 4; wx < x + w - 6; wx += 8) top += `<rect x="${f(wx)}" y="${f(wy)}" width="4" height="5" rx="1" fill="${night ? '#ffe28a' : '#ffffff'}" opacity="${night ? 0.85 : 0.45}"/>`;
      x += w + 2 + r() * 4; }
  }
  if (t.sea) { const sg2 = D.lin([[0, shade(t.sea, 0.25)], [1, t.sea]]); top += `<rect x="0" y="${HZ - 52}" width="${W}" height="56" fill="${sg2}"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${f(10 + i * 52)} ${f(HZ - 38 + (i % 3) * 9)} q8 -5 16 0 t16 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>`).join(''); }
  top += hill(W, H, 300, 20, 0.4, 0.016, mid) + hill(W, H, 318, 14, 2.2, 0.02, near);
  // tree line on the horizon
  const trees = []; for (let i = 0; i < 9; i++) trees.push([i * 52 - 14 + r() * 24, HZ - 4 - r() * 16, 0.55 + r() * 0.35]);
  trees.sort((a, b) => a[1] - b[1]);
  if (t.trees !== 'none') trees.forEach(([x, y, s]) => { top += tree(D, t.trees === 'bare' && r() > 0.7 ? 'round' : t.trees, x, y, s, t.treeColors, r); });
  // ground
  const gg = D.lin([[0, shade(t.sidewalk, 0.12)], [1, shade(t.sidewalk, -0.1)]]);
  top += `<path d="M0 ${HZ - 4} Q100 ${HZ - 12} 200 ${HZ - 4} T400 ${HZ - 6} V${H} H0Z" fill="${gg}"/>`;
  const gdark = shade(t.sidewalk, -0.22);
  for (let i = 0; i < 16; i++) top += tuft(r() * W, HZ + 6 + r() * 54, 0.9 + r() * 0.5, gdark);
  const gc = t.treeColors[0], props = PROPS[t.id] || PROPS.regular, put = (x, y, s, n) => props[n % props.length](D, x, y, s, r, t);
  top += bush(D, 28, HZ + 20, 0.9, gc) + bush(D, 372, HZ + 26, 1.0, gc);
  [[84, HZ + 40, 0.9], [150, HZ + 24, 0.7], [250, HZ + 32, 0.75], [316, HZ + 46, 0.95], [196, HZ + 52, 0.65]].forEach(([x, y, s], i) => { top += put(x, y, s, i); });
  top += `<rect x="0" y="${H - 18}" width="${W}" height="18" fill="${D.lin([[0, '#000', 0], [1, '#000', 0.2]])}"/>`;

  // foreground below the road
  const FH = 200, bg = D.lin([[0, shade(t.sidewalk, -0.05)], [1, shade(t.sidewalk, -0.3)]]);
  let bot = `<rect width="${W}" height="${FH}" fill="${bg}"/><rect width="${W}" height="26" fill="${D.lin([[0, '#000', 0.3], [1, '#000', 0]])}"/>`;
  for (let i = 0; i < 20; i++) bot += tuft(r() * W, 30 + r() * 150, 1 + r() * 0.6, shade(t.sidewalk, -0.4));
  bot += bush(D, -4, 70, 1.5, gc) + bush(D, 410, 76, 1.6, gc) + bush(D, 36, 168, 1.9, shade(gc, -0.1)) + bush(D, 366, 176, 2.0, shade(gc, -0.1));
  bot += put(20, 128, 1.5, 0) + put(382, 120, 1.5, 1) + put(66, 184, 1.2, 2) + put(334, 190, 1.2, 0);
  if (['autumn', 'thanksgiving', 'halloween'].includes(t.id)) for (let i = 0; i < 26; i++) bot += leaf(r() * W, 40 + r() * 150, 0.7 + r() * 0.5, t.particles.colors[i % t.particles.colors.length], Math.round(r() * 360));
  return { top: `<svg class="hb-top" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${D.out()}${top}</svg>`, bottom: `<svg class="hb-bot" viewBox="0 0 ${W} ${FH}" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${bot}</svg>`, ground: shade(t.sidewalk, -0.05) };
}

// =====================================================================================================================
// In-level scenery: standalone 100x100 vector props (base at y=94, centred on x=50) and a horizon strip per world.
// =====================================================================================================================
const SH = (w = 26) => `<ellipse cx="50" cy="95" rx="${w}" ry="4.2" fill="rgba(20,30,50,.24)"/>`;
const lit = (D, c, a = 0.3, b = -0.25) => D.lin([[0, shade(c, a)], [1, shade(c, b)]]);
const dome = (D, c) => D.rad([[0, shade(c, 0.35)], [0.6, c], [1, shade(c, -0.28)]], 0.32, 0.25, 0.85);
const P100 = {
  tree: (D, c = ['#3fb04a', '#e8453c'], r) => SH(30) + tree(D, 'round', 50, 94, 1.05, c, r),
  pine: (D, c = ['#2f8f6a', '#ffffff'], r) => SH(30) + tree(D, 'pine', 50, 94, 1.08, c, r),
  palm: (D, c = ['#2fbf5a', '#8a5a2b'], r) => SH(26) + tree(D, 'palm', 38, 94, 1.1, c, r),
  blossom: (D, c = ['#ffb3d1', '#7a4a2b'], r) => SH(30) + tree(D, 'blossom', 50, 94, 1.05, c, r),
  bare: (D, c, r) => SH(26) + tree(D, 'bare', 50, 94, 1.5, c || ['#3a2a3a', '#3a2a3a'], r),
  bush: (D, c = ['#3fb04a']) => bush(D, 50, 90, 1.9, c[0]),
  rock: (D, c = ['#9aa0b4']) => `${SH(34)}<path d="M14 94 L20 64 L40 46 L66 50 L84 72 L88 94Z" fill="${lit(D, c[0], 0.25, -0.3)}" stroke="${shade(c[0], -0.45)}" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 64 L40 46 L48 60 L34 80Z" fill="#fff" opacity=".22"/><path d="M48 60 L66 50 L84 72 L70 78Z" fill="#000" opacity=".1"/>`,
  mushroom: (D, c = ['#e8453c', '#ffffff']) => `${SH(24)}<path d="M42 94 Q40 70 44 62 H56 Q60 70 58 94Z" fill="${lit(D, '#f6ead2', 0.1, -0.2)}"/><path d="M12 64 Q12 28 50 26 Q88 28 88 64 Q50 72 12 64Z" fill="${dome(D, c[0])}" stroke="${shade(c[0], -0.45)}" stroke-width="2.4"/><circle cx="34" cy="48" r="6" fill="${c[1]}"/><circle cx="58" cy="40" r="5" fill="${c[1]}"/><circle cx="70" cy="54" r="5.4" fill="${c[1]}"/><ellipse cx="38" cy="38" rx="9" ry="4" fill="#fff" opacity=".28" transform="rotate(-22 38 38)"/>`,
  flowers: (D, c = ['#ff9ad5', '#ffffff', '#ffd23f']) => `${SH(30)}` + [[28, 94, 3.4, 0], [52, 94, 4.4, 1], [74, 94, 3.6, 2], [40, 94, 2.8, 2], [64, 94, 2.8, 0]].map(([x, y, s, i]) => flower(x, y, s, c[i % c.length], '#ffd23f')).join('') + tuft(20, 94, 1.8, '#2f8a3a') + tuft(82, 94, 1.8, '#2f8a3a'),
  sunflower: (D) => `${SH(18)}<path d="M50 94 V44" stroke="#3f9a45" stroke-width="4.4" stroke-linecap="round"/><path d="M50 78 Q34 74 30 62 Q44 62 50 76Z M50 70 Q66 66 70 54 Q56 54 50 68Z" fill="#4fb85a" stroke="#2f7a3a" stroke-width="1.6"/>` + Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="22" rx="6" ry="14" fill="#ffd23f" stroke="#e8a21f" stroke-width="1.2" transform="rotate(${i * 30} 50 40) translate(0 -10)"/>`).join('') + `<circle cx="50" cy="40" r="11" fill="${D.rad([[0, '#8a5a2b'], [1, '#4a2f14']])}"/>`,
  pumpkin: (D, c = ['#ff8a1f']) => pumpkin(D, 50, 92, 2.8, c[0]),
  hay: (D) => hay(D, 50, 92, 2.4),
  leafpile: (D, c = ['#e8782a', '#b5381f', '#ffb21f'], r) => leafPile(50, 88, 3, c, r || rng(5)),
  tomb: (D) => tomb(50, 93, 3.1),
  snowman: (D) => snowman(50, 92, 2.1),
  mound: (D) => mound(50, 88, 1.8),
  gift: (D, c = ['#e03a3e', '#ffd23f']) => gift(50, 92, 3.6, c[0], c[1]),
  egg: (D, c = ['#ff9ad5']) => egg(34, 92, 4.2, c[0], '#fff') + egg(66, 92, 3.6, '#8fd0ff', '#fff'),
  clover: (D) => clover(36, 92, 4.6) + clover(66, 92, 3.8),
  heart: (D, c = ['#ff4d8a']) => `${SH(24)}<path d="${heartPath(50, 70, 3.6)}" fill="${dome(D, c[0])}" stroke="${shade(c[0], -0.4)}" stroke-width="2.4"/><path d="M34 52 Q38 44 46 46" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>`,
  umbrella: (D) => umbrella(D, 50, 93, 1.75),
  ball: (D) => ball(50, 93, 4.8),
  shell: (D, c = ['#ffc9d9']) => `${SH(22)}<path d="M50 90 L16 60 Q18 30 50 24 Q82 30 84 60Z" fill="${dome(D, c[0])}" stroke="${shade(c[0], -0.4)}" stroke-width="2.4" stroke-linejoin="round"/>` + [-30, -15, 0, 15, 30].map((a) => `<path d="M50 90 L${f(50 + Math.sin((a * Math.PI) / 180) * 42)} ${f(90 - Math.cos((a * Math.PI) / 180) * 58)}" stroke="${shade(c[0], -0.35)}" stroke-width="2" opacity=".7"/>`).join('') + `<rect x="40" y="88" width="20" height="6" rx="3" fill="${shade(c[0], -0.2)}"/>`,
  castle_sand: (D) => `${SH(30)}<path d="M18 94 V62 H30 V54 H38 V62 H46 V40 H54 V62 H62 V54 H70 V62 H82 V94Z" fill="${lit(D, '#f0d28a', 0.15, -0.2)}" stroke="#b8883a" stroke-width="2.2" stroke-linejoin="round"/><path d="M42 94 V80 Q50 70 58 80 V94Z" fill="#b8883a"/><path d="M50 40 V22 L66 28 L50 34" fill="#ff5a5a" stroke="#c93a3a" stroke-width="1.6" stroke-linejoin="round"/>`,
  cactus: (D, c = ['#4fb85a']) => `${SH(24)}<g stroke="${shade(c[0], -0.4)}" stroke-width="2.4" stroke-linejoin="round"><path d="M40 94 V30 Q40 14 50 14 Q60 14 60 30 V94Z" fill="${lit(D, c[0], 0.25, -0.15)}"/><path d="M40 70 H28 Q22 70 22 62 V44 Q22 38 28 38 Q34 38 34 44 V58 H40Z" fill="${lit(D, c[0], 0.25, -0.15)}"/><path d="M60 62 H72 Q78 62 78 54 V36 Q78 30 72 30 Q66 30 66 36 V50 H60Z" fill="${lit(D, c[0], 0.25, -0.15)}"/></g><path d="M50 20 V90 M45 30 V88 M55 30 V88" stroke="${shade(c[0], -0.3)}" stroke-width="1.2" opacity=".5"/><circle cx="50" cy="14" r="4" fill="#ff6b9a"/>`,
  fern: (D, c = ['#2fa84a']) => `${SH(30)}` + [-60, -35, -12, 12, 35, 60].map((a) => `<path d="M50 94 Q${f(50 + Math.sin((a * Math.PI) / 180) * 24)} ${f(94 - 46)} ${f(50 + Math.sin((a * Math.PI) / 180) * 44)} ${f(94 - 66 + Math.abs(a) * 0.35)} Q${f(50 + Math.sin((a * Math.PI) / 180) * 24 + 8)} ${f(94 - 30)} 50 94Z" fill="${lit(D, c[0], 0.25, -0.25)}" stroke="${shade(c[0], -0.4)}" stroke-width="1.6"/>`).join('') + `<circle cx="50" cy="66" r="5" fill="#ff5a6a"/><circle cx="50" cy="66" r="2" fill="#ffd23f"/>`,
  building: (D, c = ['#8fa6cf', '#ffe28a']) => `${SH(30)}<rect x="26" y="26" width="48" height="68" rx="3" fill="${lit(D, c[0], 0.2, -0.28)}" stroke="${shade(c[0], -0.5)}" stroke-width="2.4"/><rect x="22" y="20" width="56" height="10" rx="3" fill="${shade(c[0], -0.3)}" stroke="${shade(c[0], -0.55)}" stroke-width="2"/>` + [0, 1, 2, 3].map((r) => [0, 1, 2].map((q) => `<rect x="${32 + q * 14}" y="${36 + r * 13}" width="8" height="8" rx="1.5" fill="${(r + q) % 3 ? c[1] : '#bfe9ff'}" stroke="${shade(c[0], -0.5)}" stroke-width="1"/>`).join('')).join('') + `<rect x="44" y="82" width="12" height="12" rx="2" fill="${shade(c[0], -0.5)}"/>`,
  lamp: (D) => `${SH(14)}<path d="M50 94 V30 Q50 18 62 18" stroke="#3a4a6a" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="44" y="86" width="12" height="8" rx="2" fill="#3a4a6a"/><circle cx="64" cy="22" r="18" fill="${D.rad([[0, '#fff3a8', 0.7], [1, '#fff3a8', 0]], 0.5, 0.5, 0.5)}"/><path d="M58 18 H70 L68 26 H60Z" fill="#fff3a8" stroke="#3a4a6a" stroke-width="2"/>`,
  bench: (D) => `${SH(30)}<rect x="18" y="52" width="64" height="9" rx="3" fill="${lit(D, '#c4863f', 0.2, -0.2)}" stroke="#7a4a1f" stroke-width="2"/><rect x="18" y="40" width="64" height="8" rx="3" fill="${lit(D, '#c4863f', 0.2, -0.2)}" stroke="#7a4a1f" stroke-width="2"/><path d="M26 61 V90 M74 61 V90 M26 44 V90 M74 44 V90" stroke="#3a4a6a" stroke-width="4" stroke-linecap="round"/>`,
  tower: (D, c = ['#b8bcd8', '#e8453c']) => `${SH(26)}<path d="M28 94 V40 H72 V94Z" fill="${lit(D, c[0], 0.25, -0.22)}" stroke="${shade(c[0], -0.5)}" stroke-width="2.4"/><path d="M24 40 V28 H32 V34 H40 V28 H48 V34 H52 V28 H60 V34 H68 V28 H76 V40Z" fill="${lit(D, c[0], 0.2, -0.3)}" stroke="${shade(c[0], -0.5)}" stroke-width="2.2" stroke-linejoin="round"/><path d="M26 28 L50 4 L74 28Z" fill="${lit(D, c[1], 0.25, -0.25)}" stroke="${shade(c[1], -0.5)}" stroke-width="2.4" stroke-linejoin="round"/><path d="M50 4 V-6 L62 -2 L50 2" fill="#ffd23f"/><path d="M44 94 V74 Q50 64 56 74 V94Z" fill="${shade(c[0], -0.55)}"/><path d="M46 52 V46 Q50 42 54 46 V52Z" fill="#3a2a55"/>`,
  barn: (D, c = ['#d8483a', '#ffffff']) => `${SH(34)}<path d="M16 94 V50 L50 26 L84 50 V94Z" fill="${lit(D, c[0], 0.2, -0.25)}" stroke="${shade(c[0], -0.5)}" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 52 L50 24 L86 52" stroke="${c[1]}" stroke-width="4" fill="none" stroke-linejoin="round"/><rect x="36" y="58" width="28" height="36" rx="2" fill="${shade(c[0], -0.2)}" stroke="${c[1]}" stroke-width="3"/><path d="M36 58 L64 94 M64 58 L36 94" stroke="${c[1]}" stroke-width="2.6"/><circle cx="50" cy="44" r="4.4" fill="${c[1]}"/>`,
  windmill: (D) => `${SH(22)}<path d="M36 94 L42 46 H58 L64 94Z" fill="${lit(D, '#f6ead2', 0.1, -0.2)}" stroke="#a88a5a" stroke-width="2.2" stroke-linejoin="round"/><path d="M38 46 L50 32 L62 46Z" fill="#c4553f" stroke="#7a2f20" stroke-width="2"/>` + [0, 90, 180, 270].map((a) => `<g transform="rotate(${a + 20} 50 40)"><rect x="47" y="6" width="6" height="34" fill="#a88a5a"/><rect x="53" y="8" width="14" height="22" rx="1" fill="#fff" stroke="#a88a5a" stroke-width="1.6"/></g>`).join('') + `<circle cx="50" cy="40" r="4" fill="#7a4a1f"/><rect x="45" y="76" width="10" height="18" rx="2" fill="#7a4a1f"/>`,
  fence: (D) => `${SH(34)}<path d="M10 62 H90 M10 78 H90" stroke="#a8782f" stroke-width="5" stroke-linecap="round"/>` + [16, 36, 56, 76].map((x) => `<path d="M${x - 4} 94 V54 L${x} 48 L${x + 4} 54 V94Z" fill="${lit(D, '#c4863f', 0.2, -0.2)}" stroke="#7a4a1f" stroke-width="2"/>`).join(''),
  igloo: (D) => `${SH(34)}<path d="M12 94 Q12 36 50 36 Q88 36 88 94Z" fill="${lit(D, '#ffffff', 0, -0.12)}" stroke="#9ec4e8" stroke-width="2.4"/><path d="M20 70 H80 M28 52 H72 M50 36 V52 M34 52 V70 M66 52 V70 M24 70 V94 M50 70 V94 M76 70 V94" stroke="#9ec4e8" stroke-width="1.8" fill="none" opacity=".8"/><path d="M38 94 V80 Q50 66 62 80 V94Z" fill="#6a8ab8"/>`,
  tent: (D, c = ['#ff8a1f', '#ffffff']) => `${SH(34)}<path d="M10 94 L50 22 L90 94Z" fill="${lit(D, c[0], 0.2, -0.25)}" stroke="${shade(c[0], -0.5)}" stroke-width="2.6" stroke-linejoin="round"/><path d="M50 22 L34 94 H66Z" fill="${shade(c[0], -0.45)}"/><path d="M50 22 V8 L64 14 L50 18" fill="#ff5a5a" stroke="#a82a2a" stroke-width="1.4"/>`,
  bigtop: (D, c = ['#e63946', '#ffffff']) => `${SH(36)}<path d="M12 94 V58 H88 V94Z" fill="${lit(D, c[0], 0.15, -0.25)}" stroke="${shade(c[0], -0.5)}" stroke-width="2.4"/>` + [0, 1, 2, 3, 4].map((i) => `<path d="M${16 + i * 16} 58 L${24 + i * 16} 58 L${20 + i * 16} 94 L${12 + i * 16} 94Z" fill="${c[1]}" opacity=".9"/>`).join('') + `<path d="M6 60 Q50 -4 94 60 Z" fill="${lit(D, c[0], 0.2, -0.25)}" stroke="${shade(c[0], -0.5)}" stroke-width="2.6" stroke-linejoin="round"/>` + [0, 1, 2, 3].map((i) => `<path d="M${50} 8 Q${28 + i * 16} 30 ${14 + i * 24} 60" stroke="${c[1]}" stroke-width="5" fill="none" opacity=".85"/>`).join('') + `<path d="M50 8 V-4 L62 0 L50 4" fill="#ffd23f"/><path d="M42 94 V76 Q50 66 58 76 V94Z" fill="#3a2a55"/>`,
  peak: (D, c = ['#8a98b8', '#ffffff']) => `${SH(38)}<path d="M4 94 L40 26 L58 54 L70 40 L96 94Z" fill="${lit(D, c[0], 0.2, -0.3)}" stroke="${shade(c[0], -0.5)}" stroke-width="2.4" stroke-linejoin="round"/><path d="M40 26 L52 46 L44 42 L38 52 L30 44 L34 36Z" fill="${c[1]}"/><path d="M40 26 L58 54 L52 94 L40 60Z" fill="#000" opacity=".12"/>`,
  volcano: (D) => `${SH(38)}<path d="M6 94 L36 34 H64 L94 94Z" fill="${lit(D, '#6a4444', 0.2, -0.3)}" stroke="#2a1818" stroke-width="2.6" stroke-linejoin="round"/><path d="M36 34 Q50 42 64 34 Q50 24 36 34Z" fill="${D.rad([[0, '#fff0a0'], [0.5, '#ff9a2a'], [1, '#e8451c']])}"/><path d="M44 38 Q42 62 36 80 M54 40 Q58 60 60 84" stroke="#ff8a2a" stroke-width="4.4" fill="none" stroke-linecap="round"/><circle cx="46" cy="20" r="9" fill="#c9c0cc" opacity=".7"/><circle cx="56" cy="12" r="7" fill="#d8d0dc" opacity=".55"/>`,
  lava: (D) => `${SH(30)}<path d="M14 94 L22 62 L42 48 L66 54 L82 74 L86 94Z" fill="${lit(D, '#4a3030', 0.25, -0.2)}" stroke="#1e1010" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 70 L40 60 L44 74 M58 62 L70 70 L62 82" stroke="#ff7a2a" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  coral: (D, c = ['#ff6b8a']) => `${SH(30)}` + [[50, 94, 50, 30], [38, 94, 24, 46], [62, 94, 76, 40]].map(([x, y, tx, ty]) => `<path d="M${x} ${y} Q${x} ${(y + ty) / 2} ${tx} ${ty} M${(x + tx) / 2} ${(y + ty) / 2 + 6} Q${(x + tx) / 2 + 8} ${(y + ty) / 2 - 8} ${(x + tx) / 2 + 14} ${(y + ty) / 2 - 12}" stroke="${c[0]}" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="6.5" fill="${shade(c[0], 0.25)}"/>`).join('') + `<ellipse cx="50" cy="92" rx="26" ry="5" fill="${shade(c[0], -0.3)}"/>`,
  seaweed: (D, c = ['#2fa84a']) => `${SH(20)}` + [34, 50, 66].map((x, i) => `<path d="M${x} 94 Q${x - 12} 74 ${x} 58 Q${x + 12} 42 ${x} ${24 + i * 8}" stroke="${shade(c[0], i * 0.08)}" stroke-width="7" fill="none" stroke-linecap="round"/>`).join(''),
  crystal: (D, c = ['#8a5af0']) => `${SH(30)}` + [[50, 94, 14, 70, 0], [30, 94, 10, 46, -12], [70, 94, 10, 52, 12]].map(([x, y, w, h, rot]) => `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x - w} ${y} L${x - w} ${y - h * 0.7} L${x} ${y - h} L${x + w} ${y - h * 0.7} L${x + w} ${y}Z" fill="${lit(D, c[0], 0.3, -0.25)}" stroke="${shade(c[0], -0.5)}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${x} ${y - h} L${x} ${y} M${x - w} ${y - h * 0.7} L${x} ${y - h * 0.5} L${x + w} ${y - h * 0.7}" stroke="#fff" stroke-width="1.4" opacity=".5" fill="none"/></g>`).join(''),
  planet: (D, c = ['#ff9a5a', '#ffe58a']) => `<ellipse cx="50" cy="94" rx="24" ry="4" fill="rgba(20,30,50,.18)"/><circle cx="50" cy="56" r="30" fill="${dome(D, c[0])}" stroke="${shade(c[0], -0.5)}" stroke-width="2.4"/><path d="M26 50 Q50 62 74 48" stroke="${shade(c[0], 0.25)}" stroke-width="6" fill="none" opacity=".6"/><ellipse cx="50" cy="58" rx="46" ry="11" fill="none" stroke="${c[1]}" stroke-width="5" transform="rotate(-14 50 58)"/><path d="M12 64 Q50 78 88 52" stroke="${shade(c[0], -0.5)}" stroke-width="1.6" fill="none" opacity=".4"/>`,
  rocket: (D, c = ['#ffffff', '#e8453c']) => `${SH(18)}<path d="M50 6 Q70 26 66 62 H34 Q30 26 50 6Z" fill="${lit(D, c[0], 0.1, -0.22)}" stroke="#3a4a78" stroke-width="2.4"/><path d="M34 62 L22 80 L36 74Z M66 62 L78 80 L64 74Z" fill="${c[1]}" stroke="#3a4a78" stroke-width="2.2" stroke-linejoin="round"/><circle cx="50" cy="38" r="9" fill="#8fd8ff" stroke="#3a4a78" stroke-width="2.4"/><path d="M50 6 Q58 14 60 22 H40 Q42 14 50 6Z" fill="${c[1]}"/><path d="M40 66 Q50 98 60 66Z" fill="${D.lin([[0, '#ffe14d'], [1, '#ff6a1f']])}"/>`,
  star: (D) => `${SH(14)}<path d="M50 24 L58 46 L82 48 L63 62 L70 86 L50 72 L30 86 L37 62 L18 48 L42 46Z" fill="${dome(D, '#ffd23f')}" stroke="#a86a00" stroke-width="2.4" stroke-linejoin="round"/>`,
  lolly: (D, c = ['#ff5fa8', '#ffffff']) => `${SH(14)}<path d="M50 94 V50" stroke="#f6ead2" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="36" r="26" fill="${dome(D, c[0])}" stroke="${shade(c[0], -0.45)}" stroke-width="2.4"/><path d="M50 36 m0 0 q8 -2 8 -9 q0 -12 -14 -12 M50 36 q-8 2 -8 9 q0 12 14 12 q16 0 16 -18" stroke="${c[1]}" stroke-width="4.4" fill="none" stroke-linecap="round"/>`,
  cane: (D, c = ['#ff4d6a', '#ffffff']) => `${SH(18)}<path d="M40 94 V36 Q40 14 56 14 Q72 14 72 32" stroke="${shade(c[0], -0.45)}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M40 94 V36 Q40 14 56 14 Q72 14 72 32" stroke="${c[1]}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M40 94 V36 Q40 14 56 14 Q72 14 72 32" stroke="${c[0]}" stroke-width="11" fill="none" stroke-dasharray="8 11" stroke-linecap="butt"/>`,
  cupcake: (D, c = ['#ff9ad5', '#c4863f']) => `${SH(26)}<path d="M24 56 L32 94 H68 L76 56Z" fill="${lit(D, c[1], 0.2, -0.2)}" stroke="${shade(c[1], -0.45)}" stroke-width="2.4" stroke-linejoin="round"/><path d="M36 58 L40 94 M50 58 V94 M64 58 L60 94" stroke="${shade(c[1], -0.3)}" stroke-width="1.6" opacity=".6"/><path d="M20 58 Q18 40 34 40 Q32 26 50 26 Q68 26 66 40 Q82 40 80 58Z" fill="${dome(D, c[0])}" stroke="${shade(c[0], -0.45)}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="50" cy="20" r="7" fill="#e8302c" stroke="#8f1c1c" stroke-width="2"/>`,
  gumdrops: (D, c = ['#6ec6ff', '#ffe14d', '#ff5fa8']) => `${SH(32)}` + [[30, 94, 22, 0], [62, 94, 26, 1], [46, 66, 20, 2]].map(([x, y, w, i]) => `<path d="M${x - w} ${y} Q${x - w} ${y - w * 1.6} ${x} ${y - w * 1.6} Q${x + w} ${y - w * 1.6} ${x + w} ${y}Z" fill="${dome(D, c[i])}" stroke="${shade(c[i], -0.4)}" stroke-width="2.2"/><circle cx="${x - w * 0.3}" cy="${y - w * 1.0}" r="2.4" fill="#fff" opacity=".7"/><circle cx="${x + w * 0.2}" cy="${y - w * 0.6}" r="2.4" fill="#fff" opacity=".7"/>`).join(''),
  chest: (D) => `${SH(30)}<rect x="16" y="52" width="68" height="40" rx="4" fill="${lit(D, '#a8662a', 0.2, -0.25)}" stroke="#5a3010" stroke-width="2.6"/><path d="M16 56 Q16 28 50 28 Q84 28 84 56Z" fill="${lit(D, '#b8742f', 0.25, -0.2)}" stroke="#5a3010" stroke-width="2.6"/><path d="M16 56 H84 M32 30 V92 M68 30 V92" stroke="#ffd23f" stroke-width="4"/><rect x="43" y="50" width="14" height="14" rx="3" fill="#ffd23f" stroke="#a86a00" stroke-width="2"/><circle cx="50" cy="57" r="2.4" fill="#5a3010"/><circle cx="36" cy="26" r="5" fill="#ffd23f"/><circle cx="62" cy="24" r="4" fill="#ffe27a"/>`,
  barrel: (D) => `${SH(24)}<path d="M26 90 Q20 60 26 34 H74 Q80 60 74 90Z" fill="${lit(D, '#b8742f', 0.2, -0.25)}" stroke="#5a3010" stroke-width="2.6"/><ellipse cx="50" cy="34" rx="24" ry="6" fill="${shade('#b8742f', 0.15)}" stroke="#5a3010" stroke-width="2.4"/><path d="M24 48 Q50 56 76 48 M22 76 Q50 84 78 76" stroke="#3a4a6a" stroke-width="4" fill="none"/>`,
  blocks: (D) => `${SH(32)}` + [[22, 94, '#ff5a5a', 'A'], [52, 94, '#3b82f6', 'B'], [37, 66, '#ffd23f', 'C']].map(([x, y, c, l]) => `<rect x="${x}" y="${y - 28}" width="28" height="28" rx="4" fill="${lit(D, c, 0.28, -0.2)}" stroke="${shade(c, -0.5)}" stroke-width="2.4"/><text x="${x + 14}" y="${y - 8}" text-anchor="middle" font-family="Poppins,system-ui" font-weight="900" font-size="17" fill="#fff" opacity=".92">${l}</text>`).join(''),
  tracks: (D) => `${SH(30)}<rect x="10" y="80" width="80" height="6" rx="2" fill="#7a4a2b"/><path d="M14 74 H86 M14 90 H86" stroke="#b0b6c8" stroke-width="4"/>` + [18, 34, 50, 66, 82].map((x) => `<rect x="${x - 3}" y="72" width="6" height="20" rx="1.5" fill="#7a4a2b"/>`).join(''),
  boulder: (D, c = ['#b89a6a']) => `${SH(32)}<path d="M16 94 Q10 60 34 44 Q60 32 78 52 Q92 72 84 94Z" fill="${dome(D, c[0])}" stroke="${shade(c[0], -0.5)}" stroke-width="2.4"/><path d="M30 56 Q42 46 54 48" stroke="#fff" stroke-width="3.4" fill="none" opacity=".35" stroke-linecap="round"/>`,
  log: (D) => `${SH(32)}<path d="M12 80 H78 Q86 80 86 70 Q86 60 78 60 H12Z" fill="${lit(D, '#a8662a', 0.2, -0.25)}" stroke="#5a3010" stroke-width="2.4"/><ellipse cx="12" cy="70" rx="7" ry="10" fill="${shade('#a8662a', 0.3)}" stroke="#5a3010" stroke-width="2.2"/><ellipse cx="12" cy="70" rx="3.4" ry="5.4" fill="none" stroke="#5a3010" stroke-width="1.4"/>`,
};
export const propSvg = (key) => {
  const [name, ...cols] = key.split('|'), D = Defs(), rr = rng(11 + name.length * 7), fn = P100[name] || P100.bush;
  const body = fn(D, cols.length ? cols : undefined, rr);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${D.out()}${body}</svg>`;
};
const propUrls = new Map(), propImgs = new Map();
export const propUrl = (key) => { if (!propUrls.has(key)) propUrls.set(key, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(propSvg(key))); return propUrls.get(key); };
export const propImg = (key) => { if (!propImgs.has(key)) { const im = new Image(); im.src = propUrl(key); propImgs.set(key, im); } return propImgs.get(key); };

// what each world scatters around the board (first entry also names the world on its ribbon)
export const BD_PROPS = {
  city: ['building|#8fa6cf|#ffe28a', 'lamp', 'building|#d9a4b8|#ffd8a0', 'tree', 'bench', 'building|#9ad0c0|#ffe28a', 'bush'],
  beach: ['palm', 'umbrella', 'shell', 'ball', 'palm', 'castle_sand', 'boulder|#d8c48a'],
  forest: ['pine', 'tree|#3f9a45|#ffd23f', 'mushroom', 'log', 'bush', 'pine', 'rock|#8a9a8a', 'flowers'],
  winter: ['pine', 'snowman', 'igloo', 'mound', 'pine', 'rock|#c8d8ea', 'mound'],
  halloween: ['bare', 'pumpkin|#ff7a1a', 'tomb', 'bare', 'pumpkin|#ff9a2b', 'rock|#6a5a8a', 'mushroom|#8a5af0|#ffffff'],
  space: ['planet|#ff9a5a|#ffe58a', 'rocket', 'crystal|#8a5af0', 'star', 'planet|#5ad0ff|#ffffff', 'crystal|#3df5ff', 'rock|#8a90b8'],
  autumn: ['tree|#e8782a|#b5381f', 'pumpkin', 'hay', 'leafpile', 'tree|#d9a02a|#c4552a', 'mushroom|#c4552a|#ffffff', 'bush|#d9731f'],
  jungle: ['palm', 'fern', 'flowers|#ff5a6a|#ffd23f|#ffffff', 'tree|#2fa84a|#ff5a6a', 'fern|#1f8a3a', 'mushroom|#ff7a3a|#ffffff', 'rock|#7a9a6a'],
  candy: ['lolly|#ff5fa8|#ffffff', 'cupcake', 'cane', 'gumdrops', 'lolly|#6ec6ff|#ffffff', 'cupcake|#b9a4ff|#c4863f', 'cane|#3ddc84|#ffffff'],
  desert: ['cactus', 'boulder', 'cactus|#6ac060', 'rock|#c4985a', 'boulder|#d4a86a', 'bush|#9a9a4a'],
  ocean: ['coral|#ff6b8a', 'seaweed', 'shell', 'coral|#ffb347', 'seaweed|#3ddc9a', 'coral|#b98aff', 'boulder|#6a9ac4'],
  spring: ['blossom', 'flowers', 'tree|#6ad65a|#ffd23f', 'flowers|#ffffff|#ff9ad5|#c9a8ff', 'blossom|#ffffff|#7a4a2b', 'bush|#4fc24a', 'mushroom|#ffb3d1|#ffffff'],
  farm: ['barn', 'hay', 'tree|#4fb04a|#e8453c', 'fence', 'sunflower', 'windmill', 'fence'],
  volcano: ['volcano', 'lava', 'bare|#2a1818|#2a1818', 'lava', 'rock|#5a3a3a', 'volcano', 'boulder|#6a4444'],
  mountain: ['peak', 'pine', 'tent', 'rock|#8a98b8', 'pine', 'peak|#7a8aa8|#ffffff', 'boulder|#9aa8c0'],
  castle: ['tower', 'tree|#4fb04a|#ffd23f', 'rock|#9a9ec0', 'tower|#d0b8e8|#8a5af0', 'bush', 'boulder|#a8acd0'],
  pirate: ['palm', 'chest', 'barrel', 'shell|#ffd9a0', 'palm', 'rock|#8a7a5a', 'barrel'],
  circus: ['bigtop|#e63946|#ffffff', 'ball', 'bigtop|#3b82f6|#ffd23f', 'gift|#ff5fa8|#ffd23f', 'flowers|#ff5a5a|#ffd23f|#ffffff', 'bigtop|#8a5af0|#ffffff'],
  toy: ['blocks', 'ball', 'tracks', 'blocks', 'gift|#3b82f6|#ffd23f', 'ball'],
  savanna: ['tree|#9aa83a|#d8b45a', 'boulder|#c4985a', 'bush|#a8a84a', 'tree|#b0a84a|#c4985a', 'rock|#b89a6a', 'flowers|#ffb347|#ffd23f'],
};
export const SEASON_PROPS = {
  spring: ['flowers', 'egg', 'blossom'], summer: ['umbrella', 'ball', 'palm'], autumn: ['pumpkin', 'leafpile', 'hay'], winter: ['snowman', 'pine', 'mound'],
  christmas: ['gift|#e03a3e|#ffd23f', 'snowman', 'gift|#1f8f4a|#ffffff'], halloween: ['pumpkin|#ff7a1a', 'tomb', 'bare'], valentine: ['heart', 'flowers|#ff4d8a|#ffd9e6|#ffffff', 'heart|#ff9ec6'],
  stpatrick: ['clover', 'tree|#2fae5a|#ffd23f', 'flowers|#ffffff|#ffd23f|#2fae5a'], easter: ['egg', 'flowers|#c9a8ff|#ffffff|#ffd23f', 'egg|#8fd0ff'], pride: ['flowers|#ff6b6b|#6bb6ff|#ffd23f', 'ball', 'flowers'],
};

// ---------- the horizon strip painted across the top of a level (400x160) ----------
const HZN = {   // world -> { trees, tc: tree colours, hills: [far, near] | null, sun: 'sun'|'sunset'|'moon'|null, extra }
  city: { skyline: true, hills: null, sun: 'sun' }, beach: { trees: 'palm', tc: ['#2fbf5a', '#8a5a2b'], hills: ['#9ad8b8', '#6fc89a'], sun: 'sun', sea: '#19c6d9' },
  forest: { trees: 'pine', tc: ['#2f8f4a', '#fff'], hills: ['#7fc86a', '#5fb050'], sun: 'sun' }, winter: { trees: 'pine', tc: ['#2f8f6a', '#ffffff'], hills: ['#ffffff', '#e4f1ff'], sun: null },
  halloween: { trees: 'bare', tc: ['#2a1d3a', '#2a1d3a'], hills: ['#3a2a68', '#2a1d50'], sun: 'moon', stars: true }, space: { hills: null, sun: 'moon', stars: true, planet: true },
  autumn: { trees: 'round', tc: ['#e8782a', '#b5381f'], hills: ['#e0a95a', '#c98a3a'], sun: 'sunset' }, jungle: { trees: 'palm', tc: ['#2fa84a', '#7a5230'], hills: ['#6fc860', '#3f9e35'], sun: 'sun' },
  candy: { trees: 'lolly', hills: ['#ffb0d4', '#ff98c6'], sun: 'sun' }, desert: { mesa: true, hills: ['#e8a860', '#d49448'], sun: 'sun' },
  ocean: { sea: '#35aef0', hills: null, sun: 'sun', waves: true }, spring: { trees: 'blossom', tc: ['#ffb3d1', '#7a4a2b'], hills: ['#a8e6a0', '#7fd68a'], sun: 'sun' },
  farm: { trees: 'round', tc: ['#4fb04a', '#e8453c'], hills: ['#b8e070', '#98c850'], sun: 'sun' }, volcano: { volcano: true, hills: ['#6a3a3a', '#4a2a2a'], sun: 'sunset' },
  mountain: { peaks: true, trees: 'pine', tc: ['#2f8f6a', '#ffffff'], hills: ['#a8c0a0', '#8fb27a'], sun: 'sun' }, castle: { castle: true, hills: ['#b8c0e8', '#9a9ec0'], sun: 'sun' },
  pirate: { trees: 'palm', tc: ['#2fbf5a', '#8a5a2b'], hills: ['#9ad8b8', '#e0c080'], sun: 'sun', sea: '#17b8d6' }, circus: { tents: true, hills: ['#ffb0c0', '#ff8aa0'], sun: 'sun' },
  toy: { hills: ['#ffe28a', '#ffd24a'], sun: 'sun', blocks: true }, savanna: { trees: 'round', tc: ['#9aa83a', '#d8b45a'], hills: ['#e8c878', '#d8b45a'], sun: 'sunset' },
};
export function horizonSvg(bdId, bd, seed = 3) {
  const H = HZN[bdId] || HZN.city, r = rng(seed + bdId.length * 17), D = Defs(), W = 400, HT = 160, base = 150;
  const sky0 = bd.sky[0], sky1 = mix(bd.sky[0], '#ffffff', H.stars ? 0.12 : 0.55);
  let s = `<rect width="${W}" height="${HT}" fill="${D.lin([[0, sky0], [1, sky1]])}"/>`;
  if (H.stars) for (let i = 0; i < 40; i++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * 100)}" r="${f(0.6 + r() * 1.2)}" fill="#fff" opacity="${f(0.4 + r() * 0.5)}"/>`;
  if (H.sun === 'sun' || H.sun === 'sunset') { const c1 = H.sun === 'sunset' ? '#ffb347' : '#ffe27a'; s += `<circle cx="310" cy="${H.sun === 'sunset' ? 84 : 52}" r="56" fill="${D.rad([[0, c1, 0.5], [1, c1, 0]], 0.5, 0.5, 0.5)}"/><circle cx="310" cy="${H.sun === 'sunset' ? 84 : 52}" r="20" fill="${D.rad([[0, '#fffbe0'], [0.6, c1], [1, shade(c1, -0.12)]], 0.4, 0.35, 0.7)}"/>`; }
  if (H.sun === 'moon') s += `<circle cx="310" cy="46" r="40" fill="${D.rad([[0, '#cfdcff', 0.45], [1, '#cfdcff', 0]], 0.5, 0.5, 0.5)}"/><circle cx="310" cy="46" r="17" fill="#f2f6ff"/><circle cx="305" cy="42" r="3.4" fill="#c3cfee"/><circle cx="316" cy="52" r="2.4" fill="#c3cfee"/>`;
  if (H.planet) s += `<circle cx="80" cy="60" r="20" fill="${dome(D, '#ff9a5a')}"/><ellipse cx="80" cy="62" rx="32" ry="7" fill="none" stroke="#ffe58a" stroke-width="3.4" transform="rotate(-12 80 62)"/>`;
  if (!H.stars) s += [[70, 44, 0.7], [200, 26, 0.55]].map(([x, y, k]) => cloud(D, x, y, k, false)).join('');
  const far = H.hills ? mix(H.hills[0], sky1, 0.3) : mix(bd.ground, sky1, 0.5);
  if (H.peaks) s += `<path d="M-10 ${base} L60 52 L96 96 L130 70 L190 ${base}Z M150 ${base} L230 40 L280 100 L320 66 L410 ${base}Z" fill="${D.lin([[0, '#b8c8e0'], [1, '#8a9cc0']])}"/><path d="M60 52 L78 76 L68 72 L60 84 L50 72 L44 76Z M230 40 L250 70 L240 66 L230 80 L220 66 L212 72Z" fill="#fff"/>`;
  if (H.volcano) s += `<path d="M30 ${base} L120 60 H150 L240 ${base}Z" fill="${D.lin([[0, '#7a4a4a'], [1, '#3a2222']])}"/><path d="M120 60 Q135 70 150 60 Q135 50 120 60Z" fill="#ff9a2a"/><path d="M128 66 Q124 96 112 124 M142 68 Q148 96 152 126" stroke="#ff7a2a" stroke-width="4.4" fill="none" stroke-linecap="round"/><circle cx="132" cy="38" r="12" fill="#c9c0cc" opacity=".6"/><circle cx="146" cy="24" r="9" fill="#d8d0dc" opacity=".5"/>`;
  if (H.mesa) s += [[40, 96, 70, 54], [180, 110, 90, 40], [310, 90, 70, 60]].map(([x, y, w, h], i) => `<path d="M${x} ${base} L${x + 6} ${y} H${x + w - 6} L${x + w} ${base}Z" fill="${D.lin([[0, i % 2 ? '#e8a060' : '#d98a4a'], [1, '#b8683a']])}"/>`).join('');
  if (H.castle) s += `<path d="M120 ${base} V84 H134 V72 H146 V84 H156 V54 H164 V84 H174 V72 H186 V84 H200 V${base}Z" fill="${D.lin([[0, '#c8cce8'], [1, '#9a9ec0']])}"/><path d="M150 54 L160 34 L170 54Z" fill="#e8453c"/><path d="M200 ${base} V90 H240 V${base}Z" fill="#a8acd0"/>`;
  if (H.tents) s += [[50, '#e63946'], [200, '#3b82f6'], [320, '#8a5af0']].map(([x, c]) => `<path d="M${x - 40} ${base} V112 H${x + 40} V${base}Z" fill="${c}"/><path d="M${x - 46} 114 Q${x} 40 ${x + 46} 114Z" fill="${shade(c, 0.1)}"/><path d="M${x} 56 V40 L${x + 14} 46 L${x} 50" fill="#ffd23f"/>`).join('');
  s += hill(W, HT, 118, 12, 1.2, 0.012, far);
  if (H.skyline) { let x = -6, i = 0; const cols = ['#ffd3a8', '#ffb3c7', '#b9e4ff', '#ffe28a']; while (x < W) { const w = 20 + r() * 20, h = 36 + r() * 56; s += `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h + 10)}" rx="2" fill="${D.lin([[0, shade(cols[i++ % 4], 0.05)], [1, shade(cols[(i) % 4], -0.25)]])}"/>`; for (let wy = base - h + 7; wy < base - 8; wy += 10) for (let wx = x + 4; wx < x + w - 5; wx += 7) s += `<rect x="${f(wx)}" y="${f(wy)}" width="3.4" height="4.6" rx="1" fill="#fff" opacity=".5"/>`; x += w + 2; } }
  if (H.sea) s += `<rect x="0" y="${base - 34}" width="${W}" height="40" fill="${D.lin([[0, shade(H.sea, 0.28)], [1, H.sea]])}"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${f(10 + i * 52)} ${base - 22 + (i % 3) * 7} q8 -5 16 0 t16 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>`).join('');
  if (H.blocks) s += [[40, '#ff5a5a'], [76, '#3b82f6'], [58, '#3ddc84'], [250, '#ffd23f'], [286, '#b9a4ff']].map(([x, c], i) => `<rect x="${x}" y="${base - 34 - (i % 2) * 22}" width="32" height="32" rx="4" fill="${shade(c, 0.05)}" stroke="${shade(c, -0.4)}" stroke-width="2"/>`).join('');
  s += hill(W, HT, 138, 9, 2.2, 0.018, H.hills ? H.hills[1] : mix(bd.ground, '#000', 0.04));
  if (H.trees) for (let i = 0; i < 10; i++) { const x = i * 42 - 6 + r() * 20, y = base - 4 - r() * 14, sc = 0.5 + r() * 0.3; s += H.trees === 'lolly' ? `<path d="M${f(x)} ${f(y)} V${f(y - 24 * sc * 1.4)}" stroke="#f6ead2" stroke-width="3"/><circle cx="${f(x)}" cy="${f(y - 34 * sc * 1.4)}" r="${f(12 * sc * 1.4)}" fill="${[ '#ff5fa8', '#6ec6ff', '#ffe14d', '#b9a4ff'][i % 4]}" stroke="#fff" stroke-width="1.4"/>` : tree(D, H.trees === 'bare' && i % 4 === 3 ? 'pine' : H.trees, x, y, sc, H.tc, r); }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${HT}">${D.out()}${s}</svg>` };
}
const horizonImgs = new Map();
export const horizonImg = (bdId, bd) => { if (!horizonImgs.has(bdId)) { const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(horizonSvg(bdId, bd).svg); horizonImgs.set(bdId, im); } return horizonImgs.get(bdId); };
