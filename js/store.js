// Estado de la app guardado en el teléfono (localStorage), con cálculos de
// rachas, comodines, crecimiento de la mascota y patrones.
import { PETS, STAGES } from './data.js';

const KEY = 'habitat.v1';
const START_WILDCARDS = 3;

export function dayKey(d = new Date()) {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  return y + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}
export function parseDay(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(k, n) {
  const d = parseDay(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
export function daysBetween(a, b) {
  return Math.round((parseDay(b) - parseDay(a)) / 86400000);
}
export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function blank() {
  return {
    version: 1,
    onboarded: false,
    createdAt: new Date().toISOString(),
    user: { name: '' },
    pet: { k: 'zorro', name: PETS.zorro.name, since: dayKey() },
    habits: [],
    log: {},            // { 'YYYY-MM-DD': { habitId: { level, at } } }
    rescues: [],        // [{ at, feeling, step, done }]
    letter: { text: '', at: null },
    experiments: [],    // [{ id, habitId, hypothesis, start, length, decision }]
    wildcards: START_WILDCARDS,
    saved: {},          // días salvados con un comodín
    settledUntil: dayKey(),
    lastOpen: dayKey(),
    settings: { sound: true, remind: false },
    focus: [],          // sesiones del modo foco: [{ at, min, habitId }]
    stageSeen: null,    // última etapa de la mascota que ya celebramos
    weekSeen: null      // lunes de la última semana cuyo resumen ya viste
  };
}

export let S = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* sin almacenamiento: se usa uno nuevo en memoria */ }
  return blank();
}

// Quien quiera enterarse de cada cambio (la sincronización con la nube) se anota aquí.
const listeners = [];
export function onSave(fn) { listeners.push(fn); }

export function save(silent) {
  if (!silent) S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* lleno o bloqueado */ }
  if (!silent) listeners.forEach((fn) => fn());
}

export function reset() {
  S = blank();
  save();
}

export function replaceAll(data, fromCloud) {
  S = Object.assign(blank(), data);
  save(fromCloud);
}

export function blankHabit(idea) {
  return Object.assign({ id: uid(), area: 'estudio', title: '', time: '18:00', place: '', days: [1, 2, 3, 4, 5], min: '', normal: '', epic: '', identity: '' }, idea || {});
}

// Completa lo que el usuario dejó en blanco al crear un hábito.
export function finishHabit(d) {
  const h = Object.assign({}, d);
  delete h._for; delete h.on;
  h.title = h.title.trim();
  if (!h.min.trim()) h.min = 'Empezar 2 minutos';
  if (!h.normal.trim()) h.normal = h.title;
  if (!h.epic.trim()) h.epic = h.normal + ' y un poco más';
  if (!h.identity.trim()) h.identity = 'Soy alguien que cumple: ' + h.title.toLowerCase();
  return h;
}

// ---------- hábitos y registro

export function habitById(id) {
  return S.habits.find((h) => h.id === id);
}

export function scheduledOn(k) {
  const wd = parseDay(k).getDay();
  return S.habits.filter((h) => !h.archived && h.days.includes(wd));
}

export function doneOn(k) {
  return S.log[k] || {};
}

export function mark(habitId, level, k = dayKey()) {
  if (!S.log[k]) S.log[k] = {};
  const first = !S.log[k][habitId];
  S.log[k][habitId] = { level, at: new Date().toISOString() };
  if (level === 'epic' && first) S.wildcards += 1;
  save();
}

export function unmark(habitId, k = dayKey()) {
  if (S.log[k] && S.log[k][habitId]) {
    if (S.log[k][habitId].level === 'epic' && S.wildcards > 0) S.wildcards -= 1;
    delete S.log[k][habitId];
    if (!Object.keys(S.log[k]).length) delete S.log[k];
    // marca de borrado, para que otro dispositivo no lo vuelva a traer al sincronizar
    S.removed = S.removed || {};
    S.removed[k + '|' + habitId] = new Date().toISOString();
    save();
  }
}

// ---------- racha flexible con comodines
// Un día cuenta si hiciste al menos un hábito, o si no tenías nada programado.
// Si fallaste un día completo y te quedan comodines, se gasta uno y la racha sigue.

export function settle() {
  const today = dayKey();
  let k = S.settledUntil || today;
  const used = [];
  while (k < today) {
    const sched = scheduledOn(k);
    const done = Object.keys(doneOn(k)).length;
    if (sched.length && !done && !S.saved[k] && k >= (S.pet.since || today)) {
      if (S.wildcards > 0) { S.wildcards -= 1; S.saved[k] = true; used.push(k); }
    }
    k = addDays(k, 1);
  }
  S.settledUntil = today;
  const away = daysBetween(S.lastOpen || today, today);
  S.lastOpen = today;
  save();
  return { used, away };
}

export function streak() {
  const today = dayKey();
  let n = Object.keys(doneOn(today)).length ? 1 : 0;
  let k = addDays(today, -1);
  const start = S.pet.since || today;
  while (k >= start) {
    const ok = Object.keys(doneOn(k)).length || S.saved[k] || !scheduledOn(k).length;
    if (!ok) break;
    if (Object.keys(doneOn(k)).length || S.saved[k]) n += 1;
    k = addDays(k, -1);
  }
  return n;
}

// ---------- mascota

export function activeDays() {
  return Object.keys(S.log).filter((k) => Object.keys(S.log[k]).length).length;
}

export function stage() {
  const d = activeDays();
  let st = STAGES[0], next = STAGES[1], idx = 0;
  STAGES.forEach((s, i) => { if (d >= s.from) { st = s; next = STAGES[i + 1] || null; idx = i; } });
  const prog = next ? (d - st.from) / (next.from - st.from) : 1;
  return { days: d, i: idx, label: st.label, scale: st.scale, gift: st.gift, next, prog, special: !next };
}

export function lastActive() {
  const ks = Object.keys(S.log).filter((k) => Object.keys(S.log[k]).length).sort();
  return ks.length ? ks[ks.length - 1] : null;
}

// ---------- votos de identidad

export function votes(habit) {
  let n = 0;
  Object.values(S.log).forEach((day) => { if (day[habit.id]) n += 1; });
  return n;
}

// ---------- experimentos de 14 días

export function experimentDays(ex) {
  const today = dayKey();
  const h = habitById(ex.habitId);
  const out = [];
  for (let i = 0; i < ex.length; i++) {
    const k = addDays(ex.start, i);
    const rec = doneOn(k)[ex.habitId];
    let st = 'future';
    if (k === today) st = rec ? (rec.level === 'min' ? 'min' : 'ok') : 'today';
    else if (k < today) {
      if (rec) st = rec.level === 'min' ? 'min' : 'ok';
      else st = h && h.days.includes(parseDay(k).getDay()) ? 'miss' : 'rest';
    }
    out.push({ k, n: i + 1, st });
  }
  const dayN = Math.min(ex.length, daysBetween(ex.start, today) + 1);
  const done = out.filter((d) => d.st === 'ok' || d.st === 'min').length;
  const due = out.filter((d) => d.k <= today && d.st !== 'rest' && d.st !== 'future').length;
  return { days: out, dayN, done, due, finished: daysBetween(ex.start, today) >= ex.length - 1 };
}

// ---------- patrones (últimas 6 semanas)

export function patterns() {
  const today = dayKey();
  const byDay = Array.from({ length: 7 }, () => ({ sched: 0, done: 0 }));
  const hours = {};
  let sched = 0, done = 0, mins = 0;
  for (let i = 1; i <= 42; i++) {
    const k = addDays(today, -i);
    if (k < (S.pet.since || today)) break;
    const wd = parseDay(k).getDay();
    const sc = scheduledOn(k), dn = doneOn(k);
    sc.forEach((h) => {
      byDay[wd].sched += 1; sched += 1;
      if (dn[h.id]) { byDay[wd].done += 1; done += 1; if (dn[h.id].level === 'min') mins += 1; }
    });
  }
  Object.values(S.log).forEach((day) => Object.values(day).forEach((r) => {
    if (!r.at) return;
    const h = new Date(r.at).getHours();
    const slot = Math.floor(h / 2) * 2;
    hours[slot] = (hours[slot] || 0) + 1;
  }));
  let best = null;
  Object.keys(hours).forEach((h) => { if (!best || hours[h] > hours[best]) best = h; });
  const rescues = S.rescues.length, rescued = S.rescues.filter((r) => r.done).length;
  const feel = {};
  S.rescues.forEach((r) => { feel[r.feeling] = (feel[r.feeling] || 0) + 1; });
  let topFeel = null;
  Object.keys(feel).forEach((f) => { if (!topFeel || feel[f] > feel[topFeel]) topFeel = f; });
  return { byDay, best: best === null ? null : Number(best), sched, done, mins, rescues, rescued, topFeel, enough: sched >= 5 };
}

// ---------- resumen semanal (semanas de lunes a domingo)

export function weekStart(k = dayKey()) {
  return addDays(k, -((parseDay(k).getDay() + 6) % 7));
}

function weekStats(start) {
  const today = dayKey();
  const days = [];
  const per = {};
  let sched = 0, done = 0, mins = 0;
  for (let i = 0; i < 7; i++) {
    const k = addDays(start, i);
    const sc = k < (S.pet.since || today) ? [] : scheduledOn(k), dn = doneOn(k);
    const past = k <= today;
    const items = sc.map((h) => {
      const r = dn[h.id];
      if (past) {
        per[h.id] = per[h.id] || { sched: 0, done: 0 };
        if (k < today || r) { per[h.id].sched += 1; sched += 1; }
        if (r) { per[h.id].done += 1; done += 1; if (r.level === 'min') mins += 1; }
      }
      return { id: h.id, st: r ? r.level : k < today ? 'miss' : 'pending' };
    });
    days.push({ k, items, saved: !!S.saved[k], future: !past });
  }
  const end = addDays(start, 7);
  const focusMin = (S.focus || []).filter((f) => { const k = dayKey(new Date(f.at)); return k >= start && k < end; }).reduce((a, f) => a + f.min, 0);
  const rescues = S.rescues.filter((r) => { const k = dayKey(new Date(r.at)); return k >= start && k < end; }).length;
  return { start, days, per, sched, done, mins, pct: sched ? Math.round(done / sched * 100) : null, focusMin, rescues };
}

// Resumen de la semana (0 = esta, -1 = la pasada) con el hábito que más cuesta y un consejo.
export function weekSummary(offset = 0) {
  const start = addDays(weekStart(), offset * 7);
  const w = weekStats(start);
  const prev = weekStats(addDays(start, -7));
  const hs = S.habits.filter((h) => !h.archived && w.per[h.id] && w.per[h.id].sched);
  const rate = (h) => w.per[h.id].done / w.per[h.id].sched;
  let best = null, hard = null;
  hs.forEach((h) => {
    if (!best || rate(h) > rate(best) || (rate(h) === rate(best) && w.per[h.id].done > w.per[best.id].done)) best = h;
    if (!hard || rate(h) < rate(hard)) hard = h;
  });
  if (hard && best && hard.id === best.id) hard = null;
  if (hard && rate(hard) >= 0.8) hard = null;
  // el día de la semana con más hábitos sin hacer
  const missByDay = w.days.map((d) => d.items.filter((x) => x.st === 'miss').length);
  const worst = Math.max(...missByDay);
  const worstDay = worst >= 2 ? w.days[missByDay.indexOf(worst)].k : null;
  let tip;
  if (!w.sched) tip = 'Esta semana no tenías hábitos programados. Elige uno chiquito para la próxima.';
  else if (hard && w.per[hard.id].done === 0) tip = '"' + hard.title + '" no salió ninguna vez. Prueba solo con la versión mínima: ' + hard.min.toLowerCase() + '.';
  else if (hard) tip = '"' + hard.title + '" es el que más te cuesta. ¿Lo pasamos a otra hora o a otro lugar? Ajustar no es rendirse.';
  else if (worstDay) tip = 'Casi todo lo que faltó fue un mismo día. Ese día usa la versión mínima de todo.';
  else if (w.pct >= 80) tip = 'Semana muy buena. Si te sientes listo, sube un hábito a su versión normal o épica.';
  else tip = 'Vas avanzando. La meta no es la perfección: es no fallar dos días seguidos.';
  return Object.assign(w, { prevPct: prev.pct, best, hard, worstDay, tip });
}
