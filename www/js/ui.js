// ui.js - tiny helpers: toast, modal, html escaping.
export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = (n) => Number(n || 0).toLocaleString('en-US');

let toastTimer = 0;
export function toast(msg, ms = 2200) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// modal({ emoji, title, body, lines: [[label, value]], actions: [{ label, cls, id, onClick }], dismissible })
// Returns { close }. An action's onClick may return false to keep the modal open.
export function modal({ emoji = '', title = '', body = '', lines = [], actions = [], dismissible = false }) {
  const host = $('#modalHost'); host.innerHTML = '';
  const o = document.createElement('div'); o.className = 'overlay';
  o.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    ${emoji ? `<div class="big" aria-hidden="true">${emoji}</div>` : ''}<h2>${esc(title)}</h2>${body ? `<p>${body}</p>` : ''}
    ${lines.length ? `<div class="lines">${lines.map(([a, b]) => `<div class="line"><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div>` : ''}
    <div class="row">${actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-i="${i}" ${a.disabled ? 'disabled' : ''}>${esc(a.label)}</button>`).join('')}</div></div>`;
  host.appendChild(o);
  const close = () => { host.innerHTML = ''; };
  o.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (b) { const a = actions[+b.dataset.i]; const r = a.onClick && a.onClick(); if (r !== false) close(); return; }
    if (dismissible && e.target === o) close();
  });
  return { close };
}
export const closeModal = () => { $('#modalHost').innerHTML = ''; };
