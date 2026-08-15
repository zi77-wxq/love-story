from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1] / "media"
MAX_EDGE = 1920


def optimize(source: Path) -> tuple[int, int]:
    target = source.with_suffix(".webp")
    original_size = source.stat().st_size
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        image.save(target, "WEBP", quality=82, method=6)
    with Image.open(target) as verified:
        verified.verify()
    source.unlink()
    return original_size, target.stat().st_size


before = 0
after = 0
count = 0
for path in sorted(ROOT.rglob("*")):
    if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        continue
    old_size, new_size = optimize(path)
    before += old_size
    after += new_size
    count += 1

print(f"Optimized {count} images: {before / 1024 / 1024:.1f} MB -> {after / 1024 / 1024:.1f} MB")
