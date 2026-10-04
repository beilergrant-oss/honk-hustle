// Screen-level game feel: combo tracking, floating text, haptics.
// The 3D half of the juice lives in the scene, where the meshes do.

const COMBO_WINDOW = 1500;

let combo = 0;
let lastClear = 0;

/** Clears within 1.5s of each other chain into a combo. */
export function nextCombo() {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  combo = now - lastClear < COMBO_WINDOW ? combo + 1 : 1;
  lastClear = now;
  return combo;
}

export function resetCombo() {
  combo = 0;
  lastClear = 0;
}

export const comboText = (c) => (c > 1 ? `Combo x${c}!` : 'Nice!');

export const comboColor = (c) => (c > 3 ? '#ffd23f' : '#ffffff');


/** Floating shout-out anchored at a screen position inside the game stage. */
export function floatText(container, text, x, y, color = '#ffffff') {
  if (!container) return;
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%,-50%)',
    font: '900 26px system-ui, sans-serif',
    color,
    webkitTextStroke: '2px rgba(0,0,0,.35)',
    pointerEvents: 'none',
    zIndex: 50,
    transition: 'transform .7s ease-out, opacity .7s ease-out',
  });
  container.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = 'translate(-50%,-190%) scale(1.3)';
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 800);
}