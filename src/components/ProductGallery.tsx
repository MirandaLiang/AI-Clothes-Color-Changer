import { forwardRef, type CSSProperties } from 'react';
import type { Colorway } from '../types/product';

const IMAGE_CLASSES = 'absolute inset-0 h-full w-full object-cover object-top';

/** Keeps the garment mask pixel-aligned with `object-cover object-top`. */
function maskStyle(maskUrl: string, filter: string): CSSProperties {
  return {
    filter,
    maskImage: `url(${maskUrl})`,
    WebkitMaskImage: `url(${maskUrl})`,
    maskSize: 'cover',
    WebkitMaskSize: 'cover',
    maskPosition: 'top center',
    WebkitMaskPosition: 'top center',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  };
}

interface GalleryStackProps {
  colorways: Colorway[];
  activeIndex: number;
  title: string;
}

/**
 * Every colourway image stays mounted and decoded; the active one is shown
 * by flipping opacity. Switching colourways therefore never changes an
 * <img src> — a src swap is not atomic (the browser decodes asynchronously,
 * painting a stale or blank frame even when the file is cached), which is
 * exactly the flash this design eliminates.
 */
function GalleryStack({ colorways, activeIndex, title }: GalleryStackProps) {
  return (
    <div className="relative h-full w-full">
      {colorways.map((colorway, index) => {
        const active = index === activeIndex;
        const recolour =
          colorway.imageFilter && colorway.garmentMaskUrl
            ? maskStyle(colorway.garmentMaskUrl, colorway.imageFilter)
            : undefined;
        return (
          <div
            key={colorway.id}
            className="absolute inset-0"
            style={{ opacity: active ? 1 : 0 }}
            aria-hidden={!active}
          >
            <img
              src={colorway.imageUrl}
              alt={active ? `${title} in ${colorway.name}` : ''}
              className={IMAGE_CLASSES}
              draggable={false}
            />
            {recolour && (
              <img
                src={colorway.imageUrl}
                alt=""
                aria-hidden="true"
                className={IMAGE_CLASSES}
                style={recolour}
                draggable={false}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ProductGalleryProps {
  title: string;
  colorways: Colorway[];
  /** Committed colourway, always visible in the base layer. */
  currentIndex: number;
  /** Colourway revealed by the wipe overlay. */
  incomingIndex: number;
  pageCount?: number;
  activePage?: number;
}

/**
 * Two stacked layers: the base shows the committed colourway and the overlay
 * (clip-path controlled by useColorWipe via the forwarded ref) wipes the
 * incoming colourway over it. Each layer is a GalleryStack, so colourway
 * changes are opacity flips between already-decoded bitmaps.
 */
export const ProductGallery = forwardRef<HTMLDivElement, ProductGalleryProps>(
  function ProductGallery(
    { title, colorways, currentIndex, incomingIndex, pageCount = 3, activePage = 2 },
    overlayRef,
  ) {
    return (
      <div className="relative flex-1 overflow-hidden bg-backdrop">
        <div className="absolute inset-0">
          <GalleryStack colorways={colorways} activeIndex={currentIndex} title={title} />
        </div>
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          aria-hidden="true"
        >
          <GalleryStack colorways={colorways} activeIndex={incomingIndex} title={title} />
        </div>

        <div className="absolute bottom-6 right-5 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: pageCount }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === activePage ? 'bg-ink' : 'bg-ink-2/35'}`}
            />
          ))}
        </div>
      </div>
    );
  },
);
