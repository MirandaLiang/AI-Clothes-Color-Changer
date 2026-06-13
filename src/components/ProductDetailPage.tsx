import { useMemo, useState } from 'react';
import type { Product, Size } from '../types/product';
import { formatPrice } from '../data/product';
import { useColorWipe } from '../hooks/useColorWipe';
import { usePreloadImages } from '../hooks/usePreloadImages';
import { TopBar } from './TopBar';
import { ProductGallery } from './ProductGallery';
import { ColorSwatches, SWATCH_STEP } from './ColorSwatches';
import { SizePicker } from './SizePicker';
import { AddToCartButton } from './AddToCartButton';

interface ProductDetailPageProps {
  product: Product;
  onAddToCart?: (args: { productId: string; colorwayId: string; size: Size }) => void;
}

/** Single-screen ZARA-style product detail page (matches Figma node 75:3). */
export function ProductDetailPage({ product, onAddToCart }: ProductDetailPageProps) {
  const [size, setSize] = useState<Size>('M');
  const imageUrls = useMemo(
    () => product.colorways.map((colorway) => colorway.imageUrl),
    [product],
  );
  usePreloadImages(imageUrls);
  const { scopeRef, overlayRef, ringRef, selectedIndex, incomingIndex, selectColor } = useColorWipe(
    { swatchStep: SWATCH_STEP },
  );

  const current = product.colorways[selectedIndex];
  if (!current) {
    // Defensive: useColorWipe constrains selectedIndex to valid swatches,
    // so this is unreachable unless the colorways list shrinks at runtime.
    throw new Error(`Invalid colorway index: ${selectedIndex}`);
  }

  return (
    <div
      ref={scopeRef}
      className="relative flex h-[860px] max-h-screen w-full max-w-[412px] flex-col overflow-hidden bg-white shadow-2xl sm:rounded-[28px]"
    >
      <TopBar />
      <ProductGallery
        ref={overlayRef}
        title={product.title}
        colorways={product.colorways}
        currentIndex={selectedIndex}
        incomingIndex={incomingIndex}
      />

      <section className="px-5 pb-8 pt-6">
        <h1 className="text-base font-light uppercase tracking-display text-ink">
          {product.title}
        </h1>
        <p className="mt-2 text-base font-semibold text-ink">
          {formatPrice(product.priceMinor, product.currency)}
        </p>

        <div className="mt-6 flex items-center gap-7">
          <span className="w-11 text-[11px] font-light uppercase tracking-label text-ink">
            Color
          </span>
          <ColorSwatches
            ref={ringRef}
            colorways={product.colorways}
            selectedIndex={selectedIndex}
            onSelect={selectColor}
          />
        </div>

        <div className="mt-4 flex items-center gap-7">
          <span className="w-11 text-[11px] font-light uppercase tracking-label text-ink">
            Size
          </span>
          <SizePicker value={size} onChange={setSize} />
        </div>

        <div className="mt-7">
          <AddToCartButton
            onClick={() => onAddToCart?.({ productId: product.id, colorwayId: current.id, size })}
          />
        </div>
      </section>
    </div>
  );
}
