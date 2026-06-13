import { describe, it, expect } from 'vitest';
import { formatPrice } from '../product';

describe('formatPrice', () => {
  it('formats minor units as USD', () => {
    expect(formatPrice(5990, 'USD')).toBe('$59.90');
  });
});
