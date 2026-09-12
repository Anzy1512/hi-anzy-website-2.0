# -*- coding: utf-8 -*-
"""Generate .webp and .avif siblings for every PNG/JPG brand asset.

Run after adding or replacing anything in public/brand/:

    python scripts/convert-images.py

Writes brand/foo.png -> brand/foo.webp + brand/foo.avif alongside it. Nothing
is deleted or resized -- the originals stay as the universal fallback the
<Picture> component (src/components/Picture.js) falls through to for browsers
that support neither format, and as the source these two are re-derived from,
so re-running this after replacing a source PNG regenerates both correctly.

PNG assets keep alpha (lossless where the source is already flat/graphic;
these are halftone collage cut-outs, not photos, so lossless costs little
and there is nothing to visibly degrade). JPGs (the character quote portraits)
are re-encoded lossy at quality 82, which is where WebP/AVIF stop showing a
visible difference against the source JPEG on this kind of image.
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BRAND_DIR = os.path.join(HERE, "..", "public", "brand")


def convert(path):
    name, ext = os.path.splitext(path)
    ext = ext.lower()
    if ext not in (".png", ".jpg", ".jpeg"):
        return None
    im = Image.open(path)
    is_png = ext == ".png"

    webp_path = name + ".webp"
    avif_path = name + ".avif"
    if is_png:
        im.save(webp_path, "WEBP", lossless=True)
        im.save(avif_path, "AVIF", quality=90)
    else:
        rgb = im.convert("RGB")
        rgb.save(webp_path, "WEBP", quality=82, method=6)
        rgb.save(avif_path, "AVIF", quality=68)

    orig = os.path.getsize(path)
    w = os.path.getsize(webp_path)
    a = os.path.getsize(avif_path)
    return orig, w, a


def main():
    total_orig = total_webp = total_avif = 0
    for fname in sorted(os.listdir(BRAND_DIR)):
        path = os.path.join(BRAND_DIR, fname)
        if not os.path.isfile(path):
            continue
        result = convert(path)
        if result is None:
            continue
        orig, w, a = result
        total_orig += orig
        total_webp += w
        total_avif += a
        print(f"{fname}: {orig}B -> webp {w}B ({100*w/orig:.0f}%), avif {a}B ({100*a/orig:.0f}%)")

    print(f"\ntotals: png/jpg {total_orig/1024:.0f}KB, webp {total_webp/1024:.0f}KB "
          f"({100*total_webp/total_orig:.0f}%), avif {total_avif/1024:.0f}KB ({100*total_avif/total_orig:.0f}%)")


if __name__ == "__main__":
    main()
