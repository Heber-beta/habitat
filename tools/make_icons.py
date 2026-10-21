"""Íconos de la app: el hogar pintado del zorro, Miso sentado y el nombre "Hábitat"
con el techo rojo sobre "at" (como el logo).

Uso: python3 tools/make_icons.py <Fredoka.ttf>
(Fredoka variable de Google Fonts: github.com/google/fonts/tree/main/ofl/fredoka)
Escribe icons/icon-192.png, icon-512.png, maskable-512.png, apple-180.png y favicon-32.png.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 1024
TEJA = (196, 85, 58)
TEJA_OSC = (154, 63, 42)
CREMA = (255, 246, 229)
BOSQUE = (47, 107, 79)


def font(path, size, weight='Bold'):
    f = ImageFont.truetype(path, size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f


def scene():
    """Fondo: el hogar del zorro, cuadrado alrededor de donde vive, suavizado."""
    img = Image.open(os.path.join(ROOT, 'img', 'fondos', 'casa_zorro.jpg')).convert('RGB')
    w, h = img.size
    side = w
    top = max(0, min(h - side, 1150 - int(side * 0.62)))
    bg = img.crop((0, top, side, top + side)).resize((S, S), Image.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(2.2))
    # luz cálida arriba y franja crema abajo para el nombre
    over = Image.new('RGBA', (S, S))
    d = ImageDraw.Draw(over)
    for y in range(S):
        t = y / S
        a = int(max(0, (t - 0.62) / 0.38) ** 1.6 * 200)
        d.line([(0, y), (S, y)], fill=CREMA + (a,))
    glow = Image.new('RGBA', (S, S))
    ImageDraw.Draw(glow).ellipse((S * 0.15, S * 0.02, S * 0.85, S * 0.62), fill=(255, 236, 180, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    return Image.alpha_composite(Image.alpha_composite(bg.convert('RGBA'), glow), over)


def pet(canvas, height, cx, foot):
    fox = Image.open(os.path.join(ROOT, 'img', 'pets', 'zorro_sit.png')).convert('RGBA')
    fox = fox.resize((round(fox.width * height / fox.height), height), Image.LANCZOS)
    x, y = cx - fox.width // 2, foot - fox.height
    # sombra suave en el suelo
    sh = Image.new('RGBA', canvas.size)
    ImageDraw.Draw(sh).ellipse((cx - fox.width * 0.42, foot - 26, cx + fox.width * 0.42, foot + 22), fill=(40, 30, 10, 120))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    canvas.alpha_composite(fox, (x, y))


def wordmark(canvas, fpath, width, cx, base):
    """'Hábitat' en Fredoka con el techo sobre 'at'. width = ancho total del texto."""
    size = 200
    f = font(fpath, size)
    tw = f.getlength('Hábitat')
    size = int(size * width / tw)
    f = font(fpath, size)
    tw = f.getlength('Hábitat')
    x0 = cx - tw / 2
    asc = f.getbbox('H')[1]
    y = base - f.getbbox('Hábitat')[3]
    layer = Image.new('RGBA', canvas.size)
    d = ImageDraw.Draw(layer)
    # sombra
    sh = Image.new('RGBA', canvas.size)
    ImageDraw.Draw(sh).text((x0, y + size * 0.05), 'Hábitat', font=f, fill=(30, 50, 35, 110))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size * 0.04)))
    stroke = max(2, int(size * 0.07))
    d.text((x0, y), 'Hábit', font=f, fill=BOSQUE, stroke_width=stroke, stroke_fill=CREMA)
    xa = x0 + f.getlength('Hábit')
    d.text((xa, y), 'at', font=f, fill=TEJA, stroke_width=stroke, stroke_fill=CREMA)
    # techo sobre "at", como en el logo: una V invertida gruesa apoyada sobre la "a"
    aw = f.getlength('at')
    ax = y + f.getbbox('a')[1]          # alto de la "a"
    pad, th = size * 0.1, size * 0.13
    l, r, m = xa - pad, xa + aw + pad, xa + aw / 2
    base_y, peak_y = ax - size * 0.02, ax - size * 0.36
    roof = [(l, base_y), (m, peak_y), (r, base_y)]
    d.line(roof, fill=CREMA, width=int(th + stroke * 1.6), joint='curve')
    d.line(roof, fill=TEJA, width=int(th), joint='curve')
    canvas.alpha_composite(layer)


def build(fpath, safe=1.0):
    """safe < 1 encoge el dibujo al centro (íconos 'maskable' de Android)."""
    c = scene()
    k = safe
    pet(c, int(S * 0.56 * k), S // 2, int(S / 2 + S * 0.22 * k))
    wordmark(c, fpath, S * 0.8 * k, S / 2, S / 2 + S * 0.42 * k)
    return c.convert('RGB')


def main(fpath):
    out = os.path.join(ROOT, 'icons')
    full = build(fpath)
    for name, px in (('icon-512.png', 512), ('icon-192.png', 192), ('apple-180.png', 180)):
        full.resize((px, px), Image.LANCZOS).save(os.path.join(out, name), optimize=True)
    build(fpath, safe=0.78).resize((512, 512), Image.LANCZOS).save(os.path.join(out, 'maskable-512.png'), optimize=True)
    # favicon: a 32 px el nombre no se lee, va solo la cara del zorro sobre crema
    fav = Image.new('RGBA', (256, 256), CREMA + (255,))
    ImageDraw.Draw(fav).rounded_rectangle((0, 0, 255, 255), 56, fill=(127, 176, 105, 255))
    fox = Image.open(os.path.join(ROOT, 'img', 'pets', 'zorro_sit.png')).convert('RGBA')
    head = fox.crop((0, 0, fox.width, int(fox.height * 0.55)))
    head.thumbnail((230, 230), Image.LANCZOS)
    fav.alpha_composite(head, ((256 - head.width) // 2, 256 - head.height))
    fav.resize((32, 32), Image.LANCZOS).save(os.path.join(out, 'favicon-32.png'))
    print('ok')


if __name__ == '__main__':
    main(sys.argv[1])
