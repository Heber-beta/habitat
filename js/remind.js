// Recordatorios de Hábitat.
// 1) Calendario: un archivo .ics con un evento semanal por hábito y una alerta a su hora.
//    El calendario del teléfono avisa aunque la app esté cerrada (no necesita servidor).
// 2) Dentro de la app: si está abierta a la hora de un hábito, la mascota te lo dice
//    y llega una notificación si la diste permiso.
import { PETS } from './data.js';
import { S, dayKey, addDays, parseDay, scheduledOn, doneOn } from './store.js';

const APP_URL = 'https://heber-beta.github.io/habitat/';
const ICAL_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function icsText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}
// Las líneas de un .ics no deben pasar de 75 bytes.
function fold(line) {
  const out = [];
  let cur = '';
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = ' ' + ch; }
    else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n');
}
function stamp(d) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
}

export function buildICS() {
  const now = new Date();
  const pet = S.pet.name || PETS[S.pet.k].name;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Habitat//Recordatorios//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Hábitat'];
  S.habits.filter((h) => !h.archived && h.days.length).forEach((h) => {
    // primer día programado desde hoy
    let k = dayKey();
    for (let i = 0; i < 7 && !h.days.includes(parseDay(k).getDay()); i++) k = addDays(k, 1);
    const [hh, mm] = (h.time || '18:00').split(':');
    const start = k.replace(/-/g, '') + 'T' + hh.padStart(2, '0') + mm.padStart(2, '0') + '00';
    const byday = h.days.slice().sort().map((d) => ICAL_DAYS[d]).join(',');
    lines.push('BEGIN:VEVENT',
      'UID:habitat-' + h.id + '@heber-beta.github.io',
      'DTSTAMP:' + stamp(now),
      'SEQUENCE:' + Math.floor(now.getTime() / 1000),
      'DTSTART:' + start,
      'DURATION:PT15M',
      'RRULE:FREQ=WEEKLY;BYDAY=' + byday,
      'SUMMARY:' + icsText(pet + ' te espera: ' + h.title),
      'DESCRIPTION:' + icsText('Versión mínima: ' + h.min + '. Si hoy cuesta, con eso basta.\nAbre Hábitat: ' + APP_URL),
      (h.place ? 'LOCATION:' + icsText(h.place) : null),
      'URL:' + APP_URL,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText(pet + ' te espera: ' + h.title), 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).map(fold).join('\r\n') + '\r\n';
}

export function downloadICS() {
  const blob = new Blob([buildICS()], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'habitat-recordatorios.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------- avisos con la app abierta

export function canNotify() {
  return 'Notification' in window;
}
export async function askNotify() {
  if (!canNotify()) return 'unsupported';
  try { return await Notification.requestPermission(); } catch (e) { return 'denied'; }
}

async function notify(title, body) {
  if (!canNotify() || Notification.permission !== 'granted' || !S.settings || !S.settings.remind) return;
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg) reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'habitat-' + title });
    else new Notification(title, { body, icon: 'icons/icon-192.png' });
  } catch (e) { /* sin notificaciones */ }
}

const told = new Set();
// Revisa cada 20 s si llegó la hora de algún hábito de hoy que falte. onDue(habito) avisa en pantalla.
export function startWatch(onDue) {
  const check = () => {
    const k = dayKey(), now = new Date();
    const hm = now.getHours() * 60 + now.getMinutes();
    const done = doneOn(k);
    scheduledOn(k).forEach((h) => {
      const [hh, mm] = (h.time || '18:00').split(':').map(Number);
      const at = hh * 60 + mm;
      const key = k + h.id;
      if (done[h.id] || told.has(key) || hm < at || hm > at + 10) return;
      told.add(key);
      onDue(h);
      if (document.hidden) notify((S.pet.name || 'Tu mascota') + ' te espera', h.title + ' · mínimo: ' + h.min);
    });
  };
  check();
  setInterval(check, 20000);
}
