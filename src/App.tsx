import { ProductDetailPage } from './components/ProductDetailPage';
import { PRODUCT } from './data/product';
import type { Size } from './types/product';

interface CartItem {
  productId: string;
  colorwayId: string;
  size: Size;
}

/**
 * Integration point for the cart service. Replace with the real client
 * (REST/GraphQL/feature-flagged module) when wiring this PDP into the app.
 */
function addItemToCart(item: CartItem): void {
  if (import.meta.env.DEV) {
    console.info('[cart] add', item);
  }
}

export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas font-sans">
      <ProductDetailPage product={PRODUCT} onAddToCart={addItemToCart} />
    </main>
  );
}
