from PIL import Image
import os, math, sys

SOURCE = "source-map.png"
OUT_DIR = "tiles"
TILE = 256
MAX_ZOOM = 6

img = Image.open(SOURCE).convert("RGBA")
width, height = img.size

def ensure(path):
    os.makedirs(path, exist_ok=True)

for z in range(MAX_ZOOM + 1):
    scale = 2 ** (MAX_ZOOM - z)
    w = math.ceil(width / scale)
    h = math.ceil(height / scale)
    resized = img.resize((w, h), Image.LANCZOS)

    x_tiles = math.ceil(w / TILE)
    y_tiles = math.ceil(h / TILE)

    for x in range(x_tiles):
      for y in range(y_tiles):
        left = x * TILE
        top = y * TILE
        tile = resized.crop((left, top, left + TILE, top + TILE))
        out_folder = os.path.join(OUT_DIR, str(z), str(x))
        ensure(out_folder)
        tile.save(os.path.join(out_folder, f"{y}.webp"), "WEBP", quality=80)

print("Done.")