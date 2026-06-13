import { SIZES, type Size } from '../types/product';
import { SWATCH_SIZE, SWATCH_GAP } from './ColorSwatches';

interface SizePickerProps {
  value: Size;
  onChange: (size: Size) => void;
}

/**
 * Text-only sizes per the Figma redesign; the selected size carries a
 * hairline circle. The circle is per-button (CSS transition), since size
 * selection has no choreographed motion in the reference.
 */
export function SizePicker({ value, onChange }: SizePickerProps) {
  return (
    <div role="radiogroup" aria-label="Size" className="flex" style={{ gap: SWATCH_GAP }}>
      {SIZES.map((size) => {
        const selected = size === value;
        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(size)}
            className={`grid place-items-center rounded-full text-xs font-light text-ink transition-[border-color] duration-200 ${
              selected ? 'border border-ink/60' : 'border border-transparent'
            }`}
            style={{ width: SWATCH_SIZE, height: SWATCH_SIZE }}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
