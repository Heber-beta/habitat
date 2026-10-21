"""Prepara las mascotas estilo personaje (img/pets/<mascota>.png, _blink.png, _happy.png).

Entrada (carpeta): <mascota>_open.png, <mascota>_blink.png, <mascota>_happy.png, recortes
transparentes del mismo tamaño y encuadre (ojos abiertos, ojos cerrados, cara feliz).

- Solo se toma la cara de los cuadros de parpadeo y alegría, así el cuerpo es idéntico
  y al cambiar de cuadro solo se mueven los ojos y la boca.
- Se tiñe con la luz del hogar donde vive (anim/pose.json) y se le agrega una luz de borde,
  para que se vea dentro de la escena y no pegada encima.

Uso: python3 tools/build_mascots.py <carpeta> [mascota ...]   y después  python3 tools/make_lottie.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_H = 640   # alto del recorte final (px)


def face_from(base, other, box):
    a = np.asarray(base).astype(float)
    b = np.asarray(other).astype(float)
    diff = (np.abs(a[..., :3] - b[..., :3]).sum(-1) > 45).astype(np.uint8) * 255
    m = np.zeros_like(diff)
    x0, y0, x1, y1 = box
    m[y0:y1, x0:x1] = diff[y0:y1, x0:x1]
    mask = Image.fromarray(m).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(6))
    return Image.composite(other, base, mask)


def ambient(scene, fx, fy, r=160):
    a = np.asarray(scene.convert('RGB')).astype(float) / 255
    patch = a[max(0, fy - 3 * r):fy + r // 2, max(0, fx - 2 * r):fx + 2 * r].reshape(-1, 3)
    c = patch.mean(0)
    return c / c.max()


def grade(img, amb, k=0.22):
    a = np.asarray(img).astype(float)
    rgb = a[..., :3] / 255
    rgb = rgb * (1 - k) + rgb * amb * k
    lum = rgb.mean(-1, keepdims=True)
    rgb = lum + (rgb - lum) * 0.93
    al = a[..., 3] / 255
    inner = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(4))) / 255
    rim = np.clip(al - inner, 0, 1)[..., None]
    yy, xx = np.mgrid[0:al.shape[0], 0:al.shape[1]]
    side = np.clip(1 - (xx / al.shape[1] * 0.6 + yy / al.shape[0] * 0.8), 0, 1)[..., None]
    rgb = rgb + rim * side * np.array([1.0, 0.9, 0.6]) * 0.35
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 1) * 255, a[..., 3]]).astype(np.uint8))


def main(src, only):
    with open(os.path.join(ROOT, 'anim', 'pose.json')) as f:
        pose = json.load(f)
    for k in only or sorted(pose):
        path = os.path.join(src, k + '_open.png')
        if not os.path.exists(path):
            continue
        base = Image.open(path).convert('RGBA')
        bbox = base.getbbox()
        frames = {'': base}
        for face, box in (('blink', 'eyes'), ('happy', 'face')):
            p = os.path.join(src, k + '_' + face + '.png')
            if os.path.exists(p):
                fb = pose[k]['face']
                x0, y0, x1, y1 = fb['eyes'] if box == 'eyes' else fb['face']
                frames['_' + face] = face_from(base, Image.open(p).convert('RGBA'), (x0, y0, x1, y1))
        scene = Image.open(os.path.join(ROOT, 'img', 'fondos', 'casa_' + k + '.jpg'))
        amb = ambient(scene, pose[k]['fx'], pose[k]['fy'])
        for suf, im in frames.items():
            im = grade(im.crop(bbox), amb)
            im = im.resize((round(im.width * OUT_H / im.height), OUT_H), Image.LANCZOS)
            im.save(os.path.join(ROOT, 'img', 'pets', k + suf + '.png'), optimize=True)
        print(k, 'ok', list(frames))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
