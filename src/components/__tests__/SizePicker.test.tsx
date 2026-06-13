import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SizePicker } from '../SizePicker';

describe('SizePicker', () => {
  it('marks the current size as checked', () => {
    render(<SizePicker value="M" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'M' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'XS' })).not.toBeChecked();
  });

  it('emits the chosen size', () => {
    const onChange = vi.fn();
    render(<SizePicker value="M" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'L' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('L');
  });
});
