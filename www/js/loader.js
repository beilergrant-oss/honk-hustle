// loader.js - a loading bar that is driven by REAL work and REAL connectivity (no fake progress).
//
// How the bar behaves
//   - Every task has a weight. The bar = finished weight + the live fraction of the task that is running.
//   - It never goes backwards (a retried download keeps the bar where it was until it catches up).
//   - Offline: the running network task is cancelled, the bar PAUSES (status 'offline') and resumes by itself the moment
//     Wi-Fi or mobile data is back. Tasks that don't need the network (needsNetwork: false) are not blocked.
//   - Slow: if nothing moves for `stallMs` the status becomes 'slow' (and goes back to 'loading' when progress moves).
//   - Stuck: a task that takes longer than `taskTimeoutMs` is cancelled and retried with a short back-off. After
//     `maxRetries` the status becomes 'error' and retry() tries again.
//   - Optional "Play offline": playOffline() runs only the offline-capable tasks (and any offlineFallback) and finishes.
//
// Connection type (Wi-Fi / mobile data) comes from, in order: Capacitor's Network plugin (iOS app wrapper),
// then navigator.connection (Chrome/Android), otherwise 'unknown' (iOS Safari does not expose it). Online/offline
// uses the browser events plus an optional reachability probe (pingUrl) so Wi-Fi with no internet (hotels,
// captive portals) is detected as offline too.

export class OfflineAbort extends Error { constructor() { super('offline'); this.name = 'OfflineAbort'; } }

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- connection info ----------
export function readConnection(env = defaultEnv()) {
  const nav = env.navigator || {};
  const cap = env.capStatus || null;            // last status from Capacitor Network (if present)
  const c = nav.connection || nav.mozConnection || nav.webkitConnection || null;
  let online = nav.onLine !== false;
  let type = 'unknown';
  if (cap) {
    online = !!cap.connected;
    type = cap.connectionType === 'wifi' ? 'wifi' : cap.connectionType === 'cellular' ? 'cellular' : online ? 'unknown' : 'none';
  } else if (c && c.type) {
    type = c.type === 'wifi' || c.type === 'ethernet' ? 'wifi' : c.type === 'cellular' ? 'cellular' : c.type === 'none' ? 'none' : 'unknown';
    if (type === 'none') online = false;
  }
  if (!online) type = 'none';
  const effectiveType = c && c.effectiveType ? c.effectiveType : null;     // 'slow-2g' | '2g' | '3g' | '4g'
  const quality = !online ? 'none' : effectiveType === 'slow-2g' || effectiveType === '2g' ? 'poor' : effectiveType === '3g' ? 'ok' : effectiveType === '4g' ? 'good' : 'unknown';
  return { online, type, effectiveType, quality, downlinkMbps: c && typeof c.downlink === 'number' ? c.downlink : null, saveData: !!(c && c.saveData) };
}

export function defaultEnv() {
  const w = typeof window !== 'undefined' ? window : null;
  return { window: w, navigator: typeof navigator !== 'undefined' ? navigator : {}, fetch: typeof fetch === 'function' ? fetch.bind(globalThis) : null };
}

// ---------- fetch helper that reports real byte progress and measures real speed ----------
export async function trackedFetch(url, ctx, init = {}) {
  const f = (ctx.env && ctx.env.fetch) || fetch;
  const t0 = Date.now();
  const res = await f(url, { ...init, signal: ctx.signal });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !res.body.getReader) {                      // no streaming support: progress jumps at the end
    const buf = await res.arrayBuffer();
    ctx.progress(1); ctx.recordBytes && ctx.recordBytes(buf.byteLength, Date.now() - t0);
    return new Response(buf, { status: res.status, headers: res.headers });
  }
  const reader = res.body.getReader(), chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); loaded += value.length;
    // unknown size: creep toward (not to) 90% so the bar shows life without lying about completion
    ctx.progress(total ? loaded / total : 1 - 1 / (1 + loaded / 200000));
  }
  ctx.progress(1);
  ctx.recordBytes && ctx.recordBytes(loaded, Date.now() - t0);
  return new Response(new Blob(chunks), { status: res.status, headers: res.headers });
}

// ---------- the loader ----------
export function createLoader(opts) {
  const {
    tasks,
    env = defaultEnv(),
    onUpdate = () => {},
    pingUrl = null,              // e.g. location.origin + '/favicon.ico' - confirms the internet really works
    pingTimeoutMs = 4000,
    pollMs = 3000,               // how often to re-check while offline
    stallMs = 8000,
    taskTimeoutMs = 25000,
    maxRetries = 3,
    backoffMs = (n) => Math.min(4000, 400 * 2 ** (n - 1)),
    offlineGraceMs = 5000,       // offline this long before "Play offline" is offered
    canPlayOffline = false,
  } = opts;

  const totalWeight = tasks.reduce((a, t) => a + (t.weight || 1), 0);
  const w = env.window;
  const state = {
    status: 'idle',              // idle | loading | slow | offline | error | done
    progress: 0,                 // 0..1, never decreases
    label: '',
    task: 0, taskCount: tasks.length,
    connection: readConnection(env),
    measuredMbps: null,
    error: null,
    retries: 0,
    offlineSince: null,
    canPlayOffline: false,
    offlineMode: false,
  };

  let cancelled = false, running = false, current = null, lastMove = Date.now(), doneWeight = 0, partial = 0, curWeight = 0;
  let onlineWaiters = [], retryWaiters = [], stallTimer = null, offlineTimer = null, pollTimer = null, speedSamples = [];

  const emit = () => { try { onUpdate({ ...state, connection: { ...state.connection } }); } catch (e) { /* UI errors must not break loading */ } };
  const set = (patch) => { Object.assign(state, patch); emit(); };
  const moved = () => { lastMove = Date.now(); if (state.status === 'slow') set({ status: 'loading' }); };
  const computeProgress = () => {
    const p = Math.min(1, (doneWeight + curWeight * Math.max(0, Math.min(1, partial))) / totalWeight);
    if (p > state.progress) { state.progress = p; moved(); emit(); }
  };
  const recordBytes = (bytes, ms) => {
    if (!bytes || !ms) return;
    speedSamples.push((bytes * 8) / (ms / 1000) / 1e6);
    speedSamples = speedSamples.slice(-5);
    state.measuredMbps = Math.round((speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length) * 10) / 10;
  };

  // ----- connectivity -----
  async function probe() {
    if (!pingUrl || !env.fetch) return true;
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), pingTimeoutMs);
    try { await env.fetch(pingUrl + (pingUrl.includes('?') ? '&' : '?') + '_=' + Date.now(), { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: ctl && ctl.signal }); return true; }
    catch (e) { return false; } finally { clearTimeout(timer); }
  }
  const browserOnline = () => readConnection(env).online;
  const refreshConnection = () => { state.connection = readConnection(env); };

  function goneOffline() {
    refreshConnection();
    if (current && current.needsNetwork && !state.offlineMode) { current.abort(new OfflineAbort()); }
    if (state.status !== 'offline' && state.status !== 'done' && state.status !== 'idle') {
      set({ status: 'offline', offlineSince: Date.now(), connection: state.connection });
      clearTimeout(offlineTimer);
      offlineTimer = setTimeout(() => { if (state.status === 'offline') set({ canPlayOffline }); }, offlineGraceMs);
      startPolling();
    } else emit();
  }
  function backOnline() {
    refreshConnection(); lastMove = Date.now();
    stopPolling(); clearTimeout(offlineTimer);
    const ws = onlineWaiters; onlineWaiters = [];
    ws.forEach((r) => r());
    if (state.status === 'offline') set({ status: 'loading', offlineSince: null, canPlayOffline: false });
    else emit();
  }
  function startPolling() {
    stopPolling();
    pollTimer = setInterval(async () => { if (state.status === 'offline' && browserOnline() && await probe()) backOnline(); }, pollMs);
  }
  function stopPolling() { clearInterval(pollTimer); pollTimer = null; }

  const onBrowserOffline = () => goneOffline();
  const onBrowserOnline = async () => { refreshConnection(); if (state.status === 'offline' || state.status === 'loading' || state.status === 'slow') { if (await probe()) backOnline(); else if (state.status !== 'offline') goneOffline(); } };
  const onConnChange = () => { refreshConnection(); emit(); };
  let capListener = null;
  if (w && w.addEventListener) { w.addEventListener('offline', onBrowserOffline); w.addEventListener('online', onBrowserOnline); }
  const nc = env.navigator && env.navigator.connection;
  if (nc && nc.addEventListener) nc.addEventListener('change', onConnChange);
  const capNet = w && w.Capacitor && w.Capacitor.Plugins && w.Capacitor.Plugins.Network;
  if (capNet) {
    capNet.getStatus().then((s) => { env.capStatus = s; refreshConnection(); emit(); }).catch(() => {});
    Promise.resolve(capNet.addListener('networkStatusChange', (s) => { env.capStatus = s; s.connected ? onBrowserOnline() : goneOffline(); })).then((l) => { capListener = l; }).catch(() => {});
  }

  async function waitUntilOnline() {
    if (browserOnline() && await probe()) return;
    if (state.status !== 'offline') goneOffline(); else startPolling();
    await new Promise((r) => onlineWaiters.push(r));
  }

  // ----- running one task -----
  async function runTask(task, index) {
    const needsNetwork = task.needsNetwork !== false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : { signal: undefined, abort() {} };
    let rejectNow;
    const killed = new Promise((_, rej) => { rejectNow = rej; });
    current = { needsNetwork, abort(reason) { try { controller.abort(); } catch (e) { /* ignore */ } rejectNow(reason); } };
    curWeight = task.weight || 1; partial = 0; lastMove = Date.now();
    set({ label: task.label || '', task: index + 1 });
    const ctx = { signal: controller.signal, env, progress: (f) => { partial = f; computeProgress(); }, setLabel: (l) => set({ label: l }), recordBytes };
    const timeout = new Promise((_, rej) => setTimeout(() => { try { controller.abort(); } catch (e) { /* ignore */ } rej(new Error('timeout')); }, taskTimeoutMs));
    try {
      await Promise.race([Promise.resolve().then(() => task.run(ctx)), killed, timeout]);
    } finally { current = null; }
    doneWeight += curWeight; partial = 0; curWeight = 0; computeProgress();
  }

  async function runAll() {
    for (let i = 0; i < tasks.length; i++) {
      if (cancelled) return;
      const task = tasks[i], needsNetwork = task.needsNetwork !== false;
      let attempt = 0;
      for (;;) {
        if (cancelled) return;
        if (state.offlineMode && needsNetwork) {                 // player chose to play offline
          if (task.offlineFallback) { try { await task.offlineFallback({ env, progress: () => {}, setLabel: (l) => set({ label: l }) }); } catch (e) { /* best effort */ } }
          doneWeight += task.weight || 1; computeProgress(); break;
        }
        if (needsNetwork) {
          await waitUntilOnline();
          if (cancelled) return;
          if (state.offlineMode) continue;
          if (state.status === 'offline') set({ status: 'loading' });
        }
        try { await runTask(task, i); attempt = 0; break; }
        catch (e) {
          if (cancelled) return;
          if (e instanceof OfflineAbort) { set({ retries: state.retries }); continue; }   // wait for connection, then redo this task
          if (state.offlineMode) continue;
          attempt++; state.retries++;
          if (attempt > maxRetries) {
            set({ status: 'error', error: (e && e.message) || 'Something went wrong' });
            await new Promise((r) => retryWaiters.push(r));
            attempt = 0; state.error = null; set({ status: 'loading' });
          } else { set({ error: null }); await wait(backoffMs(attempt)); }
        }
      }
    }
  }

  function start() {
    if (running) return api;
    running = true; cancelled = false; lastMove = Date.now();
    refreshConnection();
    set({ status: 'loading' });
    stallTimer = setInterval(() => { if (state.status === 'loading' && Date.now() - lastMove > stallMs) set({ status: 'slow' }); }, Math.max(50, Math.min(1000, stallMs / 4)));
    runAll().then(() => { if (!cancelled) { state.progress = 1; set({ status: 'done', label: '' }); } cleanup(); }).catch((e) => { set({ status: 'error', error: (e && e.message) || 'Failed' }); });
    return api;
  }
  function cleanup() {
    clearInterval(stallTimer); stopPolling(); clearTimeout(offlineTimer);
    if (w && w.removeEventListener) { w.removeEventListener('offline', onBrowserOffline); w.removeEventListener('online', onBrowserOnline); }
    if (nc && nc.removeEventListener) nc.removeEventListener('change', onConnChange);
    if (capListener && capListener.remove) capListener.remove();
  }
  const api = {
    start,
    getState: () => ({ ...state, connection: { ...state.connection } }),
    retry() { const r = retryWaiters; retryWaiters = []; r.forEach((f) => f()); if (state.status === 'offline') this.checkNow(); },
    async checkNow() { refreshConnection(); if (browserOnline() && await probe()) backOnline(); else { refreshConnection(); emit(); } },
    playOffline() { if (!canPlayOffline) return; state.offlineMode = true; state.offlineSince = null; stopPolling(); clearTimeout(offlineTimer); onlineWaiters.splice(0).forEach((r) => r()); if (current && current.needsNetwork) current.abort(new OfflineAbort()); set({ status: 'loading', canPlayOffline: false }); },
    cancel() { cancelled = true; onlineWaiters.splice(0).forEach((r) => r()); retryWaiters.splice(0).forEach((r) => r()); cleanup(); },
  };
  return api;
}
