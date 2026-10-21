// Service worker de Hábitat: guarda la app para que abra sin internet.
const VERSION = 'habitat-v4';
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/data.js',
  'js/store.js',
  'js/pet.js',
  'js/vendor/lottie_light.min.js',
  'anim/meta.json',
  'icons/icon-192.png',
  'icons/apple-180.png',
  'img/pets/axolote.png',
  'img/pets/ballena.png',
  'img/pets/buho.png',
  'img/pets/capibara.png',
  'img/pets/conejo.png',
  'img/pets/dinosaurio.png',
  'img/pets/gato.png',
  'img/pets/panda.png',
  'img/pets/perro.png',
  'img/pets/zorro.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Código: red primero (para recibir mejoras), con la copia guardada si no hay internet.
// Imágenes, animaciones y fuentes: copia guardada primero (no cambian).
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isAsset = /\/(img|anim|icons)\//.test(url.pathname) || url.hostname.includes('fonts.g');
  if (isAsset) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
});
