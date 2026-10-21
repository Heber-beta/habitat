"""Genera las animaciones Lottie de cada mascota (anim/<mascota>.json).

Cada archivo trae todos los estados en una sola línea de tiempo, separados por
marcadores: idle, hop, celebrate, spin, sleep, stretch, wiggle.
La mascota es la ilustración pintada (img/pets/<mascota>.png) y encima van
capas vectoriales: sombra, corazones, confeti y "Z" para dormir.

Uso: python3 tools/make_lottie.py
"""
import json
import math
import os
import random

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 60
W = H = 400
GROUND = 362          # y del suelo dentro de la composición
PET_H = 236           # alto máximo de la mascota en la composición
PET_W = 300           # ancho máximo
FLOATERS = {'ballena', 'axolote'}

SEG = {
    'idle': (0, 144),
    'hop': (150, 192),
    'celebrate': (200, 292),
    'spin': (300, 366),
    'sleep': (380, 572),
    'stretch': (580, 652),
    'wiggle': (660, 708),
}
OP = 712

EASE = {'i': {'x': [0.42], 'y': [1]}, 'o': {'x': [0.58], 'y': [0]}}       # in-out suave
EASE_OUT = {'i': {'x': [0.2], 'y': [1]}, 'o': {'x': [0.3], 'y': [0.6]}}
EASE_IN = {'i': {'x': [0.7], 'y': [1]}, 'o': {'x': [0.6], 'y': [0]}}
LINEAR = {'i': {'x': [1], 'y': [1]}, 'o': {'x': [0], 'y': [0]}}


def anim(keys, ease=EASE):
    """keys: lista de (frame, valor) o (frame, valor, ease)."""
    out = []
    for n, k in enumerate(keys):
        t, v = k[0], k[1]
        e = k[2] if len(k) > 2 else ease
        v = v if isinstance(v, list) else [v]
        kf = {'t': t, 's': v}
        if n < len(keys) - 1:
            kf.update({'i': e['i'], 'o': e['o']})
        out.append(kf)
    return {'a': 1, 'k': out}


def static(v):
    return {'a': 0, 'k': v}


def transform(p=None, a=None, s=None, r=None, o=None):
    return {
        'o': o or static(100),
        'r': r or static(0),
        'p': p or static([0, 0, 0]),
        'a': a or static([0, 0, 0]),
        's': s or static([100, 100, 100]),
    }


def shape_tr(p=(0, 0), s=100, r=0, o=100):
    return {'ty': 'tr', 'p': static(list(p)), 'a': static([0, 0]), 's': static([s, s]),
            'r': static(r), 'o': static(o), 'sk': static(0), 'sa': static(0)}


def fill(color, op=100):
    return {'ty': 'fl', 'c': static(hex_rgb(color)), 'o': static(op), 'r': 1}


def stroke(color, w, op=100):
    return {'ty': 'st', 'c': static(hex_rgb(color)), 'o': static(op), 'w': static(w), 'lc': 2, 'lj': 2}


def hex_rgb(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1]


def path(v, i, o, closed=True):
    return {'ty': 'sh', 'ks': static({'c': closed, 'v': v, 'i': i, 'o': o})}


HEART = path(
    [[0, -4], [10, -1], [0, 10], [-10, -1]],
    [[-3, -7], [0, -8], [4, -3], [0, 5]],
    [[3, -7], [0, 5], [-4, -3], [0, -8]],
)


def shape_layer(ind, name, items, ks, ip, op):
    return {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': name, 'sr': 1, 'ks': ks, 'ao': 0,
            'shapes': [{'ty': 'gr', 'it': items + [shape_tr()], 'nm': name}],
            'ip': ip, 'op': op, 'st': 0, 'bm': 0}


def heart_layer(ind, t0, x0, color, dx=0, rise=120, dur=48, size=160):
    """Corazón que aparece con un pop y sube desvaneciéndose."""
    t1 = t0 + dur
    items = [HEART, stroke('#FFFFFF', 2.4), fill(color)]
    ks = transform(
        p=anim([(t0, [x0, 250, 0], EASE_OUT), (t1, [x0 + dx, 250 - rise, 0])]),
        s=anim([(t0, [20, 20, 100], EASE_OUT), (t0 + 8, [size * 1.25, size * 1.25, 100]), (t0 + 14, [size, size, 100]), (t1, [size * 0.8, size * 0.8, 100])]),
        o=anim([(t0, 0), (t0 + 5, 100), (t1 - 14, 100), (t1, 0)]),
        r=anim([(t0, -12), (t1, 12)]),
    )
    return shape_layer(ind, 'corazón', items, ks, t0, t1 + 1)


def confetti_layer(ind, t0, color, angle, dist, kind):
    t1 = t0 + 70
    cx, cy = 200, 220
    ex, ey = cx + math.cos(angle) * dist, cy + math.sin(angle) * dist
    if kind == 'rect':
        geo = {'ty': 'rc', 'p': static([0, 0]), 's': static([10, 16]), 'r': static(3)}
    else:
        geo = {'ty': 'el', 'p': static([0, 0]), 's': static([11, 11])}
    ks = transform(
        p=anim([(t0, [cx, cy, 0], EASE_OUT), (t0 + 30, [ex, ey, 0], EASE_IN), (t1, [ex + math.cos(angle) * 10, ey + 90, 0])]),
        r=anim([(t0, 0), (t1, random.choice([-1, 1]) * random.randint(200, 540))], LINEAR),
        o=anim([(t0, 0), (t0 + 3, 100), (t1 - 18, 100), (t1, 0)]),
    )
    return shape_layer(ind, 'confeti', [geo, fill(color)], ks, t0, t1 + 1)


def z_layer(ind, t0, t1, x0, size, delay):
    """Una 'Z' que sube y crece mientras duerme (en bucle dentro del segmento)."""
    z = path([[-6, -6], [6, -6], [-6, 6], [6, 6]], [[0, 0]] * 4, [[0, 0]] * 4, closed=False)
    a, b = t0 + delay, t0 + delay + 110
    ks = transform(
        p=anim([(a, [x0, 170, 0], EASE_OUT), (b, [x0 + 34, 92, 0])]),
        s=anim([(a, [size * 0.6, size * 0.6, 100]), (b, [size * 1.2, size * 1.2, 100])]),
        o=anim([(a, 0), (a + 25, 100), (b - 30, 100), (b, 0)]),
    )
    return shape_layer(ind, 'zeta', [z, stroke('#3F5E7A', 2.6), stroke('#FFFFFF', 6.5)], ks, t0, t1 + 1)


def sparkle_layer(ind, t0, x, y, delay):
    star = path([[0, -9], [2, -2], [9, 0], [2, 2], [0, 9], [-2, 2], [-9, 0], [-2, -2]], [[0, 0]] * 8, [[0, 0]] * 8)
    a = t0 + delay
    ks = transform(
        p=static([x, y, 0]),
        s=anim([(a, [0, 0, 100], EASE_OUT), (a + 12, [180, 180, 100]), (a + 30, [0, 0, 100])]),
        r=anim([(a, 0), (a + 30, 90)], LINEAR),
    )
    return shape_layer(ind, 'brillo', [star, fill('#FFE48A')], ks, a, a + 31)


def build(name):
    img = Image.open(os.path.join(ROOT, 'img', 'pets', name + '.png'))
    iw, ih = img.size
    sc = min(PET_H / ih, PET_W / iw) * 100
    s0 = [sc, sc, 100]
    floater = name in FLOATERS
    gy = GROUND - (34 if floater else 0)

    def S(x, y):
        return [sc * x, sc * y, 100]

    # ---- transformaciones de la mascota, segmento por segmento
    pos, scl, rot = [], [], []
    P = lambda t, dy=0, e=EASE: pos.append((t, [200, gy + dy, 0], e))
    Z = lambda t, x, y, e=EASE: scl.append((t, S(x, y), e))
    R = lambda t, v, e=EASE: rot.append((t, v, e))

    # idle: respira y se balancea (los que flotan, suben y bajan)
    a, b = SEG['idle']
    if floater:
        P(a); P(a + 72, -14); P(b)
        Z(a, 1, 1); Z(a + 72, 1.02, 1.02); Z(b, 1, 1)
        R(a, -2.5); R(a + 72, 2.5); R(b, -2.5)
    else:
        P(a); P(b)
        Z(a, 1, 1); Z(a + 72, 1.025, 1.045); Z(b, 1, 1)
        R(a, 0); R(a + 36, 1.2); R(a + 72, 0); R(a + 108, -1.2); R(b, 0)

    # hop: anticipación, salto con estiramiento, aterrizaje con aplaste
    a, b = SEG['hop']
    P(a); P(a + 9, 0, EASE_OUT); P(a + 24, -64, EASE_IN); P(a + 36, 0); P(b)
    Z(a, 1, 1); Z(a + 9, 1.14, 0.84); Z(a + 24, 0.93, 1.09); Z(a + 36, 1.12, 0.88); Z(b, 1, 1)
    R(a, 0); R(b, 0)

    # celebrate: dos saltos con giro a cada lado
    a, b = SEG['celebrate']
    P(a); P(a + 9, 0, EASE_OUT); P(a + 26, -70, EASE_IN); P(a + 42, 0, EASE_OUT); P(a + 58, -48, EASE_IN); P(a + 74, 0); P(b)
    Z(a, 1, 1); Z(a + 9, 1.15, 0.84); Z(a + 26, 0.92, 1.1); Z(a + 42, 1.12, 0.88); Z(a + 58, 0.95, 1.06); Z(a + 74, 1.1, 0.9); Z(b, 1, 1)
    R(a, 0); R(a + 26, -9); R(a + 42, 0); R(a + 58, 9); R(a + 74, 0); R(b, 0)

    # spin: salto alto con vuelta completa
    a, b = SEG['spin']
    P(a); P(a + 8, 0, EASE_OUT); P(a + 30, -84, EASE_IN); P(a + 54, 0); P(b)
    Z(a, 1, 1); Z(a + 8, 1.14, 0.85); Z(a + 19, 0.04, 1.06, LINEAR); Z(a + 30, -1, 1.04, LINEAR); Z(a + 42, -0.04, 1.02, LINEAR); Z(a + 54, 1.12, 0.88); Z(b, 1, 1)
    R(a, 0); R(a + 30, -6); R(b, 0)

    # sleep: respiración lenta y profunda, un poco más aplastado
    a, b = SEG['sleep']
    P(a, 4 if not floater else 6); P(a + 96, 4 if not floater else 2); P(b, 4 if not floater else 6)
    Z(a, 1.03, 0.94); Z(a + 96, 1.055, 0.91); Z(b, 1.03, 0.94)
    R(a, 0); R(b, 0)

    # stretch: se despereza
    a, b = SEG['stretch']
    P(a, 4); P(a + 26, -6); P(a + 48, 0); P(b)
    Z(a, 1.03, 0.94); Z(a + 26, 0.9, 1.15); Z(a + 48, 1.06, 0.94); Z(a + 60, 0.98, 1.03); Z(b, 1, 1)
    R(a, 0); R(a + 26, -4); R(a + 48, 3); R(b, 0)

    # wiggle: se menea
    a, b = SEG['wiggle']
    P(a); P(b)
    Z(a, 1, 1); Z(b, 1, 1)
    R(a, 0); R(a + 8, -9); R(a + 18, 8); R(a + 28, -5); R(a + 38, 3); R(b, 0)

    layers = []
    ind = 1
    random.seed(name)
    cols = ['#E2556B', '#F6C453', '#F28B82', '#7FB069', '#8EC5E8', '#C4553A']

    # corazones del hop y de la celebración
    a, _ = SEG['hop']
    for k, (x, dx) in enumerate([(170, -20), (232, 22)]):
        layers.append(heart_layer(ind, a + 14 + k * 5, x, cols[k], dx=dx, rise=110, dur=34)); ind += 1
    a, _ = SEG['celebrate']
    for k in range(7):
        x = 120 + k * 27
        layers.append(heart_layer(ind, a + 6 + k * 6, x, cols[k % 4], dx=random.randint(-30, 30), rise=random.randint(120, 170), dur=60, size=random.randint(140, 190))); ind += 1
    for k in range(16):
        ang = -math.pi / 2 + (k - 7.5) * 0.2 + random.uniform(-0.08, 0.08)
        layers.append(confetti_layer(ind, a + 18 + random.randint(0, 6), cols[k % len(cols)], ang, random.randint(110, 175), 'rect' if k % 2 else 'dot')); ind += 1
    for k, (x, y) in enumerate([(110, 170), (295, 150), (250, 90), (140, 100)]):
        layers.append(sparkle_layer(ind, a, x, y, 10 + k * 12)); ind += 1
    a, _ = SEG['spin']
    for k, (x, y) in enumerate([(120, 200), (285, 190), (200, 90)]):
        layers.append(sparkle_layer(ind, a, x, y, 20 + k * 8)); ind += 1
    a, b = SEG['sleep']
    for k in range(3):
        layers.append(z_layer(ind, a, b, 252 + k * 8, 170 + k * 40, k * 40)); ind += 1

    # la mascota
    layers.append({
        'ddd': 0, 'ind': ind, 'ty': 2, 'nm': name, 'refId': 'pet', 'sr': 1, 'ao': 0,
        'ks': transform(p=anim(pos), a=static([iw / 2, ih, 0]), s=anim(scl), r=anim(rot)),
        'ip': 0, 'op': OP, 'st': 0, 'bm': 0,
    }); ind += 1

    # sombra en el suelo: se achica cuando salta
    sw = min(iw * sc / 100 * 0.62, 190)
    shs = []
    for seg, keys in {
        'hop': [(9, 100), (24, 55), (36, 108), (42, 100)],
        'celebrate': [(9, 100), (26, 50), (42, 105), (58, 65), (74, 104), (92, 100)],
        'spin': [(8, 100), (32, 45), (54, 108), (66, 100)],
    }.items():
        a, _ = SEG[seg]
        shs.append((a, [100, 100, 100]))
        shs += [(a + t, [v, v, 100]) for t, v in keys]
    shs.sort(key=lambda k: k[0])
    shadow_ks = transform(p=static([200, GROUND + 2, 0]), s=anim(shs), o=static(55 if floater else 100))
    layers.append(shape_layer(ind, 'sombra', [{'ty': 'el', 'p': static([0, 0]), 's': static([sw, 18 if not floater else 12])}, fill('#263A2E', 26)], shadow_ks, 0, OP))

    return {
        'v': '5.12.2', 'fr': FPS, 'ip': 0, 'op': OP, 'w': W, 'h': H, 'nm': 'Hábitat ' + name, 'ddd': 0,
        'assets': [{'id': 'pet', 'w': iw, 'h': ih, 'u': '../img/pets/', 'p': name + '.png', 'e': 0}],
        'layers': layers,
        'markers': [{'tm': a, 'cm': k, 'dr': b - a} for k, (a, b) in SEG.items()],
        'meta': {'petHeight': round(ih * sc / 100, 1), 'petWidth': round(iw * sc / 100, 1), 'ground': GROUND, 'floater': floater},
    }


def main():
    names = sorted(f[:-4] for f in os.listdir(os.path.join(ROOT, 'img', 'pets')) if f.endswith('.png'))
    meta = {}
    for n in names:
        data = build(n)
        meta[n] = data['meta']
        with open(os.path.join(ROOT, 'anim', n + '.json'), 'w') as f:
            json.dump(data, f, separators=(',', ':'))
    with open(os.path.join(ROOT, 'anim', 'meta.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    print('ok', len(names), 'animaciones')


if __name__ == '__main__':
    main()
