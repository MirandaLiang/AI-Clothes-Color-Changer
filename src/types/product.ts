/** Available garment sizes, ordered for display. */
export const SIZES = ['XS', 'S', 'M', 'L'] as const;
export type Size = (typeof SIZES)[number];

export interface Colorway {
  id: string;
  /** Human-readable colour name, used for a11y labels. */
  name: string;
  /** Swatch dot colour. */
  swatchHex: string;
  /** Product photography for this colourway. */
  imageUrl: string;
  /**
   * Optional CSS filter applied to the garment region of `imageUrl`.
   * Demo-only shim: lets one photo stand in for missing colourway
   * photography. Production should ship a dedicated photo per colourway
   * and leave this (and `garmentMaskUrl`) unset.
   */
  imageFilter?: string;
  /**
   * Alpha mask isolating the garment in `imageUrl` (white = garment).
   * Required alongside `imageFilter` so recolouring affects only the
   * product, never the model or background. Same aspect ratio as the
   * photo so `mask-size: cover` stays pixel-aligned with `object-cover`.
   */
  garmentMaskUrl?: string;
  /** True for very light swatches that need a hairline border. */
  needsBorder?: boolean;
}

export interface Product {
  id: string;
  title: string;
  /** Minor units (cents) to avoid floating-point money. */
  priceMinor: number;
  currency: 'USD';
  colorways: Colorway[];
}
