import { useEffect } from 'react';

/**
 * Warms the browser cache for the given images so colourway switches never
 * wipe to a still-decoding (blank) layer on slow connections.
 */
export function usePreloadImages(urls: string[]): void {
  useEffect(() => {
    const images = urls.map((url) => {
      const img = new Image();
      img.src = url;
      // decode() forces the bitmap to be ready, not merely fetched
      img.decode?.().catch(() => {
        /* decode is best-effort */
      });
      return img;
    });
    return () => images.forEach((img) => (img.src = ''));
  }, [urls]);
}
