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
