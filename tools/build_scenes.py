"""Arma los escenarios HD y los recortes de las mascotas a partir de las
ilustraciones exportadas de Canva (944x1680, resolución original).

Entrada (carpeta que se pasa como argumento):
  <mascota>_<lugar>.png   la escena pintada con la mascota dentro (40 archivos)
  <mascota>_vacio.png     la misma escena del hogar sin la mascota
  <mascota>_recorte.png   la mascota del hogar recortada (fondo transparente, mismo encuadre)

Salida:
  img/fondos/<lugar>_<mascota>.jpg  estudio, entreno y proyectos tal cual (mascota pintada)
  img/fondos/hogar_<mascota>.jpg    el hogar completo, para miniaturas
  img/fondos/casa_<mascota>.jpg     el hogar con el hueco de la mascota relleno: el resto
                                    de la pintura queda idéntico (sombra, luz, objetos)
  img/pets/<mascota>.png            la mascota recortada, lista para animar
  anim/pose.json                    dónde está la mascota dentro del hogar (px de 944 de ancho)

Uso: python3 tools/build_scenes.py <carpeta>   y después  python3 tools/make_lottie.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PETS = ['zorro', 'gato', 'perro', 'ballena', 'axolote', 'dinosaurio', 'panda', 'capibara', 'buho', 'conejo']
PLACES = ['estudio', 'entreno', 'proyectos']
# Objetos pegados a la mascota que deben quedarse en la escena (esquina superior izquierda del área a borrar)
CLEAR = {'perro': [(668, 1335), (826, 1245), (780, 1302), (843, 0)]}
# Mascotas metidas en el agua: el borde de abajo se desvanece (px) para que no se vea el corte al saltar
FEATHER = {'capibara': 70}
JPG = dict(quality=90, optimize=True, progressive=True, subsampling=0)


def main_blob(alpha):
    """Se queda con la mancha más grande del recorte (saca platos u objetos sueltos)."""
    from collections import deque
    m = alpha > 40
    h, w = m.shape
    best, best_n, n = 0, 0, 0
    small = m[::4, ::4]
    lab = np.zeros(small.shape, np.int32)
    for y, x in zip(*np.nonzero(small)):
        if lab[y, x]:
            continue
        n += 1
        q, cnt = deque([(y, x)]), 0
        lab[y, x] = n
        while q:
            cy, cx = q.popleft()
            cnt += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = cy + dy, cx + dx
                if 0 <= yy < small.shape[0] and 0 <= xx < small.shape[1] and small[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    q.append((yy, xx))
        if cnt > best_n:
            best, best_n = n, cnt
    keep = Image.fromarray(((lab == best) * 255).astype(np.uint8)).resize((w, h), Image.NEAREST)
    keep = keep.filter(ImageFilter.MaxFilter(9))
    return np.minimum(alpha, np.asarray(keep))


def main(src):
    os.makedirs(os.path.join(ROOT, 'img', 'fondos'), exist_ok=True)
    pose = {}
    for k in PETS:
        for p in PLACES:
            Image.open(os.path.join(src, k + '_' + p + '.png')).convert('RGB').save(
                os.path.join(ROOT, 'img', 'fondos', p + '_' + k + '.jpg'), **JPG)
        full = Image.open(os.path.join(src, k + '_casa.png')).convert('RGB')
        full.save(os.path.join(ROOT, 'img', 'fondos', 'hogar_' + k + '.jpg'), **JPG)
        empty = Image.open(os.path.join(src, k + '_vacio.png')).convert('RGB')
        cut = Image.open(os.path.join(src, k + '_recorte.png')).convert('RGBA')
        a = main_blob(np.asarray(cut)[..., 3])
        for x0, y0 in CLEAR.get(k, []):
            a[y0:, x0:] = 0
        # Mascota: los colores salen de la escena original para que calce exacto.
        pet = np.dstack([np.asarray(full), a]).astype(np.uint8)
        # Hogar sin mascota: solo el hueco (y un borde suave) viene de la escena vacía.
        hole = Image.fromarray(((a > 20) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.GaussianBlur(9))
        Image.composite(empty, full, hole).save(os.path.join(ROOT, 'img', 'fondos', 'casa_' + k + '.jpg'), **JPG)
        if k in FEATHER:
            yb = np.nonzero((a > 40).any(axis=1))[0].max()
            n = FEATHER[k]
            ramp = np.clip((yb - np.arange(a.shape[0])) / n, 0, 1)[:, None]
            a = (a * ramp).astype(np.uint8)
        ys, xs = np.nonzero(a > 40)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        pad = 6
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
        x1, y1 = min(full.width, x1 + pad), min(full.height, y1 + pad)
        Image.fromarray(pet).crop((x0, y0, x1, y1)).save(os.path.join(ROOT, 'img', 'pets', k + '.png'), optimize=True)
        pose[k] = {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}
        print(k, pose[k])
    with open(os.path.join(ROOT, 'anim', 'pose.json'), 'w') as f:
        json.dump(pose, f, indent=1)


if __name__ == '__main__':
    main(sys.argv[1])
