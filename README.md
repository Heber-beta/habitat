# Hábitat

App web instalable (PWA) de hábitos anti-procrastinación con mascota animada.
Publicada en https://heber-beta.github.io/habitat/

- `index.html`, `css/`, `js/`: la app (sin paso de compilación, módulos de JavaScript).
- `js/store.js`: datos guardados en el teléfono (localStorage), rachas con comodines, crecimiento de la mascota y patrones.
- `js/pet.js`: mascota animada con Lottie (`js/vendor/lottie_light.min.js`).
- `anim/<mascota>.json`: animaciones Lottie generadas con `python3 tools/make_lottie.py` (estados: idle, hop, celebrate, spin, sleep, stretch, wiggle).
- `img/pets/`, `img/fondos/`: ilustraciones pintadas de las 10 mascotas y sus 4 escenarios.
- `sw.js`: funciona sin internet una vez abierta.
