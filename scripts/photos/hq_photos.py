"""Фото товаров в максимальном качестве из оригиналов (папка Links каталога).

Для каждого товара: оригинал → ровно то кадрирование/поворот/отражение, что в рамке
InDesign (матрица из IDML), в родном разрешении оригинала → CMYK→sRGB по профилю →
сверка с версией из PDF → единый стиль (товар по центру квадрата, одинаковые поля,
мягкие тени) → <slug>.jpg (1200px) и <slug>-600.jpg (карточки).

usage: hq_photos.py matches.json links_dir photos_pdf_dir out_dir report.json
"""
import sys, os, io, json, math
import numpy as np
from PIL import Image, ImageCms, ImageOps

Image.MAX_IMAGE_PIXELS = None
MATCHES, LINKS, PDFDIR, OUT, REPORT = sys.argv[1:6]
PLACEMENTS = json.load(open(os.path.join(os.path.dirname(MATCHES), "placements.json")))
SIZE, FILL = 1200, 0.84
SRGB = ImageCms.createProfile("sRGB")
CMYK_DEFAULT = "/System/Library/ColorSync/Profiles/Generic CMYK Profile.icc"


# ---------- загрузка оригинала в sRGB на белом ----------
def open_original(path):
    head = open(path, "rb").read(8)
    if head.startswith(b"%PDF") or path.lower().endswith((".ai", ".pdf")):
        import pymupdf
        d = pymupdf.open(path)
        pix = d[0].get_pixmap(dpi=400, alpha=True)
        im = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)
    else:
        try:
            im = Image.open(path)
            im.load()
        except Exception:
            import subprocess, tempfile
            tmp = tempfile.mktemp(suffix=".png")
            subprocess.run(["sips", "-s", "format", "png", path, "--out", tmp],
                           check=True, capture_output=True)
            im = Image.open(tmp)
        if getattr(im, "n_frames", 1) > 1 and im.format == "TIFF":
            im.seek(0)
    im.load()
    icc = im.info.get("icc_profile")
    if im.mode in ("I;16", "I;16B", "I;16L", "I"):
        im = Image.fromarray((np.asarray(im).astype(np.float32) / 257).clip(0, 255).astype(np.uint8), "L")
    if im.mode == "CMYK":
        src = ImageCms.ImageCmsProfile(io.BytesIO(icc)) if icc else ImageCms.getOpenProfile(CMYK_DEFAULT)
        im = ImageCms.profileToProfile(im, src, SRGB, outputMode="RGB",
                                       renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC)
    elif icc and im.mode in ("RGB", "RGBA"):
        try:
            src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            alpha = im.getchannel("A") if im.mode == "RGBA" else None
            im = ImageCms.profileToProfile(im.convert("RGB"), src, SRGB, outputMode="RGB")
            if alpha is not None:
                im.putalpha(alpha)
        except Exception:
            pass
    if im.mode in ("LA", "PA") or (im.mode == "P" and "transparency" in im.info):
        im = im.convert("RGBA")
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.getchannel("A"))
        im = bg
    return im.convert("RGB")


# ---------- геометрия: как картинка стоит в рамке InDesign ----------
def inv(m):
    a, b, c, d, e, f = m
    det = a * d - b * c
    return (d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det)


def place(im, m):
    """Растр рамки (fb) в разрешении оригинала, с поворотом/отражением как в каталоге."""
    W, H = im.size
    L, T, R, B = m["gb"]
    gm = m["gm"]
    fx0, fy0, fx1, fy1 = m["fb"]
    if m.get("pdf_rect"):
        # смещение «страница PDF → разворот» берём из той же рамки (rect ↔ fb)
        dx, dy = m["fb"][0] - m["rect"][0], m["fb"][1] - m["rect"][1]
        r = m["pdf_rect"]
        fx0, fy0, fx1, fy1 = r[0] + dx, r[1] + dy, r[2] + dx, r[3] + dy
    # масштаб: px оригинала на pt разворота
    sx = W / (R - L)
    lin = math.sqrt(abs(gm[0] * gm[3] - gm[1] * gm[2]))  # масштаб картинки в рамке
    s = sx / lin
    ow, oh = max(1, round((fx1 - fx0) * s)), max(1, round((fy1 - fy0) * s))
    # выход (X,Y) → разворот → координаты картинки → пиксели оригинала
    ia, ib, ic, id_, ie, if_ = inv(gm)
    kx, ky = W / (R - L), H / (B - T)
    # x_img = ia*X' + ic*Y' + ie,  где X' = fx0 + X/s, Y' = fy0 + Y/s
    a = ia / s * kx
    b = ic / s * kx
    c = (ia * fx0 + ic * fy0 + ie - L) * kx
    d = ib / s * ky
    e = id_ / s * ky
    f = (ib * fx0 + id_ * fy0 + if_ - T) * ky
    out = im.transform((ow, oh), Image.AFFINE, (a, b, c, d, e, f), resample=Image.BICUBIC, fillcolor="white")
    if m.get("rotated") and m.get("fp"):
        # повёрнутая рамка: всё вне её контура — белое (так в каталоге)
        from PIL import ImageDraw
        mask = Image.new("L", out.size, 0)
        ImageDraw.Draw(mask).polygon([((x - fx0) * s, (y - fy0) * s) for x, y in m["fp"]], fill=255)
        white = Image.new("RGB", out.size, "white")
        out = Image.composite(out, white, mask)
    return out


# ---------- единый стиль (как scripts/normalize-photos.py) ----------
def soften_shadows(im):
    a = np.asarray(im).astype(float)
    mn, mx = a.min(2), a.max(2)
    w = np.clip((mn - 210) / 22.0, 0, 1) * ((mx - mn) < 16)
    out = 255 - (255 - a) * (1 - 0.68 * w[..., None])
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def main_span(counts, n, thr):
    idx = np.where(counts > thr)[0]
    if len(idx) == 0:
        return 0, n
    gap = max(3, int(0.04 * n))
    segs, start = [], idx[0]
    for x, y in zip(idx, idx[1:]):
        if y - x > gap:
            segs.append((start, x)); start = y
    segs.append((start, idx[-1]))
    total = counts.sum()
    keep = [(x, y) for x, y in segs if (y - x + 1) >= 0.05 * n or counts[x:y + 1].sum() >= 0.04 * total]
    keep = keep or [max(segs, key=lambda q: counts[q[0]:q[1] + 1].sum())]
    return keep[0][0], keep[-1][1] + 1


def content_box(im):
    a = np.asarray(im).astype(int)
    fg = ~((a.min(2) > 236) & (a.max(2) - a.min(2) < 20))
    h, w = fg.shape
    x0, x1 = main_span(fg.sum(0), w, max(2, 0.004 * h))
    y0, y1 = main_span(fg[:, x0:x1].sum(1), h, max(2, 0.004 * (x1 - x0)))
    x0, x1 = main_span(fg[y0:y1].sum(0), w, max(2, 0.004 * (y1 - y0)))
    m = max(2, round(0.003 * max(w, h)))
    return (max(x0 - m, 0), max(y0 - m, 0), min(x1 + m, w), min(y1 + m, h))


def compose(crop, size):
    cw, ch = crop.size
    k = min(size * FILL / cw, size * FILL / ch)
    r = crop.resize((max(1, round(cw * k)), max(1, round(ch * k))), Image.LANCZOS)
    canvas = Image.new("RGB", (size, size), "white")
    canvas.paste(r, ((size - r.width) // 2, (size - r.height) // 2))
    return canvas, k


ESRGAN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "esrgan")

def ai_upscale(im):
    """Real-ESRGAN x4 (модель для фото) для оригиналов с нехваткой разрешения."""
    import subprocess, tempfile
    d = tempfile.mkdtemp()
    src, dst = os.path.join(d, "in.png"), os.path.join(d, "out.png")
    im.save(src)
    subprocess.run([os.path.join(ESRGAN, "realesrgan-ncnn-vulkan"), "-i", src, "-o", dst,
                    "-n", "realesrgan-x4plus", "-m", os.path.join(ESRGAN, "models")],
                   capture_output=True, check=True)
    up = Image.open(dst).convert("RGB")
    # фон после нейросети — строго белый
    a = np.asarray(up).astype(int)
    near = (a.min(2) > 246) & (a.max(2) - a.min(2) < 10)
    a[near] = 255
    return Image.fromarray(a.astype(np.uint8))


def sig(im):
    t = np.asarray(im.convert("L").resize((64, 64), Image.BILINEAR)).astype(float)
    return (t - t.mean()) / (t.std() + 1e-6)


# ---------- ручные подрезки (обрывки соседних картинок в рамке каталога) ----------
MANUAL = {
    "olivki-lechchino-v-rassole-optom.jpg": (0, 0, 0.9, 1),
    "kulich-s-shokoladom-i-grushey-banchini-optom.jpg": (0, 0.3, 1, 1),
}

matches = json.load(open(MATCHES))
report, cache = [], {}
for m in matches:
    rel = os.path.relpath(m["image"], "images/catalog")
    name = os.path.basename(rel)
    pdf_im = Image.open(os.path.join(PDFDIR, rel)).convert("RGB")
    entry = dict(slug=m["slug"], file=m["file"], image=rel)
    src_path = os.path.join(LINKS, m["file"])
    try:
        pdf_src = pdf_im
        if name in MANUAL:
            l, t, r, b = MANUAL[name]
            pdf_src = pdf_im.crop((round(l * pdf_im.width), round(t * pdf_im.height),
                                   round(r * pdf_im.width), round(b * pdf_im.height)))
        pdf_crop = soften_shadows(pdf_src)
        pdf_crop = pdf_crop.crop(content_box(pdf_crop))
        pdf_sig = sig(pdf_crop)

        def build(pm):
            path = os.path.join(LINKS, pm["file"])
            if not os.path.exists(path):
                raise FileNotFoundError("оригинал не скачан: " + pm["file"])
            if pm["file"] not in cache:
                cache.clear()
                cache[pm["file"]] = open_original(path)
            framed = place(cache[pm["file"]], pm)
            if name in MANUAL:
                l, t, r, b = MANUAL[name]
                framed = framed.crop((round(l * framed.width), round(t * framed.height),
                                      round(r * framed.width), round(b * framed.height)))
            framed = soften_shadows(framed)
            c = framed.crop(content_box(framed))
            return c, float((sig(c) * pdf_sig).mean())

        crop, corr = build(m)
        if corr < 0.8:
            # разметка указала на соседнюю рамку — перебираем все рамки страницы
            best = (corr, crop, m["file"])
            for pm in PLACEMENTS:
                if pm["page"] != m["page"] or pm["file"] == m["file"] or pm["file"].lower().endswith((".ai", ".pdf")):
                    continue
                try:
                    c2, r2 = build(pm)
                except Exception:
                    continue
                if r2 > best[0]:
                    best = (r2, c2, pm["file"])
            corr, crop, entry["file"] = best
        entry.update(src_px=list(crop.size), pdf_px=list(pdf_crop.size), corr=round(corr, 3))
        if corr < 0.8:
            raise ValueError(f"не совпадает с каталогом (corr {corr:.2f})")
        use, kind = crop, "original"
    except Exception as ex:
        entry["fallback"] = str(ex)[:120]
        pdf_crop = soften_shadows(pdf_im)
        use, kind = pdf_crop.crop(content_box(pdf_crop)), "pdf"
    need = SIZE * FILL / max(use.size)        # во сколько раз растягиваем до 1200
    if need > 1.1:
        use = ai_upscale(use)
        entry["ai"] = True
    big, k = compose(use, SIZE)
    small, _ = compose(use, 600)
    entry.update(kind=kind, upscale=round(k, 2))
    out = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    big.save(out, "JPEG", quality=88, optimize=True, progressive=True, subsampling=0)
    small.save(out[:-4] + "-600.jpg", "JPEG", quality=85, optimize=True, progressive=True)
    report.append(entry)
    print(f"{kind:8} {entry.get('corr', '-'):>6} up×{k:<5.2f} {rel}  {entry.get('fallback', '')}", flush=True)

json.dump(report, open(REPORT, "w"), ensure_ascii=False, indent=1)
from collections import Counter
print("\nитог:", Counter(r["kind"] for r in report))
print("увеличено нейросетью:", sum(1 for r in report if r.get("ai")))
