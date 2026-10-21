// Mascota animada con Lottie. Un solo archivo por mascota trae todos los
// estados (idle, hop, celebrate, spin, sleep, stretch, wiggle, stand, lie) como marcadores.
// Las mascotas con poses cambian solas entre sentada (idle), de pie (stand) y acostada (lie).
import { PETS, PHRASES } from './data.js';

const LOOPS = { idle: true, sleep: true, stand: true, lie: true };
const RESTS = ['idle', 'stand', 'lie'];
const SLEEP_AFTER = 25000;
const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let META = null;
const metaReady = fetch('anim/meta.json').then((r) => r.json()).then((m) => { META = m; }).catch(() => { META = {}; });

export class Pet {
  constructor({ kind, name, onTap } = {}) {
    this.kind = kind;
    this.name = name;
    this.onTap = onTap;
    this.sleeping = false;
    this.flip = 1;
    this.taps = 0;
    this.last = Date.now();
    this.current = null;
    this.rest = 'idle';

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'pet';
    el.innerHTML = '<span class="pet-flip"><span class="pet-anim"></span></span><span class="pet-bubble" hidden></span>';
    this.el = el;
    this.flipEl = el.querySelector('.pet-flip');
    this.animEl = el.querySelector('.pet-anim');
    this.bubble = el.querySelector('.pet-bubble');
    this.label();
    el.addEventListener('click', () => this.tap());

    this.load(kind);
    this.timer = setInterval(() => this.tick(), 1000);
  }

  // Poses de descanso que trae esta mascota (meta.json puede llegar después que la animación).
  get poses() {
    if (!this.ready) return ['idle'];
    return ((META && META[this.kind] && META[this.kind].poses) || ['idle']).filter((p) => this.segments[p]);
  }

  label() {
    this.el.setAttribute('aria-label', 'Acariciar a ' + this.name);
  }

  load(kind) {
    if (this.anim) this.anim.destroy();
    this.kind = kind;
    this.ready = false;
    this.anim = window.lottie.loadAnimation({
      container: this.animEl,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: 'anim/' + kind + '.json',
      rendererSettings: { preserveAspectRatio: 'xMidYMax meet', progressiveLoad: false }
    });
    this.anim.addEventListener('DOMLoaded', () => {
      this.segments = {};
      (this.anim.markers || []).forEach((m) => {
        const t = Math.round(m.time), d = Math.round(m.duration);
        this.segments[m.payload && m.payload.name ? m.payload.name : m.comment] = [t, t + d];
      });
      this.ready = true;
      if (!this.poses.includes(this.rest)) this.rest = 'idle';
      this.play(this.sleeping ? 'sleep' : this.rest);
    });
    this.anim.addEventListener('complete', () => {
      if (LOOPS[this.current]) this.play(this.current, true);
      else this.play(this.sleeping ? 'sleep' : this.rest);
    });
  }

  // Tamaño y posición: alto visible de la mascota en px y punto de los pies.
  place({ height, x, bottom }) {
    const m = (META && META[this.kind]) || { petHeight: 236 };
    const size = height * 400 / m.petHeight;
    const st = this.el.style;
    st.width = size + 'px';
    st.height = size + 'px';
    st.left = (x - size / 2) + 'px';
    st.bottom = (bottom - size * (400 - (m.ground || 362)) / 400) + 'px';
  }

  static ready() { return metaReady; }

  play(name, force) {
    if (!this.ready || !this.segments[name]) return;
    if (!force && this.current === name && LOOPS[name]) return;
    this.current = name;
    this.anim.playSegments(this.segments[name], true);
  }

  act(name) {
    this.last = Date.now();
    if (this.sleeping && name !== 'stretch') this.sleeping = false;
    this.play(name, true);
  }

  say(text, ms = 2600) {
    clearTimeout(this.bt);
    const bs = this.bubble.style;
    this.bubble.textContent = text;
    this.bubble.hidden = false;
    this.bubble.classList.remove('pop');
    bs.setProperty('--dx', '0px');
    bs.setProperty('--dy', '0px');
    // Que la burbuja quede completa dentro de la escena (no cortada por los bordes).
    const scope = this.el.closest('.hero');
    const box = scope ? scope.getBoundingClientRect() : { left: 0, right: window.innerWidth, top: 0 };
    const r = this.bubble.getBoundingClientRect();
    if (box) {
      const left = Math.max(box.left, 0) + 8, right = Math.min(box.right, window.innerWidth) - 8;
      let dx = 0;
      if (r.left < left) dx = left - r.left;
      else if (r.right > right) dx = right - r.right;
      const hello = scope && scope.querySelector('.hello');
      const top = hello ? hello.getBoundingClientRect().bottom + 4 : Math.max(box.top, 0) + 6;
      bs.setProperty('--dx', Math.round(dx) + 'px');
      bs.setProperty('--dy', r.top < top ? Math.round(top - r.top) + 'px' : '0px');
    }
    void this.bubble.offsetWidth;
    this.bubble.classList.add('pop');
    this.bt = setTimeout(() => { this.bubble.hidden = true; }, ms);
  }

  buzz(ms = 12) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* sin vibración */ }
  }

  tap() {
    this.last = Date.now();
    this.buzz();
    if (this.onTap) this.onTap();
    if (this.sleeping) {
      this.sleeping = false;
      this.rest = this.poses.includes('stand') ? 'stand' : 'idle';
      this.play('stretch', true);
      this.say(PHRASES.wake);
      return;
    }
    this.taps += 1;
    clearTimeout(this.tt);
    this.tt = setTimeout(() => { this.taps = 0; }, 1400);
    if (this.taps >= 5) {
      this.taps = 0;
      this.play('spin', true);
      this.say(PHRASES.spin);
      this.buzz(30);
      return;
    }
    this.play('hop', true);
    if (this.taps === 1) this.say(PHRASES.tap[Math.floor(Math.random() * PHRASES.tap.length)].replace('¡Hola!', '¡Hola' + (this.userName ? ', ' + this.userName : '') + '!'));
  }

  celebrate(text) {
    this.sleeping = false;
    this.last = Date.now();
    this.play('celebrate', true);
    this.buzz(40);
    if (text) this.say(text, 3200);
  }

  sleep() {
    this.sleeping = true;
    this.bubble.hidden = true;
    this.play('sleep', true);
  }

  tick() {
    if (!this.ready || document.hidden || !this.el.isConnected) return;
    const now = Date.now();
    if (this.sleeping) return;
    if (now - this.last > SLEEP_AFTER) { this.sleep(); return; }
    if (!RESTS.includes(this.current) || reduced()) return;
    if (now - (this.idleAt || 0) > 5000 && Math.random() < 0.3) {
      this.idleAt = now;
      const r = Math.random();
      const other = this.poses.filter((p) => p !== this.rest);
      // cambia de pose (se sienta, se para, se echa) la mitad de las veces
      if (other.length && r < 0.5) { this.rest = other[Math.floor(Math.random() * other.length)]; this.play(this.rest, true); }
      else if (r < 0.7) { this.flip = -this.flip; this.flipEl.style.transform = 'scaleX(' + this.flip + ')'; }
      else if (r < 0.85 && this.rest === 'stand') this.play('wiggle', true);
      else if (this.rest === 'idle') this.play('hop', true);
    }
  }

  setKind(kind, name) {
    this.name = name;
    this.label();
    if (kind !== this.kind) this.load(kind);
    else this.act('hop');
  }

  destroy() {
    clearInterval(this.timer);
    clearTimeout(this.bt);
    if (this.anim) this.anim.destroy();
    this.el.remove();
  }
}

export function petImg(k) { return 'img/pets/' + k + '.png'; }
// Escena completa (la mascota viene pintada dentro). El hogar se guarda como hogar_<mascota>.
export function scene(place, k) { return 'img/fondos/' + (place === 'casa' ? 'hogar' : place) + '_' + k + '.jpg'; }
// El hogar sin la mascota: el fondo sobre el que se anima.
export function homeEmpty(k) { return 'img/fondos/casa_' + k + '.jpg'; }
export { PETS };
export function petMeta(k) { return (META && META[k]) || { petHeight: 236, petWidth: 236 }; }
// Dónde se para la mascota en su hogar: pies (fx, fy) y alto (h), en px de la imagen de 944x1680.
export const SCENE_W = 944, SCENE_H = 1680;
export function petPose(k) { return (META && META[k] && META[k].pose) || { fx: 472, fy: 1200, h: 380 }; }
