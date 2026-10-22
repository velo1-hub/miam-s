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
        d.line([(0, y), (w, y)], fill=(int(7 + 10 * t), int(11 + 24 * t), int(20 + 60 * t)))
    d.ellipse([w*0.55, -h*0.3, w*1.3, h*0.6], fill=(14, 38, 90))
    d.text((24, h - 40), f"{name} (substitut local)", fill=(124, 177, 255))
    img.save(f"public/img/{name}.webp", "WEBP", quality=70)
print("substituts générés")
PY
