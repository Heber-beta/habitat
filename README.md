# Hábitat

App web instalable (PWA) de hábitos anti-procrastinación con mascota animada.
Publicada en https://heber-beta.github.io/habitat/

- `index.html`, `css/`, `js/`: la app (sin paso de compilación, módulos de JavaScript).
- `js/store.js`: datos guardados en el teléfono (localStorage), rachas con comodines, crecimiento de la mascota y patrones.
- `js/pet.js`: mascota animada con Lottie (`js/vendor/lottie_light.min.js`).
- `anim/<mascota>.json`: animaciones Lottie generadas con `python3 tools/make_lottie.py` (estados: idle, hop, celebrate, spin, sleep, stretch, wiggle).
- `img/fondos/`: los 40 escenarios pintados en resolución original (944×1680), con la mascota dentro. `casa_<mascota>.jpg` es el hogar sin la mascota (fondo de la animación) y `hogar_<mascota>.jpg` el hogar completo.
- `img/pets/`: cada mascota recortada de su hogar, en la misma posición en que está pintada (`anim/pose.json`).
- `tools/build_scenes.py`: arma fondos y recortes desde las exportaciones de Canva; después se corre `tools/make_lottie.py`.
- `sw.js`: funciona sin internet una vez abierta.
