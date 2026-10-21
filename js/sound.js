// Sonidos de Hábitat hechos con Web Audio (sin archivos): cada mascota tiene su voz
// y hay sonidos para marcar, celebrar, crecer y terminar el modo foco.
// En iPhone suenan solo si el teléfono no está en silencio.
import { S, save } from './store.js';

let ctx = null;

// Tono base y forma de la voz de cada mascota (las grandes suenan más grave).
const VOICE = {
  zorro: { f: 620, type: 'triangle', glide: 1.35 },
  gato: { f: 760, type: 'sine', glide: 0.82 },
  perro: { f: 480, type: 'triangle', glide: 1.25 },
  ballena: { f: 190, type: 'sine', glide: 1.6, long: true },
  axolote: { f: 880, type: 'sine', glide: 1.2 },
  dinosaurio: { f: 230, type: 'sawtooth', glide: 0.85 },
  panda: { f: 540, type: 'triangle', glide: 1.15 },
  capibara: { f: 330, type: 'sine', glide: 0.95 },
  buho: { f: 410, type: 'sine', glide: 0.9, hoot: true },
  conejo: { f: 980, type: 'sine', glide: 1.3 }
};

export function soundOn() {
  return !S.settings || S.settings.sound !== false;
}
export function setSound(on) {
  S.settings = Object.assign({}, S.settings, { sound: on });
  save();
  if (on) play('ding');
}

function ac() {
  if (!soundOn()) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (e) { return null; }
}

// Una nota con subida/bajada de tono y envolvente suave.
function note(c, { f, f2, type = 'sine', at = 0, dur = 0.15, vol = 0.18 }) {
  const t = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Voz de la mascota al tocarla. mood: 'tap' | 'happy' | 'sleepy'
export function voice(kind, mood = 'tap') {
  const c = ac();
  if (!c) return;
  const v = VOICE[kind] || VOICE.zorro;
  const jit = 0.92 + Math.random() * 0.16;
  const f = v.f * jit;
  const vol = v.type === 'sawtooth' ? 0.07 : 0.16;
  if (mood === 'sleepy') {
    note(c, { f: f * 0.9, f2: f * 0.6, type: v.type, dur: 0.5, vol: vol * 0.7 });
    return;
  }
  if (v.hoot) {
    note(c, { f, f2: f * 0.95, type: 'sine', dur: 0.18, vol });
    note(c, { f: f * 0.85, f2: f * 0.8, type: 'sine', at: 0.24, dur: 0.3, vol });
    return;
  }
  const dur = v.long ? 0.55 : 0.13;
  note(c, { f, f2: f * v.glide, type: v.type, dur, vol });
  if (mood === 'happy') note(c, { f: f * 1.2, f2: f * 1.2 * v.glide, type: v.type, at: dur * 0.9, dur, vol });
}

const SFX = {
  // marcar un hábito
  ding(c) { note(c, { f: 880, dur: 0.18, vol: 0.14 }); note(c, { f: 1320, at: 0.08, dur: 0.3, vol: 0.12 }); },
  // celebrar (arpegio)
  celebrate(c) { [523, 659, 784, 1046].forEach((f, i) => note(c, { f, type: 'triangle', at: i * 0.08, dur: 0.25, vol: 0.13 })); },
  // la mascota crece de etapa
  grow(c) {
    [392, 523, 659, 784].forEach((f, i) => note(c, { f, type: 'triangle', at: i * 0.12, dur: 0.3, vol: 0.13 }));
    [1046, 1318, 1568].forEach((f) => note(c, { f, at: 0.55, dur: 0.9, vol: 0.07 }));
  },
  // termina un bloque del modo foco
  bell(c) { [0, 0.5].forEach((at) => { note(c, { f: 988, at, dur: 1.2, vol: 0.12 }); note(c, { f: 1976, at, dur: 0.6, vol: 0.04 }); }); },
  // botón suave
  pop(c) { note(c, { f: 420, f2: 640, dur: 0.08, vol: 0.1 }); }
};

export function play(name) {
  const c = ac();
  if (c && SFX[name]) SFX[name](c);
}
