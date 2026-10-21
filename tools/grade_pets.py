"""Integra cada mascota con la luz y el color de su hogar pintado.

Toma el recorte original (tools/pets_src/<mascota>.png) y:
- suaviza el borde del recorte (sin el halo de "foto pegada");
- tiñe levemente la mascota con el color ambiente del lugar donde pisa;
- ajusta su brillo al de la escena y le agrega una luz de borde cálida.
Guarda el resultado en img/pets/<mascota>.png. Después correr make_lottie.py.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

# Mismos puntos que PETS en js/data.js (en píxeles de la imagen de 338 de ancho)
FEET = {
    'zorro': (120, 400), 'gato': (180, 330), 'perro': (150, 470), 'ballena': (170, 260), 'axolote': (115, 430),
    'dinosaurio': (175, 480), 'panda': (180, 390), 'capibara': (165, 420), 'buho': (200, 400), 'conejo': (110, 430),
}


def ambient(scene, fx, fy):
    a = np.asarray(scene.convert('RGB'), dtype=np.float32) / 255
    sc = scene.width / 338
    x, y = int(fx * sc), int(fy * sc)
    r = int(110 * sc)
    patch = a[max(0, y - 2 * r):min(a.shape[0], y + r // 2), max(0, x - r):min(a.shape[1], x + r)]
    return patch.reshape(-1, 3).mean(0)


def grade(name):
    pet = Image.open(os.path.join(ROOT, 'tools', 'pets_src', name + '.png')).convert('RGBA')
    scene = Image.open(os.path.join(ROOT, 'img', 'fondos', 'casa_' + name + '.jpg'))
    amb = ambient(scene, *FEET[name])
    p = np.asarray(pet, dtype=np.float32) / 255
    rgb, al = p[..., :3], p[..., 3]

    # borde: erosiona 1 px y difumina, para quitar el halo blanco del recorte
    am = Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
    al2 = np.asarray(am, dtype=np.float32) / 255

    # color: mezcla suave hacia el tinte ambiente (multiplicar) y brillo hacia la escena
    tint = amb / max(amb.mean(), 1e-3)
    tint = 1 + (tint - 1) * 0.35
    lum_s = float(amb @ [0.299, 0.587, 0.114])
    mask = al > 0.5
    lum_p = float((rgb[mask] @ [0.299, 0.587, 0.114]).mean()) if mask.any() else 0.5
    gain = 1 + (min(max(lum_s / max(lum_p, 1e-3), 0.75), 1.15) - 1) * 0.4
    out = np.clip(rgb * tint * gain, 0, 1)

    # luz de borde: los bordes superiores toman el color de la luz del cielo
    edge = np.clip(al - np.asarray(am.filter(ImageFilter.MinFilter(7)), dtype=np.float32) / 255, 0, 1)
    h = al.shape[0]
    top = np.linspace(1, 0.2, h)[:, None]
    light = np.clip(amb * 1.4 + 0.15, 0, 1)
    out = out * (1 - edge[..., None] * top[..., None] * 0.35) + light * edge[..., None] * top[..., None] * 0.35

    res = np.dstack([out, al2])
    Image.fromarray((res * 255).astype(np.uint8), 'RGBA').save(os.path.join(ROOT, 'img', 'pets', name + '.png'), optimize=True)
    return amb


if __name__ == '__main__':
    for n in FEET:
        a = grade(n)
        print(n, [round(float(x), 2) for x in a])
