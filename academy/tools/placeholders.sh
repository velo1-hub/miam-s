#!/usr/bin/env bash
# Génère des substituts locaux (dégradés or/noir) pour les visuels listés dans public/img/manifest.json, afin de tester la mise en page hors ligne.
set -e
cd "$(dirname "$0")/.."
python3 - <<'PY'
import json
from PIL import Image, ImageDraw
m = json.load(open("public/img/manifest.json"))
for name, meta in m["images"].items():
    w, h = meta["w"], meta["h"]
    img = Image.new("RGB", (w, h), (11, 11, 13))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line([(0, y), (w, y)], fill=(int(226 + 14 * t), int(232 + 12 * t), int(244 + 8 * t)))
    d.ellipse([w*0.55, -h*0.3, w*1.3, h*0.6], fill=(214, 226, 250))
    d.text((24, h - 40), f"{name} (substitut local)", fill=(14, 31, 68))
    img.save(f"public/img/{name}.webp", "WEBP", quality=70)
print("substituts générés")
PY
