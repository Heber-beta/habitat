// Hábitat: pantallas, navegación y acciones.
import { PETS, PET_ORDER, AREAS, LEVELS, FEELINGS, DAY_SHORT, DAY_LONG, MONTHS, PHRASES, STAGES, HABIT_IDEAS } from './data.js';
import * as store from './store.js';
import { Pet, petImg, scene, petMeta } from './pet.js';

const S = () => store.S;
const app = document.getElementById('app');
const ui = {
  route: 'inicio',
  param: null,
  ob: null,          // borrador de la bienvenida
  rescue: null,      // estado del botón de rescate
  draft: null        // borrador del editor de hábito
};
let pet = null;

// ---------- utilidades

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const I = {
  check: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  star: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="#F6C453" stroke="#C99A1E" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  flame: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4553A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/></svg>',
  flameW: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/></svg>',
  mail: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F6B4F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  close: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#263A2E" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#263A2E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  plus: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  home: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
  lab: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/></svg>',
  chart: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  paw: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="5"/><circle cx="5" cy="9" r="2"/><circle cx="19" cy="9" r="2"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/></svg>',
  user: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>'
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'buenos días' : h < 20 ? 'buenas tardes' : 'buenas noches';
}
function todayLabel() {
  const d = new Date();
  const t = DAY_LONG[d.getDay()];
  return t[0].toUpperCase() + t.slice(1) + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()];
}
function letterExcerpt(max = 110) {
  const t = (S().letter.text || '').trim();
  if (!t) return '';
  const first = t.split(/(?<=[.!?])\s+/)[0];
  return first.length > max ? first.slice(0, max - 1) + '…' : first;
}
function daysAgo(iso) {
  if (!iso) return '';
  const n = store.daysBetween(store.dayKey(new Date(iso)), store.dayKey());
  return n === 0 ? 'Hoy escribiste:' : n === 1 ? 'Ayer escribiste:' : 'Hace ' + n + ' días escribiste:';
}
function toast(msg, ms = 2600) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
function backdrop(place, light) {
  return '<div class="backdrop' + (light ? ' light' : '') + '" aria-hidden="true"><img src="' + scene(place, S().pet.k) + '" alt=""></div>';
}
function nav(on) {
  const items = [['inicio', 'Inicio', I.home], ['lab', 'Laboratorio', I.lab], ['patrones', 'Patrones', I.chart], ['mascota', 'Mascota', I.paw], ['yo', 'Yo', I.user]];
  return '<nav class="nav" aria-label="Menú principal">' + items.map(([r, l, ic]) =>
    '<a href="#/' + r + '" class="' + (r === on ? 'on' : '') + '"' + (r === on ? ' aria-current="page"' : '') + '>' + ic + l + '</a>').join('') + '</nav>';
}
function fireflies() {
  return '<div class="fireflies" aria-hidden="true">' + [[40, 200, 0], [300, 240, 2], [210, 150, 4], [100, 120, 1], [340, 130, 3]].map(([x, y, d]) =>
    '<span style="left:' + x + 'px;top:' + y + 'px;animation-delay:' + d + 's;animation-duration:' + (7 + d * 0.6) + 's"></span>').join('') + '</div>';
}

// ---------- mascota compartida entre pantallas

function ensurePet() {
  const s = S();
  if (!pet) {
    pet = new Pet({ kind: s.pet.k, name: s.pet.name });
    pet.userName = s.user.name;
  }
  return pet;
}
function mountPet(slot, opts) {
  const p = ensurePet();
  p.userName = S().user.name;
  if (p.kind !== S().pet.k || p.name !== S().pet.name) p.setKind(S().pet.k, S().pet.name);
  slot.appendChild(p.el);
  p.el.classList.toggle('special', !!opts.special);
  const place = () => {
    if (opts.hero) placeInHero(slot, opts);
    else {
      const m = petMeta(p.kind);
      const h = Math.min(opts.height, opts.width * m.petHeight / m.petWidth);
      p.place({ height: h, x: slot.clientWidth / 2, bottom: opts.bottom || 4 });
    }
  };
  Pet.ready().then(place);
  place();
  return p;
}
// Ubica el hogar pintado y la mascota de modo que pise el mismo lugar del dibujo.
function placeInHero(hero, opts) {
  const k = S().pet.k, P = PETS[k];
  const img = hero.querySelector('img.scene');
  const W = hero.clientWidth, H = hero.clientHeight;
  const sc = W / 338;
  const feet = H - (opts.feetFromBottom || 66);
  let top = P.fy - feet / sc;
  top = Math.max(0, Math.min(top, 600 - H / sc));
  img.style.top = (-top * sc) + 'px';
  const feetY = (P.fy - top) * sc;
  pet.place({ height: P.h * (W / 390) * (opts.scale || 1), x: P.fx * sc, bottom: H - feetY });
}

// Mascotas en miniatura, cada una dentro de su propio hogar pintado.
function petGrid(current, act) {
  return '<div class="grid5">' + PET_ORDER.map((k) => '<button class="pet-tile' + (k === current ? ' on' : '') + '" data-act="' + act + '" data-k="' + k + '" aria-label="' + PETS[k].label + '" aria-pressed="' + (k === current) + '">' +
    '<img class="home" src="' + scene('casa', k) + '" alt=""><img class="who" src="' + petImg(k) + '" alt=""></button>').join('') + '</div>';
}
function changePet(k) {
  const s = S();
  if (k === s.pet.k) { if (pet) pet.tap(); return; }
  const wasDefault = s.pet.name === PETS[s.pet.k].name;
  s.pet.k = k;
  if (wasDefault) s.pet.name = PETS[k].name;
  store.save();
  render(true);
  setTimeout(() => pet && pet.say('¡Hola! Soy ' + s.pet.name), 400);
}

// ---------- hojas inferiores

function sheet(html, onOpen) {
  closeSheet();
  const w = document.createElement('div');
  w.className = 'sheet-wrap';
  w.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
  w.addEventListener('click', (e) => { if (e.target === w) closeSheet(); });
  document.body.appendChild(w);
  const f = w.querySelector('button, input, textarea');
  if (f) setTimeout(() => f.focus({ preventScroll: true }), 50);
  if (onOpen) onOpen(w);
  return w;
}
function closeSheet() {
  document.querySelectorAll('.sheet-wrap').forEach((n) => n.remove());
}

// ======================================================================
// Pantallas
// ======================================================================

function screenInicio() {
  const s = S(), k = store.dayKey();
  const st = store.stage();
  const today = store.scheduledOn(k);
  const done = store.doneOn(k);
  const nDone = today.filter((h) => done[h.id]).length;
  const streak = store.streak();
  const exc = letterExcerpt();
  const nextTxt = st.next ? 'día ' + st.days + ' de ' + st.next.from : 'día ' + st.days;
  const tasks = today.slice().sort((a, b) => a.time.localeCompare(b.time)).map((h) => {
    const r = done[h.id];
    return '<div class="task' + (r ? ' done' : '') + '">' +
      '<img class="thumb" src="' + scene(AREAS[h.area].scene, s.pet.k) + '" alt="">' +
      '<button class="body" data-act="task" data-id="' + h.id + '"><span class="t">' + esc(h.title) + '</span>' +
      '<span class="muted small">' + esc(h.time) + (h.place ? ' · ' + esc(h.place) : '') + ' · mínimo: ' + esc(h.min) + '</span></button>' +
      '<button class="check' + (r ? ' on' + (r.level === 'min' ? ' min' : '') : '') + '" data-act="check" data-id="' + h.id + '" aria-label="' + (r ? 'Desmarcar ' : 'Marcar como hecho: ') + esc(h.title) + '">' + I.check + '</button></div>';
  }).join('');

  return backdrop('casa') +
    '<main class="screen">' +
    '<section class="hero" data-hero>' +
    '<img class="scene" src="' + scene('casa', s.pet.k) + '" alt="Hogar de ' + esc(s.pet.name) + '">' +
    '<div class="shade"></div>' + fireflies() +
    '<div class="hello"><div class="who"><div class="small bold">' + todayLabel() + ' · ' + greeting() + '</div><h1 style="font-size:24px">Hola' + (s.user.name ? ', ' + esc(s.user.name) : '') + '</h1></div>' +
    '<div class="row" style="gap:6px"><span class="pill" title="Racha">' + I.flame + streak + '</span><span class="pill" title="Comodines">' + I.star + s.wildcards + '</span></div></div>' +
    '<div class="petbar"><span class="display" style="font-size:16px">' + esc(s.pet.name) + '</span><span class="muted small">' + st.label + ' · ' + nextTxt + '</span><span class="bar"><i style="width:' + Math.round(st.prog * 100) + '%"></i></span>' +
    '<button class="swap" data-act="pet-sheet" aria-label="Cambiar de mascota">' + I.paw + '<span>Cambiar</span></button></div>' +
    '</section>' +
    '<div class="pad stack" style="margin-top:14px">' +
    '<a class="btn red block" href="#/rescate" style="min-height:58px;font-size:20px">' + I.flameW + 'Estoy procrastinando</a>' +
    (exc ? '<div class="card row" style="align-items:flex-start;gap:12px;padding:10px 14px">' + I.mail + '<div><div class="muted small bold">' + daysAgo(s.letter.at) + '</div><div style="font-style:italic;font-size:14px;line-height:1.4">"' + esc(exc) + '"</div></div></div>' : '') +
    '<div class="row between" style="padding:0 2px"><h2 style="font-size:19px">Hoy</h2><span class="muted bold">' + (today.length ? nDone + ' de ' + today.length + ' hechos' : '') + '</span></div>' +
    (today.length ? '<div class="stack" style="gap:8px">' + tasks + '</div>' :
      '<div class="card muted" style="line-height:1.45">Hoy no tienes hábitos programados. Descansar también es parte del plan.</div>') +
    '<a href="#/habito/nuevo" class="btn link">+ Agregar hábito</a>' +
    '</div></main>' + nav('inicio');
}

function afterInicio() {
  const hero = app.querySelector('[data-hero]');
  const st = store.stage();
  mountPet(hero, { hero: true, scale: st.scale, special: st.special });
}

// ---------- Rescate

function screenRescate() {
  const r = ui.rescue || (ui.rescue = { step: 1, feeling: null, first: '', habitId: null });
  const s = S();
  const dots = '<div class="dots" aria-label="Paso ' + r.step + ' de 3">' + [1, 2, 3].map((i) => '<i class="' + (i <= r.step ? 'on' : '') + '"></i>').join('') + '</div>';
  let body = '';
  if (r.step === 1) {
    body = '<div class="row" style="gap:12px;align-items:flex-end"><div class="stage" data-slot style="width:110px;height:110px;flex-shrink:0"></div>' +
      '<div class="card" style="font-weight:700;line-height:1.4;font-size:14px">Tranquilo, nos pasa a todos. Vamos a partir juntos.</div></div>' +
      '<h1 style="font-size:28px;line-height:1.15">¿Qué sientes ahora mismo?</h1><div class="muted">Elige la que más se parezca. No hay respuesta mala.</div>' +
      '<div class="grid2">' + FEELINGS.map((f) => '<button class="feel" data-act="feel" data-id="' + f.id + '"><i style="background:' + f.color + '"></i>' + f.label + '</button>').join('') + '</div>';
  } else if (r.step === 2) {
    const f = FEELINGS.find((x) => x.id === r.feeling);
    const exc = letterExcerpt(90);
    const h = r.habitId && store.habitById(r.habitId);
    body = '<div class="muted bold" style="text-transform:uppercase;letter-spacing:.08em;font-size:12px">Sientes: ' + f.label + '</div>' +
      '<h1 style="font-size:26px;line-height:1.2">' + f.title + '</h1>' +
      '<div class="card" style="line-height:1.5">' + f.tip + '</div>' +
      (exc ? '<div class="card row" style="align-items:flex-start;background:#E3F0D8">' + I.mail + '<div><div class="small bold" style="color:#2F6B4F">Tu carta:</div><div style="font-style:italic;font-size:14px;line-height:1.4">"' + esc(exc) + '"</div></div></div>' : '') +
      '<label class="field">¿Cuál es la primera acción, tan chica que no puedas fallar?<input class="input" data-model="rescue.first" value="' + esc(r.first || (h ? h.min : '')) + '" placeholder="Ej: abrir el PDF de anatomía, capítulo 3"></label>' +
      '<button class="btn block" data-act="rescue-go">Empezar solo 5 minutos</button>' +
      '<button class="btn link" data-act="rescue-back">Elegir otra emoción</button>';
  } else {
    const left = Math.max(0, r.end ? Math.round((r.end - Date.now()) / 1000) : 300);
    const doneNow = r.finished;
    body = '<div class="stack" style="align-items:center;text-align:center;gap:14px">' +
      '<h1 style="font-size:26px">' + (doneNow ? '¡Lo lograste!' : 'Solo 5 minutos') + '</h1>' +
      '<div class="muted" style="max-width:300px;line-height:1.4">' + (doneNow ? 'Puedes seguir o parar. Parar también cuenta y ganaste 1 comodín.' : 'Deja el celular boca abajo. ' + esc(s.pet.name) + ' se queda contigo mientras trabajas.') + '</div>' +
      (r.first ? '<div class="chip" style="background:#fff">Primera acción: ' + esc(r.first) + '</div>' : '') +
      '<div class="timer"><svg class="ring" viewBox="0 0 230 230" aria-hidden="true"><circle cx="115" cy="115" r="104" fill="none" stroke="#EEF5E8" stroke-width="14"/><circle data-ring cx="115" cy="115" r="104" fill="none" stroke="#7FB069" stroke-width="14" stroke-linecap="round" stroke-dasharray="653.5" stroke-dashoffset="' + (653.5 * (1 - (300 - left) / 300)) + '"/></svg>' +
      '<div class="num" data-time>' + fmt(left) + '</div><div class="muted small" data-tlabel>' + (doneNow ? 'terminado' : r.running ? 'trabajando' : 'listo para partir') + '</div></div>' +
      '<div class="stage" data-slot style="width:150px;height:110px"></div>' +
      (doneNow ? '<a class="btn block" href="#/inicio">Volver al inicio</a><button class="btn link" data-act="rescue-more">Otros 5 minutos</button>' :
        '<button class="btn block" data-act="rescue-timer" style="max-width:260px">' + (r.running ? 'Pausar' : r.paused ? 'Seguir' : 'Empezar') + '</button>' +
        '<a href="#/inicio" class="btn link">Volver al inicio</a>') +
      '</div>';
  }
  return backdrop('estudio', true) +
    '<main class="screen no-nav"><div class="topbar"><a class="icon-btn" href="#/inicio" aria-label="Cerrar">' + I.close + '</a>' + dots + '<span class="muted bold" style="width:44px;text-align:right">' + r.step + '/3</span></div>' +
    '<div class="pad stack" style="gap:16px">' + body + '</div></main>';
}
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
function fmt(sec) { const m = Math.floor(sec / 60), x = sec % 60; return m + ':' + (x < 10 ? '0' : '') + x; }

function afterRescate() {
  const slot = app.querySelector('[data-slot]');
  if (slot) mountPet(slot, { height: 86, width: slot.clientWidth - 6, bottom: 6 });
  const r = ui.rescue;
  if (r && r.step === 3 && r.running) tickRescue();
}
function tickRescue() {
  clearInterval(ui.rt);
  ui.rt = setInterval(() => {
    const r = ui.rescue;
    if (!r || ui.route !== 'rescate' || !r.running) { clearInterval(ui.rt); return; }
    const left = Math.max(0, Math.round((r.end - Date.now()) / 1000));
    const t = app.querySelector('[data-time]'), ring = app.querySelector('[data-ring]');
    if (t) t.textContent = fmt(left);
    if (ring) ring.setAttribute('stroke-dashoffset', 653.5 * (1 - (r.total - left) / r.total));
    if (left <= 0) {
      clearInterval(ui.rt);
      r.running = false; r.finished = true;
      const rec = S().rescues[S().rescues.length - 1];
      if (rec && !rec.done) { rec.done = true; S().wildcards += 1; store.save(); }
      render();
      setTimeout(() => pet && pet.celebrate(PHRASES.rescueDone), 150);
    }
  }, 500);
}

// ---------- Laboratorio

function screenLab() {
  const s = S();
  const exps = s.experiments.slice().sort((a, b) => (a.decision ? 1 : 0) - (b.decision ? 1 : 0) || b.start.localeCompare(a.start));
  const colors = { ok: ['#7FB069', '#fff', '✓'], min: ['#F6C453', '#263A2E', '✓'], miss: ['#E0D5BC', '#5B6B5F', '–'], rest: ['#F3EDE0', '#9AA39C', ''], today: ['#fff', '#2F6B4F', 'hoy'], future: ['#F3EDE0', '#5B6B5F', null] };
  const cards = exps.map((ex) => {
    const h = store.habitById(ex.habitId);
    if (!h) return '';
    const A = AREAS[h.area];
    const d = store.experimentDays(ex);
    const grid = d.days.map((x) => {
      const c = colors[x.st];
      return '<div class="day" style="background:' + c[0] + ';color:' + c[1] + (x.st === 'today' ? ';border:3px solid #2F6B4F' : '') + '">' + (c[2] === null ? x.n : c[2]) + '</div>';
    }).join('');
    const decided = ex.decision ? '<div class="chip" style="background:#E3F0D8;color:#2F6B4F">Decidiste: ' + ex.decision + '</div>' : '';
    const decide = d.finished && !ex.decision ?
      '<div class="stack" style="gap:8px"><div class="bold">Terminó el experimento: cumpliste ' + d.done + ' de ' + d.due + '. ¿Qué hacemos?</div><div class="grid2" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
      ['conservar', 'ajustar', 'descartar'].map((x) => '<button class="btn ghost" style="min-height:46px;font-size:15px;padding:0 6px" data-act="decide" data-id="' + ex.id + '" data-v="' + x + '">' + x[0].toUpperCase() + x.slice(1) + '</button>').join('') + '</div></div>' : '';
    return '<div class="card stack" style="gap:12px">' +
      '<div class="row between"><div class="row"><img src="' + scene(A.scene, s.pet.k) + '" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:cover;object-position:50% 60%">' +
      '<span class="chip" style="background:' + A.soft + ';color:' + A.ink + '">' + A.label + '</span></div><span class="muted bold">' + (d.finished ? 'Terminado' : 'Día ' + d.dayN + ' de ' + ex.length) + '</span></div>' +
      '<h3 style="font-size:19px">' + esc(h.title) + '</h3>' +
      '<div style="background:#FFF6E5;border-radius:14px;padding:10px 12px;line-height:1.45;font-size:14px"><b>Hipótesis:</b> ' + esc(ex.hypothesis) + '</div>' +
      '<div class="grid7">' + grid + '</div>' +
      '<div class="row" style="border-top:1px solid #EFE6D2;padding-top:10px"><span class="display" style="font-size:26px;color:#2F6B4F">' + d.done + ' de ' + Math.max(d.due, 0) + '</span><span class="muted" style="line-height:1.35">días cumplidos hasta ahora.</span></div>' +
      decided + decide + '</div>';
  }).join('');
  return backdrop('proyectos', true) +
    '<main class="screen"><div class="topbar"><div><h1>Laboratorio</h1><div class="muted">Cada hábito es un experimento de 14 días.</div></div>' +
    '<button class="icon-btn" style="background:#2F6B4F;width:48px;height:48px;border-radius:16px" data-act="new-exp" aria-label="Nuevo experimento">' + I.plus + '</button></div>' +
    '<div class="pad stack">' + (cards || '<div class="card empty stack" style="align-items:center"><img src="' + scene('proyectos', s.pet.k) + '" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:24px"><h3>Tu primer experimento</h3><div class="muted" style="line-height:1.45">Elige un hábito y una hipótesis, por ejemplo: "si estudio a las 17:00 en la biblioteca, lo cumpliré 10 de 14 días".</div><button class="btn" data-act="new-exp">Crear experimento</button></div>') +
    '<div class="card row" style="align-items:flex-start;background:rgba(227,240,216,.95)"><div style="font-size:13px;line-height:1.45">Al día 14 eliges: <b>conservar</b>, <b>ajustar</b> (otra hora, otro lugar o una versión más chica) o <b>descartar</b>. Fallar aquí no es fracaso: es información.</div></div>' +
    '</div></main>' + nav('lab');
}

// ---------- Patrones

function screenPatrones() {
  const s = S(), p = store.patterns();
  let body;
  if (!p.enough) {
    body = '<div class="card empty stack" style="align-items:center"><img src="' + petImg(s.pet.k) + '" alt="" style="height:110px"><h3>Todavía estoy aprendiendo de ti</h3><div class="muted" style="line-height:1.45">Marca tus hábitos unos días y aquí verás tu mejor momento, qué días te cuestan y cómo te ayuda el rescate.</div></div>';
  } else {
    const order = [1, 2, 3, 4, 5, 6, 0];
    const pct = order.map((wd) => { const x = p.byDay[wd]; return x.sched ? Math.round(x.done / x.sched * 100) : null; });
    const vals = pct.filter((v) => v !== null);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    let worst = null;
    order.forEach((wd, i) => { if (pct[i] !== null && (worst === null || pct[i] < pct[worst])) worst = i; });
    const bars = order.map((wd, i) => {
      const v = pct[i];
      return '<div><span class="small bold" style="color:#3D5245">' + (v === null ? '' : v) + '</span><b style="height:' + (v === null ? 4 : Math.max(4, v * 0.95)) + 'px;background:' + (v === null ? '#EFE6D2' : v < avg * 0.7 ? '#C4553A' : '#7FB069') + '"></b><span class="small bold muted">' + DAY_SHORT[wd] + '</span></div>';
    }).join('');
    const insight = worst !== null && pct[worst] < avg * 0.7 ?
      'Los <b>' + DAY_LONG[order[worst]] + '</b> cumples bastante menos que el resto. ¿Probamos un experimento con la versión mínima ese día?' :
      'Tu semana está pareja. Bien ahí.';
    const best = p.best === null ? '—' : p.best + ':00 a ' + (p.best + 2) + ':00';
    body = '<div class="grid2"><div class="card" style="background:rgba(227,240,216,.95)"><div class="small bold" style="color:#2F6B4F">Tu mejor momento</div><div class="display" style="font-size:20px">' + best + '</div><div class="small muted">Cuando más hábitos marcas</div></div>' +
      '<div class="card" style="background:rgba(251,235,196,.95)"><div class="small bold" style="color:#7A5A0E">Cumplimiento</div><div class="display" style="font-size:20px">' + Math.round(p.done / p.sched * 100) + '%</div><div class="small muted">' + p.mins + ' veces con la versión mínima</div></div></div>' +
      '<div class="card stack"><div class="row between"><b>Cumplimiento por día</b><span class="muted small">% de hábitos</span></div><div class="bars" role="img" aria-label="Cumplimiento por día de la semana">' + bars + '</div>' +
      '<div style="font-size:13px;line-height:1.45;background:#FFF6E5;border-radius:14px;padding:10px 12px">' + insight + '</div></div>';
  }
  const fe = p.topFeel && FEELINGS.find((f) => f.id === p.topFeel);
  const resc = '<div class="card row" style="align-items:flex-start;gap:12px"><div style="width:44px;height:44px;border-radius:14px;background:#C4553A;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + I.flameW + '</div><div style="font-size:13px;line-height:1.45">' +
    (p.rescues ? '<b>Botón de rescate:</b> lo usaste ' + p.rescues + (p.rescues === 1 ? ' vez' : ' veces') + ' y en ' + p.rescued + ' terminaste los 5 minutos.' + (fe ? ' Lo que más sientes: <b>' + fe.label.toLowerCase() + '</b>.' : '') :
      '<b>Botón de rescate:</b> cuando lo uses, aquí verás qué emociones te frenan y cuánto te ayuda.') + '</div></div>';
  return backdrop('entreno', true) +
    '<main class="screen"><div class="topbar"><div><h1>Tus patrones</h1><div class="muted">Últimas 6 semanas</div></div></div>' +
    '<div class="pad stack"><div style="position:relative;height:104px;border-radius:22px;overflow:hidden;box-shadow:0 6px 16px rgba(38,58,46,.2)"><img src="' + scene('entreno', s.pet.k) + '" alt="' + esc(s.pet.name) + ' entrenando" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 68%;animation:kb 18s ease-in-out infinite alternate">' +
    '<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(24,44,34,.6),rgba(24,44,34,0) 70%)"></div><div style="position:absolute;left:14px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.4);max-width:220px"><div class="display" style="font-size:18px">' + esc(s.pet.name) + ' entrena contigo</div><div class="small bold">Racha actual: ' + plural(store.streak(), 'día', 'días') + '</div></div></div>' +
    body + resc + '</div></main>' + nav('patrones');
}

// ---------- Mascota

function screenMascota() {
  const s = S(), st = store.stage(), P = PETS[s.pet.k];
  const places = [['casa', 'Hogar'], ['estudio', 'Estudio'], ['entreno', 'Entreno'], ['proyectos', 'Proyectos']];
  const nextTxt = st.next ? 'Faltan ' + plural(st.next.from - st.days, 'día activo', 'días activos') + ' para ' + st.next.label.toLowerCase() + '.' : 'Llegó a su forma especial.';
  return backdrop('casa') +
    '<main class="screen"><div class="topbar"><div><h1>' + esc(s.pet.name) + '</h1><div class="muted">' + P.label + ' · ' + st.label + '</div></div></div>' +
    '<div class="pad stack">' +
    '<section class="hero" data-hero style="height:250px;border-radius:26px"><img class="scene" src="' + scene('casa', s.pet.k) + '" alt="Hogar de ' + esc(s.pet.name) + '">' + fireflies() + '</section>' +
    '<div class="card stack" style="gap:8px"><div class="row between"><b>Crecimiento</b><span class="muted small">' + plural(st.days, 'día activo', 'días activos') + '</span></div><span class="bar"><i style="width:' + Math.round(st.prog * 100) + '%"></i></span><div class="muted small">' + nextTxt + ' Nunca muere: si te alejas, solo se cansa y te espera.</div>' +
    '<div class="grid4" style="text-align:center;margin-top:4px">' + STAGES.map((x) => '<div style="background:' + (x.label === st.label ? '#E3F0D8' : '#FFF6E5') + ';border-radius:12px;padding:6px 2px"><div class="small bold">' + x.label + '</div><div class="small muted">día ' + x.from + '</div></div>').join('') + '</div></div>' +
    '<div class="grid4 places">' + places.map(([p, l]) => '<div class="place"><img src="' + scene(p, s.pet.k) + '" alt="' + l + ' de ' + esc(s.pet.name) + '"><div>' + l + '</div></div>').join('') + '</div>' +
    '<label class="field">Nombre<input class="input" data-model="pet.name" maxlength="16" value="' + esc(s.pet.name) + '"></label>' +
    '<div class="bold" style="font-size:14px">Cambiar de compañero</div><div class="muted small" style="margin-top:-6px">Tu progreso se mantiene.</div>' +
    petGrid(s.pet.k, 'pick-pet') +
    '</div></main>' + nav('mascota');
}
function afterMascota() {
  const st = store.stage();
  mountPet(app.querySelector('[data-hero]'), { hero: true, feetFromBottom: 30, scale: 0.85 * st.scale, special: st.special });
}

// ---------- Yo

function screenYo() {
  const s = S();
  const habits = s.habits.filter((h) => !h.archived);
  const maxV = Math.max(10, ...habits.map(store.votes));
  return backdrop('casa', true) +
    '<main class="screen"><div class="topbar"><div><h1>' + (s.user.name ? esc(s.user.name) : 'Yo') + '</h1><div class="muted">Tu carta, tu identidad y tus hábitos</div></div></div>' +
    '<div class="pad stack">' +
    '<div class="card stack"><div class="row between"><h2 style="font-size:19px">Carta a mi yo del futuro</h2></div>' +
    '<div class="row" style="flex-wrap:wrap;gap:6px"><span class="chip" style="background:#FBEBC4;color:#6E500E">¿Por qué quiero cambiar?</span><span class="chip" style="background:#DCEBF6;color:#2C5E86">¿En quién me quiero convertir?</span><span class="chip" style="background:#E3F0D8;color:#2F6B4F">¿Qué me diría en un año?</span></div>' +
    '<textarea class="input" id="carta" rows="6" aria-label="Tu carta">' + esc(s.letter.text) + '</textarea>' +
    '<div class="row between"><span class="muted small">' + (s.letter.at ? 'Guardada el ' + new Date(s.letter.at).getDate() + ' de ' + MONTHS[new Date(s.letter.at).getMonth()] : 'Te la mostraré antes de tus tareas.') + '</span><button class="btn" style="min-height:44px;font-size:15px" data-act="save-letter">Guardar</button></div></div>' +
    '<h2 style="font-size:19px;margin-top:6px">En quién me estoy convirtiendo</h2><div class="muted" style="margin-top:-6px">Cada vez que cumples, sumas un voto a esa identidad.</div>' +
    habits.map((h) => { const v = store.votes(h), A = AREAS[h.area]; return '<div class="card stack" style="gap:8px;padding:12px 14px"><div class="row between" style="align-items:baseline"><b style="font-size:15px">' + esc(h.identity || h.title) + '</b><b style="color:' + A.ink + '">' + v + (v === 1 ? ' voto' : ' votos') + '</b></div><span class="bar" style="background:' + A.soft + '"><i style="width:' + Math.min(100, v / maxV * 100) + '%;background:' + A.color + '"></i></span></div>'; }).join('') +
    '<h2 style="font-size:19px;margin-top:6px">Mis hábitos</h2>' +
    habits.map((h) => '<a class="card row between" style="text-decoration:none;color:inherit" href="#/habito/' + h.id + '"><div><b>' + esc(h.title) + '</b><div class="muted small">' + h.days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAY_SHORT[d]).join(' ') + ' · ' + esc(h.time) + (h.place ? ' · ' + esc(h.place) : '') + '</div></div><span class="muted bold">Editar</span></a>').join('') +
    '<a class="btn ghost block" href="#/habito/nuevo">Agregar hábito</a>' +
    '<h2 style="font-size:19px;margin-top:6px">Mis datos</h2>' +
    '<label class="field">Tu nombre<input class="input" data-model="user.name" maxlength="24" value="' + esc(s.user.name) + '"></label>' +
    '<div class="card muted" style="line-height:1.45">Por ahora tus datos se guardan solo en este teléfono. Haz una copia de vez en cuando.</div>' +
    '<div class="grid2"><button class="btn ghost" data-act="export">Copia de seguridad</button><label class="btn ghost" style="cursor:pointer">Restaurar<input type="file" accept="application/json" data-act-change="import" hidden></label></div>' +
    '<button class="btn link" style="color:#9A3F2A" data-act="wipe">Borrar todo y empezar de cero</button>' +
    '</div></main>' + nav('yo');
}

// ---------- Editor de hábito

function screenHabito() {
  const isNew = ui.param === 'nuevo';
  if (!ui.draft || ui.draft._for !== ui.param) {
    const base = isNew ? store.blankHabit() : store.habitById(ui.param);
    if (!base) { location.hash = '#/yo'; return ''; }
    ui.draft = JSON.parse(JSON.stringify(base));
    ui.draft._for = ui.param;
  }
  const d = ui.draft;
  return backdrop(AREAS[d.area].scene, true) +
    '<main class="screen no-nav"><div class="topbar"><button class="icon-btn" data-act="go-back" aria-label="Volver">' + I.back + '</button><h1 style="font-size:22px;flex:1">' + (isNew ? 'Nuevo hábito' : 'Editar hábito') + '</h1></div>' +
    '<div class="pad stack">' + (isNew ? ideasRow('draft') : '') + habitFields(d, 'draft', S().pet.k) +
    '<button class="btn block" data-act="save-habit">Guardar</button>' +
    (isNew ? '' : '<button class="btn link" style="color:#9A3F2A" data-act="archive-habit">Quitar este hábito</button>') +
    '</div></main>';
}
function ideasRow(model) {
  return '<div class="field">Ideas rápidas<div class="row" style="gap:6px;flex-wrap:wrap">' + HABIT_IDEAS.map((x, i) =>
    '<button class="chip" style="background:#fff;border:2px solid #E0D5BC;min-height:38px;font-size:13px" data-act="idea" data-model="' + model + '" data-i="' + i + '">' + esc(x.title) + '</button>').join('') +
    '</div><span class="muted small" style="font-weight:600">O escribe el tuyo, el que quieras.</span></div>';
}
function habitFields(d, model, k) {
  const days = [1, 2, 3, 4, 5, 6, 0];
  return '<label class="field">¿Qué hábito quieres crear?<input class="input" data-model="' + model + '.title" value="' + esc(d.title) + '" placeholder="Ej: Estudiar anatomía, leer, meditar…"></label>' +
    '<div class="field" role="group" aria-label="Escenario">¿Dónde te acompaña tu mascota?<div class="grid4">' + Object.keys(AREAS).map((a) =>
    '<button class="scene-pick' + (d.area === a ? ' on' : '') + '" data-act="area" data-model="' + model + '" data-v="' + a + '" aria-pressed="' + (d.area === a) + '"><img src="' + scene(AREAS[a].scene, k) + '" alt=""><span>' + AREAS[a].label + '</span></button>').join('') + '</div></div>' +
    '<div class="grid2"><label class="field">Hora<input class="input" type="time" data-model="' + model + '.time" value="' + esc(d.time) + '"></label><label class="field">Lugar<input class="input" data-model="' + model + '.place" value="' + esc(d.place) + '" placeholder="Ej: Biblioteca"></label></div>' +
    '<div class="field" role="group" aria-label="Días">Días<div class="row" style="gap:6px;flex-wrap:wrap">' + days.map((x) => '<button class="daychip' + (d.days.includes(x) ? ' on' : '') + '" data-act="day" data-model="' + model + '" data-v="' + x + '" aria-pressed="' + d.days.includes(x) + '" aria-label="' + DAY_LONG[x] + '">' + DAY_SHORT[x] + '</button>').join('') + '</div></div>' +
    '<div class="muted small" style="margin-bottom:-4px">Tres niveles: los días malos vale la mínima.</div>' +
    '<label class="field"><span><span class="chip" style="background:#FBEBC4;color:#6E500E">Mínima</span></span><input class="input" data-model="' + model + '.min" value="' + esc(d.min) + '" placeholder="Tan chica que no puedas fallar"></label>' +
    '<label class="field"><span><span class="chip" style="background:#E3F0D8;color:#2F6B4F">Normal</span></span><input class="input" data-model="' + model + '.normal" value="' + esc(d.normal) + '" placeholder="Lo que planeas un día normal"></label>' +
    '<label class="field"><span><span class="chip" style="background:#2F6B4F;color:#fff">Épica</span></span><input class="input" data-model="' + model + '.epic" value="' + esc(d.epic) + '" placeholder="Un día con todo"></label>' +
    '<label class="field">Identidad que construye<input class="input" data-model="' + model + '.identity" value="' + esc(d.identity) + '" placeholder="Soy alguien que…"></label>';
}

// ---------- Bienvenida

function screenBienvenida() {
  const ob = ui.ob || (ui.ob = { step: 0, name: S().user.name || '', k: 'zorro', petName: PETS.zorro.name, custom: false, habits: [], letter: '', edit: null, isNew: false });
  let body = '';
  const next = (label = 'Seguir', dis) => '<button class="btn block" data-act="ob-next"' + (dis ? ' disabled' : '') + '>' + label + '</button>';
  if (ob.step === 0) {
    body = '<div class="stack" style="align-items:center;text-align:center;gap:18px;padding-top:40px">' +
      '<div class="logo">Hábit<span>at</span></div>' +
      '<img src="' + petImg('zorro') + '" alt="" style="height:160px">' +
      '<h1 style="font-size:26px;line-height:1.2">Deja de postergar, de a poquito y acompañado</h1>' +
      '<div class="muted" style="line-height:1.5;font-size:15px">Hábitat te ayuda a empezar cuando cuesta, aprende de tus patrones y hace crecer a tu mascota cada vez que cumples.</div>' +
      next('Empezar') + '</div>';
  } else if (ob.step === 1) {
    body = '<h1 style="font-size:26px">¿Cómo te llamas?</h1><div class="muted">Así te saluda tu mascota.</div>' +
      '<input class="input" data-model="ob.name" value="' + esc(ob.name) + '" maxlength="24" placeholder="Tu nombre" autocomplete="given-name">' + next();
  } else if (ob.step === 2) {
    body = '<h1 style="font-size:26px">Elige tu compañero</h1><div class="muted" style="line-height:1.4">Crecerá contigo. Nunca muere: si te alejas, solo se cansa y te espera.</div>' +
      '<section class="hero" data-hero style="height:230px;border-radius:26px"><img class="scene" src="' + scene('casa', ob.k) + '" alt="Hogar del ' + PETS[ob.k].label.toLowerCase() + '"></section>' +
      '<div class="card" style="font-size:14px;line-height:1.45"><b>' + PETS[ob.k].label + ':</b> ' + PETS[ob.k].desc + '</div>' +
      petGrid(ob.k, 'ob-pet') +
      '<label class="field">¿Cómo se va a llamar?<input class="input" data-model="ob.petName" maxlength="16" value="' + esc(ob.petName) + '"></label>' + next('Este es');
  } else if (ob.step === 3) {
    if (ob.edit !== null) {
      const h = ob.habits[ob.edit];
      body = '<div class="row"><button class="icon-btn" data-act="ob-cancel-edit" aria-label="Volver">' + I.back + '</button><h1 style="font-size:22px">' + (ob.isNew ? 'Nuevo hábito' : 'Editar hábito') + '</h1></div>' +
        (ob.isNew ? ideasRow('ob.habits.' + ob.edit) : '') + habitFields(h, 'ob.habits.' + ob.edit, ob.k) +
        '<button class="btn block" data-act="ob-save-habit">Guardar hábito</button>';
    } else {
      body = '<h1 style="font-size:26px">Tus hábitos</h1><div class="muted" style="line-height:1.4">Crea los hábitos que tú quieras desarrollar. Ponles hora y lugar: el cuándo y el dónde son la mitad del trabajo.</div>' +
        ob.habits.map((h, i) => { const A = AREAS[h.area]; return '<div class="card row" style="gap:12px"><img src="' + scene(A.scene, ob.k) + '" alt="" style="width:56px;height:56px;border-radius:14px;object-fit:cover;object-position:50% 60%"><div style="flex:1;min-width:0"><b>' + esc(h.title) + '</b><div class="muted small">' + h.days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAY_SHORT[d]).join(' ') + ' · ' + esc(h.time) + (h.place ? ' · ' + esc(h.place) : '') + '</div></div>' +
          '<div class="stack" style="gap:4px"><button class="btn ghost" style="min-height:38px;font-size:13px;padding:0 10px" data-act="ob-edit" data-i="' + i + '">Editar</button><button class="btn link" style="min-height:32px;font-size:13px" data-act="ob-remove" data-i="' + i + '">Quitar</button></div></div>'; }).join('') +
        (ob.habits.length ? '' : '<div class="card muted" style="line-height:1.45">Todavía no tienes hábitos. Empieza con uno o dos: es mejor partir chico.</div>') +
        '<button class="btn ghost block" data-act="ob-new">+ Crear un hábito</button>' +
        next('Seguir', !ob.habits.length);
    }
  } else if (ob.step === 4) {
    body = '<h1 style="font-size:26px">Carta a tu yo del futuro</h1><div class="muted" style="line-height:1.4">Te la mostraré antes de tus tareas y cuando uses el rescate. Escribe por qué quieres cambiar y en quién te quieres convertir.</div>' +
      '<textarea class="input" rows="8" data-model="ob.letter" placeholder="Querido yo del futuro: …">' + esc(ob.letter) + '</textarea>' + next('Guardar carta') + '<button class="btn link" data-act="ob-next">La escribo después</button>';
  } else {
    body = '<div class="stack" style="align-items:center;text-align:center;gap:16px;padding-top:30px"><h1 style="font-size:28px">¡Listo' + (ob.name ? ', ' + esc(ob.name) : '') + '!</h1>' +
      '<div class="muted" style="line-height:1.5;font-size:15px">' + esc(ob.petName) + ' ya está en su casa. Cuando cumplas un hábito, márcalo en Inicio. Y si te pillas postergando, toca el botón rojo.</div>' +
      '<div class="card" style="text-align:left;line-height:1.5;font-size:14px"><b>Instálala en tu iPhone:</b> en Safari toca Compartir y luego "Agregar a pantalla de inicio". Así se abre como una app.</div>' +
      '<button class="btn block" data-act="ob-finish">Entrar a Hábitat</button></div>';
  }
  const dots = ob.step > 0 && ob.step < 5 ? '<div class="dots" style="justify-content:center;margin:6px 0 4px">' + [1, 2, 3, 4].map((i) => '<i class="' + (i <= ob.step ? 'on' : '') + '"></i>').join('') + '</div>' : '';
  return backdrop('casa') + '<main class="screen no-nav"><div style="padding-top:calc(14px + var(--safe-t))"></div>' +
    (ob.step > 0 && ob.step < 5 && ob.edit === null ? '<div class="pad row between"><button class="icon-btn" data-act="ob-back" aria-label="Atrás">' + I.back + '</button>' + dots + '<span style="width:44px"></span></div>' : '') +
    '<div class="pad stack" style="gap:14px;margin-top:8px">' + body + '</div></main>';
}
function afterBienvenida() {
  const hero = app.querySelector('[data-hero]');
  if (hero) {
    const ob = ui.ob;
    const s = S();
    s.pet.k = ob.k; s.pet.name = ob.petName || PETS[ob.k].name;
    mountPet(hero, { hero: true, feetFromBottom: 24, scale: 0.8 });
  }
}

// ======================================================================
// Navegación y render
// ======================================================================

const SCREENS = {
  inicio: [screenInicio, afterInicio],
  rescate: [screenRescate, afterRescate],
  lab: [screenLab],
  patrones: [screenPatrones],
  mascota: [screenMascota, afterMascota],
  yo: [screenYo],
  habito: [screenHabito],
  bienvenida: [screenBienvenida, afterBienvenida]
};

function parseRoute() {
  const h = (location.hash || '').replace(/^#\/?/, '');
  const [r, p] = h.split('/');
  let route = SCREENS[r] ? r : 'inicio';
  if (!S().onboarded) route = 'bienvenida';
  ui.route = route;
  ui.param = p || null;
}

export function render(keepScroll) {
  const y = window.scrollY;
  const [fn, after] = SCREENS[ui.route];
  if (pet && pet.el.parentNode) pet.el.remove();
  app.innerHTML = fn();
  document.title = 'Hábitat';
  if (after) after();
  if (keepScroll) window.scrollTo(0, y);
}

window.addEventListener('hashchange', () => {
  const prev = ui.route;
  parseRoute();
  closeSheet();
  if (ui.route === 'rescate' && prev !== 'rescate') ui.rescue = null;
  if (ui.route === 'rescate' && ui.pendingRescue) { ui.rescue = ui.pendingRescue; ui.pendingRescue = null; }
  render();
  window.scrollTo(0, 0);
});
window.addEventListener('resize', () => {
  const hero = app.querySelector('[data-hero]');
  if (hero && pet && pet.el.isConnected) render(true);
});

// ---------- modelo de datos ligado a inputs

function setPath(path, value) {
  const parts = path.split('.');
  let root;
  if (parts[0] === 'ob') root = ui.ob;
  else if (parts[0] === 'draft') root = ui.draft;
  else if (parts[0] === 'rescue') root = ui.rescue;
  else root = S();
  if (parts[0] === 'ob' || parts[0] === 'draft' || parts[0] === 'rescue') parts.shift();
  let o = root;
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
  o[parts[parts.length - 1]] = value;
  return root;
}
function getPath(path) {
  const parts = path.split('.');
  let o = parts[0] === 'ob' ? ui.ob : parts[0] === 'draft' ? ui.draft : S();
  if (parts[0] === 'ob' || parts[0] === 'draft') parts.shift();
  for (const p of parts) o = o[p];
  return o;
}

app.addEventListener('input', (e) => {
  const m = e.target.getAttribute('data-model');
  if (!m) return;
  setPath(m, e.target.value);
  if (m === 'pet.name' || m === 'user.name') {
    if (m === 'pet.name' && !e.target.value.trim()) return;
    store.save();
    if (pet) { pet.name = S().pet.name; pet.userName = S().user.name; pet.label(); }
  }
  if (m === 'ob.petName') ui.ob.custom = true;
});
app.addEventListener('change', (e) => {
  if (e.target.getAttribute('data-act-change') === 'import') importData(e.target.files[0]);
  const m = e.target.getAttribute('data-model');
  if (m === 'pet.name' && !e.target.value.trim()) { S().pet.name = PETS[S().pet.k].name; store.save(); render(true); }
});

// ---------- acciones

const ACT = {
  task(el) { openTask(el.dataset.id); },
  check(el) {
    const id = el.dataset.id, k = store.dayKey();
    if (store.doneOn(k)[id]) {
      sheet('<h2 style="font-size:20px">¿Desmarcar este hábito?</h2><div class="muted" style="margin:6px 0 14px">Si lo marcaste por error, lo quito de hoy.</div><div class="grid2"><button class="btn ghost" data-sheet="no">Dejarlo</button><button class="btn red" data-sheet="yes">Desmarcar</button></div>', (w) => {
        w.addEventListener('click', (e) => {
          const b = e.target.closest('[data-sheet]');
          if (!b) return;
          if (b.dataset.sheet === 'yes') { store.unmark(id, k); render(true); }
          closeSheet();
        });
      });
    } else openLevels(id);
  },
  feel(el) { ui.rescue.feeling = el.dataset.id; ui.rescue.step = 2; render(); window.scrollTo(0, 0); },
  'rescue-back'() { ui.rescue.step = 1; render(); },
  'rescue-go'() {
    const r = ui.rescue;
    const inp = app.querySelector('[data-model="rescue.first"]');
    r.first = inp ? inp.value.trim() : r.first;
    r.step = 3; r.total = 300; r.end = null; r.running = false; r.finished = false;
    S().rescues.push({ at: new Date().toISOString(), feeling: r.feeling, step: r.first, habitId: r.habitId || null, done: false });
    store.save();
    render(); window.scrollTo(0, 0);
  },
  'rescue-timer'() {
    const r = ui.rescue;
    if (r.running) {
      r.left = Math.max(0, Math.round((r.end - Date.now()) / 1000));
      r.running = false; r.paused = true;
      clearInterval(ui.rt);
    } else {
      r.end = Date.now() + (r.paused ? r.left : r.total) * 1000;
      r.running = true; r.paused = false;
      if (pet) pet.say(PHRASES.rescueStart);
    }
    const b = app.querySelector('[data-act="rescue-timer"]');
    if (b) b.textContent = r.running ? 'Pausar' : 'Seguir';
    const l = app.querySelector('[data-tlabel]');
    if (l) l.textContent = r.running ? 'trabajando' : 'en pausa';
    if (r.running) tickRescue();
  },
  'rescue-more'() {
    const r = ui.rescue;
    r.finished = false; r.paused = false; r.total = 300; r.end = Date.now() + 300000; r.running = true;
    render(); tickRescue();
  },
  'new-exp'() { openNewExperiment(); },
  decide(el) {
    const ex = S().experiments.find((x) => x.id === el.dataset.id);
    ex.decision = el.dataset.v;
    store.save();
    if (el.dataset.v === 'ajustar') { location.hash = '#/habito/' + ex.habitId; return; }
    render(true);
  },
  'pick-pet'(el) { changePet(el.dataset.k); },
  'pet-sheet'() {
    sheet('<h2 style="font-size:21px">Cambiar de compañero</h2><div class="muted" style="margin:4px 0 14px">Puedes cambiarlo cuando quieras. Tu progreso se mantiene.</div>' + petGrid(S().pet.k, 'sheet-pet'), (w) => {
      w.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act="sheet-pet"]');
        if (!b) return;
        closeSheet();
        changePet(b.dataset.k);
      });
    });
  },
  'save-letter'() {
    const t = app.querySelector('#carta').value.trim();
    S().letter = { text: t, at: new Date().toISOString() };
    store.save();
    toast('Carta guardada');
    render(true);
  },
  export() {
    const blob = new Blob([JSON.stringify(S(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'habitat-' + store.dayKey() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  wipe() {
    if (!confirm('¿Borrar todos tus datos de Hábitat en este teléfono? No se puede deshacer.')) return;
    store.reset(); ui.ob = null;
    if (pet) { pet.destroy(); pet = null; }
    location.hash = '#/bienvenida';
    parseRoute(); render();
  },
  'go-back'() { history.length > 1 ? history.back() : (location.hash = '#/yo'); },
  area(el) { const d = getPath(el.dataset.model); d.area = el.dataset.v; render(true); },
  day(el) {
    const d = getPath(el.dataset.model), v = Number(el.dataset.v);
    d.days = d.days.includes(v) ? d.days.filter((x) => x !== v) : d.days.concat(v);
    el.classList.toggle('on'); el.setAttribute('aria-pressed', d.days.includes(v));
  },
  'save-habit'() {
    const d = ui.draft;
    if (!d.title.trim()) { toast('Ponle un nombre al hábito'); return; }
    if (!d.days.length) { toast('Elige al menos un día'); return; }
    const clean = store.finishHabit(d);
    const i = S().habits.findIndex((h) => h.id === clean.id);
    if (i >= 0) S().habits[i] = clean; else S().habits.push(clean);
    store.save(); ui.draft = null;
    toast('Hábito guardado');
    location.hash = '#/inicio';
  },
  'archive-habit'() {
    if (!confirm('¿Quitar este hábito? Tu historial se mantiene.')) return;
    const h = store.habitById(ui.draft.id);
    if (h) h.archived = true;
    store.save(); ui.draft = null;
    location.hash = '#/yo';
  },
  // bienvenida
  'ob-next'() {
    const ob = ui.ob;
    if (ob.step === 1 && !ob.name.trim()) { toast('Escribe tu nombre (o un apodo)'); return; }
    ob.step += 1; render(); window.scrollTo(0, 0);
  },
  'ob-back'() { ui.ob.step = Math.max(0, ui.ob.step - 1); render(); },
  'ob-pet'(el) {
    const ob = ui.ob, k = el.dataset.k;
    if (k === ob.k) { if (pet) pet.tap(); return; }
    ob.k = k;
    if (!ob.custom) ob.petName = PETS[k].name;
    render(true);
    setTimeout(() => pet && pet.say('¡Hola! Soy ' + ob.petName), 400);
  },
  'ob-edit'(el) { const ob = ui.ob; ob.edit = Number(el.dataset.i); ob.isNew = false; ob.backup = JSON.stringify(ob.habits[ob.edit]); render(); window.scrollTo(0, 0); },
  'ob-new'() { const ob = ui.ob; ob.habits.push(store.blankHabit()); ob.edit = ob.habits.length - 1; ob.isNew = true; render(); window.scrollTo(0, 0); },
  'ob-cancel-edit'() {
    const ob = ui.ob;
    if (ob.isNew) ob.habits.splice(ob.edit, 1);
    else if (ob.backup) ob.habits[ob.edit] = JSON.parse(ob.backup);
    ob.edit = null; render();
  },
  'ob-save-habit'() {
    const ob = ui.ob, h = ob.habits[ob.edit];
    if (!h.title.trim()) { toast('Escribe qué hábito quieres crear'); return; }
    if (!h.days.length) { toast('Elige al menos un día'); return; }
    ob.habits[ob.edit] = store.finishHabit(h);
    ob.edit = null; render(); window.scrollTo(0, 0);
  },
  'ob-remove'(el) { ui.ob.habits.splice(Number(el.dataset.i), 1); render(true); },
  idea(el) {
    const d = getPath(el.dataset.model), x = HABIT_IDEAS[Number(el.dataset.i)];
    Object.assign(d, { area: x.area, title: x.title, min: x.min, normal: x.normal, epic: x.epic, identity: x.identity });
    render(true);
  },
  'ob-finish'() {
    const ob = ui.ob, s = S();
    s.user.name = ob.name.trim();
    s.pet = { k: ob.k, name: (ob.petName || PETS[ob.k].name).trim(), since: store.dayKey() };
    s.habits = ob.habits.map((h) => store.finishHabit(h));
    if (ob.letter.trim()) s.letter = { text: ob.letter.trim(), at: new Date().toISOString() };
    s.onboarded = true;
    s.settledUntil = store.dayKey(); s.lastOpen = store.dayKey();
    store.save();
    ui.ob = null;
    location.hash = '#/inicio';
    parseRoute(); render();
    setTimeout(() => pet && pet.celebrate('¡Hola, ' + (s.user.name || 'amigo') + '! Vamos juntos'), 500);
  }
};

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !app.contains(el)) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});

// ---------- hojas: antes de empezar, niveles, experimento

function openTask(id) {
  const h = store.habitById(id), A = AREAS[h.area], s = S();
  const exc = letterExcerpt(140);
  const done = store.doneOn(store.dayKey())[id];
  sheet('<div class="stack">' +
    '<div style="position:relative;height:150px;border-radius:20px;overflow:hidden"><img src="' + scene(A.scene, s.pet.k) + '" alt="' + esc(s.pet.name) + ' en ' + A.label.toLowerCase() + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 62%"></div>' +
    '<div class="row between"><span class="chip" style="background:' + A.soft + ';color:' + A.ink + '">' + A.label + '</span><span class="muted bold">' + esc(h.time) + (h.place ? ' · ' + esc(h.place) : '') + '</span></div>' +
    '<h2 style="font-size:22px">' + esc(h.title) + '</h2>' +
    (exc ? '<div class="card row" style="align-items:flex-start;background:#fff">' + I.mail + '<div><div class="muted small bold">Antes de empezar, tu carta:</div><div style="font-style:italic;line-height:1.45">"' + esc(exc) + '"</div></div></div>' : '') +
    '<div class="card" style="background:#FBEBC4;line-height:1.45"><b>Versión mínima:</b> ' + esc(h.min) + '. Si hoy cuesta, con eso basta.</div>' +
    (done ? '<div class="chip" style="background:#E3F0D8;color:#2F6B4F;align-self:flex-start">Hecho hoy: versión ' + LEVELS[done.level].label.toLowerCase() + '</div>' :
      '<button class="btn block" data-sheet="done">Ya lo hice</button>') +
    '<button class="btn red block" data-sheet="rescue">Me cuesta empezar</button>' +
    '<a class="btn link" href="#/habito/' + h.id + '">Editar hábito</a></div>', (w) => {
    w.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sheet]');
      if (!b) return;
      if (b.dataset.sheet === 'done') openLevels(id);
      if (b.dataset.sheet === 'rescue') { closeSheet(); ui.pendingRescue = { step: 1, feeling: null, first: '', habitId: id }; location.hash = '#/rescate'; }
    });
  });
}

function openLevels(id) {
  const h = store.habitById(id);
  sheet('<h2 style="font-size:21px">¿Qué versión hiciste?</h2><div class="muted" style="margin:4px 0 12px">Todas cuentan para tu racha y tu identidad.</div><div class="stack" style="gap:10px">' +
    ['min', 'normal', 'epic'].map((l) => '<button class="level" data-level="' + l + '"><span class="dot" style="background:' + LEVELS[l].color + '"></span><span style="flex:1"><b>' + LEVELS[l].label + '</b><div class="muted small">' + esc(h[l] || LEVELS[l].hint) + '</div></span></button>').join('') + '</div>', (w) => {
    w.addEventListener('click', (e) => {
      const b = e.target.closest('[data-level]');
      if (!b) return;
      store.mark(id, b.dataset.level);
      closeSheet();
      if (ui.route !== 'inicio') location.hash = '#/inicio';
      else { render(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      const k = store.dayKey();
      const all = store.scheduledOn(k).every((x) => store.doneOn(k)[x.id]);
      const vote = '+1 voto: ' + (h.identity || h.title).replace(/^Soy /, '').replace(/^alguien/, 'alguien');
      setTimeout(() => pet && pet.celebrate(all ? PHRASES.allDone : vote.length > 34 ? '+1 voto para tu identidad' : vote), 120);
      if (b.dataset.level === 'epic') toast('¡Épico! Ganaste 1 comodín');
    });
  });
}

function openNewExperiment() {
  const hs = S().habits.filter((h) => !h.archived);
  if (!hs.length) { toast('Primero agrega un hábito'); return; }
  let pick = hs[0].id;
  const hyp = (h) => 'Si hago "' + h.title.toLowerCase() + '" a las ' + h.time + (h.place ? ' en ' + h.place.toLowerCase() : '') + ', lo voy a cumplir 10 de 14 días.';
  sheet('<h2 style="font-size:21px">Nuevo experimento</h2><div class="muted" style="margin:4px 0 12px">14 días para probar si este plan funciona contigo.</div>' +
    '<div class="stack" style="gap:8px" role="radiogroup" aria-label="Hábito">' + hs.map((h, i) => '<button class="level" role="radio" aria-checked="' + (i === 0) + '" data-h="' + h.id + '" style="border-color:' + (i === 0 ? '#2F6B4F' : '') + '"><span class="dot" style="background:' + AREAS[h.area].color + '"></span><b>' + esc(h.title) + '</b></button>').join('') + '</div>' +
    '<label class="field" style="margin-top:12px">Hipótesis<textarea class="input" rows="3" id="hyp">' + esc(hyp(hs[0])) + '</textarea></label>' +
    '<button class="btn block" style="margin-top:12px" data-sheet="go">Empezar hoy</button>', (w) => {
    w.addEventListener('click', (e) => {
      const hb = e.target.closest('[data-h]');
      if (hb) {
        pick = hb.dataset.h;
        w.querySelectorAll('[data-h]').forEach((x) => { const on = x === hb; x.style.borderColor = on ? '#2F6B4F' : ''; x.setAttribute('aria-checked', on); });
        w.querySelector('#hyp').value = hyp(store.habitById(pick));
      }
      if (e.target.closest('[data-sheet="go"]')) {
        S().experiments.push({ id: store.uid(), habitId: pick, hypothesis: w.querySelector('#hyp').value.trim(), start: store.dayKey(), length: 14, decision: null });
        store.save(); closeSheet(); render();
      }
    });
  });
}

function importData(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!data || !data.pet || !Array.isArray(data.habits)) throw new Error('formato');
      if (!confirm('¿Reemplazar tus datos actuales con esta copia?')) return;
      store.replaceAll(data);
      if (pet) { pet.destroy(); pet = null; }
      toast('Datos restaurados');
      parseRoute(); render();
    } catch (e) { toast('Ese archivo no es una copia de Hábitat'); }
  };
  r.readAsText(file);
}

// ---------- arranque

function boot() {
  if (S().onboarded) {
    const { used, away } = store.settle();
    if (used.length) setTimeout(() => toast('Usaste ' + used.length + (used.length === 1 ? ' comodín' : ' comodines') + ' para salvar tu racha'), 900);
    if (away >= 2) setTimeout(() => { if (pet) { pet.sleep(); setTimeout(() => pet.say(PHRASES.missed, 3500), 1600); } }, 600);
  }
  parseRoute();
  render();
}
boot();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
