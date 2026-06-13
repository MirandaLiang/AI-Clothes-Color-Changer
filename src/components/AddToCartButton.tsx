interface AddToCartButtonProps {
  onClick: () => void;
}

/** ZARA-style hairline-outlined CTA (per Figma: 0.5px ink border, light caps). */
export function AddToCartButton({ onClick }: AddToCartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 w-full border-[0.5px] border-ink bg-white text-xs font-light uppercase tracking-cta text-ink transition-colors duration-200 hover:bg-ink hover:text-white active:scale-[0.99]"
    >
      Add to Cart
    </button>
  );
}
