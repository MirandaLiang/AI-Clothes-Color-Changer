"""Generate src/assets/product-tan.jpg from the ecru on-model photo.

Pipeline (asset provenance — rerun if the source photo or mask changes):
  1. Garment mask (src/assets/garment-mask.png): warmth/brightness threshold
     below the detected waistband, geodesic growth into cool-lit folds,
     morphological cleanup, feathered alpha.
  2. Reinhard colour transfer in CIE-LAB: shift the masked garment's channel
     statistics to those measured on the real tan reference photo
     (mean [56.5, 8.0, 36.9], std [4.3, 1.1, 2.3]); L-contrast gain capped
     at 1.6 to preserve on-model shading.
  3. Linen grain graft: high-pass (sigma=5, clipped +/-4 L) of the reference's
     luminance, mirror-tiled, added to L inside the mask at 0.9x.

Regenerate the mask first if the source photo changed:
  python3 tools/build_garment_mask.py

Usage: python3 tools/recolor_garment.py <tan_reference.png>
Deps:  pillow numpy scipy scikit-image
"""

import sys

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import color

SRC = 'src/assets/product-ecru.jpg'
MASK = 'src/assets/garment-mask.png'
OUT = 'src/assets/product-tan.jpg'

TAN_MEAN = np.array([56.5, 8.0, 36.9])
TAN_STD = np.array([4.3, 1.1, 2.3])
L_GAIN_CAP = 1.6
GRAIN_STRENGTH = 0.9


def main(reference_path: str) -> None:
    img = np.array(Image.open(SRC).convert('RGB'))
    mask_img = Image.open(MASK)
    if mask_img.size != (img.shape[1], img.shape[0]):
        mask_img = mask_img.resize((img.shape[1], img.shape[0]), Image.BILINEAR)
    alpha = np.array(mask_img).astype(float)[..., 3] / 255
    ref = np.array(Image.open(reference_path).convert('RGB'))
    height, width = img.shape[:2]

    # grain from a flat patch of the reference
    ref_l = color.rgb2lab(ref / 255.0)[..., 0]
    patch = ref_l[600:1100, 200:700]
    grain = np.clip(patch - ndimage.gaussian_filter(patch, sigma=5), -4, 4)
    tile = np.block([[grain, grain[:, ::-1]], [grain[::-1, :], grain[::-1, ::-1]]])
    reps = (height // tile.shape[0] + 2, width // tile.shape[1] + 2)
    grain_full = np.tile(tile, reps)[:height, :width]

    # Reinhard transfer
    lab = color.rgb2lab(img / 255.0)
    src_pixels = lab[alpha > 0.9]
    s_mean, s_std = src_pixels.mean(0), src_pixels.std(0)
    gain = np.minimum(TAN_STD / np.maximum(s_std, 1e-6), [L_GAIN_CAP, 6.0, 6.0])
    out = lab.copy()
    for c in range(3):
        out[..., c] = (lab[..., c] - s_mean[c]) * gain[c] + TAN_MEAN[c]
    out[..., 0] += grain_full * GRAIN_STRENGTH * alpha

    tan = np.clip(color.lab2rgb(out), 0, 1)
    composite = (img / 255.0) * (1 - alpha[..., None]) + tan * alpha[..., None]
    Image.fromarray((composite * 255).astype(np.uint8)).save(OUT, quality=86, optimize=True)
    print('wrote', OUT)


if __name__ == '__main__':
    main(sys.argv[1])
