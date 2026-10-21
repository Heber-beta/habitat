// Sincronización entre dispositivos con Supabase (la misma cuenta del macrociclo).
// Sin librerías: login con correo y contraseña (Auth REST) y una fila por usuario en la
// tabla "habitat" (ver supabase.sql). Los datos se mezclan, así no se pierde lo que marcaste
// en un dispositivo sin internet.
import * as store from './store.js';

const URL_ = 'https://bquxfhbuspaykcpacefa.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdXhmaGJ1c3BheWtjcGFjZWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMjcyODgsImV4cCI6MjEwNzYwMzI4OH0.mFgpvzLQp44NT7dk3FC3w7KnSGRkNIS2inCGowRe0r0';
const AUTH = 'habitat.auth';

let auth = null;
try { auth = JSON.parse(localStorage.getItem(AUTH) || 'null'); } catch (e) { auth = null; }
let timer = null, busy = false, onChange = () => {};
export const status = { state: auth ? 'idle' : 'off', at: null, error: null };

export function user() { return auth && auth.email; }

function keep(a) {
  auth = a;
  try { a ? localStorage.setItem(AUTH, JSON.stringify(a)) : localStorage.removeItem(AUTH); } catch (e) { /* sin almacenamiento */ }
}

async function call(path, opts = {}, withUser = true) {
  const headers = Object.assign({ apikey: KEY, 'Content-Type': 'application/json' }, opts.headers || {});
  if (withUser && auth) headers.Authorization = 'Bearer ' + auth.access_token;
  const res = await fetch(URL_ + path, Object.assign({}, opts, { headers }));
  const txt = await res.text();
  let body = null;
  try { body = txt ? JSON.parse(txt) : null; } catch (e) { body = txt; }
  if (!res.ok) {
    const msg = (body && (body.error_description || body.msg || body.message || body.error)) || ('Error ' + res.status);
    const err = new Error(msg); err.status = res.status; throw err;
  }
  return body;
}

function session(b, email) {
  keep({ access_token: b.access_token, refresh_token: b.refresh_token, expires_at: Date.now() + (b.expires_in || 3600) * 1000, email: (b.user && b.user.email) || email, id: b.user && b.user.id });
}

async function fresh() {
  if (!auth) throw new Error('Sin sesión');
  if (Date.now() < auth.expires_at - 60000) return;
  try {
    const b = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: auth.refresh_token }) }, false);
    session(b, auth.email);
  } catch (e) {
    if (e.status === 400 || e.status === 401) { keep(null); status.state = 'off'; }
    throw e;
  }
}

const MSG = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'Email not confirmed': 'Falta confirmar tu correo: revisa tu bandeja de entrada.',
  'User already registered': 'Ese correo ya tiene cuenta: usa "Entrar".'
};
const es = (e) => MSG[e.message] || (e.status ? e.message : 'No hay conexión. Intenta de nuevo.');

export async function signIn(email, password) {
  try {
    const b = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    session(b, email);
    status.state = 'idle';
    await sync();
    return { ok: true };
  } catch (e) { return { ok: false, msg: es(e) }; }
}

export async function signUp(email, password) {
  try {
    const b = await call('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    if (b && b.access_token) { session(b, email); status.state = 'idle'; await sync(); return { ok: true }; }
    return { ok: true, confirm: true };
  } catch (e) { return { ok: false, msg: es(e) }; }
}

export async function recover(email) {
  try { await call('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email }) }, false); return { ok: true }; } catch (e) { return { ok: false, msg: es(e) }; }
}

export function signOut() {
  if (auth) call('/auth/v1/logout', { method: 'POST' }).catch(() => {});
  keep(null);
  status.state = 'off';
}

// ---------- mezcla de dos copias de los datos

const byKey = (a, b, key, pick) => {
  const m = {};
  (a || []).forEach((x) => { m[key(x)] = x; });
  (b || []).forEach((x) => { const k = key(x); m[k] = m[k] ? pick(m[k], x) : x; });
  return Object.values(m);
};

export function merge(a, b) {
  // manda la copia más reciente, salvo que sea de un teléfono recién instalado (sin bienvenida)
  let base = (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
  if (!base.onboarded && (base === a ? b : a).onboarded) base = base === a ? b : a;
  const other = base === a ? b : a;
  const out = Object.assign({}, other, base);
  out.habits = byKey(other.habits, base.habits, (h) => h.id, (o, n) => n);
  out.removed = Object.assign({}, a.removed, b.removed);
  out.log = {};
  [a.log || {}, b.log || {}].forEach((log) => Object.keys(log).forEach((k) => Object.keys(log[k]).forEach((id) => {
    const r = log[k][id];
    const gone = out.removed[k + '|' + id];
    if (gone && (!r.at || r.at <= gone)) return;
    out.log[k] = out.log[k] || {};
    const cur = out.log[k][id];
    if (!cur || (r.at || '') > (cur.at || '')) out.log[k][id] = r;
  })));
  out.rescues = byKey(a.rescues, b.rescues, (r) => r.at, (o, n) => (n.done ? n : o)).sort((x, y) => x.at.localeCompare(y.at));
  out.focus = byKey(a.focus, b.focus, (f) => f.at, (o) => o).sort((x, y) => x.at.localeCompare(y.at));
  out.experiments = byKey(other.experiments, base.experiments, (x) => x.id, (o, n) => (n.decision || !o.decision ? n : o));
  out.saved = Object.assign({}, a.saved, b.saved);
  const la = a.letter || {}, lb = b.letter || {};
  out.letter = (la.at || '') >= (lb.at || '') ? la : lb;
  out.settledUntil = [a.settledUntil, b.settledUntil].filter(Boolean).sort().pop();
  out.lastOpen = [a.lastOpen, b.lastOpen].filter(Boolean).sort().pop();
  out.createdAt = [a.createdAt, b.createdAt].filter(Boolean).sort()[0];
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  return out;
}

// ---------- traer, mezclar y subir

async function push(data) {
  await call('/rest/v1/habitat?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: auth.id, data, updated_at: new Date().toISOString() })
  });
}

export async function sync() {
  if (!auth || busy) return;
  busy = true;
  status.state = 'syncing'; onChange('status');
  try {
    await fresh();
    const rows = await call('/rest/v1/habitat?select=data&user_id=eq.' + auth.id);
    const remote = rows && rows[0] && rows[0].data;
    const local = store.S;
    if (!remote) await push(local);
    else {
      const merged = merge(local, remote);
      const m = JSON.stringify(merged);
      if (m !== JSON.stringify(local)) { store.replaceAll(merged, true); onChange('data'); }
      if (m !== JSON.stringify(remote)) await push(merged);
    }
    status.state = 'idle'; status.at = new Date(); status.error = null;
  } catch (e) {
    status.state = auth ? 'error' : 'off';
    status.error = e.status === 404 ? 'Falta crear la tabla en Supabase.' : es(e);
  } finally {
    busy = false;
    onChange('status');
  }
}

// Sube los cambios poco después de cada guardado y trae lo nuevo al volver a la app.
export function start(cb) {
  onChange = cb || onChange;
  store.onSave(() => { if (!auth) return; clearTimeout(timer); timer = setTimeout(sync, 1500); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  window.addEventListener('online', () => sync());
  setInterval(() => { if (!document.hidden) sync(); }, 60000);
  sync();
}
