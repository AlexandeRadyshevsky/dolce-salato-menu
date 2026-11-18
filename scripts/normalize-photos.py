"""Единый стиль фото товаров: товар по центру квадратного белого холста
с одинаковым отступом. usage: normalize.py <src_dir> <dst_dir>"""
import sys, glob, os
import numpy as np
from PIL import Image

SRC, DST = sys.argv[1], sys.argv[2]
SIZE, FILL, MAX_UP = 900, 0.84, 2.0

def main_span(counts, n, thr):
    """Диапазон основного объекта по проекции: отрезки активных строк/столбцов,
    разделённые пустотой > 4%, узкие и лёгкие отрезки (штрихи, обрывки) отбрасываются."""
    idx = np.where(counts > thr)[0]
    if len(idx) == 0:
        return 0, n
    gap = max(3, int(0.04 * n))
    segs, start = [], idx[0]
    for a, b in zip(idx, idx[1:]):
        if b - a > gap:
            segs.append((start, a)); start = b
    segs.append((start, idx[-1]))
    total = counts.sum()
    keep = [(a, b) for a, b in segs
            if (b - a + 1) >= 0.05 * n or counts[a:b + 1].sum() >= 0.04 * total]
    keep = keep or [max(segs, key=lambda s: counts[s[0]:s[1] + 1].sum())]
    return keep[0][0], keep[-1][1] + 1

def content_box(im):
    a = np.asarray(im.convert("RGB")).astype(int)
    mn, mx = a.min(2), a.max(2)
    fg = ~((mn > 236) & (mx - mn < 20))           # не почти-белый фон
    h, w = fg.shape
    x0, x1 = main_span(fg.sum(0), w, max(2, 0.004 * h))
    y0, y1 = main_span(fg[:, x0:x1].sum(1), h, max(2, 0.004 * (x1 - x0)))
    x0, x1 = main_span(fg[y0:y1].sum(0), w, max(2, 0.004 * (y1 - y0)))
    m = 2
    return (max(x0 - m, 0), max(y0 - m, 0), min(x1 + m, w), min(y1 + m, h))

# ручная подрезка: в кадр из макета каталога попал край соседней картинки
# (доли ширины/высоты: left, top, right, bottom)
MANUAL = {
    "olivki-lechchino-v-rassole-optom.jpg": (0, 0, 0.9, 1),
    "kulich-s-shokoladom-i-grushey-banchini-optom.jpg": (0, 0.3, 1, 1),
}

def soften_shadows(im):
    """Светлые нейтральные тени/подложки исходных снимков (часть обрезана по прямой
    и читается как серый прямоугольник) осветляем на 2/3 к белому.
    Цветные пиксели товара не трогаем; переход плавный."""
    a = np.asarray(im).astype(float)
    mn, mx = a.min(2), a.max(2)
    neutral = (mx - mn) < 16
    # вес: 0 при min<=210, 1 при min>=232 — плавно, без ступенек
    w = np.clip((mn - 210) / 22.0, 0, 1) * neutral
    k = 1 - 0.68 * w[..., None]                       # доля оставшейся «серости»
    out = 255 - (255 - a) * k
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

for f in sorted(glob.glob(os.path.join(SRC, "*", "*.jpg"))):
    im = Image.open(f).convert("RGB")
    if os.path.basename(f) in MANUAL:
        l, t, r, b = MANUAL[os.path.basename(f)]
        im = im.crop((round(l * im.width), round(t * im.height), round(r * im.width), round(b * im.height)))
    im = soften_shadows(im)
    crop = im.crop(content_box(im))
    cw, ch = crop.size
    k = min(SIZE * FILL / cw, SIZE * FILL / ch, MAX_UP)
    crop = crop.resize((max(1, round(cw * k)), max(1, round(ch * k))), Image.LANCZOS)
    canvas = Image.new("RGB", (SIZE, SIZE), "white")
    canvas.paste(crop, ((SIZE - crop.width) // 2, (SIZE - crop.height) // 2))
    out = os.path.join(DST, os.path.relpath(f, SRC))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    canvas.save(out, "JPEG", quality=84, optimize=True, progressive=True)
print("done", len(glob.glob(os.path.join(DST, "*", "*.jpg"))))
