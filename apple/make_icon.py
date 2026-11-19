"""Builds the Nesos app icon (Deep water): Nesos blue, a soft grid, and the
yellow-to-mint N. Usage: python3 make_icon.py <AppIcon.appiconset folder>"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1]
N = [(146,18),(113,923),(205,923),(178,180),(812,943),(832,943),(866,38),(774,38),(800,786),(167,18)]

def rgb(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)], dtype=np.float64)

def art(size):
    """The full-bleed square artwork."""
    S = size * 2                                   # draw at 2x, then shrink
    y, x = np.mgrid[0:S, 0:S].astype(np.float64)
    a = math.radians(160)
    t = ((x - S/2) * math.sin(a) + (y - S/2) * -math.cos(a)) / (S * (abs(math.sin(a)) + abs(math.cos(a)))) + 0.5
    t = np.clip(t, 0, 1)[..., None]
    img = rgb('#1a759f') * (1 - t) + rgb('#184e77') * t
    # grid: five squares across, no line on the outer edge
    line = max(2.0, S / 220.0)
    for k in range(1, 5):
        c = S * k / 5
        lo, hi = int(round(c - line/2)), int(round(c + line/2))
        img[lo:hi, :, :] = img[lo:hi, :, :] * 0.92 + 255 * 0.08
        img[:, lo:hi, :] = img[:, lo:hi, :] * 0.92 + 255 * 0.08
    base = Image.fromarray(img.astype(np.uint8), 'RGB')
    # the N: 60% of the icon's height, centered, yellow to mint
    h = S * 0.60; s = h / 962.0; w = 780 * s
    ox, oy = (S - w) / 2, (S - h) / 2
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).polygon([(ox + (px - 100) * s, oy + py * s) for px, py in N], fill=255)
    gy = np.clip((np.arange(S) - oy) / h, 0, 1)[:, None, None]
    grad = rgb('#efeda3') * (1 - gy) + rgb('#b9edc7') * gy
    grad = Image.fromarray(np.broadcast_to(grad, (S, S, 3)).astype(np.uint8), 'RGB')
    base.paste(grad, (0, 0), mask)
    return base.resize((size, size), Image.LANCZOS)

def mac(size, square):
    """macOS shape: a rounded square inset on a clear canvas, with a soft shadow."""
    C = 1024; body = 824; r = 185; off = (C - body) // 2
    tile = square.resize((body, body), Image.LANCZOS)
    m = Image.new('L', (body * 2, body * 2), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, body * 2 - 1, body * 2 - 1], radius=r * 2, fill=255)
    m = m.resize((body, body), Image.LANCZOS)
    canvas = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    shadow = Image.new('L', (C, C), 0); shadow.paste(m, (off, off + 12))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * 0.3))
    canvas.paste(Image.new('RGBA', (C, C), (0, 0, 0, 255)), (0, 0), shadow)
    canvas.paste(tile.convert('RGBA'), (off, off), m)
    return canvas.resize((size, size), Image.LANCZOS)

square = art(1024)
square.save(os.path.join(OUT, 'icon-ios-1024.png'))
contents = json.load(open(os.path.join(OUT, 'Contents.json')))
for image in contents['images']:
    if image.get('idiom') == 'mac':
        px = int(image['size'].split('x')[0]) * int(image['scale'][0])
        name = 'icon-mac-%d.png' % px
        mac(px, square).save(os.path.join(OUT, name))
        image['filename'] = name
    elif not image.get('appearances'):
        image['filename'] = 'icon-ios-1024.png'
json.dump(contents, open(os.path.join(OUT, 'Contents.json'), 'w'), indent=2)
print('ok')
