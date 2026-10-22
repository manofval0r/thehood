import sys
from PIL import Image, ImageChops

a = Image.open(sys.argv[1]).convert("RGB")
b = Image.open(sys.argv[2]).convert("RGB")
d = ImageChops.difference(a, b)
bbox = d.getbbox()
print("size", a.size, "diff bbox", bbox)
if bbox:
    x0, y0, x1, y1 = bbox
    print("region", (x0, y0, x1, y1), "w", x1 - x0, "h", y1 - y0)
    px = d.crop(bbox).getdata()
    worst = max(px, key=lambda p: max(p))
    print("worst pixel delta", worst)
    # how many pixels differ at all
    n = sum(1 for p in d.getdata() if p != (0, 0, 0))
    print("pixels differing:", n, "of", a.size[0] * a.size[1])
    a.crop(bbox).resize(((x1 - x0) * 3, (y1 - y0) * 3), Image.NEAREST).save("out/qa/diff-region-a.png")
    b.crop(bbox).resize(((x1 - x0) * 3, (y1 - y0) * 3), Image.NEAREST).save("out/qa/diff-region-b.png")
