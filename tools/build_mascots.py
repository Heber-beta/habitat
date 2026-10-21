"""Prepara las mascotas estilo personaje, con varias poses (img/pets/<mascota>_<pose>.png).

Entrada (carpeta): recortes transparentes de Canva, <mascota>_<pose>.png, con estas poses:
  sit, sit_blink, sit_happy   sentado (ojos abiertos, parpadeo, cara feliz)
  stand, stand_blink          de pie
  lie, lie_blink              acostado
  curl                        durmiendo en bolita
Una pose que falta se salta (la animación usa la sentada en su lugar).

- De los cuadros _blink y _happy solo se toma la cara (donde cambian los ojos y la boca),
  así el cuerpo es idéntico y al cambiar de cuadro solo se mueve la cara.
- Todas las poses quedan a la misma escala del animal (RATIO = alto de la pose / alto sentado;
  si viene <mascota>_ratio.json de tools/split_sheet.py, se usan las alturas medidas en la hoja).
- Se tiñe con la luz del hogar donde vive (anim/pose.json) y se le agrega una luz de borde,
  para que se vea dentro de la escena y no pegada encima.
- img/pets/<mascota>.png es la pose sentada, para miniaturas.

Uso: python3 tools/build_mascots.py <carpeta> [mascota ...]   y después  python3 tools/make_lottie.py
"""
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_H = 640   # alto de la pose sentada (px)
POSES = ['sit', 'stand', 'lie', 'curl']
FACES = ['blink', 'happy']
RATIO = {'sit': 1, 'stand': 0.95, 'lie': 0.7, 'curl': 0.55}
RATIO_PET = {}   # ajustes por mascota, p. ej. {'ballena': {'lie': 0.7}}


def face_from(base, other):
    """Pega en base solo la zona donde el otro cuadro cambia de verdad (ojos, boca)."""
    a = np.asarray(base).astype(float)
    b = np.asarray(other).astype(float)
    diff = ((np.abs(a[..., :3] - b[..., :3]).sum(-1) > 45) & (a[..., 3] > 128)).astype(np.uint8) * 255
    # el ruido del pelaje es disperso; la cara cambia en manchas densas
    dense = np.asarray(Image.fromarray(diff).filter(ImageFilter.GaussianBlur(10))) > 110
    mask = Image.fromarray((dense * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(7))
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
    out = os.path.join(ROOT, 'img', 'pets')
    for k in only or sorted(pose):
        if not os.path.exists(os.path.join(src, k + '_sit.png')):
            continue
        for f in os.listdir(out):
            if f.startswith(k + '_'):
                os.remove(os.path.join(out, f))
        scene = Image.open(os.path.join(ROOT, 'img', 'fondos', 'casa_' + k + '.jpg'))
        amb = ambient(scene, pose[k]['fx'], pose[k]['fy'])
        ratio = dict(RATIO, **RATIO_PET.get(k, {}))
        rp = os.path.join(src, k + '_ratio.json')   # alturas medidas en la hoja de poses (split_sheet.py)
        if os.path.exists(rp):
            with open(rp) as f:
                ratio.update(json.load(f))
        made = []
        for p in POSES:
            path = os.path.join(src, k + '_' + p + '.png')
            if not os.path.exists(path):
                continue
            base = Image.open(path).convert('RGBA')
            bbox = base.getbbox()
            frames = {'': base}
            for face in FACES:
                fp = os.path.join(src, k + '_' + p + '_' + face + '.png')
                if os.path.exists(fp):
                    frames['_' + face] = face_from(base, Image.open(fp).convert('RGBA'))
            h = round(OUT_H * ratio[p])
            for suf, im in frames.items():
                im = grade(im.crop(bbox), amb)
                im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
                im.save(os.path.join(out, k + '_' + p + suf + '.png'), optimize=True)
                made.append(p + suf)
        shutil.copy(os.path.join(out, k + '_sit.png'), os.path.join(out, k + '.png'))
        print(k, 'ok', made)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
