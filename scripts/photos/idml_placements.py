"""Все размещённые картинки каталога из IDML: страница, файл-оригинал,
рамка на странице (pt, координаты PDF) и видимая область в долях оригинала.

usage: idml_placements.py <idml_dir> <out.json>
"""
import sys, os, re, json, urllib.parse
import xml.etree.ElementTree as ET

IDML, OUT = sys.argv[1], sys.argv[2]
BLEED = 21.0  # PDF-страница 637x884 = A4 595.3x841.9 + 21pt с каждой стороны

def mat(s):
    a, b, c, d, e, f = map(float, s.split())
    return (a, b, c, d, e, f)

I = (1, 0, 0, 1, 0, 0)

def mul(m, n):
    """m ∘ n: сначала n, потом m (n — внутренний → m — родитель)."""
    a, b, c, d, e, f = m
    A, B, C, D, E, F = n
    return (a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f)

def inv(m):
    a, b, c, d, e, f = m
    det = a * d - b * c
    return (d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det)

def ap(m, x, y):
    a, b, c, d, e, f = m
    return (a * x + c * y + e, b * x + d * y + f)

def path_points(el):
    pts = []
    for p in el.iter("PathPointType"):
        x, y = map(float, p.get("Anchor").split())
        pts.append((x, y))
    return pts

def bbox(pts):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))

design = open(os.path.join(IDML, "designmap.xml")).read()
spread_files = re.findall(r'<idPkg:Spread src="([^"]+)"', design)

GRAPHIC_TAGS = ("Image", "EPS", "PDF", "ImportedPage")
placements = []

for sf in spread_files:
    root = ET.parse(os.path.join(IDML, sf)).getroot()
    spread = root.find("Spread")
    sm = mat(spread.get("ItemTransform", "1 0 0 1 0 0"))
    pages = []
    for pg in spread.findall("Page"):
        pm = mul(sm, mat(pg.get("ItemTransform")))
        t, l, b, r = map(float, pg.get("GeometricBounds").split())
        p0, p1 = ap(pm, l, t), ap(pm, r, b)
        pages.append((pg.get("Name"), pm, (min(p0[0], p1[0]), min(p0[1], p1[1]), max(p0[0], p1[0]), max(p0[1], p1[1]))))

    def walk(el, m):
        for ch in el:
            cm = mul(m, mat(ch.get("ItemTransform"))) if ch.get("ItemTransform") else m
            g = next((x for x in ch if x.tag in GRAPHIC_TAGS), None)
            if ch.tag in ("Rectangle", "Polygon", "Oval") and g is not None:
                link = g.find("Link")
                if link is None:
                    continue
                uri = urllib.parse.unquote(link.get("LinkResourceURI", ""))
                fname = uri.split("/")[-1]
                frame_pts = [ap(cm, x, y) for x, y in path_points(ch)]
                fb = bbox(frame_pts)  # рамка в координатах разворота
                # страница — по центру рамки
                cx, cy = (fb[0] + fb[2]) / 2, (fb[1] + fb[3]) / 2
                page = next((p for p in pages if p[2][0] <= cx <= p[2][2] and p[2][1] <= cy <= p[2][3]), None)
                if page is None:
                    continue
                name, pm, pb = page
                # рамка в координатах страницы PDF (+ bleed)
                inv_pm = inv(pm)
                q = [ap(inv_pm, x, y) for x, y in frame_pts]
                qb = bbox(q)
                rect_pdf = (qb[0] + BLEED, qb[1] + BLEED, qb[2] + BLEED, qb[3] + BLEED)
                # видимая область в координатах картинки
                gm = mul(cm, mat(g.get("ItemTransform", "1 0 0 1 0 0")))
                gb = g.find("Properties/GraphicBounds")
                if gb is None:
                    continue
                L, T, R, B = (float(gb.get(k)) for k in ("Left", "Top", "Right", "Bottom"))
                ig = inv(gm)
                ip = [ap(ig, x, y) for x, y in frame_pts]
                vb = bbox(ip)
                # доли от GraphicBounds (0..1), обрезаем по границам картинки
                fx0 = max(0.0, (vb[0] - L) / (R - L)); fy0 = max(0.0, (vb[1] - T) / (B - T))
                fx1 = min(1.0, (vb[2] - L) / (R - L)); fy1 = min(1.0, (vb[3] - T) / (B - T))
                a, b_, c, d, _, _ = gm
                clip = g.find("ClippingPathSettings")
                placements.append(dict(
                    page=int(name) if name.isdigit() else name,
                    file=fname,
                    rect=[round(v, 2) for v in rect_pdf],
                    crop=[round(fx0, 4), round(fy0, 4), round(fx1, 4), round(fy1, 4)],
                    m=[round(v, 6) for v in gm[:4]],
                    gm=list(gm),                       # картинка → разворот (полная матрица)
                    gb=[L, T, R, B],                   # GraphicBounds картинки (pt)
                    fb=list(fb),                       # рамка в координатах разворота
                    fp=[list(pt) for pt in frame_pts], # контур рамки (для повёрнутых)
                    rotated=abs(b_) > 1e-6 or abs(c) > 1e-6,
                    flipped=(a < 0) or (d < 0),
                    clipping=clip.get("ClippingType") if clip is not None else "None",
                    ppi=g.get("EffectivePpi") or (g.find("Properties") is not None and None),
                ))
            walk(ch, cm)

    walk(spread, sm)

json.dump(placements, open(OUT, "w"), ensure_ascii=False, indent=1)
from collections import Counter
print("размещений:", len(placements), "уникальных файлов:", len({p["file"] for p in placements}))
print("обтравка:", Counter(p["clipping"] for p in placements))
print("повёрнутых:", sum(p["rotated"] for p in placements), "отражённых:", sum(p["flipped"] for p in placements))
for p in placements[:3]:
    print(p)
