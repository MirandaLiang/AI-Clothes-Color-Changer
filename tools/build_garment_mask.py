"""Generate src/assets/garment-mask.png — alpha mask of the pants in the
ecru on-model photo (white/opaque = garment).

Pipeline:
  1. Per-column waistline: trace the bottom edge of the midriff skin band
     (warm + mid-bright pixels) so the cutoff follows the tilted waistband
     instead of a horizontal line.
  2. Seed: warm-white bright pixels below the waistline; keep the largest
     connected component.
  3. Geodesic growth into near-neutral fabric (cool-lit folds), bounded so
     the cool grey background is never entered.
  4. Bridge fill: the brightly lit waistband top edge reads cool (same
     warmth as background), so short vertical gaps between the waistline
     and the mask are filled where pixels are bright non-skin fabric.
  5. Morphological cleanup (close, fill holes, open).
     (Analysis always runs at 824px wide — the resolution the thresholds and
     kernel sizes were tuned for — then the feathered alpha is upsampled to
     the source photo's resolution, which also smooths the silhouette.)
  6. Skin/shadow carve-out: strongly warm (skin) and dark (shadow) pixels,
     dilated a few px, are subtracted so hands/hips overlapping the garment
     are never tinted (bright knuckle highlights can pass the fabric
     thresholds and the closing step would otherwise swallow whole fingers).
  7. Spatially-varying feathered alpha: a wide, soft gradient along the
     background silhouette, blended into a tight feather near skin so the
     tint never halos onto the hand, arm, or midriff.

Usage: python3 tools/build_garment_mask.py
Deps:  pillow numpy scipy
"""

import numpy as np
from PIL import Image
from scipy import ndimage

SRC = 'src/assets/product-ecru.jpg'
OUT = 'src/assets/garment-mask.png'


ANALYSIS_WIDTH = 824


def main() -> None:
    source = Image.open(SRC).convert('RGB')
    full_size = source.size
    if source.width != ANALYSIS_WIDTH:
        scale = ANALYSIS_WIDTH / source.width
        source = source.resize(
            (ANALYSIS_WIDTH, round(source.height * scale)), Image.LANCZOS,
        )
    img = np.array(source).astype(int)
    height, width = img.shape[:2]
    r, b = img[..., 0], img[..., 2]
    warmth = r - b
    bright = img.sum(axis=2) // 3
    ygrid = np.arange(height)[:, None]

    # 1. per-column waistline from the midriff skin band
    skin = (warmth > 25) & (bright < 195)
    window = skin[420:640, :]
    has_skin = window.any(0)
    bottom = window.shape[0] - 1 - window[::-1, :].argmax(0)
    ys = np.where(has_skin, 420 + bottom, -1)
    cols = np.where(ys > 0)[0]
    waistline = np.interp(np.arange(width), cols, ys[cols].astype(float))
    waistline = ndimage.median_filter(waistline, size=31)
    waistline = ndimage.gaussian_filter1d(waistline, sigma=8)
    below_waist = ygrid >= (waistline[None, :] - 2)

    # 2. seed
    seed = (warmth >= 0) & (bright > 165) & below_waist
    seed = ndimage.binary_opening(seed, structure=np.ones((5, 5)))
    labels, _ = ndimage.label(seed)
    seed = labels == (np.bincount(labels.ravel())[1:].argmax() + 1)

    # 3. geodesic growth
    grow = (warmth >= -2) & (bright > 165) & below_waist
    mask = ndimage.binary_propagation(seed, mask=grow)

    # 4. bridge fill at the waistband
    fill = np.zeros_like(mask)
    for x in range(cols.min(), cols.max() + 1):
        wy = int(waistline[x])
        hits = np.where(mask[wy:wy + 50, x])[0]
        if hits.size == 0 or hits[0] == 0:
            continue
        seg = slice(wy, wy + hits[0])
        fill[seg, x] = (bright[seg, x] > 180) & (warmth[seg, x] < 30)
    mask |= fill

    # 5. cleanup
    mask = ndimage.binary_closing(mask, structure=np.ones((25, 25)))
    mask = ndimage.binary_fill_holes(mask)
    mask = ndimage.binary_opening(mask, structure=np.ones((7, 7)))

    # 6. carve out skin and the deepest crevice shadow, with a minimal 1px
    # margin: a wider margin leaves an untinted ecru rim along the garment
    # boundary, while shadow ON fabric (neutral hue, mid-bright) must stay
    # in the mask so it tints like the rest of the cloth
    skin_or_crevice = (warmth > 22) | (bright < 120)
    keep_out = ndimage.binary_dilation(skin_or_crevice, structure=np.ones((3, 3)))
    mask &= ~keep_out
    mask = ndimage.binary_opening(mask, structure=np.ones((3, 3)))

    # re-claim the anti-aliased boundary pixels (they are part fabric and
    # must take part tint, or they read as a thin white outline) — but never
    # walk back onto unambiguous skin
    mask = ndimage.binary_dilation(mask, structure=np.ones((3, 3))) & ~(warmth > 32)

    # drop stray micro-components (e.g. specks on the wrist contour)
    labels, count = ndimage.label(mask)
    if count:
        sizes = np.bincount(labels.ravel())
        mask = np.isin(labels, np.where(sizes > 500)[0][1:])

    # 7. spatially-varying feather: soft against the flat background,
    # tight near skin (a wide gradient there would tint the body)
    soft = ndimage.gaussian_filter(mask.astype(float), sigma=3.0)
    soft = np.clip((soft - 0.12) / 0.76, 0, 1)
    tight = ndimage.gaussian_filter(mask.astype(float), sigma=1.2)
    tight = np.clip((tight - 0.35) / 0.35, 0, 1)
    near_skin = ndimage.binary_dilation(warmth > 22, structure=np.ones((13, 13)))
    weight = np.clip(ndimage.gaussian_filter(near_skin.astype(float), sigma=3.0) * 1.4, 0, 1)
    alpha = tight * weight + soft * (1 - weight)

    # upsample the feathered alpha to the source resolution (bilinear +
    # light blur -> smooth sub-pixel silhouette instead of hard 1px steps)
    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8))
    if alpha_img.size != full_size:
        alpha_img = alpha_img.resize(full_size, Image.BILINEAR)
        alpha_full = ndimage.gaussian_filter(
            np.array(alpha_img).astype(float) / 255, sigma=1.2,
        )
    else:
        alpha_full = np.array(alpha_img).astype(float) / 255

    out = np.zeros((full_size[1], full_size[0], 4), np.uint8)
    out[..., :3] = 255
    out[..., 3] = (alpha_full * 255).astype(np.uint8)
    Image.fromarray(out).save(OUT)
    print('wrote', OUT, out.shape[1::-1])


if __name__ == '__main__':
    main()
