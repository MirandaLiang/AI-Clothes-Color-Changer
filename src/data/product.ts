import type { Product } from '../types/product';
import productEcru from '../assets/product-ecru.jpg';
import productTan from '../assets/product-tan.jpg';

/**
 * Static fixture. In production this comes from the catalogue API;
 * the shape is already API-friendly (ids, minor currency units).
 */
export const PRODUCT: Product = {
  id: '01255475251',
  title: 'Wide Leg Pleated Linen Pants',
  priceMinor: 5990,
  currency: 'USD',
  colorways: [
    {
      id: 'ecru',
      name: 'Ecru',
      swatchHex: '#f4f0e5',
      imageUrl: productEcru,
      needsBorder: true,
    },
    {
      id: 'tan',
      name: 'Tan',
      swatchHex: '#a8884e',
      // Derived from the ecru photo + real tan reference via LAB colour
      // transfer and grain grafting — see tools/recolor_garment.py.
      // Replace with dedicated tan photography when available.
      imageUrl: productTan,
    },
  ],
};

export function formatPrice(minor: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(minor / 100);
}
