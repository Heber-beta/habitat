"""Corta una hoja de poses (2x2) en las poses sueltas que espera tools/build_mascots.py.

La hoja es una imagen de Canva sin fondo con la mascota cuatro veces:
  arriba izquierda: sentada   arriba derecha: de pie
  abajo izquierda: acostada   abajo derecha: durmiendo en bolita
<mascota>_hoja_blink.png y <mascota>_hoja_happy.png son la misma hoja con los ojos cerrados
y con cara feliz; se cortan con los mismos recuadros para que calcen exacto.

Uso: python3 tools/split_sheet.py <carpeta> <mascota>   (escribe <mascota>_<pose>.png y <mascota>_ratio.json)
"""
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

QUAD = {(0, 0): 'sit', (1, 0): 'stand', (0, 1): 'lie', (1, 1): 'curl'}


def blobs(alpha, step=4):
    m = alpha[::step, ::step] > 40
    lab = np.zeros(m.shape, np.int32)
    out, n = [], 0
    for y, x in zip(*np.nonzero(m)):
        if lab[y, x]:
            continue
        n += 1
        q, pts = deque([(y, x)]), []
        lab[y, x] = n
        while q:
            cy, cx = q.popleft()
            pts.append((cy, cx))
            for dy in (-2, -1, 0, 1, 2):
                for dx in (-2, -1, 0, 1, 2):
                    yy, xx = cy + dy, cx + dx
                    if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n
                        q.append((yy, xx))
        ys, xs = np.array(pts).T
        out.append((len(pts), xs.min() * step, ys.min() * step, (xs.max() + 1) * step, (ys.max() + 1) * step))
    return sorted(out, reverse=True)


def main(src, k):
    sheet = Image.open(os.path.join(src, k + '_hoja.png')).convert('RGBA')
    W, H = sheet.size
    boxes = {}
    found = blobs(np.asarray(sheet)[..., 3])
    pad = 12
    for n, x0, y0, x1, y1 in found:
        if n < found[0][0] * 0.005:   # motas sueltas
            continue
        # cada mancha va con la pose de su cuadrante (así un objeto suelto, como la mandarina, queda con su cuerpo)
        pose = QUAD[(int((x0 + x1) / 2 > W / 2), int((y0 + y1) / 2 > H / 2))]
        b = boxes.get(pose, (W, H, 0, 0))
        boxes[pose] = (min(b[0], max(0, x0 - pad)), min(b[1], max(0, y0 - pad)), max(b[2], min(W, x1 + pad)), max(b[3], min(H, y1 + pad)))
    faces = {'': sheet}
    for face in ('blink', 'happy'):
        p = os.path.join(src, k + '_hoja_' + face + '.png')
        if os.path.exists(p):
            faces['_' + face] = Image.open(p).convert('RGBA').resize((W, H))
    for pose, box in boxes.items():
        for suf, im in faces.items():
            if pose == 'curl' and suf:
                continue
            if suf == '_happy' and pose != 'sit':
                continue
            crop = im.crop(box)
            if suf:   # solo lo que cae dentro del recorte de la pose base
                crop.putalpha(Image.fromarray(np.minimum(np.asarray(crop)[..., 3], np.asarray(sheet.crop(box))[..., 3])))
            crop.save(os.path.join(src, k + '_' + pose + suf + '.png'))
    # en la hoja todas las poses están a la misma escala: se guarda el alto de cada una respecto de la sentada
    alpha = np.asarray(sheet)[..., 3]
    def height(b):
        ys = np.nonzero((alpha[b[1]:b[3], b[0]:b[2]] > 40).any(axis=1))[0]
        return ys.max() - ys.min() + 1
    ratio = {p: round(height(b) / height(boxes['sit']), 3) for p, b in boxes.items()}
    with open(os.path.join(src, k + '_ratio.json'), 'w') as f:
        json.dump(ratio, f)
    print(k, ratio)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
