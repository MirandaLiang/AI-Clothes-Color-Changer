import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ColorSwatches } from '../ColorSwatches';
import type { Colorway } from '../../types/product';

const COLORWAYS: Colorway[] = [
  { id: 'ecru', name: 'Ecru', swatchHex: '#f4f0e5', imageUrl: 'ecru.jpg', needsBorder: true },
  { id: 'tan', name: 'Tan', swatchHex: '#a8884e', imageUrl: 'tan.jpg' },
];

describe('ColorSwatches', () => {
  it('renders one radio per colorway with the selection reflected', () => {
    render(<ColorSwatches colorways={COLORWAYS} selectedIndex={0} onSelect={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Ecru' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tan' })).not.toBeChecked();
  });

  it('reports the tapped index', () => {
    const onSelect = vi.fn();
    render(<ColorSwatches colorways={COLORWAYS} selectedIndex={0} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tan' }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);
  });
});
