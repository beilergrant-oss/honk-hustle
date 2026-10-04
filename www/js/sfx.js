// sfx.js - sounds (WebAudio, no files), haptics (Capacitor), all switchable from Settings.
let ctx = null, soundOn = true, hapticsOn = true;
export const configureSfx = ({ sound, haptics }) => { soundOn = sound !== false; hapticsOn = haptics !== false; };
const A = () => { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } if (ctx.state === 'suspended') ctx.resume(); return ctx; };
export const unlockAudio = () => { try { A(); } catch (e) {} };   // call from the first tap (iOS needs a user gesture)

function tone(freq, { dur = 0.15, type = 'triangle', gain = 0.16, slideTo = null, delay = 0 } = {}) {
  if (!soundOn) return;
  const c = A(); if (!c) return;
  const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur * 0.8);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sfx = {
  tap: () => tone(660, { dur: 0.06, type: 'sine', gain: 0.08 }),
  go: (combo = 0) => tone(523.25 * Math.pow(2, Math.min(combo, 12) / 12), { dur: 0.18, slideTo: 523.25 * Math.pow(2, Math.min(combo, 12) / 12) * 1.6 }),
  blocked: () => tone(150, { dur: 0.16, type: 'square', gain: 0.07, slideTo: 100 }),
  locked: () => { tone(220, { dur: 0.08, type: 'square', gain: 0.06 }); tone(165, { dur: 0.1, type: 'square', gain: 0.06, delay: 0.08 }); },
  board: (i = 0) => tone(784 * Math.pow(2, Math.min(i, 7) / 12), { dur: 0.08, type: 'sine', gain: 0.07 }),
  full: () => { tone(880, { dur: 0.12 }); tone(1175, { dur: 0.2, delay: 0.1 }); },
  honk: () => { tone(330, { dur: 0.22, type: 'sawtooth', gain: 0.06 }); tone(392, { dur: 0.22, type: 'sawtooth', gain: 0.06 }); },
  power: () => { tone(440, { dur: 0.1, type: 'sine' }); tone(660, { dur: 0.1, type: 'sine', delay: 0.08 }); tone(990, { dur: 0.16, type: 'sine', delay: 0.16 }); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { dur: 0.22, delay: i * 0.12 })),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, { dur: 0.28, type: 'sawtooth', gain: 0.07, delay: i * 0.16 })),
  coin: () => { tone(988, { dur: 0.07, type: 'square', gain: 0.06 }); tone(1319, { dur: 0.16, type: 'square', gain: 0.06, delay: 0.07 }); },
};
export function haptic(kind = 'light') {
  if (!hapticsOn) return;
  try {
    const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
    if (H) { if (kind === 'success' || kind === 'error') H.notification({ type: kind === 'success' ? 'SUCCESS' : 'ERROR' }); else H.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }); }
    else if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 30 : 12);
  } catch (e) { /* haptics are optional */ }
}
