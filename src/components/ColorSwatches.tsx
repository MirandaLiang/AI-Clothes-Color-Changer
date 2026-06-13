import { forwardRef } from 'react';
import type { Colorway } from '../types/product';

export const SWATCH_SIZE = 32;
export const SWATCH_GAP = 14;
/** Centre-to-centre distance the selection ring travels per swatch. */
export const SWATCH_STEP = SWATCH_SIZE + SWATCH_GAP;

const RING_INSET = 3; // ring overhangs the swatch by this much per side

interface ColorSwatchesProps {
  colorways: Colorway[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Swatch row in the Figma redesign's language: bare 32px dots with a single
 * hairline ring marking the selection. The ring is one element positioned
 * by GSAP (via the forwarded ref) so it can slide between swatches.
 */
export const ColorSwatches = forwardRef<HTMLDivElement, ColorSwatchesProps>(function ColorSwatches(
  { colorways, selectedIndex, onSelect },
  ringRef,
) {
  return (
    <div className="relative" style={{ height: SWATCH_SIZE }}>
      <div
        ref={ringRef}
        data-testid="selection-ring"
        aria-hidden="true"
        className="pointer-events-none absolute z-10 rounded-full border border-ink/60"
        style={{
          width: SWATCH_SIZE + RING_INSET * 2,
          height: SWATCH_SIZE + RING_INSET * 2,
          left: -RING_INSET,
          top: -RING_INSET,
        }}
      />
      <div role="radiogroup" aria-label="Color" className="flex" style={{ gap: SWATCH_GAP }}>
        {colorways.map((colorway, index) => (
          <button
            key={colorway.id}
            type="button"
            role="radio"
            aria-checked={index === selectedIndex}
            aria-label={colorway.name}
            onClick={() => onSelect(index)}
            className={`rounded-full transition-transform active:scale-90 ${
              colorway.needsBorder ? 'border border-ink/15' : ''
            }`}
            style={{
              width: SWATCH_SIZE,
              height: SWATCH_SIZE,
              backgroundColor: colorway.swatchHex,
            }}
          />
        ))}
      </div>
    </div>
  );
});
