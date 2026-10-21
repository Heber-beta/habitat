# Hábitat

App web instalable (PWA) de hábitos anti-procrastinación con mascota animada.
Publicada en https://heber-beta.github.io/habitat/

- `index.html`, `css/`, `js/`: la app (sin paso de compilación, módulos de JavaScript).
- `js/store.js`: datos guardados en el teléfono (localStorage), rachas con comodines, crecimiento de la mascota y patrones.
- `js/pet.js`: mascota animada con Lottie (`js/vendor/lottie_light.min.js`).
- `anim/<mascota>.json`: animaciones Lottie generadas con `python3 tools/make_lottie.py` (estados: idle, hop, celebrate, spin, sleep, stretch, wiggle, stand, lie).
- `img/fondos/`: los 40 escenarios pintados en resolución original (944×1680), con la mascota dentro. `casa_<mascota>.jpg` es el hogar sin la mascota (fondo de la animación) y `hogar_<mascota>.jpg` el hogar completo.
- `img/pets/`: cada mascota recortada de su hogar, en la misma posición en que está pintada (`anim/pose.json`).
- `tools/split_sheet.py` y `tools/build_mascots.py`: cada mascota sale de una hoja de poses de Canva (2x2: sentada, de pie, acostada, en bolita, más versiones con ojos cerrados y cara feliz). `split_sheet.py <carpeta> <mascota>` corta la hoja y mide la escala de cada pose; `build_mascots.py <carpeta>` las tiñe con la luz del hogar y deja `img/pets/<mascota>_<pose>.png`. La ubicación en el hogar está en `anim/pose.json` (fx, fy = pies; h = alto sentado).
- `tools/build_scenes.py`: arma fondos y recortes desde las exportaciones de Canva; después se corre `tools/make_lottie.py`.
- `sw.js`: funciona sin internet una vez abierta.
