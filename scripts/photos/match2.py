"""Точное сопоставление: наше фото ← рендер области PDF (как при исходной сборке)
→ рамка IDML по перекрытию → файл-оригинал + кадрирование.
usage: match2.py menu.json placements.json catalog.pdf photos_orig out.json"""
import sys, json, os
import numpy as np, pymupdf
from PIL import Image

MENU, PLC, PDF, ORIG, OUT = sys.argv[1:6]
menu = json.load(open(MENU)); plc = json.load(open(PLC))

def clean_page(pno):
    d = pymupdf.open(PDF); d.select([pno - 1]); pg = d[0]
    pg.add_redact_annot(pg.rect)
    pg.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED)
    return d, pg

def g64(im):
    t = np.asarray(im.convert("L").resize((64, 64), Image.BILINEAR)).astype(float)
    return (t - t.mean()) / (t.std() + 1e-6)

def aspect(im): return im.width / im.height

pages = {}
def page_rects(pno):
    """Все растровые картинки страницы и их рендер (pad 4pt, как в build)."""
    if pno in pages: return pages[pno]
    d, pg = clean_page(pno)
    out = []
    seen = set()
    for img in pg.get_images(full=True):
        for r in pg.get_image_rects(img[0]):
            if r.width < 15 or r.height < 15: continue
            rr = r & pg.rect
            rr = pymupdf.Rect(rr.x0 - 4, rr.y0 - 4, rr.x1 + 4, rr.y1 + 4) & pg.rect
            key = tuple(round(v) for v in rr)
            if key in seen: continue
            seen.add(key)
            zoom = min(300 / max(rr.width, rr.height), 6)
            pix = pg.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rr, alpha=False)
            im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            out.append(dict(rect=[r.x0, r.y0, r.x1, r.y1], sig=g64(im), aspect=aspect(im)))
    pages[pno] = (d, out)
    return pages[pno]

def overlap_min(a, b):
    x0, y0, x1, y1 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
    if x1 <= x0 or y1 <= y0: return 0.0
    inter = (x1 - x0) * (y1 - y0)
    return inter / min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]))

def iou(a, b):
    x0, y0, x1, y1 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
    if x1 <= x0 or y1 <= y0: return 0.0
    inter = (x1 - x0) * (y1 - y0)
    return inter / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter)

res, bad = [], []
for c in menu["categories"]:
    for p in c["products"]:
        if "image" not in p: continue
        mine = Image.open(os.path.join(ORIG, os.path.relpath(p["image"], "images/catalog")))
        ms, ma = g64(mine), aspect(mine)
        # страница: обычно p["page"]; на всякий случай смотрим и соседние
        best = None
        for pno in (p["page"], p["page"] - 1, p["page"] + 1):
            if pno < 1 or pno > 106: continue
            _, rects = page_rects(pno)
            for r in rects:
                if abs(np.log(r["aspect"] / ma)) > 0.12: continue
                s = float((ms * r["sig"]).mean())
                if best is None or s > best[0]: best = (s, pno, r["rect"])
        if best is None or best[0] < 0.9:
            bad.append((p["slug"], "нет точного совпадения рендера", best and round(best[0], 3))); continue
        s, pno, rect = best
        cands = [x for x in plc if x["page"] == pno and not x["file"].lower().endswith((".ai", ".pdf"))]
        scored = sorted(((iou(rect, x["rect"]), i) for i, x in enumerate(cands)), reverse=True)
        if not scored or scored[0][0] < 0.5:
            # картинка вылезает за рамку или наоборот: перекрытие относительно меньшей области
            alt = sorted(((overlap_min(rect, x["rect"]), iou(rect, x["rect"]), i) for i, x in enumerate(cands)), reverse=True)
            if not alt or alt[0][0] < 0.85 or (len(alt) > 1 and alt[1][0] > 0.85):
                bad.append((p["slug"], "нет рамки IDML", alt[:2])); continue
            scored = [(alt[0][1], alt[0][2])]
        x = cands[scored[0][1]]
        res.append(dict(image=p["image"], slug=p["slug"], name=p["name_ru"], page=pno, file=x["file"],
                        crop=x["crop"], rotated=x["rotated"], flipped=x["flipped"], rect=x["rect"],
                        gm=x["gm"], gb=x["gb"], fb=x["fb"], fp=x["fp"], pdf_rect=[round(v, 2) for v in rect],
                        render=round(s, 4), iou=round(scored[0][0], 3)))

json.dump(res, open(OUT, "w"), ensure_ascii=False, indent=1)
print("сопоставлено:", len(res), "проблемных:", len(bad))
for b in bad: print("  ", b)
print("render corr min:", min(r["render"] for r in res), " iou min:", min(r["iou"] for r in res))
from collections import Counter
dup = {f: n for f, n in Counter(r["file"] for r in res).items() if n > 1}
print("один файл на несколько товаров:", dup)
